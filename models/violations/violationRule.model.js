const mongoose = require("mongoose");

const violationRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // ✅ global uniqueness
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

    // Ordering for dropdowns (mobile + admin)
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },

    // Admin who created the rule
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Soft delete (safe for existing violations)
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ViolationRule", violationRuleSchema);
