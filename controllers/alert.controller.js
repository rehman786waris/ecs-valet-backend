const Alert = require("../models/alerts/alert.model");
const AlertReason = require("../models/alerts/alertReason.model");
const Property = require("../models/properties/property.model");

const ALERT_POPULATE = [
  { path: "reason", select: "name" },
  { path: "properties", select: "propertyName" },
  { path: "createdBy", select: "name" },
];

const formatAlert = (alertDoc) => {
  if (!alertDoc) return null;

  const alert = alertDoc.toObject
    ? alertDoc.toObject({ virtuals: true })
    : { ...alertDoc };

  alert.id = alert.id || alert._id?.toString?.();

  if (Array.isArray(alert.properties)) {
    alert.properties = alert.properties
      .map((property) => {
        if (!property) return null;

        if (typeof property === "string") {
          return { id: property, propertyName: null };
        }

        if (property.toString && !property._id && !property.id) {
          return { id: property.toString(), propertyName: null };
        }

        return {
          id: property.id || property._id?.toString?.() || null,
          propertyName: property.propertyName ?? property.name ?? null,
        };
      })
      .filter(Boolean);
  }

  return alert;
};

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
    const populatedAlert = await Alert.findById(alert._id)
      .populate(ALERT_POPULATE);

    return res.status(201).json({
      message: "Alert created and sent successfully",
      data: formatAlert(populatedAlert || alert),
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
    const {
      page = 1,
      limit = 10,
      search = "",
      reason,
      status,
      deleted,
      active,
    } = req.query;

    const baseQuery = { isDeleted: false };

    if (deleted === "true") baseQuery.isDeleted = true;
    if (deleted === "false") baseQuery.isDeleted = false;
    if (active === "true") baseQuery.isActive = true;
    if (active === "false") baseQuery.isActive = false;

    if (reason) baseQuery.reason = reason;

    if (search) {
      const searchRegex = new RegExp(search, "i");
      const [reasonMatches, propertyMatches] = await Promise.all([
        AlertReason.find({ name: { $regex: searchRegex }, isActive: true }).select("_id"),
        Property.find({
          propertyName: { $regex: searchRegex },
          isDeleted: false,
        }).select("_id"),
      ]);

      const reasonIds = reasonMatches.map((r) => r._id);
      const propertyIds = propertyMatches.map((p) => p._id);

      baseQuery.$or = [
        { title: { $regex: searchRegex } },
        ...(reasonIds.length ? [{ reason: { $in: reasonIds } }] : []),
        ...(propertyIds.length ? [{ properties: { $in: propertyIds } }] : []),
      ];
    }

    const query = { ...baseQuery };
    if (status) query.sendStatus = status;

    const countersBaseQuery = { ...baseQuery };
    delete countersBaseQuery.isActive;

    const [
      alerts,
      total,
      totalSent,
      totalPending,
      totalFailed,
      totalActive,
      totalInactive,
    ] =
      await Promise.all([
        Alert.find(query)
          .populate(ALERT_POPULATE)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(Number(limit)),
        Alert.countDocuments(query),
        Alert.countDocuments({ ...baseQuery, sendStatus: "Sent" }),
        Alert.countDocuments({ ...baseQuery, sendStatus: "Pending" }),
        Alert.countDocuments({ ...baseQuery, sendStatus: "Failed" }),
        Alert.countDocuments({ ...countersBaseQuery, isActive: true }),
        Alert.countDocuments({ ...countersBaseQuery, isActive: false }),
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
        active: totalActive,
        inactive: totalInactive,
      },
      data: alerts.map(formatAlert),
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
      .populate(ALERT_POPULATE);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    return res.status(200).json(formatAlert(alert));
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
    ).populate(ALERT_POPULATE);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    return res.status(200).json({
      message: "Alert updated successfully",
      data: formatAlert(alert),
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
    const alert = await Alert.findById(req.params.id).populate(ALERT_POPULATE);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    alert.isActive = !alert.isActive;
    await alert.save();

    return res.status(200).json({
      message: `Alert ${alert.isActive ? "enabled" : "disabled"} successfully`,
      data: formatAlert(alert),
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
      { isActive: false, isDeleted: true },
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
