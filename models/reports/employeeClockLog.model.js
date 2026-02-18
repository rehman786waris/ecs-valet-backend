const mongoose = require("mongoose");

const employeeClockLogSchema = new mongoose.Schema(
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

    barcodeId: {
      type: String,
      index: true,
    },

    checkIn: {
      type: Date,
      required: true,
      index: true,
    },

    checkOut: {
      type: Date,
      index: true,
    },

    durationMinutes: {
      type: Number,
    },

    reason: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-calculate duration
employeeClockLogSchema.pre("save", function () {
  if (this.checkIn && this.checkOut) {
    this.durationMinutes = Math.floor(
      (this.checkOut - this.checkIn) / 60000
    );
  }
});

// Reporting indexes
employeeClockLogSchema.index({ checkIn: -1 });
employeeClockLogSchema.index({ employee: 1, checkIn: -1 });

module.exports = mongoose.model(
  "EmployeeClockLog",
  employeeClockLogSchema
);
