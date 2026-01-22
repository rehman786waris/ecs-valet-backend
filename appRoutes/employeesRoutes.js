const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeesController");
const adminAuth = require("../middlewares/adminAuthMiddleware");
const uploadEmployeeAvatar = require("../middlewares/uploadEmployeeAvatarS3");

// ======================
// EMPLOYEE AUTH
// ======================
router.post("/login", employeeController.loginEmployee);

// ======================
// ADMIN ACTIONS
// ======================
router.post("/", adminAuth, employeeController.createEmployee);
router.get("/", adminAuth, employeeController.getEmployees);
router.get("/:id", adminAuth, employeeController.getEmployeeById);

/* ======================
   UPDATE EMPLOYEE + AVATAR
====================== */
router.put(
  "/:id",
  adminAuth,
  uploadEmployeeAvatar.single("avatar"), // 👈 image field
  employeeController.updateEmployee
);

router.patch("/:id/status", adminAuth, employeeController.toggleEmployeeStatus);
router.delete("/:id", adminAuth, employeeController.deleteEmployee);

module.exports = router;
