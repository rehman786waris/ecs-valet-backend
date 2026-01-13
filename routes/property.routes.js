const express = require("express");
const router = express.Router();

const propertyController = require("../controllers/property.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

/* =====================================================
   PROPERTY ROUTES
===================================================== */

// Create property
router.post("/", adminAuth, propertyController.createProperty);

// Get all properties
router.get("/", adminAuth, propertyController.getProperties);

// Get property by ID
router.get("/:id", adminAuth, propertyController.getPropertyById);

// Update property
router.put("/:id", adminAuth, propertyController.updateProperty);

// Toggle active/inactive
router.patch("/:id/status", adminAuth, propertyController.togglePropertyStatus);

// Soft delete property
router.delete("/:id", adminAuth, propertyController.deleteProperty);

module.exports = router;
