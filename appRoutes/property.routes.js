const express = require("express");
const router = express.Router();

const uploadPropertyImages = require("../middlewares/uploadPropertyImages");
const propertyController = require("../controllers/property.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");
const adminManagerEmployeeAuth = require("../middlewares/adminManagerEmployeeAuth");

/* =====================================================
   PROPERTY ROUTES
===================================================== */

// Create property
router.post(
  "/",
  adminManagerEmployeeAuth,
  uploadPropertyImages.fields([
    { name: "images", maxCount: 10 },
    { name: "propertyLogo", maxCount: 1 },
  ]),
  propertyController.createProperty
);

// Get all properties
router.get("/", adminManagerEmployeeAuth, propertyController.getProperties);

// Get property by ID
router.get("/:id", adminManagerEmployeeAuth, propertyController.getPropertyById);

// Update property
router.put(
  "/:id",
  adminManagerEmployeeAuth,
  uploadPropertyImages.fields([
    { name: "images", maxCount: 10 },
    { name: "propertyLogo", maxCount: 1 },
  ]),
  propertyController.updateProperty
);

// Toggle active/inactive
router.patch("/:id/status", adminAuth, propertyController.togglePropertyStatus);

// Soft delete property
router.delete("/:id", adminAuth, propertyController.deleteProperty);

module.exports = router;
