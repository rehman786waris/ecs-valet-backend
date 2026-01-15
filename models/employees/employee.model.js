const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const employeeSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    employeeType: {
      type: String,
      enum: ["Employee", "Contractor"],
      required: true,
    },

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
    },

    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    timeZone: {
      type: String,
      required: true,
      default: "UTC",
    },

    schedule: {
      startTime: {
        type: String,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/, // HH:mm
      },
      endTime: {
        type: String,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/,
      },
      workingDays: {
        type: [String],
        enum: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        default: [],
      },
    },

    lastLogin: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin
      required: true,
    },
  },
  { timestamps: true }
);

/* 🔐 HASH PASSWORD */
employeeSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

/* 🔐 COMPARE PASSWORD */
employeeSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

/* ❌ PREVENT SELF MANAGER */
employeeSchema.pre("save", function (next) {
  if (
    this.reportingManager &&
    this.reportingManager.equals(this._id)
  ) {
    return next(new Error("Employee cannot be their own reporting manager"));
  }
  next();
});

/* INDEXES */
employeeSchema.index({ email: 1, isDeleted: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ reportingManager: 1 });

module.exports = mongoose.model("Employee", employeeSchema);
