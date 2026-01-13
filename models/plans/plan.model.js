// models/plan.model.js
const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    // ======================
    // Basic Info
    // ======================
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Basic, Premium, Pro
    },

    description: {
      type: String,
      trim: true,
    },

    icon: {
      type: String, // URL or file path
      default: null,
    },

    // ======================
    // Pricing
    // ======================
    pricing: {
      monthly: {
        type: Number,
        required: true, // 49.00, 89.99
      },
      yearly: {
        type: Number, // 499.00
        default: null,
      },
      currency: {
        type: String,
        default: "USD",
      },
    },

    // ======================
    // Trial
    // ======================
    trial: {
      isAvailable: {
        type: Boolean,
        default: true,
      },
      durationDays: {
        type: Number,
        default: 14,
      },
    },

    // ======================
    // Feature Allowances
    // ======================
    allowances: {
      properties: {
        type: Number, // Number of Properties
        required: true,
      },
      userLicenses: {
        type: Number, // User Licenses
        required: true,
      },
      monthlyAlerts: {
        type: Number, // Monthly Alerts
        required: true,
      },
      unitsAllowed: {
        type: Number, // Units Allowed (200, 200+)
        required: true,
      },
    },

    // ======================
    // Included Features (Toggles)
    // ======================
    features: {
      apiAccess: { type: Boolean, default: false },
      customBranding: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      support24x7: { type: Boolean, default: false },

      serviceRouteTracking: { type: Boolean, default: false },
      propertyManagerPortal: { type: Boolean, default: false },
      taskManagement: { type: Boolean, default: false },
      violationManagement: { type: Boolean, default: false },
      biLingualMobileApp: { type: Boolean, default: false },
      tutorials: { type: Boolean, default: false },
      customerSupport: { type: Boolean, default: false },
    },

    // ======================
    // UI / Status
    // ======================
    isActive: {
      type: Boolean,
      default: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
