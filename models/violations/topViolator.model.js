// models/topViolator.model.js
const mongoose = require("mongoose");

const topViolatorSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    propertyLabel: {
      type: String,
      required: true, // "#1302-1614 N FITZHUGH"
      trim: true,
    },

    binTagId: {
      type: String,
      required: true,
      index: true,
      uppercase: true,
      trim: true,
    },

    buildingName: {
      type: String,
      required: true,
      trim: true,
    },

    totalViolations: {
      type: Number,
      required: true,
      min: 0,
    },

    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "all"],
      default: "all",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/// 🔍 PERFORMANCE INDEXES
topViolatorSchema.index({
  company: 1,
  period: 1,
  totalViolations: -1,
});

topViolatorSchema.index({
  company: 1,
  binTagId: 1,
});

module.exports = mongoose.model("TopViolator", topViolatorSchema);
