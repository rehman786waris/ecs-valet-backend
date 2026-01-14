const express = require("express");
const router = express.Router();

const serviceNoteController = require("../controllers/serviceNote.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

/* =====================================================
   SERVICE NOTE ROUTES
===================================================== */

// Create service note
router.post("/", adminAuth, serviceNoteController.createServiceNote);

// Get all service notes
router.get("/", adminAuth, serviceNoteController.getServiceNotes);

// Get service note by ID
router.get("/:id", adminAuth, serviceNoteController.getServiceNoteById);

// Update service note
router.put("/:id", adminAuth, serviceNoteController.updateServiceNote);

// Enable / Disable service note
router.patch("/:id/status", adminAuth, serviceNoteController.toggleServiceNoteStatus);

// Soft delete service note
router.delete("/:id", adminAuth, serviceNoteController.deleteServiceNote);

module.exports = router;
