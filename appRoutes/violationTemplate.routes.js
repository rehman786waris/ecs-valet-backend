const express = require("express");
const router = express.Router();

const violationTemplateController = require("../controllers/violationTemplate.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

/* =====================================================
   VIOLATION TEMPLATE ROUTES
===================================================== */

// Create template
router.post("/", adminAuth, violationTemplateController.createTemplate);

// Get all templates
router.get("/", adminAuth, violationTemplateController.getTemplates);

// Get single template
router.get("/:id", adminAuth, violationTemplateController.getTemplateById);

// Update template
router.put("/:id", adminAuth, violationTemplateController.updateTemplate);

// Soft delete template
router.delete("/:id", adminAuth, violationTemplateController.deleteTemplate);

module.exports = router;
