const mongoose = require("mongoose");

const missedRouteCheckpointSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    barcodeId: {
      type: String,
      required: true,
      index: true,
    },

    expectedDate: {
      type: Date,
      required: true,
      index: true,
    },

    reason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "MissedRouteCheckpoint",
  missedRouteCheckpointSchema
);
