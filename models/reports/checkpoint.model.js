const mongoose = require("mongoose");

const checkpointSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true,
      index: true,
    },

    name: {
      type: String, // B5, B2-QR#7, B4_24
      trim: true,
    },

    barcodeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Checkpoint", checkpointSchema);
