const express = require("express");
const router = express.Router();
const controller = require("../controllers/qrScanLog.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");
const adminManagerEmployeeAuth = require("../middlewares/adminManagerEmployeeAuth");
//const mobileAuth = require("../middlewares/mobileAuthMiddleware");

/* ======================
   QR SCAN LOG ROUTES
====================== */

// Mobile scan
router.post("/scan", adminManagerEmployeeAuth, controller.createScanLog);

// Admin dashboard
router.get("/", adminAuth, controller.getScanLogs);
router.get("/:id", adminAuth, controller.getScanLogById);
router.delete("/:id", adminAuth, controller.deleteScanLog);

module.exports = router;
