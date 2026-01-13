// models/recycleReport.model.js
const mongoose = require("mongoose");

const recycleReportSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    binTag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BinTag",
    },

    recycled: {
      type: Boolean,
      default: false,
    },

    contaminated: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["Route Checkpoint", "Violation Reported"],
    },

    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecycleReport", recycleReportSchema);
