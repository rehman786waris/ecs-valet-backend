const mongoose = require("mongoose");

const recycleReportSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    scanDate: {
      type: Date,
      required: true,
      index: true,
    },

    recycle: {
      type: Boolean,
    },

    contaminated: {
      type: Boolean,
    },

    status: {
      type: String,
      enum: ["Violation Reported", "Route Check Point"],
      index: true,
    },

    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "RecycleReport",
  recycleReportSchema
);
