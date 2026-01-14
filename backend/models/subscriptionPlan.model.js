const mongoose = require("mongoose");

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      enum: ["starter", "professional", "enterprise"],
      unique: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Monthly price cannot be negative"],
    },
    annualPrice: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Annual price cannot be negative"],
    },
    currency: {
      type: String,
      default: "usd",
      trim: true,
      lowercase: true,
    },
    limits: {
      maxUsers: {
        type: Number,
        default: -1, // -1 = unlimited
      },
      maxProjects: {
        type: Number,
        default: -1,
      },
      maxStorageBytes: {
        type: Number,
        default: -1,
      },
    },
    features: [
      {
        type: String,
        enum: [
          "basic_grievance",
          "advanced_permissions",
          "custom_roles",
          "audit_logs",
          "api_access",
          "sso",
          "custom_integrations",
          "priority_support",
          "dedicated_support",
          "sla_guarantee",
          "on_premise",
        ],
      },
    ],
    stripePriceIds: {
      monthly: {
        type: String,
        trim: true,
      },
      annual: {
        type: String,
        trim: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
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

// Indexes
SubscriptionPlanSchema.index({ name: 1 }, { unique: true });
SubscriptionPlanSchema.index({ isActive: 1 });

const SubscriptionPlan = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);

module.exports = SubscriptionPlan;
