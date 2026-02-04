const express = require("express");
const router = express.Router();

const propertyManager = require("../controllers/propertyManagerController");
const adminManagerEmployeeAuth = require("../middlewares/adminManagerEmployeeAuth");
const roleAuth = require("../middlewares/roleAuth");
const uploadPropertyManagerAvatar = require("../middlewares/uploadPropertyManagerAvatarS3");

// ---------------- PUBLIC ----------------
router.post("/login", propertyManager.propertyManagerLogin);

// ---------------- ADMIN ----------------
router.post(
  "/create",
  adminManagerEmployeeAuth,
  roleAuth("admin", "super-admin"),
  propertyManager.createPropertyManager
);
router.put("/:id/enable", adminManagerEmployeeAuth, propertyManager.enablePropertyManager);
router.put("/:id/disable", adminManagerEmployeeAuth, propertyManager.disablePropertyManager);
router.delete("/:id", adminManagerEmployeeAuth, propertyManager.deletePropertyManager);
router.get("/", adminManagerEmployeeAuth, propertyManager.getPropertyManagers);
router.get("/:id", adminManagerEmployeeAuth, propertyManager.getPropertyManager);

/* ======================
   UPDATE PROPERTY MANAGER + AVATAR
====================== */
router.put(
  "/:id",
  adminManagerEmployeeAuth,
  uploadPropertyManagerAvatar.single("avatar"), // 👈 image field
  propertyManager.updatePropertyManager // ✅ FIXED
);

module.exports = router;
