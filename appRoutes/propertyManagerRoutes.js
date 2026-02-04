const express = require("express");
const router = express.Router();

const propertyManager = require("../controllers/propertyManagerController");
const adminManagerEmployeeAuth = require("../middlewares/adminManagerEmployeeAuth");
const roleAuth = require("../middlewares/roleAuth");
const uploadPropertyManagerAvatar = require("../middlewares/uploadPropertyManagerAvatarS3");
const dashboardController = require("../controllers/propertyManagerDashboard.controller");

// ---------------- PUBLIC ----------------
router.post("/login", propertyManager.propertyManagerLogin);

// ---------------- DASHBOARD (PM + ADMIN) ----------------
router.get(
  "/dashboard",
  adminManagerEmployeeAuth,
  roleAuth("PROPERTY_MANAGER", "admin", "super-admin"),
  dashboardController.getDashboard
);
router.post(
  "/dashboard",
  adminManagerEmployeeAuth,
  roleAuth("PROPERTY_MANAGER", "admin", "super-admin"),
  dashboardController.getDashboard
);

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

router.put(
  "/:id/assign-properties",
  adminManagerEmployeeAuth,
  roleAuth("admin", "super-admin"),
  propertyManager.assignProperties
);

module.exports = router;
