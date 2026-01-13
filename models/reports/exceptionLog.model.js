// models/exceptionLog.model.js
const mongoose = require("mongoose");

const exceptionLogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: String,

    exceptionType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExceptionType",
      required: true,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    status: {
      type: String,
      enum: ["Open", "Resolved"],
      default: "Open",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExceptionLog", exceptionLogSchema);
