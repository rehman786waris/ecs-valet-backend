const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      trim: true, // Mr, Mrs, etc.
    },

    firstName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    mobile: {
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
    },

    zipcode: {
      type: String,
      trim: true,
    },

    timeZone: {
      type: String,
      trim: true,
    },

    images: [
      {
        type: String, // image URL or filename
      },
    ],

    manualPickup: {
      type: Boolean,
      default: false,
    },

    fieldEmployees: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", CompanySchema);
