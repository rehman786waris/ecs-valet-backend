const express = require("express");
const router = express.Router();

const taskController = require("../controllers/task.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

/* =====================================================
   TASK ROUTES
===================================================== */

// Create task
router.post("/", adminAuth, taskController.createTask);

// Get all tasks
router.get("/", adminAuth, taskController.getTasks);

// Get task by ID
router.get("/:id", adminAuth, taskController.getTaskById);

// Update task
router.put("/:id", adminAuth, taskController.updateTask);

// Enable / Disable task
router.patch("/:id/status", adminAuth, taskController.toggleTaskStatus);

// Soft delete task
router.delete("/:id", adminAuth, taskController.deleteTask);

module.exports = router;
