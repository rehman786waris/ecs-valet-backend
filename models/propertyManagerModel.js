// models/propertyManagerModel.js
const mongoose = require("mongoose");

const propertyManagerSchema = new mongoose.Schema(
  {
    // Basic Info
    title: { type: String, trim: true },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },

    mobile: { type: String, trim: true },

    timeZone: { type: String, required: true },

    // 🔐 Auth
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["PROPERTY_MANAGER"],
      default: "PROPERTY_MANAGER",
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },

    lastLogin: { type: Date, default: null },

    isEnabled: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    // Relations
    properties: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],

    // Permissions
    permissions: {
      dailyViolationCountEmail: { type: Boolean, default: false },
      dailyViolationCountSMS: { type: Boolean, default: false },
      dailyNotesCountEmail: { type: Boolean, default: false },
      dailyNotesCountSMS: { type: Boolean, default: false },
      checkoutNotesEmail: { type: Boolean, default: false },
      firstPickupEmail: { type: Boolean, default: false },
      firstPickupSMS: { type: Boolean, default: false },
      propertyCheckInEmail: { type: Boolean, default: false },
      propertyCheckInSMS: { type: Boolean, default: false },
      propertyCheckOutEmail: { type: Boolean, default: false },
      propertyCheckOutSMS: { type: Boolean, default: false },
      createViolationEmail: { type: Boolean, default: false },
    },

    // Audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// Virtual
propertyManagerSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("PropertyManager", propertyManagerSchema);
