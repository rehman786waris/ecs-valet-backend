const express = require("express");
const router = express.Router();

const scheduleController = require("../controllers/schedule.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

/* =====================================================
   SCHEDULE ROUTES
===================================================== */

router.post("/", adminAuth, scheduleController.createSchedule);
router.get("/", adminAuth, scheduleController.getSchedules);
router.get("/:id", adminAuth, scheduleController.getScheduleById);
router.put("/:id", adminAuth, scheduleController.updateSchedule);

// Mobile actions
router.patch("/:id/check-in", adminAuth, scheduleController.checkIn);
router.patch("/:id/check-out", adminAuth, scheduleController.checkOut);

router.delete("/:id", adminAuth, scheduleController.deleteSchedule);

module.exports = router;
