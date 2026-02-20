const mongoose = require("mongoose");

const exceptionLogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    exceptionType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExceptionType",
      required: true,
      index: true,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    // 🔒 snapshot for historical accuracy
    // keep flexible to avoid validation errors when snapshot shape evolves
    propertySnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: ["Open", "Resolved"],
      default: "Open",
      index: true,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* 🔥 Performance Indexes */
exceptionLogSchema.index({ property: 1, createdAt: -1 });
exceptionLogSchema.index({ exceptionType: 1, status: 1 });
exceptionLogSchema.index({ employee: 1, createdAt: -1 });

module.exports = mongoose.model("ExceptionLog", exceptionLogSchema);
