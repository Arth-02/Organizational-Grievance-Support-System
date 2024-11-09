const mongoose = require("mongoose");

const GrievanceSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attachment",
      },
    ],
    status: {
      type: String,
      enum: ["submitted", "in-progress", "resolved", "dismissed"],
      default: "submitted",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    reported_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rank: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: "date_reported",
      updatedAt: "updated_at",
    },
    versionKey: false,
  }
);

GrievanceSchema.index({ rank: 1 }, { unique: true });
GrievanceSchema.index({ status: 1, rank: 1 }, { unique: true });

const Grievance = mongoose.model("Grievance", GrievanceSchema);

module.exports = Grievance;
