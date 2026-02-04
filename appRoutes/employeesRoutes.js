const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeesController");
const adminManagerEmployeeAuth = require("../middlewares/adminManagerEmployeeAuth");
const roleAuth = require("../middlewares/roleAuth");
const uploadEmployeeAvatar = require("../middlewares/uploadEmployeeAvatarS3");

// ======================
// EMPLOYEE AUTH
// ======================
router.post("/login", employeeController.loginEmployee);

// ======================
// ADMIN ACTIONS
// ======================
router.post(
  "/",
  adminManagerEmployeeAuth,
  roleAuth("admin", "super-admin"),
  employeeController.createEmployee
);
router.get("/", adminManagerEmployeeAuth, employeeController.getEmployees);
router.get("/:id", adminManagerEmployeeAuth, employeeController.getEmployeeById);

/* ======================
   UPDATE EMPLOYEE + AVATAR
====================== */
router.put(
  "/:id",
  adminManagerEmployeeAuth,
  uploadEmployeeAvatar.single("avatar"), // 👈 image field
  employeeController.updateEmployee
);

router.patch("/:id/status", adminManagerEmployeeAuth, employeeController.toggleEmployeeStatus);
router.delete("/:id", adminManagerEmployeeAuth, employeeController.deleteEmployee);

router.put(
  "/:id/assign-property",
  adminManagerEmployeeAuth,
  roleAuth("admin", "super-admin"),
  employeeController.assignEmployeeProperty
);

module.exports = router;
