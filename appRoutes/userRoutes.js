const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

const auth = require("../middlewares/authMiddleware");
const adminAuth = require("../middlewares/adminAuthMiddleware");
const superAdminAuth = require("../middlewares/superAdminAuth");
const uploadUserAvatar = require("../middlewares/uploadUserAvatarS3");

const { validate } = require("../middlewares/validateRequest");
const {
  createUserSchema,
  loginSchema,
  updateUserSchema,
} = require("../middlewares/user.validation");



// =====================================================
// PUBLIC ROUTES
// =====================================================

// Create user + company
router.post(
  "/",
  validate(createUserSchema),
  userController.createUser
);

// Login
router.post(
  "/login",
  validate(loginSchema),
  userController.login
);

// Refresh token
router.post("/refresh", userController.refreshToken);

// Forgot / Reset password
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);


// =====================================================
// PROTECTED ROUTES (AUTH REQUIRED)
// =====================================================

// Get all users (multi-tenant)
router.get("/", auth, userController.getUsers);

// Search users
router.get("/search", auth, userController.searchUsers);

// Get single user
router.get("/:id", auth, userController.getUser);

// Update user (with avatar upload)
router.put(
  "/:id",
  auth,
  uploadUserAvatar.single("avatar"),
  validate(updateUserSchema),
  userController.updateUser
);

// Soft delete user
router.delete("/:id", auth, userController.deleteUser);


// =====================================================
// ADMIN / SUPER ADMIN ACTIONS
// =====================================================

// Enable user
router.put(
  "/:id/enable",
  auth,
  adminAuth,
  superAdminAuth,
  userController.enableUser
);

// Disable user
router.put(
  "/:id/disable",
  auth,
  adminAuth,
  superAdminAuth,
  userController.disableUser
);

module.exports = router;
