const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    propertyManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropertyManager",
      default: null,
      index: true,
    },

    redundantRouteService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    propertyName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    propertyLogo: {
      type: String,
      trim: true,
    },

    propertyBarcode: {
      type: String,
      trim: true,
      index: true,
    },

    propertyQrCodeImage: {
      type: String,
      trim: true,
    },
    propertyType: {
      type: String,
      enum: ["Apartment", "Condo", "Commercial", "Townhouse", "Other"],
      required: true,
    },

    addressType: {
      type: String,
      enum: ["Main Office", "Same Address"],
      default: "Main Office",
    },

    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
    },

    radiusMiles: {
      type: Number,
      default: 0,
    },

    /* ✅ REFERENCED BUILDINGS */
    buildings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Building",
      },
    ],

    serviceAgreement: {
      pickupStartDate: Date,

      pickupFrequency: {
        sunday: Boolean,
        monday: Boolean,
        tuesday: Boolean,
        wednesday: Boolean,
        thursday: Boolean,
        friday: Boolean,
        saturday: Boolean,
      },

      pickupType: {
        type: String,
        enum: ["Waste", "Recycle", "Both"],
      },

      binSizeWaste: Number,
      binSizeRecycle: Number,
      wasteReductionTarget: Number,
    },

    serviceAlertSMS: {
      propertyCheckin: String,
      propertyCheckout: String,
      propertyCheckInAt: {
        type: Date,
        default: null,
      },
  
      propertyCheckOutAt: {
        type: Date,
        default: null,
      },
    },

    violationReminder: {
      type: String,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);
