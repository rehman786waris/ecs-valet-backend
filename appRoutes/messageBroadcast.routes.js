const express = require("express");
const router = express.Router();

const controller = require("../controllers/messageBroadcast.controller");
const adminManagerEmployeeAuth = require("../middlewares/adminManagerEmployeeAuth");

// Message Broadcasts
router.post("/", adminManagerEmployeeAuth, controller.createMessageBroadcast);
router.get("/", adminManagerEmployeeAuth, controller.getMessageBroadcasts);

module.exports = router;
