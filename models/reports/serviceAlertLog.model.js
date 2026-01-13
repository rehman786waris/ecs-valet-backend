// models/serviceAlertLog.model.js
const mongoose = require("mongoose");

const serviceAlertLogSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    mobile: String,

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    message: String,

    status: {
      type: String,
      enum: ["New", "Submitted", "Closed"],
      default: "New",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ServiceAlertLog",
  serviceAlertLogSchema
);
