const express = require("express");
const router = express.Router();

const violationController = require("../controllers/violation.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

/* =====================================================
   VIOLATION ROUTES
===================================================== */

// Create violation (Manual / Scan - Mobile)
router.post("/", adminAuth, violationController.createViolation);

// Get all violations (Admin dashboard)
router.get("/", adminAuth, violationController.getViolations);

// Get single violation by ID
router.get("/:id", adminAuth, violationController.getViolationById);

// Update violation details
router.put("/:id", adminAuth, violationController.updateViolation);

// Update violation status only
router.patch("/:id/status", adminAuth, violationController.updateViolationStatus);

// Soft delete violation
router.delete("/:id", adminAuth, violationController.deleteViolation);

module.exports = router;
