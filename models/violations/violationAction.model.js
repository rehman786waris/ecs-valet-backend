const mongoose = require("mongoose");

const violationActionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,        // Global uniqueness
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Ordering for UI & dropdowns
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },

    // Admin who created this action
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Soft delete (IMPORTANT)
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ViolationAction", violationActionSchema);
