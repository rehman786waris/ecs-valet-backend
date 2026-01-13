// models/notification.model.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // ======================
    // Content
    // ======================
    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // ======================
    // Type
    // ======================
    type: {
      type: String,
      enum: [
        "Weather",
        "Service",
        "Violation",
        "System",
        "General",
      ],
      default: "General",
    },

    // ======================
    // Targeting
    // ======================
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },

    // ======================
    // Delivery
    // ======================
    isBroadcast: {
      type: Boolean,
      default: true,
    },

    // ======================
    // Status
    // ======================
    isActive: {
      type: Boolean,
      default: true,
    },

    // ======================
    // Audit
    // ======================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
