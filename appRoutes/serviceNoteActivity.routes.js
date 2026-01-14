const express = require("express");
const router = express.Router();

const activityController = require("../controllers/serviceNoteActivity.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

/* =====================================================
   SERVICE NOTE ACTIVITY ROUTES
===================================================== */

// Create activity
router.post("/", adminAuth, activityController.createActivity);

// Get all activities (optionally by serviceNote)
router.get("/", adminAuth, activityController.getActivities);

// Get activity by ID
router.get("/:id", adminAuth, activityController.getActivityById);

// Update activity
router.put("/:id", adminAuth, activityController.updateActivity);

// Delete activity
router.delete("/:id", adminAuth, activityController.deleteActivity);

module.exports = router;
