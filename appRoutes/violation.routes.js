const express = require("express");
const router = express.Router();

const violationController = require("../controllers/violation.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");
const adminManagerEmployeeAuth = require("../middlewares/adminManagerEmployeeAuth");
const roleAuth = require("../middlewares/roleAuth");
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
router.get("/", adminManagerEmployeeAuth, violationController.getViolations);

// ✅ STATIC ROUTE — MUST COME BEFORE :id
router.get(
  "/top-violators",
  adminManagerEmployeeAuth,
  roleAuth("PROPERTY_MANAGER", "admin"),
  violationController.getTopViolators
);

// READ BY ID
router.get("/:id", adminAuth, violationController.getViolationById);

// UPDATE STATUS
router.patch("/:id/status", adminAuth, violationController.updateViolationStatus);

// DELETE
router.delete("/:id", adminAuth, violationController.deleteViolation);

module.exports = router;
