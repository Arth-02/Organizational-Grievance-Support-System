const mongoose = require('mongoose');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const Attachment = require('../models/attachment.model');
const Subscription = require('../models/subscription.model');
const SubscriptionPlan = require('../models/subscriptionPlan.model');

/**
 * UsageTracker - Tracks and monitors organization resource usage
 * 
 * @requirements 7.1, 7.2, 7.3
 */
class UsageTracker {
  /**
   * Get current usage statistics for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<{userCount: number, projectCount: number, storageBytes: number}>}
   * @requirements 7.1, 7.2, 7.3
   */
  static async getUsage(organizationId) {
    if (!mongoose.isValidObjectId(organizationId)) {
      throw new Error('Invalid organization ID');
    }

    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    const [userCount, projectCount, storageResult] = await Promise.all([
      // Count non-deleted users
      User.countDocuments({ 
        organization_id: orgObjectId, 
        is_deleted: { $ne: true }
      }),
      // Count non-deleted projects
      Project.countDocuments({ 
        organization_id: orgObjectId, 
        deleted_at: null 
      }),
      // Calculate total storage from active attachments
      Attachment.aggregate([
        { 
          $match: { 
            organization_id: orgObjectId,
            is_active: true 
          } 
        },
        { 
          $group: { 
            _id: null, 
            totalBytes: { $sum: '$filesize' } 
          } 
        }
      ])
    ]);

    const storageBytes = storageResult[0]?.totalBytes || 0;

    return { userCount, projectCount, storageBytes };
  }

  /**
   * Check if organization is within plan limits
   * @param {string} organizationId - Organization ID
   * @param {string} [resourceType] - Optional specific resource to check ('users', 'projects', 'storage')
   * @returns {Promise<{withinLimits: boolean, limits: Object, usage: Object, violations: Array}>}
   * @requirements 7.1, 7.2, 7.3
   */
  static async checkLimits(organizationId, resourceType = null) {
    if (!mongoose.isValidObjectId(organizationId)) {
      throw new Error('Invalid organization ID');
    }

    // Get subscription with plan
    const subscription = await Subscription.findOne({
      organization_id: organizationId
    }).populate('plan_id');

    if (!subscription || !subscription.plan_id) {
      throw new Error('No subscription found for organization');
    }

    const plan = subscription.plan_id;
    const usage = await this.getUsage(organizationId);
    const violations = [];

    const limits = {
      users: {
        current: usage.userCount,
        max: plan.limits.maxUsers,
        unlimited: plan.limits.maxUsers === -1
      },
      projects: {
        current: usage.projectCount,
        max: plan.limits.maxProjects,
        unlimited: plan.limits.maxProjects === -1
      },
      storage: {
        current: usage.storageBytes,
        max: plan.limits.maxStorageBytes,
        unlimited: plan.limits.maxStorageBytes === -1
      }
    };

    // Check specific resource or all resources
    const resourcesToCheck = resourceType ? [resourceType] : ['users', 'projects', 'storage'];

    for (const resource of resourcesToCheck) {
      const limit = limits[resource];
      if (!limit) continue;

      if (!limit.unlimited && limit.current >= limit.max) {
        violations.push({
          resource,
          current: limit.current,
          max: limit.max,
          message: `${resource} limit reached (${limit.current}/${limit.max})`
        });
      }
    }

    return {
      withinLimits: violations.length === 0,
      limits,
      usage,
      violations,
      planName: plan.name,
      planDisplayName: plan.displayName
    };
  }

  /**
   * Calculate usage percentages for each resource type
   * @param {string} organizationId - Organization ID
   * @returns {Promise<{users: Object, projects: Object, storage: Object}>}
   * @requirements 7.1, 7.2, 7.3
   */
  static async getUsagePercentages(organizationId) {
    if (!mongoose.isValidObjectId(organizationId)) {
      throw new Error('Invalid organization ID');
    }

    // Get subscription with plan
    const subscription = await Subscription.findOne({
      organization_id: organizationId
    }).populate('plan_id');

    if (!subscription || !subscription.plan_id) {
      throw new Error('No subscription found for organization');
    }

    const plan = subscription.plan_id;
    const usage = await this.getUsage(organizationId);

    const calculatePercentage = (current, max) => {
      if (max === -1) return 0; // Unlimited
      if (max === 0) return 100; // Edge case: max is 0
      return Math.min(100, Math.round((current / max) * 100));
    };

    return {
      users: {
        current: usage.userCount,
        limit: plan.limits.maxUsers,
        percentage: calculatePercentage(usage.userCount, plan.limits.maxUsers),
        unlimited: plan.limits.maxUsers === -1,
        status: this._getUsageStatus(usage.userCount, plan.limits.maxUsers)
      },
      projects: {
        current: usage.projectCount,
        limit: plan.limits.maxProjects,
        percentage: calculatePercentage(usage.projectCount, plan.limits.maxProjects),
        unlimited: plan.limits.maxProjects === -1,
        status: this._getUsageStatus(usage.projectCount, plan.limits.maxProjects)
      },
      storage: {
        current: usage.storageBytes,
        limit: plan.limits.maxStorageBytes,
        percentage: calculatePercentage(usage.storageBytes, plan.limits.maxStorageBytes),
        unlimited: plan.limits.maxStorageBytes === -1,
        status: this._getUsageStatus(usage.storageBytes, plan.limits.maxStorageBytes),
        // Human-readable storage values
        currentFormatted: this._formatBytes(usage.storageBytes),
        limitFormatted: plan.limits.maxStorageBytes === -1 
          ? 'Unlimited' 
          : this._formatBytes(plan.limits.maxStorageBytes)
      },
      planName: plan.name,
      planDisplayName: plan.displayName,
      subscriptionStatus: subscription.status
    };
  }


  /**
   * Check if adding a resource would exceed limits
   * @param {string} organizationId - Organization ID
   * @param {string} resourceType - Resource type ('users', 'projects', 'storage')
   * @param {number} [additionalAmount=1] - Amount to add (1 for users/projects, bytes for storage)
   * @returns {Promise<{allowed: boolean, current: number, limit: number, afterAdd: number}>}
   */
  static async canAddResource(organizationId, resourceType, additionalAmount = 1) {
    if (!mongoose.isValidObjectId(organizationId)) {
      throw new Error('Invalid organization ID');
    }

    if (!['users', 'projects', 'storage'].includes(resourceType)) {
      throw new Error('Invalid resource type. Must be users, projects, or storage');
    }

    const subscription = await Subscription.findOne({
      organization_id: organizationId
    }).populate('plan_id');

    if (!subscription || !subscription.plan_id) {
      throw new Error('No subscription found for organization');
    }

    // Check subscription status
    if (!['active', 'trialing'].includes(subscription.status)) {
      return {
        allowed: false,
        reason: `Subscription is ${subscription.status}`,
        current: 0,
        limit: 0,
        afterAdd: 0
      };
    }

    const plan = subscription.plan_id;
    const usage = await this.getUsage(organizationId);

    let current, limit;
    switch (resourceType) {
      case 'users':
        current = usage.userCount;
        limit = plan.limits.maxUsers;
        break;
      case 'projects':
        current = usage.projectCount;
        limit = plan.limits.maxProjects;
        break;
      case 'storage':
        current = usage.storageBytes;
        limit = plan.limits.maxStorageBytes;
        break;
    }

    // Unlimited
    if (limit === -1) {
      return {
        allowed: true,
        current,
        limit: -1,
        afterAdd: current + additionalAmount,
        unlimited: true
      };
    }

    const afterAdd = current + additionalAmount;
    const allowed = afterAdd <= limit;

    return {
      allowed,
      current,
      limit,
      afterAdd,
      unlimited: false,
      reason: allowed ? null : `Adding ${additionalAmount} would exceed ${resourceType} limit (${current}/${limit})`
    };
  }

  /**
   * Get usage status based on percentage thresholds
   * @param {number} current - Current usage
   * @param {number} max - Maximum limit
   * @returns {string} Status: 'ok', 'warning', 'critical', or 'unlimited'
   * @private
   */
  static _getUsageStatus(current, max) {
    if (max === -1) return 'unlimited';
    if (max === 0) return 'critical';
    
    const percentage = (current / max) * 100;
    
    if (percentage >= 100) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'ok';
  }

  /**
   * Format bytes to human-readable string
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string (e.g., "1.5 GB")
   * @private
   */
  static _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get detailed usage report for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Detailed usage report
   */
  static async getDetailedUsageReport(organizationId) {
    if (!mongoose.isValidObjectId(organizationId)) {
      throw new Error('Invalid organization ID');
    }

    const subscription = await Subscription.findOne({
      organization_id: organizationId
    }).populate('plan_id');

    if (!subscription || !subscription.plan_id) {
      throw new Error('No subscription found for organization');
    }

    const plan = subscription.plan_id;
    const usage = await this.getUsage(organizationId);
    const percentages = await this.getUsagePercentages(organizationId);

    return {
      organizationId,
      subscription: {
        id: subscription._id,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd
      },
      plan: {
        id: plan._id,
        name: plan.name,
        displayName: plan.displayName,
        limits: plan.limits,
        features: plan.features
      },
      usage: {
        raw: usage,
        percentages: {
          users: percentages.users,
          projects: percentages.projects,
          storage: percentages.storage
        }
      },
      summary: {
        overallStatus: this._getOverallStatus(percentages),
        warnings: this._getWarnings(percentages),
        recommendations: this._getRecommendations(percentages, plan)
      },
      generatedAt: new Date()
    };
  }

  /**
   * Get overall usage status
   * @param {Object} percentages - Usage percentages object
   * @returns {string} Overall status
   * @private
   */
  static _getOverallStatus(percentages) {
    const statuses = [
      percentages.users.status,
      percentages.projects.status,
      percentages.storage.status
    ];

    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'ok';
  }

  /**
   * Get warnings based on usage
   * @param {Object} percentages - Usage percentages object
   * @returns {Array} Array of warning messages
   * @private
   */
  static _getWarnings(percentages) {
    const warnings = [];

    if (percentages.users.status === 'warning') {
      warnings.push(`User usage at ${percentages.users.percentage}% of limit`);
    } else if (percentages.users.status === 'critical') {
      warnings.push(`User limit reached (${percentages.users.current}/${percentages.users.limit})`);
    }

    if (percentages.projects.status === 'warning') {
      warnings.push(`Project usage at ${percentages.projects.percentage}% of limit`);
    } else if (percentages.projects.status === 'critical') {
      warnings.push(`Project limit reached (${percentages.projects.current}/${percentages.projects.limit})`);
    }

    if (percentages.storage.status === 'warning') {
      warnings.push(`Storage usage at ${percentages.storage.percentage}% of limit`);
    } else if (percentages.storage.status === 'critical') {
      warnings.push(`Storage limit reached (${percentages.storage.currentFormatted}/${percentages.storage.limitFormatted})`);
    }

    return warnings;
  }

  /**
   * Get recommendations based on usage
   * @param {Object} percentages - Usage percentages object
   * @param {Object} plan - Current plan
   * @returns {Array} Array of recommendations
   * @private
   */
  static _getRecommendations(percentages, plan) {
    const recommendations = [];
    const overallStatus = this._getOverallStatus(percentages);

    if (overallStatus === 'critical' && plan.name !== 'enterprise') {
      recommendations.push({
        type: 'upgrade',
        message: 'Consider upgrading your plan to increase limits',
        priority: 'high'
      });
    } else if (overallStatus === 'warning' && plan.name === 'starter') {
      recommendations.push({
        type: 'upgrade',
        message: 'You are approaching your plan limits. Consider upgrading to Professional.',
        priority: 'medium'
      });
    }

    if (percentages.storage.status === 'warning' || percentages.storage.status === 'critical') {
      recommendations.push({
        type: 'cleanup',
        message: 'Consider removing unused attachments to free up storage',
        priority: percentages.storage.status === 'critical' ? 'high' : 'medium'
      });
    }

    return recommendations;
  }
}

// Import notification dependencies
const UsageNotification = require('../models/usageNotification.model');
const { sendNotification } = require('../utils/notification');
const { sendEmail } = require('../utils/mail');

/**
 * UsageNotificationService - Handles usage threshold notifications
 * 
 * @requirements 7.4, 7.5
 */
class UsageNotificationService {
  /**
   * Check usage and send notifications if thresholds are crossed
   * @param {string} organizationId - Organization ID
   * @returns {Promise<{notificationsSent: Array, warnings: Array}>}
   * @requirements 7.4, 7.5
   */
  static async checkAndNotify(organizationId) {
    if (!mongoose.isValidObjectId(organizationId)) {
      throw new Error('Invalid organization ID');
    }

    const subscription = await Subscription.findOne({
      organization_id: organizationId
    }).populate('plan_id');

    if (!subscription || !subscription.plan_id) {
      return { notificationsSent: [], warnings: ['No subscription found'] };
    }

    // Only check for active/trialing subscriptions
    if (!['active', 'trialing'].includes(subscription.status)) {
      return { notificationsSent: [], warnings: ['Subscription not active'] };
    }

    const percentages = await UsageTracker.getUsagePercentages(organizationId);
    const notificationsSent = [];
    const warnings = [];

    // Check each resource type
    const resourceTypes = ['users', 'projects', 'storage'];

    for (const resourceType of resourceTypes) {
      const usage = percentages[resourceType];
      
      // Skip unlimited resources
      if (usage.unlimited) continue;

      // Check 100% threshold (critical)
      if (usage.percentage >= 100) {
        const sent = await this._sendThresholdNotification(
          organizationId,
          resourceType,
          'critical',
          100,
          usage,
          subscription.currentPeriodStart
        );
        if (sent) {
          notificationsSent.push({
            resourceType,
            thresholdType: 'critical',
            percentage: usage.percentage
          });
        }
      }
      // Check 80% threshold (warning)
      else if (usage.percentage >= 80) {
        const sent = await this._sendThresholdNotification(
          organizationId,
          resourceType,
          'warning',
          80,
          usage,
          subscription.currentPeriodStart
        );
        if (sent) {
          notificationsSent.push({
            resourceType,
            thresholdType: 'warning',
            percentage: usage.percentage
          });
        }
      }
    }

    return { notificationsSent, warnings };
  }

  /**
   * Send threshold notification if not already sent in current billing period
   * @param {string} organizationId - Organization ID
   * @param {string} resourceType - Resource type
   * @param {string} thresholdType - 'warning' or 'critical'
   * @param {number} thresholdPercentage - 80 or 100
   * @param {Object} usage - Current usage data
   * @param {Date} billingPeriodStart - Start of current billing period
   * @returns {Promise<boolean>} Whether notification was sent
   * @private
   */
  static async _sendThresholdNotification(
    organizationId,
    resourceType,
    thresholdType,
    thresholdPercentage,
    usage,
    billingPeriodStart
  ) {
    try {
      // Check if notification already sent for this threshold in current billing period
      const existingNotification = await UsageNotification.findOne({
        organization_id: organizationId,
        resourceType,
        thresholdType,
        billingPeriodStart
      });

      if (existingNotification) {
        // Already notified for this threshold
        return false;
      }

      // Get organization admins to notify
      const admins = await this._getOrganizationAdmins(organizationId);
      
      if (admins.length === 0) {
        console.warn(`No admins found for organization ${organizationId}`);
        return false;
      }

      // Create notification record
      const notification = await UsageNotification.create({
        organization_id: organizationId,
        resourceType,
        thresholdType,
        thresholdPercentage,
        usageAtNotification: {
          current: usage.current,
          limit: usage.limit,
          percentage: usage.percentage
        },
        notificationMethod: 'both',
        notifiedUsers: admins.map(a => a._id),
        billingPeriodStart
      });

      // Send socket notification
      await this._sendSocketNotification(admins, resourceType, thresholdType, usage);

      // Send email notification
      await this._sendEmailNotification(admins, resourceType, thresholdType, usage);

      return true;
    } catch (error) {
      // Handle duplicate key error (race condition)
      if (error.code === 11000) {
        return false;
      }
      console.error('Error sending threshold notification:', error);
      return false;
    }
  }

  /**
   * Get organization admins (users with admin role)
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} Array of admin users
   * @private
   */
  static async _getOrganizationAdmins(organizationId) {
    const Role = require('../models/role.model');
    
    // Find admin role for the organization
    const adminRole = await Role.findOne({
      organization_id: organizationId,
      name: { $regex: /admin/i }
    });

    if (!adminRole) {
      // Fallback: get all users if no admin role found
      return User.find({
        organization_id: organizationId,
        is_deleted: { $ne: true },
        is_active: true
      }).limit(5);
    }

    return User.find({
      organization_id: organizationId,
      role: adminRole._id,
      is_deleted: { $ne: true },
      is_active: true
    });
  }

  /**
   * Send socket notification to users
   * @param {Array} users - Users to notify
   * @param {string} resourceType - Resource type
   * @param {string} thresholdType - 'warning' or 'critical'
   * @param {Object} usage - Usage data
   * @private
   */
  static async _sendSocketNotification(users, resourceType, thresholdType, usage) {
    const userIds = users.map(u => u._id.toString());
    
    const notification = {
      type: 'usage_alert',
      data: {
        resourceType,
        thresholdType,
        current: usage.current,
        limit: usage.limit,
        percentage: usage.percentage,
        message: this._getNotificationMessage(resourceType, thresholdType, usage)
      },
      timestamp: new Date()
    };

    try {
      sendNotification(userIds, notification);
    } catch (error) {
      console.error('Error sending socket notification:', error);
    }
  }

  /**
   * Send email notification to users
   * @param {Array} users - Users to notify
   * @param {string} resourceType - Resource type
   * @param {string} thresholdType - 'warning' or 'critical'
   * @param {Object} usage - Usage data
   * @private
   */
  static async _sendEmailNotification(users, resourceType, thresholdType, usage) {
    const subject = thresholdType === 'critical'
      ? `⚠️ ${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} Limit Reached`
      : `📊 ${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} Usage Warning`;

    const message = this._getNotificationMessage(resourceType, thresholdType, usage);
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${thresholdType === 'critical' ? '#dc2626' : '#f59e0b'};">
          ${subject}
        </h2>
        <p>${message}</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Current Usage:</strong> ${usage.current}</p>
          <p style="margin: 8px 0 0;"><strong>Limit:</strong> ${usage.limit}</p>
          <p style="margin: 8px 0 0;"><strong>Usage:</strong> ${usage.percentage}%</p>
        </div>
        ${thresholdType === 'critical' 
          ? '<p style="color: #dc2626;"><strong>Action Required:</strong> Please upgrade your plan or remove unused resources to continue adding new items.</p>'
          : '<p>Consider upgrading your plan to avoid hitting limits.</p>'
        }
        <p style="margin-top: 24px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/subscription" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Manage Subscription
          </a>
        </p>
      </div>
    `;

    for (const user of users) {
      try {
        await sendEmail(user.email, subject, html);
      } catch (error) {
        console.error(`Error sending email to ${user.email}:`, error);
      }
    }
  }

  /**
   * Get notification message based on resource type and threshold
   * @param {string} resourceType - Resource type
   * @param {string} thresholdType - 'warning' or 'critical'
   * @param {Object} usage - Usage data
   * @returns {string} Notification message
   * @private
   */
  static _getNotificationMessage(resourceType, thresholdType, usage) {
    const resourceNames = {
      users: 'user',
      projects: 'project',
      storage: 'storage'
    };

    const resourceName = resourceNames[resourceType] || resourceType;

    if (thresholdType === 'critical') {
      return `Your organization has reached the ${resourceName} limit. You are currently using ${usage.current} out of ${usage.limit} ${resourceName}${usage.current !== 1 ? 's' : ''}. Please upgrade your plan or remove unused resources to add more.`;
    }

    return `Your organization is approaching the ${resourceName} limit. You are currently using ${usage.percentage}% of your ${resourceName} allocation (${usage.current}/${usage.limit}). Consider upgrading your plan to avoid hitting limits.`;
  }

  /**
   * Get unacknowledged notifications for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} Array of unacknowledged notifications
   */
  static async getUnacknowledgedNotifications(organizationId) {
    if (!mongoose.isValidObjectId(organizationId)) {
      throw new Error('Invalid organization ID');
    }

    return UsageNotification.find({
      organization_id: organizationId,
      acknowledged: false
    }).sort({ created_at: -1 });
  }

  /**
   * Acknowledge a notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User acknowledging the notification
   * @returns {Promise<Object>} Updated notification
   */
  static async acknowledgeNotification(notificationId, userId) {
    if (!mongoose.isValidObjectId(notificationId)) {
      throw new Error('Invalid notification ID');
    }

    return UsageNotification.findByIdAndUpdate(
      notificationId,
      {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId
      },
      { new: true }
    );
  }

  /**
   * Reset notifications for a new billing period
   * This should be called when a subscription renews
   * @param {string} organizationId - Organization ID
   * @param {Date} newPeriodStart - New billing period start date
   * @returns {Promise<{deletedCount: number}>}
   */
  static async resetNotificationsForNewPeriod(organizationId, newPeriodStart) {
    if (!mongoose.isValidObjectId(organizationId)) {
      throw new Error('Invalid organization ID');
    }

    // Delete old notifications from previous billing periods
    const result = await UsageNotification.deleteMany({
      organization_id: organizationId,
      billingPeriodStart: { $lt: newPeriodStart }
    });

    return { deletedCount: result.deletedCount };
  }
}

module.exports = UsageTracker;
module.exports.UsageTracker = UsageTracker;
module.exports.UsageNotificationService = UsageNotificationService;
