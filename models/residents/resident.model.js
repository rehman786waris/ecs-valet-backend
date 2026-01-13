// models/resident.model.js
const mongoose = require("mongoose");

const residentSchema = new mongoose.Schema(
  {
    // ======================
    // Identity
    // ======================
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    // ======================
    // Contact
    // ======================
    mobile: {
      type: String,
      trim: true,
      match: /^[0-9\-\+\s()]+$/,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    // ======================
    // Property Mapping
    // ======================
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      default: null,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
    },

    // ======================
    // Stats (Derived / Cached)
    // ======================
    violationCount: {
      type: Number,
      default: 0,
    },

    serviceAlertCount: {
      type: Number,
      default: 0,
    },

    // ======================
    // Multi-Tenant
    // ======================
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // ======================
    // Status
    // ======================
    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model("Resident", residentSchema);
