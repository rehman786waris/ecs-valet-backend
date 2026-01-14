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

    propertySnapshot: {
      address: String,
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

taskLogSchema.index({ property: 1, completedAt: -1 });
taskLogSchema.index({ scannedBy: 1 });

module.exports = mongoose.model("TaskLog", taskLogSchema);
