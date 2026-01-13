const AlertReason = require("../models/alerts/alertReason.model");

/* =====================================================
   CREATE ALERT REASON
===================================================== */
exports.createReason = async (req, res) => {
  try {
    const exists = await AlertReason.findOne({ name: req.body.name });
    if (exists) {
      return res.status(400).json({ message: "Alert reason already exists" });
    }

    const reason = await AlertReason.create(req.body);

    return res.status(201).json({
      message: "Alert reason created successfully",
      data: reason,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create alert reason",
      error: error.message,
    });
  }
};

/* =====================================================
   GET ALERT REASONS
===================================================== */
exports.getReasons = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};

    if (isActive !== undefined) query.isActive = isActive;

    const reasons = await AlertReason.find(query).sort({ name: 1 });

    return res.status(200).json({
      total: reasons.length,
      data: reasons,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch alert reasons",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE ALERT REASON
===================================================== */
exports.updateReason = async (req, res) => {
  try {
    const reason = await AlertReason.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!reason) {
      return res.status(404).json({ message: "Alert reason not found" });
    }

    return res.status(200).json({
      message: "Alert reason updated successfully",
      data: reason,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update alert reason",
      error: error.message,
    });
  }
};

/* =====================================================
   ENABLE / DISABLE ALERT REASON
===================================================== */
exports.toggleReasonStatus = async (req, res) => {
  try {
    const reason = await AlertReason.findById(req.params.id);

    if (!reason) {
      return res.status(404).json({ message: "Alert reason not found" });
    }

    reason.isActive = !reason.isActive;
    await reason.save();

    return res.status(200).json({
      message: `Alert reason ${reason.isActive ? "enabled" : "disabled"} successfully`,
      data: reason,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update alert reason status",
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE ALERT REASON (SOFT)
===================================================== */
exports.deleteReason = async (req, res) => {
  try {
    const reason = await AlertReason.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!reason) {
      return res.status(404).json({ message: "Alert reason not found" });
    }

    return res.status(200).json({
      message: "Alert reason deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete alert reason",
      error: error.message,
    });
  }
};
