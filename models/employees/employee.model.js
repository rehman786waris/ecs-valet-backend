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
      unique: true,
      trim: true,
      index: true,
    },

    mobile: { type: String, required: true },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    tokenVersion: { type: Number, default: 0 },
    lastLogin: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    employeeType: {
      type: String,
      enum: ["Full Time", "Part Time", "Contract", "Temporary"],
      required: true,
    },

    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    timeZone: { type: String, required: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
  },
  { timestamps: true }
);

employeeSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

employeeSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model("Employee", employeeSchema);
