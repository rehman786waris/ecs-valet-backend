const express = require("express");
const router = express.Router();

const violationTemplateController = require("../controllers/violationTemplate.controller");
const adminManagerEmployeeAuth = require("../middlewares/adminManagerEmployeeAuth");
const roleAuth = require("../middlewares/roleAuth");

/* =====================================================
   VIOLATION TEMPLATE ROUTES
===================================================== */

// Create template
router.post(
  "/",
  adminManagerEmployeeAuth,
  roleAuth("PROPERTY_MANAGER", "admin"),
  violationTemplateController.createTemplate
);

// Get all templates
router.get(
  "/",
  adminManagerEmployeeAuth,
  roleAuth("PROPERTY_MANAGER", "admin"),
  violationTemplateController.getTemplates
);

// Get single template
router.get(
  "/:id",
  adminManagerEmployeeAuth,
  roleAuth("PROPERTY_MANAGER", "admin"),
  violationTemplateController.getTemplateById
);

// Update template
router.put(
  "/:id",
  adminManagerEmployeeAuth,
  roleAuth("PROPERTY_MANAGER", "admin"),
  violationTemplateController.updateTemplate
);

// Soft delete template
router.delete(
  "/:id",
  adminManagerEmployeeAuth,
  roleAuth("PROPERTY_MANAGER", "admin"),
  violationTemplateController.deleteTemplate
);

module.exports = router;
