const express = require("express");
const router = express.Router();

const alertController = require("../controllers/alert.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

// Alerts
router.post("/", adminAuth, alertController.createAlert);
router.get("/", adminAuth, alertController.getAlerts);
router.get("/:id", adminAuth, alertController.getAlertById);
router.put("/:id", adminAuth, alertController.updateAlert);
router.patch("/:id/status", adminAuth, alertController.toggleAlertStatus);
router.delete("/:id", adminAuth, alertController.deleteAlert);

module.exports = router;

