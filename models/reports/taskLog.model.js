const mongoose = require("mongoose");

const taskLogSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    completedAt: {
      type: Date,
      index: true,
    },

    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    mediaCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaskLog", taskLogSchema);
