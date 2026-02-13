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

// Admin/Manager/Employee dashboard
router.get("/", adminManagerEmployeeAuth, controller.getScanLogs);
router.get("/:id", adminManagerEmployeeAuth, controller.getScanLogById);
router.delete("/:id", adminAuth, controller.deleteScanLog);

module.exports = router;
