const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customer.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

/* =====================================================
   CUSTOMER ROUTES
===================================================== */

// Create customer
router.post("/", adminAuth, customerController.createCustomer);

// Get all customers
router.get("/", adminAuth, customerController.getCustomers);

// Get customer by ID
router.get("/:id", adminAuth, customerController.getCustomerById);

// Update customer
router.put("/:id", adminAuth, customerController.updateCustomer);

// Enable / Disable customer
router.patch("/:id/status", adminAuth, customerController.toggleCustomerStatus);

// Soft delete customer
router.delete("/:id", adminAuth, customerController.deleteCustomer);

module.exports = router;
