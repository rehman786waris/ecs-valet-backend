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

    clockIn: {
      type: Date,
      required: true,
    },

    clockOut: {
      type: Date,
    },

    reason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

employeeClockLogSchema.index({ employee: 1 });
employeeClockLogSchema.index({ clockIn: -1 });

module.exports = mongoose.model(
  "EmployeeClockLog",
  employeeClockLogSchema
);
