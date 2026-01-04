const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, "Action is required"],
      enum: [
        // Organization actions
        "ORGANIZATION_CREATED",
        "ORGANIZATION_APPROVED",
        "ORGANIZATION_REJECTED",
        "ORGANIZATION_SUSPENDED",
        "ORGANIZATION_ACTIVATED",
        "ORGANIZATION_DELETED",
        // User actions
        "USER_CREATED",
        "USER_UPDATED",
        "USER_ACTIVATED",
        "USER_DEACTIVATED",
        "USER_DELETED",
        "USER_LOGIN",
        "USER_LOGOUT",
        // Project actions
        "PROJECT_CREATED",
        "PROJECT_UPDATED",
        "PROJECT_ACTIVATED",
        "PROJECT_DEACTIVATED",
        "PROJECT_DELETED",
        // Role actions
        "ROLE_CREATED",
        "ROLE_UPDATED",
        "ROLE_ACTIVATED",
        "ROLE_DEACTIVATED",
        "ROLE_DELETED",
        // Grievance actions
        "GRIEVANCE_CREATED",
        "GRIEVANCE_STATUS_CHANGED",
        "GRIEVANCE_DELETED",
        // Department actions
        "DEPARTMENT_CREATED",
        "DEPARTMENT_UPDATED",
        "DEPARTMENT_DELETED",
        // Task actions
        "TASK_CREATED",
        "TASK_UPDATED",
        "TASK_DELETED",
        // Generic
        "OTHER",
      ],
    },
    entity_type: {
      type: String,
      required: [true, "Entity type is required"],
      enum: ["Organization", "User", "Project", "Role", "Grievance", "Department", "Task", "Board", "Other"],
    },
    entity_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    entity_name: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: false,
    },
    ip_address: {
      type: String,
      required: false,
    },
    user_agent: {
      type: String,
      required: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    versionKey: false,
  }
);

// Indexes for efficient querying
auditLogSchema.index({ created_at: -1 });
auditLogSchema.index({ action: 1, created_at: -1 });
auditLogSchema.index({ entity_type: 1, created_at: -1 });
auditLogSchema.index({ performed_by: 1, created_at: -1 });
auditLogSchema.index({ organization_id: 1, created_at: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
