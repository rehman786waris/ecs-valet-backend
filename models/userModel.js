const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
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

    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      trim: true,
      match: /^[0-9\-\+\s()]+$/,
    },

    jobTitle: {
      type: String,
      trim: true,
    },

    profileImage: {
      url: { type: String, trim: true },
      key: { type: String, trim: true },
      provider: {
        type: String,
        enum: ["s3", "cloudinary", "local"],
        default: "s3",
      },
      uploadedAt: { type: Date, default: Date.now },
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
    // Authentication
    // ======================
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    // ======================
    // Role & Access
    // ======================
    role: {
      type: String,
      enum: [
        "super-admin",
        "admin",
        "property-manager",
        "employee",
      ],
      default: "admin",
    },

    // ======================
    // Subscription
    // ======================
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },

    // ======================
    // Status
    // ======================
    status: {
      type: String,
      enum: ["Active", "Expired", "Suspended"],
      default: "Active",
    },

    isEnabled: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    // ======================
    // Security
    // ======================
    tokenVersion: {
      type: Number,
      default: 0,
    },

    resetCode: {
      type: String,
      select: false,
    },

    resetCodeExpires: Date,
    resetAttempts: {
      type: Number,
      default: 0,
    },

    // ======================
    // Agreements
    // ======================
    agreedToTerms: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/* ======================
   INDEXES (MUST BE HERE)
====================== */

// Unique per company
userSchema.index(
  { email: 1, company: 1 },
  { unique: true }
);

userSchema.index(
  { username: 1, company: 1 },
  { unique: true }
);

// Admin UI filtering
userSchema.index({ company: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
