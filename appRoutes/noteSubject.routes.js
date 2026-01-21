const express = require("express");
const router = express.Router();

const noteSubjectController = require("../controllers/noteSubject.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

// Note Subjects
router.post("/", adminAuth, noteSubjectController.createNoteSubject);
router.get("/", adminAuth, noteSubjectController.getNoteSubjects);
router.get("/:id", adminAuth, noteSubjectController.getNoteSubjectById);
router.put("/:id", adminAuth, noteSubjectController.updateNoteSubject);
router.patch(
  "/:id/status",
  adminAuth,
  noteSubjectController.toggleNoteSubjectStatus
);
router.delete("/:id", adminAuth, noteSubjectController.deleteNoteSubject);

module.exports = router;
