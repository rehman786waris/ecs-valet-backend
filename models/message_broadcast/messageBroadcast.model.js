// models/messageBroadcast.model.js
const mongoose = require("mongoose");

const messageBroadcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
      },
    ],

    channel: {
      type: String,
      enum: ["Email", "SMS", "Push"],
      default: "Email",
    },

    status: {
      type: String,
      enum: ["Pending", "Sent", "Failed"],
      default: "Sent",
    },

    sentAt: {
      type: Date,
      default: Date.now,
    },

    createdBy: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "createdBy.type",
        required: true,
      },
      type: {
        type: String,
        enum: ["User", "PropertyManager", "Employee"],
        required: true,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "MessageBroadcast",
  messageBroadcastSchema
);
