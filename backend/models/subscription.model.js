const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
      unique: true,
    },
    plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: [true, "Subscription plan is required"],
    },
    status: {
      type: String,
      enum: ["active", "trialing", "past_due", "cancelled", "expired", "pending"],
      default: "active",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "annual"],
      default: "monthly",
    },
    currentPeriodStart: {
      type: Date,
      required: [true, "Current period start date is required"],
    },
    currentPeriodEnd: {
      type: Date,
      required: [true, "Current period end date is required"],
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
    },
    trialStart: {
      type: Date,
    },
    trialEnd: {
      type: Date,
    },
    // Provider-specific data (flexible for multiple providers)
    providerData: {
      provider: {
        type: String,
        enum: ["stripe", "razorpay", "paypal", "manual"],
      },
      customerId: {
        type: String,
        trim: true,
      },
      subscriptionId: {
        type: String,
        trim: true,
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    // Pending plan change (for downgrades)
    pendingPlanChange: {
      newPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubscriptionPlan",
      },
      effectiveDate: {
        type: Date,
      },
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
SubscriptionSchema.index({ organization_id: 1 }, { unique: true });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });

const Subscription = mongoose.model("Subscription", SubscriptionSchema);

module.exports = Subscription;
