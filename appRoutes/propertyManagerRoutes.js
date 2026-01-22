const express = require("express");
const router = express.Router();

const propertyManager = require("../controllers/propertyManagerController");
const adminAuth = require("../middlewares/adminAuthMiddleware");
const uploadPropertyManagerAvatar = require("../middlewares/uploadPropertyManagerAvatarS3");

// ---------------- PUBLIC ----------------
router.post("/login", propertyManager.propertyManagerLogin);

// ---------------- ADMIN ----------------
router.post("/create", adminAuth, propertyManager.createPropertyManager);
router.put("/:id/enable", adminAuth, propertyManager.enablePropertyManager);
router.put("/:id/disable", adminAuth, propertyManager.disablePropertyManager);
router.delete("/:id", adminAuth, propertyManager.deletePropertyManager);
router.get("/", adminAuth, propertyManager.getPropertyManagers);
router.get("/:id", adminAuth, propertyManager.getPropertyManager);

/* ======================
   UPDATE PROPERTY MANAGER + AVATAR
====================== */
router.put(
  "/:id",
  adminAuth,
  uploadPropertyManagerAvatar.single("avatar"), // 👈 image field
  propertyManager.updatePropertyManager // ✅ FIXED
);

module.exports = router;
