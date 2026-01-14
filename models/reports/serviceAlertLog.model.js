const mongoose = require("mongoose");

const serviceAlertLogSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    propertySnapshot: {
      address: String,
      type: String,
    },

    mobile: {
      type: String,
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    message: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["New", "Submitted", "Closed"],
      default: "New",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

serviceAlertLogSchema.index({ createdAt: -1 });
serviceAlertLogSchema.index({ property: 1, createdAt: -1 });

module.exports = mongoose.model("ServiceAlertLog", serviceAlertLogSchema);
