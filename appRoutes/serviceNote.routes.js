const express = require("express");
const router = express.Router();

const serviceNoteController = require("../controllers/serviceNote.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");
const adminManagerEmployeeAuth = require("../middlewares/adminManagerEmployeeAuth");
const uploadServiceNoteImages = require("../middlewares/uploadServiceNoteImages");

/* =====================================================
   SERVICE NOTE ROUTES
===================================================== */

router.post(
  "/",
  adminAuth,
  uploadServiceNoteImages.array("images", 10),
  serviceNoteController.createServiceNote
);

router.get("/", adminManagerEmployeeAuth, serviceNoteController.getServiceNotes);

router.get("/:id", adminManagerEmployeeAuth, serviceNoteController.getServiceNoteById);

router.put(
  "/:id",
  adminAuth,
  uploadServiceNoteImages.array("images", 10),
  serviceNoteController.updateServiceNote
);

router.patch("/:id/status", adminAuth, serviceNoteController.toggleServiceNoteStatus);

router.delete("/:id", adminAuth, serviceNoteController.deleteServiceNote);

module.exports = router;
