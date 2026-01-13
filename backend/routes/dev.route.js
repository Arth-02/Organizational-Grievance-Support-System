const { approveOrganization } = require("../controllers/dev.controller");
const {
  getDashboardStats,
  getRecentActivity,
  getGrowthTrends,
  getAllOrganizations,
  getOrganizationById,
  updateOrganizationStatus,
  rejectOrganization,
  deleteOrganization,
  getOrganizationUsers,
  // User management
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getAllOrganizationNames,
  // Role management
  getAllRoles,
  getRoleById,
  updateRoleStatus,
  deleteRole,
  // Grievance management
  getAllGrievances,
  getGrievanceById,
  updateGrievanceStatus,
  deleteGrievance,
  // Project management
  getAllProjects,
  getProjectById,
  updateProjectStatus,
  deleteProject,
  // Audit log management
  getAuditLogs,
  getAuditLogStats,
  getAuditLogActionTypes,
  getAuditLogById,
  clearOldAuditLogs,
} = require("../controllers/admin.controller");
const { checkRole } = require("../middlewares/auth.middleware");
const { DEV } = require("../utils/constant");

const router = require("express").Router();

// Dashboard routes
router.get("/dashboard/stats", checkRole([DEV]), getDashboardStats);
router.get("/dashboard/recent-activity", checkRole([DEV]), getRecentActivity);
router.get("/dashboard/trends", checkRole([DEV]), getGrowthTrends);

// Organizations management
router.get("/organizations", checkRole([DEV]), getAllOrganizations);
router.get("/organizations/names", checkRole([DEV]), getAllOrganizationNames);
router.get("/organizations/:id", checkRole([DEV]), getOrganizationById);
router.get("/organizations/:id/users", checkRole([DEV]), getOrganizationUsers);
router.post("/organizations/:id/approve", checkRole([DEV]), approveOrganization);
router.post("/organizations/:id/reject", checkRole([DEV]), rejectOrganization);
router.patch("/organizations/:id/status", checkRole([DEV]), updateOrganizationStatus);
router.delete("/organizations/:id", checkRole([DEV]), deleteOrganization);

// Users management
router.get("/users", checkRole([DEV]), getAllUsers);
router.get("/users/:id", checkRole([DEV]), getUserById);
router.patch("/users/:id/status", checkRole([DEV]), updateUserStatus);
router.delete("/users/:id", checkRole([DEV]), deleteUser);

// Roles management
router.get("/roles", checkRole([DEV]), getAllRoles);
router.get("/roles/:id", checkRole([DEV]), getRoleById);
router.patch("/roles/:id/status", checkRole([DEV]), updateRoleStatus);
router.delete("/roles/:id", checkRole([DEV]), deleteRole);

// Grievances management
router.get("/grievances", checkRole([DEV]), getAllGrievances);
router.get("/grievances/:id", checkRole([DEV]), getGrievanceById);
router.patch("/grievances/:id/status", checkRole([DEV]), updateGrievanceStatus);
router.delete("/grievances/:id", checkRole([DEV]), deleteGrievance);

// Projects management
router.get("/projects", checkRole([DEV]), getAllProjects);
router.get("/projects/:id", checkRole([DEV]), getProjectById);
router.patch("/projects/:id/status", checkRole([DEV]), updateProjectStatus);
router.delete("/projects/:id", checkRole([DEV]), deleteProject);

// Audit logs management
router.get("/audit-logs", checkRole([DEV]), getAuditLogs);
router.get("/audit-logs/stats", checkRole([DEV]), getAuditLogStats);
router.get("/audit-logs/action-types", checkRole([DEV]), getAuditLogActionTypes);
router.get("/audit-logs/:id", checkRole([DEV]), getAuditLogById);
router.delete("/audit-logs/clear", checkRole([DEV]), clearOldAuditLogs);

// Legacy route (keep for backward compatibility)
router.post("/verify-organization", checkRole([DEV]), approveOrganization);

module.exports = router;
