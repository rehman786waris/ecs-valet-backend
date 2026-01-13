// models/taskLog.model.js
const mongoose = require("mongoose");

const taskLogSchema = new mongoose.Schema(
  {
    taskName: String,

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
    },

    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    completionDate: Date,

    media: [
      {
        url: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaskLog", taskLogSchema);
