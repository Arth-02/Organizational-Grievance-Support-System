const {
  errorResponse,
  successResponse,
  catchResponse,
} = require("../utils/response");
const { subscriptionService } = require("../services/subscription.service");

/**
 * SubscriptionController - Handles subscription-related HTTP requests
 * 
 * @requirements 2.1, 2.2, 2.3, 2.4
 */

/**
 * Get all available subscription plans
 * GET /subscriptions/plans
 */
const getPlans = async (req, res) => {
  try {
    const response = await subscriptionService.getAvailablePlans();
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Subscription plans retrieved successfully");
  } catch (err) {
    console.error("Error getting subscription plans:", err);
    return catchResponse(res);
  }
};

/**
 * Get current subscription for the organization
 * GET /subscriptions/current
 */
const getCurrentSubscription = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    
    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    const response = await subscriptionService.getSubscriptionWithUsage(organizationId);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Subscription retrieved successfully");
  } catch (err) {
    console.error("Error getting current subscription:", err);
    return catchResponse(res);
  }
};

/**
 * Create a new subscription
 * POST /subscriptions
 * Body: { planId, billingCycle, paymentMethodId }
 */
const createSubscription = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { planId, billingCycle, paymentMethodId } = req.body;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    if (!planId) {
      return errorResponse(res, 400, "Plan ID is required");
    }

    const response = await subscriptionService.createSubscription(
      organizationId,
      planId,
      billingCycle || 'monthly',
      paymentMethodId
    );

    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Subscription created successfully", 201);
  } catch (err) {
    console.error("Error creating subscription:", err);
    return catchResponse(res);
  }
};


/**
 * Upgrade subscription to a higher tier plan
 * PUT /subscriptions/upgrade
 * Body: { newPlanId }
 * @requirements 2.2
 */
const upgradeSubscription = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { newPlanId } = req.body;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    if (!newPlanId) {
      return errorResponse(res, 400, "New plan ID is required");
    }

    const response = await subscriptionService.upgradeSubscription(organizationId, newPlanId);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Subscription upgraded successfully");
  } catch (err) {
    console.error("Error upgrading subscription:", err);
    return catchResponse(res);
  }
};

/**
 * Downgrade subscription to a lower tier plan (scheduled for period end)
 * PUT /subscriptions/downgrade
 * Body: { newPlanId }
 * @requirements 2.3
 */
const downgradeSubscription = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { newPlanId } = req.body;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    if (!newPlanId) {
      return errorResponse(res, 400, "New plan ID is required");
    }

    const response = await subscriptionService.downgradeSubscription(organizationId, newPlanId);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Subscription downgrade scheduled successfully");
  } catch (err) {
    console.error("Error downgrading subscription:", err);
    return catchResponse(res);
  }
};

/**
 * Cancel subscription
 * POST /subscriptions/cancel
 * Body: { immediate: boolean }
 * @requirements 2.4
 */
const cancelSubscription = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { immediate } = req.body;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    const response = await subscriptionService.cancelSubscription(organizationId, immediate === true);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Subscription cancelled successfully");
  } catch (err) {
    console.error("Error cancelling subscription:", err);
    return catchResponse(res);
  }
};

/**
 * Start a trial for Professional plan
 * POST /subscriptions/trial
 * @requirements 2.7
 */
const startTrial = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    const response = await subscriptionService.startTrial(organizationId);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Trial started successfully", 201);
  } catch (err) {
    console.error("Error starting trial:", err);
    return catchResponse(res);
  }
};

/**
 * Check if organization has access to a specific feature
 * GET /subscriptions/features/:featureName
 */
const checkFeatureAccess = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { featureName } = req.params;

    if (!organizationId) {
      return errorResponse(res, 400, "Organization ID is required");
    }

    if (!featureName) {
      return errorResponse(res, 400, "Feature name is required");
    }

    const response = await subscriptionService.hasFeatureAccess(organizationId, featureName);
    if (!response.isSuccess) {
      return errorResponse(res, response.code || 500, response.message);
    }
    return successResponse(res, response.data, "Feature access checked successfully");
  } catch (err) {
    console.error("Error checking feature access:", err);
    return catchResponse(res);
  }
};

module.exports = {
  getPlans,
  getCurrentSubscription,
  createSubscription,
  upgradeSubscription,
  downgradeSubscription,
  cancelSubscription,
  startTrial,
  checkFeatureAccess,
};
