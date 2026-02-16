const mongoose = require("mongoose");

const binTagSchema = new mongoose.Schema(
  {
    /* ======================
       MULTI TENANT
    ====================== */
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    /* ======================
       PROPERTY
    ====================== */
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    propertySnapshot: {
      propertyName: { type: String },
      address: { type: String },
    },

    /* ======================
       BUILDING (EMBEDDED)
    ====================== */
    building: {
      name: { type: String, trim: true },
      order: { type: Number },
      address: { type: String, trim: true },
    },

    /* ======================
       UNIT / TAG INFO
    ====================== */
    unitNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    units: [
      {
        unitNumber: {
          type: String,
          trim: true,
          uppercase: true,
          required: true,
        },
      },
    ],

    barcode: {
      type: String,
      required: true,
      index: true,
    },

    qrCodeImage: {
      type: String,
    },

    type: {
      type: String,
      enum: ["Route Checkpoint", "unit"],
      required: true,
      index: true,
    },

    /* ======================
       STATUS & SCANS
    ====================== */
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },

    select: {
      type: Boolean,
      default: false,
    },

    selectAll: {
      type: Boolean,
      default: false,
    },

    scanCount: {
      type: Number,
      default: 0,
    },

    lastScannedAt: {
      type: Date,
    },

    lastScannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    /* ======================
       AUDIT
    ====================== */
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

/* ======================
   INDEXES
====================== */
binTagSchema.index({ company: 1, barcode: 1 }, { unique: true });
binTagSchema.index({ company: 1, status: 1 });
binTagSchema.index({ company: 1, type: 1 });

module.exports = mongoose.model("BinTag", binTagSchema);
