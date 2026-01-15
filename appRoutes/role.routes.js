const express = require("express");
const router = express.Router();
const roleController = require("../controllers/rolesController");
const adminAuth = require("../middlewares/adminAuthMiddleware");

// Admin only
router.post("/", adminAuth, roleController.createRole);
router.get("/", adminAuth, roleController.getRoles);
router.get("/:id", adminAuth, roleController.getRoleById);
router.put("/:id", adminAuth, roleController.updateRole);
router.patch("/:id/status", adminAuth, roleController.toggleRoleStatus);
router.delete("/:id", adminAuth, roleController.deleteRole);

module.exports = router;
