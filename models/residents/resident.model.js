const mongoose = require("mongoose");

const residentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    mobile: {
      type: String,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      index: true,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    violationCount: {
      type: Number,
      default: 0,
      index: true,
    },

    serviceAlertCount: {
      type: Number,
      default: 0,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
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

/**
 * Prevent duplicate residents in same property + unit
 */
residentSchema.index(
  { property: 1, unit: 1, email: 1 },
  { unique: false }
);

module.exports = mongoose.model("Resident", residentSchema);
