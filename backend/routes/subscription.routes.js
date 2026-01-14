const router = require("express").Router();
const {
  getPlans,
  getCurrentSubscription,
  createSubscription,
  upgradeSubscription,
  downgradeSubscription,
  cancelSubscription,
  startTrial,
  checkFeatureAccess,
} = require("../controllers/subscription.controller");
const { isLoggedIn } = require("../middlewares/auth.middleware");

/**
 * Subscription Routes
 * 
 * @requirements 2.1, 2.2, 2.3, 2.4
 */

// GET /subscriptions/plans - List all available subscription plans (public)
router.get("/plans", getPlans);

// GET /subscriptions/current - Get current subscription for the organization
router.get("/current", isLoggedIn, getCurrentSubscription);

// POST /subscriptions - Create a new subscription
router.post("/", isLoggedIn, createSubscription);

// PUT /subscriptions/upgrade - Upgrade to a higher tier plan
router.put("/upgrade", isLoggedIn, upgradeSubscription);

// PUT /subscriptions/downgrade - Downgrade to a lower tier plan (scheduled for period end)
router.put("/downgrade", isLoggedIn, downgradeSubscription);

// POST /subscriptions/cancel - Cancel subscription
router.post("/cancel", isLoggedIn, cancelSubscription);

// POST /subscriptions/trial - Start a trial for Professional plan
router.post("/trial", isLoggedIn, startTrial);

// GET /subscriptions/features/:featureName - Check if organization has access to a feature
router.get("/features/:featureName", isLoggedIn, checkFeatureAccess);

module.exports = router;
