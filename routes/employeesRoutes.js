const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeesController");
const adminAuth = require("../middlewares/adminAuthMiddleware");

// Auth
router.post("/login", employeeController.loginEmployee);

// Admin actions
router.post("/", adminAuth, employeeController.createEmployee);
router.get('/', adminAuth, employeeController.getEmployees);
router.get('/:id', adminAuth, employeeController.getEmployeeById);
router.put('/:id', adminAuth, employeeController.updateEmployee);
router.patch('/:id/status', adminAuth, employeeController.toggleEmployeeStatus);
router.delete('/:id', adminAuth, employeeController.deleteEmployee);

module.exports = router;
