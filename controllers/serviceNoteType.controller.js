const ServiceNoteType = require("../models/service/serviceNoteType.model");

/* =====================================================
   CREATE SERVICE NOTE TYPE
===================================================== */
exports.createNoteType = async (req, res) => {
  try {
    const exists = await ServiceNoteType.findOne({ name: req.body.name });

    if (exists) {
      return res.status(400).json({ message: "Note type already exists" });
    }

    const noteType = await ServiceNoteType.create(req.body);

    return res.status(201).json({
      message: "Service note type created successfully",
      data: noteType,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create service note type",
      error: error.message,
    });
  }
};

/* =====================================================
   GET ALL SERVICE NOTE TYPES
===================================================== */
exports.getNoteTypes = async (req, res) => {
  try {
    const { isActive } = req.query;

    const query = {};
    if (isActive !== undefined) query.isActive = isActive;

    const noteTypes = await ServiceNoteType.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name");

    return res.status(200).json({
      total: noteTypes.length,
      data: noteTypes,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch service note types",
      error: error.message,
    });
  }
};

/* =====================================================
   GET SERVICE NOTE TYPE BY ID
===================================================== */
exports.getNoteTypeById = async (req, res) => {
  try {
    const noteType = await ServiceNoteType.findById(req.params.id)
      .populate("createdBy", "name");

    if (!noteType) {
      return res.status(404).json({ message: "Service note type not found" });
    }

    return res.status(200).json(noteType);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch service note type",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE SERVICE NOTE TYPE
===================================================== */
exports.updateNoteType = async (req, res) => {
  try {
    const noteType = await ServiceNoteType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!noteType) {
      return res.status(404).json({ message: "Service note type not found" });
    }

    return res.status(200).json({
      message: "Service note type updated successfully",
      data: noteType,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update service note type",
      error: error.message,
    });
  }
};

/* =====================================================
   ENABLE / DISABLE SERVICE NOTE TYPE
===================================================== */
exports.toggleNoteTypeStatus = async (req, res) => {
  try {
    const noteType = await ServiceNoteType.findById(req.params.id);

    if (!noteType) {
      return res.status(404).json({ message: "Service note type not found" });
    }

    noteType.isActive = !noteType.isActive;
    await noteType.save();

    return res.status(200).json({
      message: `Service note type ${noteType.isActive ? "enabled" : "disabled"} successfully`,
      data: noteType,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update service note type status",
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE SERVICE NOTE TYPE (SOFT DELETE)
===================================================== */
exports.deleteNoteType = async (req, res) => {
  try {
    const noteType = await ServiceNoteType.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!noteType) {
      return res.status(404).json({ message: "Service note type not found" });
    }

    return res.status(200).json({
      message: "Service note type deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete service note type",
      error: error.message,
    });
  }
};
