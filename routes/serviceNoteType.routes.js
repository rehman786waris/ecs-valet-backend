const express = require("express");
const router = express.Router();

const noteTypeController = require("../controllers/serviceNoteType.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

/* =====================================================
   SERVICE NOTE TYPE ROUTES
===================================================== */

// Create note type
router.post("/", adminAuth, noteTypeController.createNoteType);

// Get all note types
router.get("/", adminAuth, noteTypeController.getNoteTypes);

// Get note type by ID
router.get("/:id", adminAuth, noteTypeController.getNoteTypeById);

// Update note type
router.put("/:id", adminAuth, noteTypeController.updateNoteType);

// Enable / Disable note type
router.patch("/:id/status", adminAuth, noteTypeController.toggleNoteTypeStatus);

// Soft delete note type
router.delete("/:id", adminAuth, noteTypeController.deleteNoteType);

module.exports = router;
