const express = require("express");
const router = express.Router();
const user = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");
const superAdminAuth = require("../middlewares/superAdminAuth");
const adminAuth = require("../middlewares/adminAuthMiddleware");


// ---------------------- PUBLIC ROUTES ----------------------
router.post("/create", user.createUser);
router.post("/login", user.login);
router.post("/refresh", user.refreshToken);
router.post("/forgot-password", user.forgotPassword);
router.post("/reset-password", user.resetPassword);


// ---------------------- ENABLE / DISABLE MUST COME FIRST ----------------------
router.put("/:id/enable", adminAuth,superAdminAuth, user.enableUser);
router.put("/:id/disable", adminAuth,superAdminAuth, user.disableUser);

// ---------------------- PROTECTED ROUTES ----------------------
router.get("/search", auth, user.searchUsers);
router.get("/", auth, user.getUsers);
router.get("/:id", auth, user.getUser);
router.put("/:id", auth, user.updateUser);
router.delete("/:id", auth, user.deleteUser);


module.exports = router;
