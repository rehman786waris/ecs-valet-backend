const mongoose = require("mongoose");

const recycleReportSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    propertySnapshot: {
      address: String,
      type: String,
    },

    scanDate: {
      type: Date,
      required: true,
      index: true,
    },

    recycle: {
      type: Boolean,
      default: false,
    },

    contaminated: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["Violation Reported", "Route Check Point"],
      required: true,
      index: true,
    },

    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

recycleReportSchema.index({ property: 1, scanDate: -1 });
recycleReportSchema.index({ status: 1, scanDate: -1 });

module.exports = mongoose.model("RecycleReport", recycleReportSchema);
