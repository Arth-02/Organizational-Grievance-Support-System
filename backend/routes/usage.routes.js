const router = require("express").Router();
const {
  getUsage,
  getUsagePercentages,
  checkLimits,
  getUsageReport,
  canAddResource,
  getNotifications,
  acknowledgeNotification,
} = require("../controllers/usage.controller");
const { isLoggedIn } = require("../middlewares/auth.middleware");

/**
 * Usage Routes
 * 
 * @requirements 7.6
 */

// GET /usage - Get current usage statistics
router.get("/", isLoggedIn, getUsage);

// GET /usage/percentages - Get usage percentages with plan limits
router.get("/percentages", isLoggedIn, getUsagePercentages);

// GET /usage/limits - Check if organization is within plan limits
router.get("/limits", isLoggedIn, checkLimits);

// GET /usage/report - Get detailed usage report
router.get("/report", isLoggedIn, getUsageReport);

// GET /usage/can-add - Check if a resource can be added
router.get("/can-add", isLoggedIn, canAddResource);

// GET /usage/notifications - Get unacknowledged usage notifications
router.get("/notifications", isLoggedIn, getNotifications);

// POST /usage/notifications/:id/acknowledge - Acknowledge a usage notification
router.post("/notifications/:id/acknowledge", isLoggedIn, acknowledgeNotification);

module.exports = router;
