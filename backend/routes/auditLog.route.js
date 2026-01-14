const router = require("express").Router();
const {
  isLoggedIn,
  checkPermission,
} = require("../middlewares/auth.middleware");
const {
  requireFeature,
} = require("../middlewares/subscription.middleware");
const {
  getOrganizationAuditLogs,
  getOrganizationAuditLogById,
  getOrganizationAuditLogStats,
  getOrganizationAuditLogActionTypes,
} = require("../controllers/auditLog.controller");

/**
 * Organization-level audit log routes
 * These routes are protected by the 'audit_logs' feature requirement
 * Only available to Professional and Enterprise plans
 * @requirements 6.4
 */

// Get all audit logs for the user's organization
router.get(
  "/",
  isLoggedIn,
  requireFeature('audit_logs'),
  getOrganizationAuditLogs
);

// Get audit log statistics for the user's organization
router.get(
  "/stats",
  isLoggedIn,
  requireFeature('audit_logs'),
  getOrganizationAuditLogStats
);

// Get available action types for filtering
router.get(
  "/action-types",
  isLoggedIn,
  requireFeature('audit_logs'),
  getOrganizationAuditLogActionTypes
);

// Get a specific audit log by ID (must belong to user's organization)
router.get(
  "/:id",
  isLoggedIn,
  requireFeature('audit_logs'),
  getOrganizationAuditLogById
);

module.exports = router;
