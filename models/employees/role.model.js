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
        "barcodes",
        "reports",
        "manage_violations",
        "manage_tasks",
        "manage_notes",
        "manage_residents",
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
