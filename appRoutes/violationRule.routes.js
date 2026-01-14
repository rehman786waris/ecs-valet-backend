const express = require("express");
const router = express.Router();

const violationRuleController = require("../controllers/violationRule.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

/* =====================================================
   VIOLATION RULE ROUTES (GLOBAL)
===================================================== */

// Create rule
router.post("/", adminAuth, violationRuleController.createViolationRule);

// Get all rules (admin + dropdowns)
router.get("/", adminAuth, violationRuleController.getViolationRules);

// Get single rule
router.get("/:id", adminAuth, violationRuleController.getViolationRuleById);

// Update rule
router.put("/:id", adminAuth, violationRuleController.updateViolationRule);

// Soft delete rule
router.delete("/:id", adminAuth, violationRuleController.deleteViolationRule);

module.exports = router;
