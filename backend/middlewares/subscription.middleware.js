const { subscriptionService } = require('../services/subscription.service');
const { UsageTracker } = require('../services/usageTracker.service');
const Subscription = require('../models/subscription.model');

/**
 * Access error codes for subscription-based access control
 * @requirements 6.6
 */
const AccessErrorCodes = {
  SUBSCRIPTION_REQUIRED: 'subscription_required',
  USER_LIMIT_REACHED: 'user_limit_reached',
  PROJECT_LIMIT_REACHED: 'project_limit_reached',
  STORAGE_LIMIT_REACHED: 'storage_limit_reached',
  FEATURE_NOT_AVAILABLE: 'feature_not_available',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  READ_ONLY_MODE: 'read_only_mode'
};

/**
 * Simple in-memory cache for subscription data
 * @requirements 6.8
 */
class SubscriptionCache {
  constructor(ttlMs = 60000) { // 1 minute default TTL
    this.cache = new Map();
    this.ttl = ttlMs;
  }

  get(organizationId) {
    const entry = this.cache.get(organizationId);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(organizationId);
      return null;
    }
    
    return entry.data;
  }

  set(organizationId, data) {
    this.cache.set(organizationId, {
      data,
      expiresAt: Date.now() + this.ttl
    });
  }

  invalidate(organizationId) {
    this.cache.delete(organizationId);
  }

  clear() {
    this.cache.clear();
  }
}

// Singleton cache instance
const subscriptionCache = new SubscriptionCache();

/**
 * Get minimum plan required for a feature
 * @param {string} featureName - Feature name
 * @returns {string} Minimum plan name
 */
const getMinimumPlanForFeature = (featureName) => {
  const featurePlanMap = {
    'basic_grievance': 'starter',
    'advanced_permissions': 'professional',
    'custom_roles': 'professional',
    'audit_logs': 'professional',
    'api_access': 'professional',
    'sso': 'enterprise',
    'custom_integrations': 'enterprise',
    'priority_support': 'professional',
    'dedicated_support': 'enterprise',
    'sla_guarantee': 'enterprise',
    'on_premise': 'enterprise'
  };
  
  return featurePlanMap[featureName] || 'enterprise';
};

/**
 * Get subscription data with caching
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object|null>} Subscription data or null
 */
const getCachedSubscription = async (organizationId) => {
  // Check cache first
  let subscriptionData = subscriptionCache.get(organizationId);
  
  if (!subscriptionData) {
    // Fetch from database
    const result = await subscriptionService.getActiveSubscription(organizationId);
    
    if (result.isSuccess) {
      subscriptionData = result.data;
      subscriptionCache.set(organizationId, subscriptionData);
    }
  }
  
  return subscriptionData;
};


/**
 * Middleware factory to check subscription limits for resource creation
 * @param {string} limitType - Type of limit to check: 'users', 'projects', or 'storage'
 * @returns {Function} Express middleware function
 * @requirements 6.1, 6.2, 6.3, 6.6
 */
const checkSubscriptionLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      const organizationId = req.user?.organization_id?.toString();
      
      if (!organizationId) {
        return res.status(401).json({
          error: 'Organization not found',
          code: 'ORGANIZATION_REQUIRED',
          message: 'User must belong to an organization'
        });
      }

      // Get cached subscription or fetch from DB
      const subscription = await getCachedSubscription(organizationId);

      if (!subscription) {
        return res.status(403).json({
          error: 'Subscription required',
          code: AccessErrorCodes.SUBSCRIPTION_REQUIRED,
          message: 'Your organization does not have an active subscription',
          upgradeUrl: '/settings/subscription'
        });
      }

      // Check subscription status
      if (subscription.status === 'expired' || subscription.status === 'cancelled') {
        return res.status(403).json({
          error: 'Subscription expired',
          code: AccessErrorCodes.SUBSCRIPTION_EXPIRED,
          message: 'Your subscription has expired. Please renew to continue.',
          upgradeUrl: '/settings/subscription'
        });
      }

      // Only allow resource creation for active or trialing subscriptions
      if (!['active', 'trialing'].includes(subscription.status)) {
        return res.status(403).json({
          error: 'Subscription not active',
          code: AccessErrorCodes.SUBSCRIPTION_REQUIRED,
          message: `Your subscription status is ${subscription.status}. Please resolve any payment issues.`,
          upgradeUrl: '/settings/subscription'
        });
      }

      const plan = subscription.plan;
      
      // Get current usage
      const usage = await UsageTracker.getUsage(organizationId);

      // Check limit based on type
      switch (limitType) {
        case 'users': {
          const maxUsers = plan.limits.maxUsers;
          if (maxUsers !== -1 && usage.userCount >= maxUsers) {
            return res.status(403).json({
              error: 'User limit reached',
              code: AccessErrorCodes.USER_LIMIT_REACHED,
              message: `You have reached the maximum number of users (${maxUsers}) for your ${plan.displayName} plan.`,
              currentUsage: usage.userCount,
              limit: maxUsers,
              planName: plan.name,
              planDisplayName: plan.displayName,
              upgradeUrl: '/settings/subscription'
            });
          }
          break;
        }

        case 'projects': {
          const maxProjects = plan.limits.maxProjects;
          if (maxProjects !== -1 && usage.projectCount >= maxProjects) {
            return res.status(403).json({
              error: 'Project limit reached',
              code: AccessErrorCodes.PROJECT_LIMIT_REACHED,
              message: `You have reached the maximum number of projects (${maxProjects}) for your ${plan.displayName} plan.`,
              currentUsage: usage.projectCount,
              limit: maxProjects,
              planName: plan.name,
              planDisplayName: plan.displayName,
              upgradeUrl: '/settings/subscription'
            });
          }
          break;
        }

        case 'storage': {
          const maxStorage = plan.limits.maxStorageBytes;
          // For storage, we need to check the file size being uploaded
          const fileSize = req.file?.size || req.body?.fileSize || 0;
          
          if (maxStorage !== -1 && (usage.storageBytes + fileSize) > maxStorage) {
            return res.status(403).json({
              error: 'Storage limit reached',
              code: AccessErrorCodes.STORAGE_LIMIT_REACHED,
              message: `You have reached the storage limit (${formatBytes(maxStorage)}) for your ${plan.displayName} plan.`,
              currentUsage: usage.storageBytes,
              limit: maxStorage,
              currentUsageFormatted: formatBytes(usage.storageBytes),
              limitFormatted: formatBytes(maxStorage),
              planName: plan.name,
              planDisplayName: plan.displayName,
              upgradeUrl: '/settings/subscription'
            });
          }
          break;
        }

        default:
          console.warn(`Unknown limit type: ${limitType}`);
      }

      // Attach subscription info to request for downstream use
      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('Error in checkSubscriptionLimit middleware:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify subscription limits'
      });
    }
  };
};


/**
 * Middleware factory to check if organization has access to a specific feature
 * @param {string} featureName - Feature name to check
 * @returns {Function} Express middleware function
 * @requirements 6.4, 6.5
 */
const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const organizationId = req.user?.organization_id?.toString();
      
      if (!organizationId) {
        return res.status(401).json({
          error: 'Organization not found',
          code: 'ORGANIZATION_REQUIRED',
          message: 'User must belong to an organization'
        });
      }

      // Get cached subscription or fetch from DB
      const subscription = await getCachedSubscription(organizationId);

      if (!subscription) {
        return res.status(403).json({
          error: 'Subscription required',
          code: AccessErrorCodes.SUBSCRIPTION_REQUIRED,
          message: 'Your organization does not have an active subscription',
          upgradeUrl: '/settings/subscription'
        });
      }

      // Check subscription status
      if (!['active', 'trialing'].includes(subscription.status)) {
        return res.status(403).json({
          error: 'Subscription not active',
          code: AccessErrorCodes.SUBSCRIPTION_REQUIRED,
          message: `Your subscription status is ${subscription.status}. Please resolve any issues.`,
          upgradeUrl: '/settings/subscription'
        });
      }

      const plan = subscription.plan;
      
      // Check if feature is included in plan
      if (!plan.features.includes(featureName)) {
        const requiredPlan = getMinimumPlanForFeature(featureName);
        
        return res.status(403).json({
          error: `Feature '${featureName}' not available in your plan`,
          code: AccessErrorCodes.FEATURE_NOT_AVAILABLE,
          message: `The '${featureName}' feature is not available in your ${plan.displayName} plan. Please upgrade to ${requiredPlan} or higher.`,
          feature: featureName,
          currentPlan: plan.name,
          currentPlanDisplayName: plan.displayName,
          requiredPlan: requiredPlan,
          upgradeUrl: '/settings/subscription'
        });
      }

      // Attach subscription info to request for downstream use
      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('Error in requireFeature middleware:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify feature access'
      });
    }
  };
};

/**
 * Middleware to enforce read-only mode for expired/cancelled subscriptions
 * Allows GET requests, blocks POST/PUT/DELETE
 * @requirements 6.7
 */
const enforceSubscriptionAccess = async (req, res, next) => {
  try {
    const organizationId = req.user?.organization_id?.toString();
    
    if (!organizationId) {
      return res.status(401).json({
        error: 'Organization not found',
        code: 'ORGANIZATION_REQUIRED',
        message: 'User must belong to an organization'
      });
    }

    // Get cached subscription or fetch from DB
    const subscription = await getCachedSubscription(organizationId);

    if (!subscription) {
      return res.status(403).json({
        error: 'Subscription required',
        code: AccessErrorCodes.SUBSCRIPTION_REQUIRED,
        message: 'Your organization does not have an active subscription',
        upgradeUrl: '/settings/subscription'
      });
    }

    // Check if subscription is expired or cancelled (past period end)
    const isExpiredOrCancelled = 
      subscription.status === 'expired' || 
      subscription.status === 'cancelled' ||
      (subscription.cancelAtPeriodEnd && new Date() > new Date(subscription.currentPeriodEnd));

    if (isExpiredOrCancelled) {
      // Allow read operations (GET, HEAD, OPTIONS)
      const readOnlyMethods = ['GET', 'HEAD', 'OPTIONS'];
      
      if (readOnlyMethods.includes(req.method)) {
        // Allow read access but attach warning
        req.subscription = subscription;
        req.subscriptionReadOnly = true;
        return next();
      }

      // Block write operations
      return res.status(403).json({
        error: 'Subscription expired - read-only mode',
        code: AccessErrorCodes.READ_ONLY_MODE,
        message: 'Your subscription has expired. You can view existing data but cannot make changes. Please renew your subscription to continue.',
        subscriptionStatus: subscription.status,
        expiredAt: subscription.currentPeriodEnd,
        upgradeUrl: '/settings/subscription'
      });
    }

    // Attach subscription info to request
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Error in enforceSubscriptionAccess middleware:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify subscription access'
    });
  }
};


/**
 * Middleware to check if organization has an active subscription
 * Does not check limits, just verifies subscription exists and is active
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    const organizationId = req.user?.organization_id?.toString();
    
    if (!organizationId) {
      return res.status(401).json({
        error: 'Organization not found',
        code: 'ORGANIZATION_REQUIRED',
        message: 'User must belong to an organization'
      });
    }

    // Get cached subscription or fetch from DB
    const subscription = await getCachedSubscription(organizationId);

    if (!subscription) {
      return res.status(403).json({
        error: 'Subscription required',
        code: AccessErrorCodes.SUBSCRIPTION_REQUIRED,
        message: 'Your organization does not have an active subscription',
        upgradeUrl: '/settings/subscription'
      });
    }

    // Check subscription status
    if (!['active', 'trialing'].includes(subscription.status)) {
      return res.status(403).json({
        error: 'Subscription not active',
        code: AccessErrorCodes.SUBSCRIPTION_REQUIRED,
        message: `Your subscription status is ${subscription.status}. Please resolve any issues.`,
        subscriptionStatus: subscription.status,
        upgradeUrl: '/settings/subscription'
      });
    }

    // Attach subscription info to request
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Error in requireActiveSubscription middleware:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify subscription'
    });
  }
};

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (bytes === -1) return 'Unlimited';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Invalidate subscription cache for an organization
 * Call this when subscription is updated
 * @param {string} organizationId - Organization ID
 */
const invalidateSubscriptionCache = (organizationId) => {
  subscriptionCache.invalidate(organizationId);
};

/**
 * Clear entire subscription cache
 * Useful for testing or admin operations
 */
const clearSubscriptionCache = () => {
  subscriptionCache.clear();
};

module.exports = {
  checkSubscriptionLimit,
  requireFeature,
  enforceSubscriptionAccess,
  requireActiveSubscription,
  invalidateSubscriptionCache,
  clearSubscriptionCache,
  subscriptionCache,
  AccessErrorCodes,
  getMinimumPlanForFeature
};
