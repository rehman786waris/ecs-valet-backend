const ServiceNoteStatus = require("../models/service/serviceNoteStatus.model");

/* =====================================================
   CREATE STATUS
===================================================== */
exports.createStatus = async (req, res) => {
  try {
    const { name, code, isSystem } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        message: "name and code are required",
      });
    }

    const exists = await ServiceNoteStatus.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(409).json({
        message: "Status code already exists",
      });
    }

    const status = await ServiceNoteStatus.create({
      name,
      code,
      isSystem: isSystem ?? true,
    });

    return res.status(201).json({
      message: "Service note status created successfully",
      data: status,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create service note status",
      error: error.message,
    });
  }
};

/* =====================================================
   GET ALL STATUSES
===================================================== */
exports.getAllStatuses = async (req, res) => {
  try {
    const { activeOnly } = req.query;

    const filter = {};
    if (activeOnly === "true") {
      filter.isActive = true;
    }

    const statuses = await ServiceNoteStatus.find(filter)
      .sort({ createdAt: 1 });

    return res.status(200).json({
      total: statuses.length,
      data: statuses,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch service note statuses",
      error: error.message,
    });
  }
};

/* =====================================================
   GET STATUS BY ID
===================================================== */
exports.getStatusById = async (req, res) => {
  try {
    const status = await ServiceNoteStatus.findById(req.params.id);

    if (!status) {
      return res.status(404).json({
        message: "Service note status not found",
      });
    }

    return res.status(200).json({
      data: status,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch service note status",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE STATUS
===================================================== */
exports.updateStatus = async (req, res) => {
  try {
    const status = await ServiceNoteStatus.findById(req.params.id);

    if (!status) {
      return res.status(404).json({
        message: "Service note status not found",
      });
    }

    // 🔒 Protect SYSTEM fields
    if (status.isSystem) {
      delete req.body.code;
      delete req.body.isSystem;
    }

    Object.assign(status, req.body);
    await status.save();

    return res.status(200).json({
      message: "Service note status updated successfully",
      data: status,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update service note status",
      error: error.message,
    });
  }
};

/* =====================================================
   DISABLE STATUS (SOFT DELETE)
===================================================== */
exports.disableStatus = async (req, res) => {
  try {
    const status = await ServiceNoteStatus.findById(req.params.id);

    if (!status) {
      return res.status(404).json({
        message: "Service note status not found",
      });
    }

    if (status.isSystem) {
      return res.status(403).json({
        message: "System status cannot be disabled",
      });
    }

    status.isActive = false;
    await status.save();

    return res.status(200).json({
      message: "Service note status disabled successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to disable service note status",
      error: error.message,
    });
  }
};

/* =====================================================
   ENABLE STATUS
===================================================== */
exports.enableStatus = async (req, res) => {
  try {
    const status = await ServiceNoteStatus.findById(req.params.id);

    if (!status) {
      return res.status(404).json({
        message: "Service note status not found",
      });
    }

    status.isActive = true;
    await status.save();

    return res.status(200).json({
      message: "Service note status enabled successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to enable service note status",
      error: error.message,
    });
  }
};
