const express = require("express");
const router = express.Router();
const controller = require("../controllers/serviceNoteStatus.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");


// CRUD
router.post("/", adminAuth, controller.createStatus);
router.get("/", adminAuth, controller.getAllStatuses);
router.get("/:id", adminAuth, controller.getStatusById);
router.put("/:id", adminAuth, controller.updateStatus);

// Enable / Disable
router.patch("/:id/disable", adminAuth, controller.disableStatus);
router.patch("/:id/enable", adminAuth, controller.enableStatus);

module.exports = router;
