const ViolationAction = require("../models/violations/violationAction.model");

/* =====================================================
   CREATE VIOLATION ACTION (GLOBAL - ADMIN)
===================================================== */
exports.createViolationAction = async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Violation action name is required",
      });
    }

    const action = await ViolationAction.create({
      name,
      description,
      sortOrder,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Violation action created successfully",
      data: action,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Violation action with this name already exists",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   GET ALL VIOLATION ACTIONS (ADMIN / DROPDOWN)
===================================================== */
exports.getViolationActions = async (req, res) => {
  try {
    const { activeOnly } = req.query;

    const query = {
      isDeleted: false,
    };

    if (activeOnly === "true") {
      query.isActive = true;
    }

    const actions = await ViolationAction.find(query)
      .sort({ sortOrder: 1, name: 1 });

    res.json({ data: actions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   GET SINGLE VIOLATION ACTION
===================================================== */
exports.getViolationActionById = async (req, res) => {
  try {
    const action = await ViolationAction.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!action) {
      return res.status(404).json({
        message: "Violation action not found",
      });
    }

    res.json({ data: action });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   UPDATE VIOLATION ACTION
===================================================== */
exports.updateViolationAction = async (req, res) => {
  try {
    const action = await ViolationAction.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!action) {
      return res.status(404).json({
        message: "Violation action not found",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "isActive",
      "sortOrder",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        action[field] = req.body[field];
      }
    });

    await action.save();

    res.json({
      message: "Violation action updated successfully",
      data: action,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Violation action with this name already exists",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   SOFT DELETE VIOLATION ACTION
===================================================== */
exports.deleteViolationAction = async (req, res) => {
  try {
    const action = await ViolationAction.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!action) {
      return res.status(404).json({
        message: "Violation action not found",
      });
    }

    action.isDeleted = true;
    await action.save();

    res.json({
      message: "Violation action deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
