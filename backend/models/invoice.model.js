const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
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
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "paid", "failed", "refunded", "void"],
      default: "draft",
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
    lineItems: [
      {
        description: {
          type: String,
          trim: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        unitPrice: {
          type: Number,
          default: 0,
        },
        amount: {
          type: Number,
          default: 0,
        },
      },
    ],
    billingPeriod: {
      start: {
        type: Date,
      },
      end: {
        type: Date,
      },
    },
    dueDate: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    invoicePdfUrl: {
      type: String,
      trim: true,
    },
    // Provider-specific invoice data
    providerData: {
      provider: {
        type: String,
        trim: true,
      },
      invoiceId: {
        type: String,
        trim: true,
      },
      hostedInvoiceUrl: {
        type: String,
        trim: true,
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
InvoiceSchema.index({ organization_id: 1 });
InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ status: 1 });

const Invoice = mongoose.model("Invoice", InvoiceSchema);

module.exports = Invoice;
