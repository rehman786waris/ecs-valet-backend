const mongoose = require("mongoose");

const serviceRouteSummarySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

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

    totalCheckpoints: {
      type: Number,
      default: 0,
    },

    scannedCheckpoints: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ServiceRouteSummary",
  serviceRouteSummarySchema
);
