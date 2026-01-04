const AuditLog = require("../models/auditLog.model");
const User = require("../models/user.model");

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.action - The action performed
 * @param {string} params.entity_type - Type of entity (Organization, User, etc.)
 * @param {string} params.entity_id - ID of the entity
 * @param {string} params.entity_name - Name of the entity for display
 * @param {string} params.description - Human-readable description
 * @param {string} params.performed_by - User ID who performed the action
 * @param {string} params.organization_id - Organization ID if applicable
 * @param {string} params.ip_address - IP address of the request
 * @param {string} params.user_agent - User agent string
 * @param {Object} params.metadata - Additional metadata
 */
const createAuditLog = async ({
  action,
  entity_type,
  entity_id,
  entity_name,
  description,
  performed_by,
  organization_id,
  ip_address,
  user_agent,
  metadata = {},
}) => {
  try {
    const auditLog = new AuditLog({
      action,
      entity_type,
      entity_id,
      entity_name,
      description,
      performed_by,
      organization_id,
      ip_address,
      user_agent,
      metadata,
    });

    await auditLog.save();
    return { isSuccess: true, data: auditLog };
  } catch (err) {
    console.error("Create Audit Log Error:", err.message);
    // Don't throw - audit logging should not break the main flow
    return { isSuccess: false, message: err.message };
  }
};

/**
 * Helper to get performer name from user ID
 */
const getPerformerName = async (userId) => {
  try {
    if (!userId) return "System";
    const user = await User.findById(userId).select("firstname lastname username").lean();
    if (!user) return "Unknown User";
    if (user.firstname && user.lastname) {
      return `${user.firstname} ${user.lastname}`;
    }
    return user.username || "Unknown User";
  } catch (err) {
    return "Unknown User";
  }
};

/**
 * Helper to extract request info for audit logging
 */
const getRequestInfo = (req) => {
  return {
    ip_address: req.ip || req.connection?.remoteAddress || req.headers["x-forwarded-for"],
    user_agent: req.headers["user-agent"],
    performed_by: req.user?._id,
    organization_id: req.user?.organization_id,
  };
};

// Convenience methods for common actions
const logOrganizationAction = async (action, organization, req, metadata = {}) => {
  const requestInfo = getRequestInfo(req);
  return createAuditLog({
    action,
    entity_type: "Organization",
    entity_id: organization._id,
    entity_name: organization.name,
    description: `Organization "${organization.name}" - ${action.replace(/_/g, " ").toLowerCase()}`,
    ...requestInfo,
    metadata,
  });
};

const logUserAction = async (action, user, req, metadata = {}) => {
  const requestInfo = getRequestInfo(req);
  
  // Get performer name if not provided in metadata
  let performerName = metadata.updatedByName || metadata.createdByName || metadata.deletedByName;
  if (!performerName && requestInfo.performed_by) {
    performerName = await getPerformerName(requestInfo.performed_by);
  }
  
  // Store performer name in metadata
  if (performerName && !metadata.performerName) {
    metadata.performerName = performerName;
  }
  
  // Build description based on action and metadata
  const userName = (user.firstname && user.lastname) 
    ? `${user.firstname} ${user.lastname}` 
    : (user.username || "Unknown");
  let description = `User "${userName}" - ${action.replace(/_/g, " ").toLowerCase()}`;
  
  // Add "by whom" info for actions done by another user
  if (performerName && action !== "USER_LOGIN") {
    description += ` by ${performerName}`;
  }
  
  // Add changed fields info for updates
  if (action === "USER_UPDATED" && metadata.changedFields) {
    const fieldNames = Object.keys(metadata.changedFields);
    if (fieldNames.length > 0) {
      description += ` (changed: ${fieldNames.join(", ")})`;
    }
  }
  
  return createAuditLog({
    action,
    entity_type: "User",
    entity_id: user._id,
    entity_name: userName,
    description,
    ...requestInfo,
    organization_id: user.organization_id || requestInfo.organization_id,
    metadata,
  });
};

const logProjectAction = async (action, project, req, metadata = {}) => {
  const requestInfo = getRequestInfo(req);
  return createAuditLog({
    action,
    entity_type: "Project",
    entity_id: project._id,
    entity_name: project.name,
    description: `Project "${project.name}" - ${action.replace(/_/g, " ").toLowerCase()}`,
    ...requestInfo,
    organization_id: project.organization_id || requestInfo.organization_id,
    metadata,
  });
};

const logRoleAction = async (action, role, req, metadata = {}) => {
  const requestInfo = getRequestInfo(req);
  return createAuditLog({
    action,
    entity_type: "Role",
    entity_id: role._id,
    entity_name: role.name,
    description: `Role "${role.name}" - ${action.replace(/_/g, " ").toLowerCase()}`,
    ...requestInfo,
    organization_id: role.organization_id || requestInfo.organization_id,
    metadata,
  });
};

const logGrievanceAction = async (action, grievance, req, metadata = {}) => {
  const requestInfo = getRequestInfo(req);
  return createAuditLog({
    action,
    entity_type: "Grievance",
    entity_id: grievance._id,
    entity_name: grievance.title,
    description: `Grievance "${grievance.title}" - ${action.replace(/_/g, " ").toLowerCase()}`,
    ...requestInfo,
    organization_id: grievance.organization_id || requestInfo.organization_id,
    metadata,
  });
};

module.exports = {
  createAuditLog,
  getRequestInfo,
  getPerformerName,
  logOrganizationAction,
  logUserAction,
  logProjectAction,
  logRoleAction,
  logGrievanceAction,
};
