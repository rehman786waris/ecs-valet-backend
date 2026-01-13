const express = require("express");
const router = express.Router();

const propertyManager = require("../controllers/propertyManagerController");
const adminAuth = require("../middlewares/adminAuthMiddleware");

// ---------------- PUBLIC ----------------
router.post("/login", propertyManager.propertyManagerLogin);

// ---------------- ADMIN ----------------
router.post("/create", adminAuth, propertyManager.createPropertyManager);
router.put("/:id/enable", adminAuth, propertyManager.enablePropertyManager);
router.put("/:id/disable", adminAuth, propertyManager.disablePropertyManager);
router.delete("/:id", adminAuth, propertyManager.deletePropertyManager);
router.get("/", adminAuth, propertyManager.getPropertyManagers);
router.get("/:id", adminAuth, propertyManager.getPropertyManager);
router.put("/:id", adminAuth, propertyManager.updatePropertyManager);

module.exports = router;
