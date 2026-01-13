const ServiceNoteActivity = require("../models/service/serviceNoteActivity.model");

/* =====================================================
   CREATE SERVICE NOTE ACTIVITY
===================================================== */
exports.createActivity = async (req, res) => {
  try {
    const activity = await ServiceNoteActivity.create(req.body);

    return res.status(201).json({
      message: "Service note activity created successfully",
      data: activity,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create service note activity",
      error: error.message,
    });
  }
};

/* =====================================================
   GET ALL ACTIVITIES (by Service Note)
===================================================== */
exports.getActivities = async (req, res) => {
  try {
    const { serviceNote } = req.query;

    const query = {};
    if (serviceNote) query.serviceNote = serviceNote;

    const activities = await ServiceNoteActivity.find(query)
      .populate("serviceNote", "subject status")
      .populate("changedBy", "name")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      total: activities.length,
      data: activities,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch service note activities",
      error: error.message,
    });
  }
};

/* =====================================================
   GET ACTIVITY BY ID
===================================================== */
exports.getActivityById = async (req, res) => {
  try {
    const activity = await ServiceNoteActivity.findById(req.params.id)
      .populate("serviceNote", "subject status")
      .populate("changedBy", "name");

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    return res.status(200).json(activity);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch activity",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE ACTIVITY (RARE CASE)
===================================================== */
exports.updateActivity = async (req, res) => {
  try {
    const activity = await ServiceNoteActivity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    return res.status(200).json({
      message: "Service note activity updated successfully",
      data: activity,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update service note activity",
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE ACTIVITY (USE CAREFULLY)
===================================================== */
exports.deleteActivity = async (req, res) => {
  try {
    const activity = await ServiceNoteActivity.findByIdAndDelete(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    return res.status(200).json({
      message: "Service note activity deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete service note activity",
      error: error.message,
    });
  }
};
