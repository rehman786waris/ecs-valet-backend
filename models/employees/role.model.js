const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    permissions: {
      type: [String],
      enum: [
        "customers",
        "employees",
        "properties",
        "manage_residents",
        "barcodes",
        "reports",
        "manage_tasks",
        "manage_violations",
        "manage_notes",
      ],
      default: [],
    },

    isSystemRole: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
