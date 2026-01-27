const express = require("express");
const router = express.Router();

const violationController = require("../controllers/violation.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");
const uploadViolationImages = require("../middlewares/uploadViolationImages");

/* =====================================================
   VIOLATION ROUTES
===================================================== */

// CREATE
router.post(
  "/",
  adminAuth,
  uploadViolationImages.array("images", 5),
  violationController.createViolation
);

// UPDATE
router.put(
  "/:id",
  adminAuth,
  uploadViolationImages.array("images", 5),
  violationController.updateViolation
);

// LIST
router.get("/", adminAuth, violationController.getViolations);

// ✅ STATIC ROUTE — MUST COME BEFORE :id
router.get(
  "/top-violators",
  adminAuth,
  violationController.getTopViolators
);

// READ BY ID
router.get("/:id", adminAuth, violationController.getViolationById);

// UPDATE STATUS
router.patch("/:id/status", adminAuth, violationController.updateViolationStatus);

// DELETE
router.delete("/:id", adminAuth, violationController.deleteViolation);

module.exports = router;
