const express = require("express");
const router = express.Router();

const violationActionController = require("../controllers/violationAction.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

/* =====================================================
   VIOLATION ACTION ROUTES (GLOBAL)
===================================================== */

// Create action
router.post("/", adminAuth, violationActionController.createViolationAction);

// Get all actions (admin + dropdowns)
router.get("/", adminAuth, violationActionController.getViolationActions);

// Get single action
router.get("/:id", adminAuth, violationActionController.getViolationActionById);

// Update action
router.put("/:id", adminAuth, violationActionController.updateViolationAction);

// Soft delete action
router.delete("/:id", adminAuth, violationActionController.deleteViolationAction);

module.exports = router;
