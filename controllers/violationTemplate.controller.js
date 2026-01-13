const ViolationTemplate = require("../models/violations/violationTemplate.model");

/* =====================================================
   CREATE TEMPLATE
===================================================== */
exports.createTemplate = async (req, res) => {
  try {
    const { name, subject, body, type, isDefault = false } = req.body;

    if (!name || !subject || !body || !type) {
      return res.status(400).json({
        message: "Name, subject, body, and type are required",
      });
    }

    // Ensure only one default template per type
    if (isDefault === true) {
      await ViolationTemplate.updateMany(
        { type, isDefault: true, isDeleted: false },
        { isDefault: false }
      );
    }

    const template = await ViolationTemplate.create({
      name,
      subject,
      body,
      type,
      isDefault,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Template created successfully",
      data: template,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   GET ALL TEMPLATES (ADMIN LIST)
===================================================== */
exports.getTemplates = async (req, res) => {
  try {
    const { type, activeOnly } = req.query;

    const query = {
      isDeleted: false,
    };

    if (type) query.type = type;
    if (activeOnly === "true") query.isActive = true;

    const templates = await ViolationTemplate.find(query)
      .sort({ createdAt: -1 });

    res.json({ data: templates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   GET SINGLE TEMPLATE
===================================================== */
exports.getTemplateById = async (req, res) => {
  try {
    const template = await ViolationTemplate.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!template) {
      return res.status(404).json({
        message: "Template not found",
      });
    }

    res.json({ data: template });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   UPDATE TEMPLATE
===================================================== */
exports.updateTemplate = async (req, res) => {
  try {
    const template = await ViolationTemplate.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!template) {
      return res.status(404).json({
        message: "Template not found",
      });
    }

    const allowedFields = [
      "name",
      "subject",
      "body",
      "type",
      "isDefault",
      "isActive",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        template[field] = req.body[field];
      }
    });

    // Ensure only one default template per type
    if (req.body.isDefault === true) {
      await ViolationTemplate.updateMany(
        {
          _id: { $ne: template._id },
          type: template.type,
          isDefault: true,
          isDeleted: false,
        },
        { isDefault: false }
      );
    }

    await template.save();

    res.json({
      message: "Template updated successfully",
      data: template,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   SOFT DELETE TEMPLATE
===================================================== */
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await ViolationTemplate.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!template) {
      return res.status(404).json({
        message: "Template not found",
      });
    }

    template.isDeleted = true;
    template.isActive = false;
    await template.save();

    res.json({
      message: "Template deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
