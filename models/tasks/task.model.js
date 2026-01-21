const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    /* ================= DATE RANGE ================= */
    startDate: {
      type: Date,
      required: true,
      index: true,
    },

    endDate: {
      type: Date,
      required: true,
      index: true,
      validate: {
        validator(value) {
          return value >= this.startDate;
        },
        message: "End date must be greater than or equal to start date",
      },
    },

    /* ================= FREQUENCY ================= */
    frequency: {
      type: String,
      enum: ["Daily", "Weekly", "Monthly"],
      required: true,
      index: true,
    },

    /* ================= RELATIONS ================= */
    taskOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    /* ================= FLAGS ================= */
    photoRequired: {
      type: Boolean,
      default: false,
      index: true,
    },

    notifyPropertyManager: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* ================= STATUS ================= */
    status: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    /* ================= SYSTEM ================= */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* ================= INDEXES FOR LIST VIEW ================= */
taskSchema.index({ property: 1, startDate: 1 });
taskSchema.index({ taskOwner: 1, startDate: 1 });
taskSchema.index({ status: 1, isActive: 1 });

module.exports = mongoose.model("Task", taskSchema);
