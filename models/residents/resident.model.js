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
      index: true,
    },

    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      index: true,
    },

    unit: {
      type: String,
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

    select: {
      type: Boolean,
      default: false,
    },

    selectAll: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropertyManager",
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * Prevent duplicate residents in same property + unit
 */
residentSchema.index(
  { property: 1, unit: 1 },
  {
    unique: true,
    partialFilterExpression: {
      property: { $type: "objectId" },
      unit: { $type: "string" },
    },
  }
);

residentSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $type: "string" },
    },
  }
);

module.exports = mongoose.model("Resident", residentSchema);
