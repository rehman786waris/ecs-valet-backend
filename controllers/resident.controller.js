const Resident = require("../models/residents/resident.model");

/* =====================================================
   CREATE RESIDENT
===================================================== */
exports.createResident = async (req, res) => {
  try {
    const resident = await Resident.create({
      ...req.body,
      createdBy: req.user._id, // from auth middleware
    });

    res.status(201).json({
      message: "Resident created successfully",
      data: resident,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* =====================================================
   GET ALL RESIDENTS (WITH FILTERS)
===================================================== */
exports.getResidents = async (req, res) => {
  try {
    const { property, search, isActive = true } = req.query;

    const filter = { isActive };

    if (property) filter.property = property;

    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, "i") },
        { lastName: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { unit: new RegExp(search, "i") },
      ];
    }

    const residents = await Resident.find(filter)
      .populate("property", "name address")
      .populate("building", "name")
      .sort({ createdAt: -1 });

    res.json({ data: residents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET SINGLE RESIDENT
===================================================== */
exports.getResidentById = async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id)
      .populate("property")
      .populate("building");

    if (!resident)
      return res.status(404).json({ message: "Resident not found" });

    res.json({ data: resident });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   UPDATE RESIDENT
===================================================== */
exports.updateResident = async (req, res) => {
  try {
    const resident = await Resident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!resident)
      return res.status(404).json({ message: "Resident not found" });

    res.json({
      message: "Resident updated successfully",
      data: resident,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* =====================================================
   SOFT DELETE RESIDENT
===================================================== */
exports.deleteResident = async (req, res) => {
  try {
    const resident = await Resident.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!resident)
      return res.status(404).json({ message: "Resident not found" });

    res.json({ message: "Resident deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
