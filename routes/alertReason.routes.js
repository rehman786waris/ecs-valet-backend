const express = require("express");
const router = express.Router();

const reasonController = require("../controllers/alertReason.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

// Alert Reasons
router.post("/", adminAuth, reasonController.createReason);
router.get("/", adminAuth, reasonController.getReasons);
router.put("/:id", adminAuth, reasonController.updateReason);
router.patch("/:id/status", adminAuth, reasonController.toggleReasonStatus);
router.delete("/:id", adminAuth, reasonController.deleteReason);

module.exports = router;
