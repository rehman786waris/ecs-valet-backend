const express = require("express");
const router = express.Router();

const alertController = require("../controllers/alert.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");
const adminManagerEmployeeAuth = require("../middlewares/adminManagerEmployeeAuth");

// Alerts
router.post("/", adminAuth, alertController.createAlert);
router.get("/", adminManagerEmployeeAuth, alertController.getAlerts);
router.get("/:id", adminManagerEmployeeAuth, alertController.getAlertById);
router.put("/:id", adminAuth, alertController.updateAlert);
router.patch("/:id/status", adminAuth, alertController.toggleAlertStatus);
router.delete("/:id", adminAuth, alertController.deleteAlert);

module.exports = router;
