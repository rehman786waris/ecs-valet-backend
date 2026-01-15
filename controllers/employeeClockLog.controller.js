const EmployeeClockLog = require("../models/employees/employeeClockLogs.model");

/* ================= CREATE CLOCK LOG (ADMIN) ================= */
exports.createClockLog = async (req, res) => {
  try {
    const { employee, reportingManager, clockIn, reason } = req.body;

    const openLog = await EmployeeClockLog.findOne({
      employee,
      clockOut: null,
    });

    if (openLog) {
      return res.status(400).json({
        message: "Employee already clocked in",
      });
    }

    const log = await EmployeeClockLog.create({
      employee,
      reportingManager,
      clockIn,
      reason,
      source: "admin",
      isManual: true,
      updatedBy: req.user.id,
    });

    res.status(201).json({
      message: "Clock-in created successfully",
      log,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= CLOCK OUT (ADMIN) ================= */
exports.clockOut = async (req, res) => {
  try {
    const log = await EmployeeClockLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: "Clock log not found" });
    }

    if (log.clockOut) {
      return res.status(400).json({ message: "Already clocked out" });
    }

    log.clockOut = new Date();
    log.workDurationMinutes = Math.floor(
      (log.clockOut - log.clockIn) / 60000
    );
    log.updatedBy = req.user.id;

    await log.save();

    res.json({
      message: "Clock-out successful",
      log,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET ALL CLOCK LOGS ================= */
exports.getClockLogs = async (req, res) => {
  const logs = await EmployeeClockLog.find()
    .populate("employee", "firstName lastName")
    .populate("reportingManager", "firstName lastName")
    .sort({ clockIn: -1 });

  res.json(logs);
};

/* ================= GET SINGLE CLOCK LOG ================= */
exports.getClockLogById = async (req, res) => {
  const log = await EmployeeClockLog.findById(req.params.id)
    .populate("employee")
    .populate("reportingManager");

  if (!log) {
    return res.status(404).json({ message: "Clock log not found" });
  }

  res.json(log);
};

/* ================= UPDATE CLOCK LOG ================= */
exports.updateClockLog = async (req, res) => {
  const log = await EmployeeClockLog.findById(req.params.id);

  if (!log) {
    return res.status(404).json({ message: "Clock log not found" });
  }

  Object.assign(log, req.body);
  log.isManual = true;
  log.updatedBy = req.user.id;

  if (log.clockOut && log.clockIn) {
    log.workDurationMinutes = Math.floor(
      (log.clockOut - log.clockIn) / 60000
    );
  }

  await log.save();

  res.json({ message: "Clock log updated", log });
};

/* ================= DELETE CLOCK LOG ================= */
exports.deleteClockLog = async (req, res) => {
  const log = await EmployeeClockLog.findByIdAndDelete(req.params.id);

  if (!log) {
    return res.status(404).json({ message: "Clock log not found" });
  }

  res.json({ message: "Clock log deleted successfully" });
};
