// models/residentImport.model.js
const mongoose = require("mongoose");

const residentImportSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
    },

    totalRecords: Number,
    successCount: Number,
    failureCount: Number,

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },

    errorLog: [
      {
        row: Number,
        message: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResidentImport", residentImportSchema);
