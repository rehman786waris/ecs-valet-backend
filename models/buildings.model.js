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
      required: true,
      trim: true,
    },

    numberOfUnits: {
      type: Number,
      required: true,
      min: 0,
    },

    units: [
      {
        unitNumber: {
          type: String,
          trim: true,
          required: true,
        },
        status: {
          type: Boolean,
          default: false,
          index: true,
        },
        checkIn: {
          type: Date,
          default: null,
        },
        checkOut: {
          type: Date,
          default: null,
        },
      },
    ],

    buildingOrder: {
      type: Number,
      default: 0,
      index: true,
    },

    address: {
      type: String,
      required: true,
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
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Building", buildingSchema);
