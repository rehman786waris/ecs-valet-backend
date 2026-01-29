const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    billingCycle: {
      type: String,
      enum: ["Monthly", "Yearly"],
      default: "Monthly",
    },

    status: {
      type: String,
      enum: ["Trial", "Active", "Expired", "Cancelled"],
      default: "Trial",
      index: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      index: true,
    },

    trialEndsAt: {
      type: Date,
      index: true,
    },

    cancelledAt: Date,
  },
  { timestamps: true }
);

// ✅ THIS LINE IS MANDATORY
module.exports = mongoose.model("Subscription", subscriptionSchema);
