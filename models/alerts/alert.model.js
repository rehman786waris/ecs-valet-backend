const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    reason: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AlertReason",
      required: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    properties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        required: true,
        index: true,
      },
    ],

    sendStatus: {
      type: String,
      enum: ["Pending", "Sent", "Failed"],
      default: "Pending",
      index: true,
    },

    sentAt: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // more flexible than Employee
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", alertSchema);
