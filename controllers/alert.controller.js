const Alert = require("../models/alerts/alert.model");
const AlertReason = require("../models/alerts/alertReason.model");
const Property = require("../models/properties/property.model");

/* =====================================================
   CREATE ALERT
===================================================== */
exports.createAlert = async (req, res) => {
  try {
    const { title, reason, message, properties } = req.body;

    if (!title || !reason || !message) {
      return res
        .status(400)
        .json({ message: "Title, reason, and message are required" });
    }

    const propertyIds = Array.isArray(properties)
      ? properties
      : properties
        ? [properties]
        : [];

    if (!propertyIds.length) {
      return res.status(400).json({ message: "Properties are required" });
    }

    const reasonDoc = await AlertReason.findOne({
      _id: reason,
      isActive: true,
    }).select("_id");
    if (!reasonDoc) {
      return res.status(400).json({ message: "Invalid alert reason" });
    }

    const uniquePropertyIds = [...new Set(propertyIds.map((id) => id.toString()))];
    const propertyCount = await Property.countDocuments({
      _id: { $in: uniquePropertyIds },
      isDeleted: false,
    });
    if (propertyCount !== uniquePropertyIds.length) {
      return res.status(400).json({ message: "Invalid property selection" });
    }

    const alert = await Alert.create({
      title,
      reason,
      message,
      properties: uniquePropertyIds,
      createdBy: req.user._id,
    });

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

    const baseQuery = { isActive: true };

    if (reason) baseQuery.reason = reason;

    if (search) {
      baseQuery.$or = [{ title: { $regex: search, $options: "i" } }];
    }

    const query = { ...baseQuery };
    if (status) query.sendStatus = status;

    const [alerts, total, totalSent, totalPending, totalFailed] =
      await Promise.all([
        Alert.find(query)
          .populate("reason", "name")
          .populate("properties", "name")
          .populate("createdBy", "name")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(Number(limit)),
        Alert.countDocuments(query),
        Alert.countDocuments({ ...baseQuery, sendStatus: "Sent" }),
        Alert.countDocuments({ ...baseQuery, sendStatus: "Pending" }),
        Alert.countDocuments({ ...baseQuery, sendStatus: "Failed" }),
      ]);

    const totalAll = totalSent + totalPending + totalFailed;

    return res.status(200).json({
      total,
      page: Number(page),
      limit: Number(limit),
      counters: {
        total: totalAll,
        sent: totalSent,
        pending: totalPending,
        failed: totalFailed,
      },
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
