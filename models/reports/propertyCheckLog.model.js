// models/propertyCheckLog.model.js
const mongoose = require("mongoose");

const propertyCheckLogSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    checkIn: {
      type: Date,
      required: true,
    },

    checkOut: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "PropertyCheckLog",
  propertyCheckLogSchema
);
