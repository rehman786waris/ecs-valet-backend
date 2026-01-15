const express = require("express");
const router = express.Router();
const clockLogController = require("../controllers/employeeClockLog.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

// Admin only
router.post("/", adminAuth, clockLogController.createClockLog);
router.post("/:id/clock-out", adminAuth, clockLogController.clockOut);
router.get("/", adminAuth, clockLogController.getClockLogs);
router.get("/:id", adminAuth, clockLogController.getClockLogById);
router.put("/:id", adminAuth, clockLogController.updateClockLog);
router.delete("/:id", adminAuth, clockLogController.deleteClockLog);

module.exports = router;
