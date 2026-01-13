// models/messageBroadcastLog.model.js
const mongoose = require("mongoose");

const messageBroadcastLogSchema = new mongoose.Schema(
  {
    broadcast: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MessageBroadcast",
      required: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    email: {
      type: String,
      trim: true,
    },

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },

    status: {
      type: String,
      enum: ["Sent", "Failed"],
      required: true,
    },

    errorMessage: {
      type: String,
    },
  },
  { timestamps: true }
);

messageBroadcastLogSchema.index({ broadcast: 1 });
messageBroadcastLogSchema.index({ recipient: 1 });

module.exports = mongoose.model(
  "MessageBroadcastLog",
  messageBroadcastLogSchema
);
