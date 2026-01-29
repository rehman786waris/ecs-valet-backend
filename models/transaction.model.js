// models/transaction.model.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    // ======================
    // References
    // ======================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // or User / CompanyAdmin
      required: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },

    // ======================
    // Payment Info
    // ======================
    amount: {
      type: Number,
      required: true, // 49.00, 19.00, 199.00
    },

    currency: {
      type: String,
      default: "USD",
    },

    billingCycle: {
      type: String,
      enum: ["Monthly", "Yearly"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Paid", "Failed", "Refunded"],
      required: true,
    },

    // ======================
    // Gateway / Transaction IDs
    // ======================
    transactionId: {
      type: String, // tx_123abc...
      required: true,
      unique: true,
    },

    paymentGateway: {
      type: String,
      enum: ["Stripe", "PayPal", "Manual"],
      default: "Stripe",
    },

    gatewayResponse: {
      type: Object, // raw response (optional)
      default: null,
    },

    // ======================
    // Refund Info
    // ======================
    refundedAt: {
      type: Date,
      default: null,
    },

    refundReason: {
      type: String,
      default: null,
    },

    // ======================
    // Audit
    // ======================
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
