const adminService = require("../services/admin.service");
const auditService = require("../services/audit.service");
const mongoose = require("mongoose");
const {
  errorResponse,
  successResponse,
  catchResponse,
} = require("../utils/response");

// ==================== DASHBOARD ====================

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const response = await adminService.getDashboardStats();
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Dashboard stats retrieved successfully");
  } catch (err) {
    console.error("Get Dashboard Stats Error:", err);
    return catchResponse(res);
  }
};

// Get recent activity
const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const response = await adminService.getRecentActivity(limit);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Recent activity retrieved successfully");
  } catch (err) {
    console.error("Get Recent Activity Error:", err);
    return catchResponse(res);
  }
};

// Get growth trends
const getGrowthTrends = async (req, res) => {
  try {
    const response = await adminService.getGrowthTrends();
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Growth trends retrieved successfully");
  } catch (err) {
    console.error("Get Growth Trends Error:", err);
    return catchResponse(res);
  }
};

// ==================== ORGANIZATION MANAGEMENT ====================

// Get all organizations
const getAllOrganizations = async (req, res) => {
  try {
    const response = await adminService.getAllOrganizations(req.query);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(
      res,
      { organizations: response.data, pagination: response.pagination },
      "Organizations retrieved successfully"
    );
  } catch (err) {
    console.error("Get All Organizations Error:", err);
    return catchResponse(res);
  }
};

// Get organization by ID
const getOrganizationById = async (req, res) => {
  try {
    const response = await adminService.getOrganizationById(req.params.id);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Organization retrieved successfully");
  } catch (err) {
    console.error("Get Organization By ID Error:", err);
    return catchResponse(res);
  }
};

// Update organization status (suspend/activate)
const updateOrganizationStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== "boolean") {
      return errorResponse(res, 400, "is_active must be a boolean");
    }
    const response = await adminService.updateOrganizationStatus(req.params.id, is_active);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    
    // Log audit
    await auditService.logOrganizationAction(
      is_active ? "ORGANIZATION_ACTIVATED" : "ORGANIZATION_SUSPENDED",
      response.data,
      req
    );
    
    return successResponse(
      res,
      response.data,
      is_active ? "Organization activated successfully" : "Organization suspended successfully"
    );
  } catch (err) {
    console.error("Update Organization Status Error:", err);
    return catchResponse(res);
  }
};

// Reject organization
const rejectOrganization = async (req, res) => {
  try {
    const { reason } = req.body;
    // Get org details before rejection for audit
    const orgResponse = await adminService.getOrganizationById(req.params.id);
    const response = await adminService.rejectOrganization(req.params.id, reason);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    
    // Log audit
    if (orgResponse.isSuccess) {
      await auditService.logOrganizationAction(
        "ORGANIZATION_REJECTED",
        orgResponse.data,
        req,
        { reason }
      );
    }
    
    return successResponse(res, null, response.message);
  } catch (err) {
    console.error("Reject Organization Error:", err);
    return catchResponse(res);
  }
};

// Delete organization
const deleteOrganization = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Get org details before deletion for audit
    const orgResponse = await adminService.getOrganizationById(req.params.id);
    const response = await adminService.deleteOrganization(session, req.params.id);
    if (!response.isSuccess) {
      await session.abortTransaction();
      return errorResponse(res, response.code, response.message);
    }
    await session.commitTransaction();
    
    // Log audit
    if (orgResponse.isSuccess) {
      await auditService.logOrganizationAction(
        "ORGANIZATION_DELETED",
        orgResponse.data,
        req
      );
    }
    
    return successResponse(res, null, response.message);
  } catch (err) {
    await session.abortTransaction();
    console.error("Delete Organization Error:", err);
    return catchResponse(res);
  } finally {
    session.endSession();
  }
};

// Get organization users
const getOrganizationUsers = async (req, res) => {
  try {
    const response = await adminService.getOrganizationUsers(req.params.id, req.query);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(
      res,
      { users: response.data, pagination: response.pagination },
      "Users retrieved successfully"
    );
  } catch (err) {
    console.error("Get Organization Users Error:", err);
    return catchResponse(res);
  }
};

// ==================== USER MANAGEMENT ====================

// Get all users across organizations
const getAllUsers = async (req, res) => {
  try {
    const response = await adminService.getAllUsers(req.query);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(
      res,
      { users: response.data, pagination: response.pagination },
      "Users retrieved successfully"
    );
  } catch (err) {
    console.error("Get All Users Error:", err);
    return catchResponse(res);
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const response = await adminService.getUserById(req.params.id);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "User retrieved successfully");
  } catch (err) {
    console.error("Get User By ID Error:", err);
    return catchResponse(res);
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== "boolean") {
      return errorResponse(res, 400, "is_active must be a boolean");
    }
    const response = await adminService.updateUserStatus(req.params.id, is_active);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    
    // Log audit
    await auditService.logUserAction(
      is_active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      response.data,
      req
    );
    
    return successResponse(
      res,
      response.data,
      is_active ? "User activated successfully" : "User deactivated successfully"
    );
  } catch (err) {
    console.error("Update User Status Error:", err);
    return catchResponse(res);
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    // Get user details before deletion for audit
    const userResponse = await adminService.getUserById(req.params.id);
    const response = await adminService.deleteUser(req.params.id);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    
    // Log audit
    if (userResponse.isSuccess) {
      await auditService.logUserAction(
        "USER_DELETED",
        userResponse.data,
        req
      );
    }
    
    return successResponse(res, null, response.message);
  } catch (err) {
    console.error("Delete User Error:", err);
    return catchResponse(res);
  }
};

// Get all organization names for filter
const getAllOrganizationNames = async (req, res) => {
  try {
    const response = await adminService.getAllOrganizationNames();
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Organization names retrieved successfully");
  } catch (err) {
    console.error("Get All Organization Names Error:", err);
    return catchResponse(res);
  }
};

// ==================== ROLE MANAGEMENT ====================

// Get all roles across organizations
const getAllRoles = async (req, res) => {
  try {
    const response = await adminService.getAllRoles(req.query);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(
      res,
      { roles: response.data, pagination: response.pagination },
      "Roles retrieved successfully"
    );
  } catch (err) {
    console.error("Get All Roles Error:", err);
    return catchResponse(res);
  }
};

// Get role by ID
const getRoleById = async (req, res) => {
  try {
    const response = await adminService.getRoleById(req.params.id);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Role retrieved successfully");
  } catch (err) {
    console.error("Get Role By ID Error:", err);
    return catchResponse(res);
  }
};

// Update role status
const updateRoleStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== "boolean") {
      return errorResponse(res, 400, "is_active must be a boolean");
    }
    const response = await adminService.updateRoleStatus(req.params.id, is_active);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    
    // Log audit
    await auditService.logRoleAction(
      is_active ? "ROLE_ACTIVATED" : "ROLE_DEACTIVATED",
      response.data,
      req
    );
    
    return successResponse(
      res,
      response.data,
      is_active ? "Role activated successfully" : "Role deactivated successfully"
    );
  } catch (err) {
    console.error("Update Role Status Error:", err);
    return catchResponse(res);
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    // Get role details before deletion for audit
    const roleResponse = await adminService.getRoleById(req.params.id);
    const response = await adminService.deleteRole(req.params.id);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    
    // Log audit
    if (roleResponse.isSuccess) {
      await auditService.logRoleAction(
        "ROLE_DELETED",
        roleResponse.data,
        req
      );
    }
    
    return successResponse(res, null, response.message);
  } catch (err) {
    console.error("Delete Role Error:", err);
    return catchResponse(res);
  }
};

// ==================== GRIEVANCE MANAGEMENT ====================

// Get all grievances across organizations
const getAllGrievances = async (req, res) => {
  try {
    const response = await adminService.getAllGrievances(req.query);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(
      res,
      { grievances: response.data, pagination: response.pagination },
      "Grievances retrieved successfully"
    );
  } catch (err) {
    console.error("Get All Grievances Error:", err);
    return catchResponse(res);
  }
};

// Get grievance by ID
const getGrievanceById = async (req, res) => {
  try {
    const response = await adminService.getGrievanceById(req.params.id);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Grievance retrieved successfully");
  } catch (err) {
    console.error("Get Grievance By ID Error:", err);
    return catchResponse(res);
  }
};

// Update grievance status
const updateGrievanceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["submitted", "in-progress", "resolved", "dismissed"];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 400, "Invalid status. Must be one of: submitted, in-progress, resolved, dismissed");
    }
    
    // Get previous status for audit metadata
    const prevResponse = await adminService.getGrievanceById(req.params.id);
    const previousStatus = prevResponse.isSuccess ? prevResponse.data.status : null;
    
    const response = await adminService.updateGrievanceStatus(req.params.id, status);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    
    // Log audit
    await auditService.logGrievanceAction(
      "GRIEVANCE_STATUS_CHANGED",
      response.data,
      req,
      { previousStatus, newStatus: status }
    );
    
    return successResponse(res, response.data, "Grievance status updated successfully");
  } catch (err) {
    console.error("Update Grievance Status Error:", err);
    return catchResponse(res);
  }
};

// Delete grievance
const deleteGrievance = async (req, res) => {
  try {
    // Get grievance details before deletion for audit
    const grievanceResponse = await adminService.getGrievanceById(req.params.id);
    const response = await adminService.deleteGrievance(req.params.id);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    
    // Log audit
    if (grievanceResponse.isSuccess) {
      await auditService.logGrievanceAction(
        "GRIEVANCE_DELETED",
        grievanceResponse.data,
        req
      );
    }
    
    return successResponse(res, null, response.message);
  } catch (err) {
    console.error("Delete Grievance Error:", err);
    return catchResponse(res);
  }
};

// ==================== PROJECT MANAGEMENT ====================

// Get all projects across organizations
const getAllProjects = async (req, res) => {
  try {
    const response = await adminService.getAllProjects(req.query);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(
      res,
      { projects: response.data, pagination: response.pagination },
      "Projects retrieved successfully"
    );
  } catch (err) {
    console.error("Get All Projects Error:", err);
    return catchResponse(res);
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const response = await adminService.getProjectById(req.params.id);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Project retrieved successfully");
  } catch (err) {
    console.error("Get Project By ID Error:", err);
    return catchResponse(res);
  }
};

// Update project status
const updateProjectStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== "boolean") {
      return errorResponse(res, 400, "is_active must be a boolean");
    }
    const response = await adminService.updateProjectStatus(req.params.id, is_active);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    
    // Log audit
    await auditService.logProjectAction(
      is_active ? "PROJECT_ACTIVATED" : "PROJECT_DEACTIVATED",
      response.data,
      req
    );
    
    return successResponse(
      res,
      response.data,
      is_active ? "Project activated successfully" : "Project deactivated successfully"
    );
  } catch (err) {
    console.error("Update Project Status Error:", err);
    return catchResponse(res);
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    // Get project details before deletion for audit
    const projectResponse = await adminService.getProjectById(req.params.id);
    const response = await adminService.deleteProject(req.params.id);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    
    // Log audit
    if (projectResponse.isSuccess) {
      await auditService.logProjectAction(
        "PROJECT_DELETED",
        projectResponse.data,
        req
      );
    }
    
    return successResponse(res, null, response.message);
  } catch (err) {
    console.error("Delete Project Error:", err);
    return catchResponse(res);
  }
};

// ==================== AUDIT LOG MANAGEMENT ====================

// Get all audit logs
const getAuditLogs = async (req, res) => {
  try {
    const response = await adminService.getAuditLogs(req.query);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(
      res,
      { logs: response.data, pagination: response.pagination },
      "Audit logs retrieved successfully"
    );
  } catch (err) {
    console.error("Get Audit Logs Error:", err);
    return catchResponse(res);
  }
};

// Get audit log statistics
const getAuditLogStats = async (req, res) => {
  try {
    const response = await adminService.getAuditLogStats();
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Audit log stats retrieved successfully");
  } catch (err) {
    console.error("Get Audit Log Stats Error:", err);
    return catchResponse(res);
  }
};

// Get available action types
const getAuditLogActionTypes = async (req, res) => {
  try {
    const response = await adminService.getAuditLogActionTypes();
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Action types retrieved successfully");
  } catch (err) {
    console.error("Get Audit Log Action Types Error:", err);
    return catchResponse(res);
  }
};

// Get audit log by ID
const getAuditLogById = async (req, res) => {
  try {
    const response = await adminService.getAuditLogById(req.params.id);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, "Audit log retrieved successfully");
  } catch (err) {
    console.error("Get Audit Log By ID Error:", err);
    return catchResponse(res);
  }
};

// Clear old audit logs
const clearOldAuditLogs = async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;
    if (daysToKeep < 7) {
      return errorResponse(res, 400, "Days to keep must be at least 7");
    }
    const response = await adminService.clearOldAuditLogs(daysToKeep);
    if (!response.isSuccess) {
      return errorResponse(res, response.code, response.message);
    }
    return successResponse(res, response.data, response.message);
  } catch (err) {
    console.error("Clear Old Audit Logs Error:", err);
    return catchResponse(res);
  }
};

module.exports = {
  // Dashboard
  getDashboardStats,
  getRecentActivity,
  getGrowthTrends,
  // Organization management
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
};
