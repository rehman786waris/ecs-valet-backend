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

    username: {
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
    // Prefer this for multi-property assignments
    properties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
      },
    ],

    profileImage: {
      url: { type: String, trim: true },
      key: { type: String, trim: true },
      provider: {
        type: String,
        enum: ["s3", "cloudinary", "local"],
        default: "s3",
      },
      uploadedAt: { type: Date, default: Date.now },
    },

    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "reportingManagerType",
    },
    reportingManagerType: {
      type: String,
      enum: ["Employee", "PropertyManager", "User"],
      default: "Employee",
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
      id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "createdBy.type",
        required: true,
      },
      type: {
        type: String,
        enum: ["User", "PropertyManager", "Employee"],
        required: true,
      },
    },
  },
  { timestamps: true }
);

/* 🔐 HASH PASSWORD */
employeeSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

/* 🔐 COMPARE PASSWORD */
employeeSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

/* ❌ PREVENT SELF MANAGER */
employeeSchema.pre("save", function () {
  if (
    this.reportingManager &&
    this._id &&
    this.reportingManager.equals(this._id)
  ) {
    throw new Error("Employee cannot be their own reporting manager");
  }
});


/* INDEXES */
employeeSchema.index({ email: 1, isDeleted: 1 });
employeeSchema.index({ username: 1, isDeleted: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ reportingManager: 1 });
employeeSchema.index({ properties: 1 });

module.exports = mongoose.model("Employee", employeeSchema);
