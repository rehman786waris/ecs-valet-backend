// models/exceptionType.model.js
const mongoose = require("mongoose");

const exceptionTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      enum: ["Service Issue", "Customer Issue", "Access Denied"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExceptionType", exceptionTypeSchema);
