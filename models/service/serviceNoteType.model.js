const mongoose = require("mongoose");

const serviceNoteTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
    },

    isSystem: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

/* ================= HELPERS ================= */
serviceNoteTypeSchema.pre("validate", async function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_");
  }
});

module.exports = mongoose.model("ServiceNoteType", serviceNoteTypeSchema);
