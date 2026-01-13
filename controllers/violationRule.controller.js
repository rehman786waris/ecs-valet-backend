const ViolationRule = require("../models/violations/violationRule.model");

/* =====================================================
   CREATE VIOLATION RULE (GLOBAL - ADMIN)
===================================================== */
exports.createViolationRule = async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Rule name is required" });
    }

    const rule = await ViolationRule.create({
      name,
      description,
      sortOrder,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Violation rule created successfully",
      data: rule,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Violation rule with this name already exists",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   GET ALL VIOLATION RULES (ADMIN / DROPDOWN)
===================================================== */
exports.getViolationRules = async (req, res) => {
  try {
    const { activeOnly } = req.query;

    const query = {
      isDeleted: false,
    };

    if (activeOnly === "true") {
      query.isActive = true;
    }

    const rules = await ViolationRule.find(query)
      .sort({ sortOrder: 1, name: 1 });

    res.json({ data: rules });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   GET SINGLE VIOLATION RULE
===================================================== */
exports.getViolationRuleById = async (req, res) => {
  try {
    const rule = await ViolationRule.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!rule) {
      return res.status(404).json({ message: "Violation rule not found" });
    }

    res.json({ data: rule });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   UPDATE VIOLATION RULE
===================================================== */
exports.updateViolationRule = async (req, res) => {
  try {
    const rule = await ViolationRule.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!rule) {
      return res.status(404).json({ message: "Violation rule not found" });
    }

    const allowedFields = ["name", "description", "isActive", "sortOrder"];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        rule[field] = req.body[field];
      }
    });

    await rule.save();

    res.json({
      message: "Violation rule updated successfully",
      data: rule,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Violation rule with this name already exists",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   SOFT DELETE VIOLATION RULE
===================================================== */
exports.deleteViolationRule = async (req, res) => {
  try {
    const rule = await ViolationRule.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!rule) {
      return res.status(404).json({ message: "Violation rule not found" });
    }

    rule.isDeleted = true;
    await rule.save();

    res.json({ message: "Violation rule deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
