const ServiceNote = require("../models/service/serviceNote.model");
const ServiceNoteActivity = require("../models/service/serviceNoteActivity.model");

/* =====================================================
   CREATE SERVICE NOTE
===================================================== */
exports.createServiceNote = async (req, res) => {
  try {
    const note = await ServiceNote.create(req.body);

    // Create activity log
    await ServiceNoteActivity.create({
      serviceNote: note._id,
      status: "New",
      changedBy: req.body.createdBy,
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
   GET ALL SERVICE NOTES (Filters + Pagination)
===================================================== */
exports.getServiceNotes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      noteType,
      property,
    } = req.query;

    const query = { isActive: true };

    if (status) query.status = status;
    if (noteType) query.noteType = noteType;
    if (property) query.property = property;

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: "i" } },
        { unitNumber: { $regex: search, $options: "i" } },
      ];
    }

    const notes = await ServiceNote.find(query)
      .populate("user", "name")
      .populate("property", "name")
      .populate("noteType", "name")
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
      .populate("noteType", "name")
      .populate("createdBy", "name");

    if (!note) {
      return res.status(404).json({ message: "Service note not found" });
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
   UPDATE SERVICE NOTE (Status, Description, etc.)
===================================================== */
exports.updateServiceNote = async (req, res) => {
  try {
    const note = await ServiceNote.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Service note not found" });
    }

    const prevStatus = note.status;

    Object.assign(note, req.body);

    // Auto set readAt
    if (req.body.status === "Read" && prevStatus !== "Read") {
      note.readAt = new Date();
    }

    await note.save();

    // Log activity if status changed
    if (req.body.status && req.body.status !== prevStatus) {
      await ServiceNoteActivity.create({
        serviceNote: note._id,
        status: req.body.status,
        changedBy: req.body.updatedBy || note.createdBy,
      });
    }

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
      return res.status(404).json({ message: "Service note not found" });
    }

    note.isActive = !note.isActive;
    await note.save();

    return res.status(200).json({
      message: `Service note ${note.isActive ? "enabled" : "disabled"} successfully`,
      data: note,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update service note status",
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE SERVICE NOTE (SOFT DELETE)
===================================================== */
exports.deleteServiceNote = async (req, res) => {
  try {
    const note = await ServiceNote.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Service note not found" });
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
