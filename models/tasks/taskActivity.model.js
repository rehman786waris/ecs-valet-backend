// models/taskActivity.model.js
const mongoose = require("mongoose");

const taskActivitySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    action: {
      type: String,
      enum: ["Created", "Updated", "Completed", "Cancelled"],
      required: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaskActivity", taskActivitySchema);
