const Alert = require("../models/alerts/alert.model");

/* =====================================================
   CREATE ALERT
===================================================== */
exports.createAlert = async (req, res) => {
  try {
    const alert = await Alert.create(req.body);

    // mark as sent (or handle async sending later)
    alert.sendStatus = "Sent";
    alert.sentAt = new Date();
    await alert.save();

    return res.status(201).json({
      message: "Alert created and sent successfully",
      data: alert,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create alert",
      error: error.message,
    });
  }
};

/* =====================================================
   GET ALL ALERTS (FILTERS + PAGINATION)
===================================================== */
exports.getAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", reason, status } = req.query;

    const query = { isActive: true };

    if (reason) query.reason = reason;
    if (status) query.sendStatus = status;

    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }];
    }

    const alerts = await Alert.find(query)
      .populate("reason", "name")
      .populate("properties", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Alert.countDocuments(query);

    return res.status(200).json({
      total,
      page: Number(page),
      limit: Number(limit),
      data: alerts,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch alerts",
      error: error.message,
    });
  }
};

/* =====================================================
   GET ALERT BY ID
===================================================== */
exports.getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate("reason", "name")
      .populate("properties", "name")
      .populate("createdBy", "name");

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    return res.status(200).json(alert);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch alert",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE ALERT
===================================================== */
exports.updateAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    return res.status(200).json({
      message: "Alert updated successfully",
      data: alert,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update alert",
      error: error.message,
    });
  }
};

/* =====================================================
   ENABLE / DISABLE ALERT
===================================================== */
exports.toggleAlertStatus = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    alert.isActive = !alert.isActive;
    await alert.save();

    return res.status(200).json({
      message: `Alert ${alert.isActive ? "enabled" : "disabled"} successfully`,
      data: alert,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update alert status",
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE ALERT (SOFT DELETE)
===================================================== */
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    return res.status(200).json({
      message: "Alert deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete alert",
      error: error.message,
    });
  }
};
