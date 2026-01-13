const Violation = require("../models/violations/violation.model");

/* =====================================================
   CREATE VIOLATION (MANUAL / SCAN)
===================================================== */
exports.createViolation = async (req, res) => {
  try {
    const {
      property,
      user,
      rule,
      action,
      unitNumber,
      building,
      floor,
      notes,
      source = "Manual",
      binTagId,
      images = [],
    } = req.body;

    if (!property || !user || !rule) {
      return res.status(400).json({
        message: "Property, user, and rule are required",
      });
    }

    if (source === "Scan" && !binTagId) {
      return res.status(400).json({
        message: "Bin Tag ID is required for scan violations",
      });
    }

    const violation = await Violation.create({
      company: req.user.company,
      property,
      user,
      rule,
      action: action || null,
      unitNumber,
      building,
      floor,
      notes,
      source,
      binTagId,
      images: images.filter(img => img.url),
      createdBy: req.user._id,
      submittedFromMobile: source === "Scan",
    });

    res.status(201).json({
      message: "Violation created successfully",
      data: violation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   GET ALL VIOLATIONS (ADMIN)
===================================================== */
exports.getViolations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      property,
      rule,
      action,
      search,
    } = req.query;

    const query = {
      company: req.user.company,
      isDeleted: false,
    };

    if (status) query.status = status;
    if (property) query.property = property;
    if (rule) query.rule = rule;
    if (action) query.action = action;

    if (search) {
      query.$or = [
        { unitNumber: { $regex: search, $options: "i" } },
        { binTagId: { $regex: search, $options: "i" } },
      ];
    }

    const violations = await Violation.find(query)
      .populate("user", "firstName lastName")
      .populate("property", "name address")
      .populate("rule", "name")
      .populate("action", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Violation.countDocuments(query);

    res.json({
      data: violations,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   GET SINGLE VIOLATION
===================================================== */
exports.getViolationById = async (req, res) => {
  try {
    const violation = await Violation.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    })
      .populate("user")
      .populate("property")
      .populate("rule")
      .populate("action")
      .populate("createdBy", "firstName lastName");

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    res.json({ data: violation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   UPDATE VIOLATION (DETAILS ONLY)
===================================================== */
exports.updateViolation = async (req, res) => {
  try {
    const violation = await Violation.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (violation.status === "Closed") {
      return res.status(400).json({
        message: "Closed violations cannot be modified",
      });
    }

    const allowedFields = [
      "rule",
      "action",
      "unitNumber",
      "building",
      "floor",
      "notes",
      "images",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        violation[field] = req.body[field];
      }
    });

    await violation.save();

    res.json({
      message: "Violation updated successfully",
      data: violation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   UPDATE STATUS (WORKFLOW SAFE)
===================================================== */
exports.updateViolationStatus = async (req, res) => {
  try {
    const { status, action } = req.body;

    if (!["New", "Submitted", "Pending", "Closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const violation = await Violation.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (status === "Submitted" && !violation.action && !action) {
      return res.status(400).json({
        message: "Action is required when submitting a violation",
      });
    }

    violation.status = status;
    violation.statusUpdatedAt = new Date();

    if (action) violation.action = action;

    if (status === "Submitted" && !violation.submittedAt) {
      violation.submittedAt = new Date();
    }

    await violation.save();

    res.json({
      message: "Status updated successfully",
      data: violation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   SOFT DELETE VIOLATION
===================================================== */
exports.deleteViolation = async (req, res) => {
  try {
    const violation = await Violation.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    violation.isDeleted = true;
    await violation.save();

    res.json({ message: "Violation deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
