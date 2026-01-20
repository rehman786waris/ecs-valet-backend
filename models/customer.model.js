const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },

    zip: {
      type: String,
      trim: true,
    },

    propertyManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropertyManager",
      index: true,
    },

    redundantRouteService: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
