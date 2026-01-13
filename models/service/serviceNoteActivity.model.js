const mongoose = require("mongoose");

const serviceNoteActivitySchema = new mongoose.Schema(
  {
    serviceNote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceNote",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["New", "Read", "Closed"],
      required: true,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ServiceNoteActivity",
  serviceNoteActivitySchema
);
