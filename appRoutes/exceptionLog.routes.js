const express = require("express");
const router = express.Router();
const adminAuth = require("../middlewares/adminAuthMiddleware");
const exceptionLogController = require("../controllers/exceptionLog.controller");

router.post("/logs", adminAuth, adminAuth, exceptionLogController.createExceptionLog);
router.get("/logs", adminAuth, exceptionLogController.getExceptionLogs);
router.patch("/logs/:id/resolve", adminAuth, exceptionLogController.resolveException);

module.exports = router;
