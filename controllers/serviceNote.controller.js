const ServiceNote = require("../models/service/serviceNote.model");
const ServiceNoteStatus = require("../models/service/serviceNoteStatus.model");

/* =====================================================
   CREATE SERVICE NOTE (WITH IMAGES)
===================================================== */
exports.createServiceNote = async (req, res) => {
  try {
    // 🔹 Default status must exist
    const defaultStatus = await ServiceNoteStatus.findOne({
      code: "NEW",
      isActive: true,
    });

    if (!defaultStatus) {
      return res.status(400).json({
        message: "Default status (NEW) is not configured",
      });
    }

    const images =
      req.files?.map((file) => ({
        url: file.location,
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
      })) || [];

    const note = await ServiceNote.create({
      ...req.body,
      status: defaultStatus._id,
      images,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: "Service note created successfully",
      data: note,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create service note",
      error: error.message,
    });
  }
};

/* =====================================================
   GET ALL SERVICE NOTES
===================================================== */
const mongoose = require("mongoose");

exports.getServiceNotes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      noteType,
      property,
    } = req.query;

    const query = { isActive: true };

    // 🔹 STATUS FILTER (CODE or ObjectId)
    if (status) {
      if (mongoose.Types.ObjectId.isValid(status)) {
        query.status = status;
      } else {
        const statusDoc = await ServiceNoteStatus.findOne({
          code: status.toUpperCase(),
          isActive: true,
        });

        if (!statusDoc) {
          return res.status(400).json({
            message: "Invalid status filter",
          });
        }

        query.status = statusDoc._id;
      }
    }

    if (noteType) query.noteType = noteType;
    if (property) query.property = property;

    if (search) {
      query.$or = [{ unitNumber: { $regex: search, $options: "i" } }];
    }

    const notes = await ServiceNote.find(query)
      .populate("user", "name")
      .populate("property", "name")
      .populate("subject", "name")
      .populate("noteType", "name")
      .populate("status", "name code")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ServiceNote.countDocuments(query);

    return res.status(200).json({
      total,
      page: Number(page),
      limit: Number(limit),
      data: notes,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch service notes",
      error: error.message,
    });
  }
};


/* =====================================================
   GET SERVICE NOTE BY ID
===================================================== */
exports.getServiceNoteById = async (req, res) => {
  try {
    const note = await ServiceNote.findById(req.params.id)
      .populate("user", "name")
      .populate("property", "name")
      .populate("subject", "name")
      .populate("noteType", "name")
      .populate("status", "name code")
      .populate("createdBy", "name");

    if (!note) {
      return res.status(404).json({
        message: "Service note not found",
      });
    }

    return res.status(200).json(note);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch service note",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE SERVICE NOTE (WITH IMAGES & STATUS)
===================================================== */
exports.updateServiceNote = async (req, res) => {
  try {
    const note = await ServiceNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        message: "Service note not found",
      });
    }

    const previousStatus = note.status?.toString();

    Object.assign(note, req.body);

    // 🔹 Append images
    if (req.files?.length) {
      const images = req.files.map((file) => ({
        url: file.location,
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
      }));
      note.images.push(...images);
    }

    // 🔹 Handle status change
    if (req.body.status && req.body.status !== previousStatus) {
      const statusObj = await ServiceNoteStatus.findById(req.body.status);

      if (!statusObj || !statusObj.isActive) {
        return res.status(400).json({
          message: "Invalid or inactive status",
        });
      }

      // 📌 READ logic
      if (statusObj.code === "READ") {
        note.readAt = new Date();
      }
    }

    await note.save();

    return res.status(200).json({
      message: "Service note updated successfully",
      data: note,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update service note",
      error: error.message,
    });
  }
};

/* =====================================================
   ENABLE / DISABLE SERVICE NOTE
===================================================== */
exports.toggleServiceNoteStatus = async (req, res) => {
  try {
    const note = await ServiceNote.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Service note not found",
      });
    }

    note.isActive = !note.isActive;
    await note.save();

    return res.status(200).json({
      message: `Service note ${
        note.isActive ? "enabled" : "disabled"
      } successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update service note status",
      error: error.message,
    });
  }
};

/* =====================================================
   SOFT DELETE SERVICE NOTE
===================================================== */
exports.deleteServiceNote = async (req, res) => {
  try {
    const note = await ServiceNote.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({
        message: "Service note not found",
      });
    }

    return res.status(200).json({
      message: "Service note deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete service note",
      error: error.message,
    });
  }
};
