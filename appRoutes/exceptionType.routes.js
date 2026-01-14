const express = require("express");
const router = express.Router();
const adminAuth = require("../middlewares/adminAuthMiddleware");
const exceptionTypeController = require("../controllers/exceptionType.controller");


router.post("/types", adminAuth, exceptionTypeController.createExceptionType);
router.get("/types", adminAuth, exceptionTypeController.getExceptionTypes);
router.patch("/types/:id/toggle", adminAuth, exceptionTypeController.toggleExceptionType
);

module.exports = router;
