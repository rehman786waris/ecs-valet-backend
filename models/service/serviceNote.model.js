const mongoose = require("mongoose");

const serviceNoteSchema = new mongoose.Schema(
  {
    user: {
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

    unitNumber: {
      type: String,
      trim: true,
      index: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NoteSubject",
      required: true,
      index: true,
    },

    noteType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceNoteType",
      required: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    images: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
        },

        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    status: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceNoteStatus",
      required: true,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

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
  {
    timestamps: true,
    versionKey: false,
  }
);

serviceNoteSchema.index({ property: 1, status: 1 });
serviceNoteSchema.index({ subject: 1, noteType: 1 });
serviceNoteSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ServiceNote", serviceNoteSchema);
