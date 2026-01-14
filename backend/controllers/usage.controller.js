const {
  errorResponse,
  successResponse,
  catchResponse,
} = require("../utils/response");
const { UsageTracker, UsageNotificationService } = require("../services/usageTracker.service");

/**
 * UsageController - Handles usage-related HTTP requests
 * 
 * @requirements 7.6
 */

/**
 * Get current usage statistics for the organization
 * GET /usage
 * @requirements 7.6
 */
const getUsage = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    const usage = await UsageTracker.getUsage(organizationId);
    return successResponse(res, usage, "Usage statistics retrieved successfully");
  } catch (err) {
    console.error("Error getting usage statistics:", err);
    return catchResponse(res);
  }
};

/**
 * Get usage percentages with plan limits
 * GET /usage/percentages
 */
const getUsagePercentages = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    const percentages = await UsageTracker.getUsagePercentages(organizationId);
    return successResponse(res, percentages, "Usage percentages retrieved successfully");
  } catch (err) {
    console.error("Error getting usage percentages:", err);
    return catchResponse(res);
  }
};

/**
 * Check if organization is within plan limits
 * GET /usage/limits
 */
const checkLimits = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { resourceType } = req.query;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    const limits = await UsageTracker.checkLimits(organizationId, resourceType);
    return successResponse(res, limits, "Limits checked successfully");
  } catch (err) {
    console.error("Error checking limits:", err);
    return catchResponse(res);
  }
};

/**
 * Get detailed usage report
 * GET /usage/report
 */
const getUsageReport = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    const report = await UsageTracker.getDetailedUsageReport(organizationId);
    return successResponse(res, report, "Usage report retrieved successfully");
  } catch (err) {
    console.error("Error getting usage report:", err);
    return catchResponse(res);
  }
};

/**
 * Check if a resource can be added
 * GET /usage/can-add
 * Query: { resourceType, amount }
 */
const canAddResource = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { resourceType, amount } = req.query;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    if (!resourceType) {
      return errorResponse(res, 400, "Resource type is required");
    }

    const result = await UsageTracker.canAddResource(
      organizationId,
      resourceType,
      parseInt(amount, 10) || 1
    );
    return successResponse(res, result, "Resource check completed");
  } catch (err) {
    console.error("Error checking if resource can be added:", err);
    return catchResponse(res);
  }
};

/**
 * Get unacknowledged usage notifications
 * GET /usage/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    const notifications = await UsageNotificationService.getUnacknowledgedNotifications(organizationId);
    return successResponse(res, notifications, "Notifications retrieved successfully");
  } catch (err) {
    console.error("Error getting notifications:", err);
    return catchResponse(res);
  }
};

/**
 * Acknowledge a usage notification
 * POST /usage/notifications/:id/acknowledge
 */
const acknowledgeNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, 400, "Notification ID is required");
    }

    const notification = await UsageNotificationService.acknowledgeNotification(id, userId);
    
    if (!notification) {
      return errorResponse(res, 404, "Notification not found");
    }

    return successResponse(res, notification, "Notification acknowledged successfully");
  } catch (err) {
    console.error("Error acknowledging notification:", err);
    return catchResponse(res);
  }
};

module.exports = {
  getUsage,
  getUsagePercentages,
  checkLimits,
  getUsageReport,
  canAddResource,
  getNotifications,
  acknowledgeNotification,
};
