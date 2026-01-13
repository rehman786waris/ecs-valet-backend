// models/role.model.js
const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    description: {
      type: String,
      trim: true,
    },

    permissions: {
      customers: { type: Boolean, default: false },
      employees: { type: Boolean, default: false },
      properties: { type: Boolean, default: false },
      barcodes: { type: Boolean, default: false },
      reports: { type: Boolean, default: false },
      manageViolations: { type: Boolean, default: false },
      manageTasks: { type: Boolean, default: false },
      manageNotes: { type: Boolean, default: false },
      manageResidents: { type: Boolean, default: false },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
