// models/property.model.js
const mongoose = require("mongoose");

/* ======================
   BUILDING SUB-SCHEMA
====================== */
const buildingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    totalUnits: {
      type: Number,
      default: 0,
    },
    buildingOrder: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

/* ======================
   PROPERTY SCHEMA
====================== */
const propertySchema = new mongoose.Schema(
  {
    /* ======================
       MULTI TENANT
    ====================== */
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    /* ======================
       CUSTOMER & MANAGER
    ====================== */
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
      type: Boolean,
      default: false,
      index: true,
    },

    /* ======================
       BASIC INFO
    ====================== */
    propertyName: {
      type: String,
      required: true,
      trim: true,
      index: true,
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
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zip: { type: String, trim: true },
    },

    radiusMiles: {
      type: Number,
      min: 0,
      default: 0,
    },

    /* ======================
       BUILDINGS
    ====================== */
    buildings: {
      type: [buildingSchema],
      default: [],
    },

    /* ======================
       SERVICE AGREEMENT
    ====================== */
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

      binSizeWaste: {
        type: Number, // gallons
      },

      binSizeRecycle: {
        type: Number, // gallons
      },

      wasteReductionTarget: {
        type: Number, // %
      },
    },

    /* ======================
       SERVICE ALERT SMS
    ====================== */
    serviceAlertSMS: {
      propertyCheckin: {
        type: String,
        trim: true,
      },
      propertyCheckout: {
        type: String,
        trim: true,
      },
    },

    /* ======================
       STATUS & AUDIT
    ====================== */
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

/* ======================
   INDEXES
====================== */
propertySchema.index({ company: 1, isDeleted: 1 });
propertySchema.index({ company: 1, propertyName: 1 });
propertySchema.index({ company: 1, propertyManager: 1 });

module.exports = mongoose.model("Property", propertySchema);
