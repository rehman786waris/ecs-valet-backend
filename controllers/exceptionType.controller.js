const ExceptionType = require("../models/reports/exceptionType.model");

/* ===============================
   CREATE EXCEPTION TYPE
================================ */
exports.createExceptionType = async (req, res) => {
  try {
    const { name, category } = req.body;

    const exists = await ExceptionType.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: "Exception type already exists" });
    }

    const exceptionType = await ExceptionType.create({
      name,
      category,
      createdBy: req.user?._id || null,
    });

    res.status(201).json(exceptionType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   LIST EXCEPTION TYPES
================================ */
exports.getExceptionTypes = async (req, res) => {
  try {
    const types = await ExceptionType.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    res.json(types);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   TOGGLE EXCEPTION TYPE
================================ */
exports.toggleExceptionType = async (req, res) => {
  try {
    const { id } = req.params;

    const type = await ExceptionType.findById(id);
    if (!type) {
      return res.status(404).json({ message: "Exception type not found" });
    }

    type.isActive = !type.isActive;
    await type.save();

    res.json(type);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
