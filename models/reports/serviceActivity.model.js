// models/serviceActivity.model.js
const mongoose = require("mongoose");

const serviceActivitySchema = new mongoose.Schema(
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
    },

    unitNumber: String,

    activityType: {
      type: String,
      enum: [
        "Route Checkpoint",
        "Violation Reported",
        "Recycle",
        "Task Completed",
      ],
      required: true,
    },

    volume: {
      type: Number,
      default: 0,
    },

    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    scannedAt: {
      type: Date,
      default: Date.now,
    },

    media: [
      {
        url: String,
        type: String, // image / video
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceActivity", serviceActivitySchema);
