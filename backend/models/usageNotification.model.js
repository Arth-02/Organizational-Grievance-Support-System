const mongoose = require("mongoose");

/**
 * UsageNotification Model - Tracks usage notification history to prevent duplicate alerts
 * 
 * @requirements 7.4, 7.5
 */
const UsageNotificationSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
    },
    resourceType: {
      type: String,
      required: [true, "Resource type is required"],
      enum: ["users", "projects", "storage"],
    },
    thresholdType: {
      type: String,
      required: [true, "Threshold type is required"],
      enum: ["warning", "critical"], // warning = 80%, critical = 100%
    },
    thresholdPercentage: {
      type: Number,
      required: true,
      enum: [80, 100],
    },
    usageAtNotification: {
      current: {
        type: Number,
        required: true,
      },
      limit: {
        type: Number,
        required: true,
      },
      percentage: {
        type: Number,
        required: true,
      },
    },
    notificationMethod: {
      type: String,
      enum: ["socket", "email", "both"],
      default: "both",
    },
    notifiedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedAt: {
      type: Date,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Track the billing period to reset notifications on new period
    billingPeriodStart: {
      type: Date,
      required: true,
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

// Compound index to prevent duplicate notifications for same threshold in same billing period
UsageNotificationSchema.index(
  { 
    organization_id: 1, 
    resourceType: 1, 
    thresholdType: 1, 
    billingPeriodStart: 1 
  },
  { unique: true }
);

// Index for querying notifications by organization
UsageNotificationSchema.index({ organization_id: 1, created_at: -1 });

// Index for finding unacknowledged notifications
UsageNotificationSchema.index({ organization_id: 1, acknowledged: 1 });

const UsageNotification = mongoose.model("UsageNotification", UsageNotificationSchema);

module.exports = UsageNotification;
