const express = require("express");
const router = express.Router();

const violationController = require("../controllers/violation.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");
const uploadViolationImages = require("../middlewares/uploadViolationImages");

/* =====================================================
   VIOLATION ROUTES
===================================================== */

// Create violation with images
router.post("/", adminAuth, uploadViolationImages.array("images", 5), violationController.createViolation);
router.put("/:id", adminAuth, uploadViolationImages.array("images", 5), violationController.updateViolation);
router.get("/", adminAuth, violationController.getViolations);
router.get("/:id", adminAuth, violationController.getViolationById);
router.patch("/:id/status", adminAuth, violationController.updateViolationStatus);
router.delete("/:id", adminAuth, violationController.deleteViolation);

module.exports = router;
