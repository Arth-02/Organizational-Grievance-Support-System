const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
    },
    subscription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    provider: {
      type: String,
      required: [true, "Payment provider is required"],
      enum: ["stripe", "razorpay", "paypal", "manual"],
      trim: true,
    },
    providerPaymentId: {
      type: String,
      required: [true, "Provider payment ID is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "usd",
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "succeeded", "failed", "refunded", "partially_refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentMethod",
    },
    paidAt: {
      type: Date,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    refundedAmount: {
      type: Number,
      default: 0,
      min: [0, "Refunded amount cannot be negative"],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
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
PaymentSchema.index({ organization_id: 1 });
PaymentSchema.index({ providerPaymentId: 1 });
PaymentSchema.index({ status: 1 });

const Payment = mongoose.model("Payment", PaymentSchema);

module.exports = Payment;
