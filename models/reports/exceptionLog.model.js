const mongoose = require("mongoose");

const exceptionLogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    exceptionType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExceptionType",
      required: true,
      index: true,
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
      index: true,
    },

    status: {
      type: String,
      enum: ["Open", "Resolved"],
      default: "Open",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExceptionLog", exceptionLogSchema);
