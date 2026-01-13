// models/employeeClockLog.model.js
const mongoose = require("mongoose");

const employeeClockLogSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    clockIn: Date,
    clockOut: Date,

    reason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "EmployeeClockLog",
  employeeClockLogSchema
);
