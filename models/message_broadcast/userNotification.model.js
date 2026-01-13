// models/userNotification.model.js
const mongoose = require("mongoose");

const userNotificationSchema = new mongoose.Schema(
  {
    notification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: Date,
  },
  { timestamps: true }
);

userNotificationSchema.index(
  { notification: 1, user: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "UserNotification",
  userNotificationSchema
);

