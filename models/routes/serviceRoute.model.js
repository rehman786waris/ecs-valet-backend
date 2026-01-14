const mongoose = require("mongoose");

const serviceRouteSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    routeName: {
      type: String,
      required: true,
      trim: true,
    },

    checkpoints: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Checkpoint",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceRoute", serviceRouteSchema);
