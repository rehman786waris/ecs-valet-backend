const Customer = require("../models/customer.model");

/* =====================================================
   CREATE CUSTOMER
===================================================== */
exports.createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);

    return res.status(201).json({
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create customer",
      error: error.message,
    });
  }
};

/* =====================================================
   GET ALL CUSTOMERS
===================================================== */
exports.getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ],
    };

    const customers = await Customer.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments(query);

    return res.status(200).json({
      total,
      page: Number(page),
      limit: Number(limit),
      data: customers,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
};

/* =====================================================
   GET CUSTOMER BY ID
===================================================== */
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json(customer);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch customer",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE CUSTOMER
===================================================== */
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update customer",
      error: error.message,
    });
  }
};

/* =====================================================
   ENABLE / DISABLE CUSTOMER
===================================================== */
exports.toggleCustomerStatus = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.isActive = !customer.isActive;
    await customer.save();

    return res.status(200).json({
      message: `Customer ${customer.isActive ? "enabled" : "disabled"} successfully`,
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update customer status",
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE CUSTOMER (SOFT DELETE)
===================================================== */
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete customer",
      error: error.message,
    });
  }
};
