const UsageTracker = require('../services/usageTracker.service');
const { UsageNotificationService } = require('../services/usageTracker.service');

/**
 * Usage Hooks Middleware - Provides hooks for real-time usage tracking
 * 
 * @requirements 7.7
 */

/**
 * Simple in-memory cache for usage data
 * In production, consider using Redis for distributed caching
 */
const usageCache = new Map();
const CACHE_TTL = 60000; // 1 minute cache TTL

/**
 * Get cached usage or fetch fresh data
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} Usage data
 */
const getCachedUsage = async (organizationId) => {
  const cacheKey = `usage:${organizationId}`;
  const cached = usageCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const usage = await UsageTracker.getUsage(organizationId);
  usageCache.set(cacheKey, { data: usage, timestamp: Date.now() });
  return usage;
};

/**
 * Invalidate usage cache for an organization
 * @param {string} organizationId - Organization ID
 */
const invalidateUsageCache = (organizationId) => {
  const cacheKey = `usage:${organizationId}`;
  usageCache.delete(cacheKey);
};

/**
 * Hook to be called after a user is created
 * Updates usage cache and checks for notifications
 * @param {string} organizationId - Organization ID
 */
const onUserCreated = async (organizationId) => {
  try {
    invalidateUsageCache(organizationId);
    
    // Check and send notifications if thresholds crossed
    await UsageNotificationService.checkAndNotify(organizationId);
  } catch (error) {
    console.error('Error in onUserCreated hook:', error);
  }
};

/**
 * Hook to be called after a user is deleted
 * Updates usage cache
 * @param {string} organizationId - Organization ID
 */
const onUserDeleted = async (organizationId) => {
  try {
    invalidateUsageCache(organizationId);
  } catch (error) {
    console.error('Error in onUserDeleted hook:', error);
  }
};

/**
 * Hook to be called after a project is created
 * Updates usage cache and checks for notifications
 * @param {string} organizationId - Organization ID
 */
const onProjectCreated = async (organizationId) => {
  try {
    invalidateUsageCache(organizationId);
    
    // Check and send notifications if thresholds crossed
    await UsageNotificationService.checkAndNotify(organizationId);
  } catch (error) {
    console.error('Error in onProjectCreated hook:', error);
  }
};

/**
 * Hook to be called after a project is deleted
 * Updates usage cache
 * @param {string} organizationId - Organization ID
 */
const onProjectDeleted = async (organizationId) => {
  try {
    invalidateUsageCache(organizationId);
  } catch (error) {
    console.error('Error in onProjectDeleted hook:', error);
  }
};

/**
 * Hook to be called after an attachment is created
 * Updates usage cache and checks for notifications
 * @param {string} organizationId - Organization ID
 * @param {number} fileSize - Size of the uploaded file in bytes
 */
const onAttachmentCreated = async (organizationId, fileSize) => {
  try {
    invalidateUsageCache(organizationId);
    
    // Check and send notifications if thresholds crossed
    await UsageNotificationService.checkAndNotify(organizationId);
  } catch (error) {
    console.error('Error in onAttachmentCreated hook:', error);
  }
};

/**
 * Hook to be called after an attachment is deleted
 * Updates usage cache
 * @param {string} organizationId - Organization ID
 * @param {number} fileSize - Size of the deleted file in bytes
 */
const onAttachmentDeleted = async (organizationId, fileSize) => {
  try {
    invalidateUsageCache(organizationId);
  } catch (error) {
    console.error('Error in onAttachmentDeleted hook:', error);
  }
};

/**
 * Express middleware to track resource creation
 * Attaches hooks to response to be called after successful operations
 * @param {string} resourceType - Type of resource ('user', 'project', 'attachment')
 * @returns {Function} Express middleware
 */
const trackResourceCreation = (resourceType) => {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to intercept successful responses
    res.json = function(data) {
      // Check if operation was successful (status 200-299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const organizationId = req.user?.organization_id;
        
        if (organizationId) {
          // Call appropriate hook based on resource type
          setImmediate(async () => {
            try {
              switch (resourceType) {
                case 'user':
                  await onUserCreated(organizationId.toString());
                  break;
                case 'project':
                  await onProjectCreated(organizationId.toString());
                  break;
                case 'attachment':
                  const fileSize = req.file?.size || req.files?.reduce((sum, f) => sum + f.size, 0) || 0;
                  await onAttachmentCreated(organizationId.toString(), fileSize);
                  break;
              }
            } catch (error) {
              console.error(`Error in ${resourceType} creation hook:`, error);
            }
          });
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Express middleware to track resource deletion
 * @param {string} resourceType - Type of resource ('user', 'project', 'attachment')
 * @returns {Function} Express middleware
 */
const trackResourceDeletion = (resourceType) => {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to intercept successful responses
    res.json = function(data) {
      // Check if operation was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const organizationId = req.user?.organization_id;
        
        if (organizationId) {
          // Call appropriate hook based on resource type
          setImmediate(async () => {
            try {
              switch (resourceType) {
                case 'user':
                  await onUserDeleted(organizationId.toString());
                  break;
                case 'project':
                  await onProjectDeleted(organizationId.toString());
                  break;
                case 'attachment':
                  await onAttachmentDeleted(organizationId.toString(), 0);
                  break;
              }
            } catch (error) {
              console.error(`Error in ${resourceType} deletion hook:`, error);
            }
          });
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Utility function to manually trigger usage check
 * Can be called from services after batch operations
 * @param {string} organizationId - Organization ID
 */
const triggerUsageCheck = async (organizationId) => {
  try {
    invalidateUsageCache(organizationId);
    await UsageNotificationService.checkAndNotify(organizationId);
  } catch (error) {
    console.error('Error in triggerUsageCheck:', error);
  }
};

/**
 * Get current usage with caching
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} Usage data
 */
const getUsageWithCache = async (organizationId) => {
  return getCachedUsage(organizationId);
};

/**
 * Clear all usage cache (useful for testing or admin operations)
 */
const clearAllUsageCache = () => {
  usageCache.clear();
};

module.exports = {
  // Hooks for direct use in services
  onUserCreated,
  onUserDeleted,
  onProjectCreated,
  onProjectDeleted,
  onAttachmentCreated,
  onAttachmentDeleted,
  
  // Express middleware
  trackResourceCreation,
  trackResourceDeletion,
  
  // Utility functions
  triggerUsageCheck,
  getUsageWithCache,
  invalidateUsageCache,
  clearAllUsageCache
};
