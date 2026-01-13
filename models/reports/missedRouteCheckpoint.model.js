// models/missedRouteCheckpoint.model.js
const mongoose = require("mongoose");

const missedRouteCheckpointSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
    },

    binTag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BinTag",
      required: true,
    },

    barcodeId: {
      type: String,
      required: true,
    },

    expectedDate: {
      type: Date,
      required: true,
    },

    detectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "MissedRouteCheckpoint",
  missedRouteCheckpointSchema
);
