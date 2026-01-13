const mongoose = require("mongoose");

const violationTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    body: {
      type: String,
      required: true,
      trim: true,
    },

    // Flexible template category (email, notice, invoice, etc.)
    type: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // Only one default per type (enforced in controller)
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

/* ----------------------------------
   PERFORMANCE INDEX
----------------------------------- */
violationTemplateSchema.index({
  type: 1,
  isDefault: 1,
  isActive: 1,
});

module.exports = mongoose.model("ViolationTemplate", violationTemplateSchema);
