const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
    },
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    key: {
      type: String,
      required: [true, "Project key is required"],
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    project_type: {
      type: String,
      enum: ["software", "business", "service_desk"],
      default: "software",
    },
    status: {
      type: String,
      enum: ["planned", "active", "on_hold", "completed", "archived"],
      default: "active",
    },
    start_date: {
      type: Date,
      default: Date.now,
    },
    end_date: {
      type: Date,
      default: null,
    },
    manager: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    icon: {
      type: String,
      default: null,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deleted_at: {
      type: Date,
      default: null,
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

// Index for organization_id to optimize queries filtering by organization
ProjectSchema.index({ organization_id: 1 });

// Compound unique index for key within an organization (excluding soft-deleted)
ProjectSchema.index(
  { key: 1, organization_id: 1 },
  { 
    unique: true,
    partialFilterExpression: { deleted_at: null }
  }
);

// Index for listing active projects
ProjectSchema.index({ organization_id: 1, deleted_at: 1 });

const Project = mongoose.model("Project", ProjectSchema);

module.exports = Project;
