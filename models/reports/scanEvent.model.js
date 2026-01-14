const mongoose = require("mongoose");

const scanEventSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRoute",
      index: true,
    },

    checkpoint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Checkpoint",
      required: true,
      index: true,
    },

    activityType: {
      type: String,
      enum: ["Violation Reported", "Route Check Point", "Service", "Other"],
      required: true,
    },
    
    volume: {
      type: Number,
      default: null,
    },    

    eventType: {
      type: String,
      enum: ["CHECK_IN", "CHECK_OUT"],
      required: true,
    },

    scannedAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);
// ⚡ Critical compound indexes for report performance
scanEventSchema.index({ property: 1, scannedAt: 1 });
scanEventSchema.index({ checkpoint: 1, scannedAt: 1 });
scanEventSchema.index({ employee: 1, scannedAt: 1 });

module.exports = mongoose.model("ScanEvent", scanEventSchema);
