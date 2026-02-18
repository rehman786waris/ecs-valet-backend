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

    workDurationMinutes: {
      type: Number,
      default: 0,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    source: {
      type: String,
      enum: ["mobile", "web", "admin"],
      default: "mobile",
    },

    isManual: {
      type: Boolean,
      default: false,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin
    },
  },
  { timestamps: true }
);

/* ❌ PREVENT INVALID CLOCK */
employeeClockLogSchema.pre("save", function () {
  if (this.clockOut && this.clockOut < this.clockIn) {
    throw new Error("Clock-out cannot be before clock-in");
  }
});

/* ❌ ONE OPEN SESSION PER EMPLOYEE */
employeeClockLogSchema.index(
  { employee: 1 },
  { unique: true, partialFilterExpression: { clockOut: null } }
);

module.exports = mongoose.model("EmployeeClockLogs", employeeClockLogSchema);
