const mongoose = require("mongoose");

const qrScanLogSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    binTag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BinTag",
      required: true,
      index: true,
    },

    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    scannedBySnapshot: {
      firstName: String,
      lastName: String,
      email: String,
      username: String,
    },

    scannedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    location: {
      lat: Number,
      lng: Number,
    },

    snapshot: {
      propertyName: String,
      unitNumber: String,
      units: [
        {
          _id: false,
          unitId: {
            type: mongoose.Schema.Types.ObjectId,
          },
          unitNumber: {
            type: String,
            trim: true,
          },
        },
      ],
      barcode: String,
    },
  },
  { timestamps: true }
);

qrScanLogSchema.index({ company: 1, scannedAt: -1 });

module.exports = mongoose.model("QrScanLog", qrScanLogSchema);
