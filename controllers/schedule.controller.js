const Schedule = require("../models/schedule/schedule.model");

/* =====================================================
   CREATE SCHEDULE
===================================================== */
exports.createSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.create(req.body);

    return res.status(201).json({
      message: "Schedule created successfully",
      data: schedule,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create schedule",
      error: error.message,
    });
  }
};

/* =====================================================
   GET SCHEDULES (FILTER + PAGINATION)
===================================================== */
exports.getSchedules = async (req, res) => {
  try {
    const { page = 1, limit = 10, date, employee } = req.query;

    const query = { isActive: true };

    if (date) query.date = new Date(date);
    if (employee) query.assignedTo = employee;

    const schedules = await Schedule.find(query)
      .populate("property", "name address")
      .populate("assignedTo", "name")
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Schedule.countDocuments(query);

    return res.status(200).json({
      total,
      page: Number(page),
      limit: Number(limit),
      data: schedules,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch schedules",
      error: error.message,
    });
  }
};

/* =====================================================
   GET SINGLE SCHEDULE
===================================================== */
exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate("property")
      .populate("assignedTo");

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    return res.status(200).json(schedule);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch schedule",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE SCHEDULE
===================================================== */
exports.updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    return res.status(200).json({
      message: "Schedule updated successfully",
      data: schedule,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update schedule",
      error: error.message,
    });
  }
};

/* =====================================================
   CHECK IN
===================================================== */
exports.checkIn = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    schedule.checkIn = new Date();
    schedule.status = "Checked In";
    await schedule.save();

    return res.status(200).json({
      message: "Checked in successfully",
      data: schedule,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Check-in failed",
      error: error.message,
    });
  }
};

/* =====================================================
   CHECK OUT
===================================================== */
exports.checkOut = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    schedule.checkOut = new Date();
    schedule.status = "Checked Out";
    await schedule.save();

    return res.status(200).json({
      message: "Checked out successfully",
      data: schedule,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Check-out failed",
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE SCHEDULE (SOFT)
===================================================== */
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    return res.status(200).json({
      message: "Schedule deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete schedule",
      error: error.message,
    });
  }
};
