const mongoose = require("mongoose");

const serviceNoteStatusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
      unique: true,
      index: true,
    },

    isSystem: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceNoteStatus", serviceNoteStatusSchema);
