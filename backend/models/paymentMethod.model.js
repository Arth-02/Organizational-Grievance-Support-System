const mongoose = require("mongoose");

const PaymentMethodSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
    },
    provider: {
      type: String,
      required: [true, "Payment provider is required"],
      enum: ["stripe", "razorpay", "paypal"],
      trim: true,
    },
    providerPaymentMethodId: {
      type: String,
      required: [true, "Provider payment method ID is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Payment method type is required"],
      enum: ["card", "bank_transfer", "upi", "wallet"],
    },
    // Card-specific fields
    card: {
      brand: {
        type: String,
        trim: true,
      },
      last4: {
        type: String,
        trim: true,
      },
      expiryMonth: {
        type: Number,
      },
      expiryYear: {
        type: Number,
      },
    },
    // Bank-specific fields (for future use)
    bank: {
      bankName: {
        type: String,
        trim: true,
      },
      last4: {
        type: String,
        trim: true,
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
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
PaymentMethodSchema.index({ organization_id: 1 });
PaymentMethodSchema.index({ organization_id: 1, isDefault: 1 });

const PaymentMethod = mongoose.model("PaymentMethod", PaymentMethodSchema);

module.exports = PaymentMethod;
