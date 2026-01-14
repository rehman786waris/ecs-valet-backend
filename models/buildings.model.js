const mongoose = require("mongoose");

const buildingSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true, // e.g. B5, Building A, Tower 2
      trim: true,
    },

    numberOfUnits: {
      type: Number,
      default: 0,
      min: 0,
    },

    buildingOrder: {
      type: Number, // Used for route / service order
      index: true,
    },

    address: {
      type: String,
      trim: true,
    },

    images: [
      {
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Building", buildingSchema);
