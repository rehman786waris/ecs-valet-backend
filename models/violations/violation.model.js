const mongoose = require("mongoose");

/* =====================================================
   VIOLATION IMAGE SUB-SCHEMA
===================================================== */
const violationImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

/* =====================================================
   VIOLATION SCHEMA
===================================================== */
const violationSchema = new mongoose.Schema(
  {
    // Tenant isolation
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    // Resident / violator
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    rule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ViolationRule",
      required: true,
    },

    action: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ViolationAction",
      default: null,
    },

    status: {
      type: String,
      enum: ["New", "Submitted", "Pending", "Closed", "Read", "Archived", "InProcess", "Submitted", "OnHold"],
      default: "New",
      index: true,
    },

    statusUpdatedAt: Date,

    // Manual vs Scan
    source: {
      type: String,
      enum: ["Manual", "Scan"],
      default: "Manual",
      index: true,
    },

    // BIN TAG ID (used in Scan + Manual)
    binTagId: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },

    images: {
      type: [violationImageSchema],
      default: [],
    },

    // Manual location details
    unitNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    building: {
      type: String,
      trim: true,
    },

    floor: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    // Inspector / admin
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Mobile tracking
    submittedFromMobile: {
      type: Boolean,
      default: false,
    },

    submittedAt: Date,

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

/* =====================================================
   INDEXES (PERFORMANCE)
===================================================== */
violationSchema.index({
  company: 1,
  status: 1,
  createdAt: -1,
});

violationSchema.index({
  scanTagId: 1,
  company: 1,
});

violationSchema.index({
  company: 1,
  binTagId: 1,
});

module.exports = mongoose.model("Violation", violationSchema);
