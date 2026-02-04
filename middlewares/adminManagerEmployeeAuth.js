const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const PropertyManager = require("../models/propertyManagerModel");
const Employee = require("../models/employees/employee.model");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Admin / Super Admin
    const admin = await User.findById(decoded.id);
    if (admin) {
      if (!admin.isEnabled) {
        return res.status(403).json({ message: "Account is disabled" });
      }
      if ((admin.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)) {
        return res
          .status(401)
          .json({ message: "Session expired. Login again." });
      }
      if (!["admin", "super-admin"].includes(admin.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      req.user = admin;
      req.userType = "USER";
      return next();
    }

    // Property Manager
    const manager = await PropertyManager.findById(decoded.id);
    if (manager) {
      if (!manager.isEnabled) {
        return res.status(403).json({ message: "Account is disabled" });
      }
      if ((manager.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)) {
        return res
          .status(401)
          .json({ message: "Session expired. Login again." });
      }
      req.user = manager;
      req.userType = "PROPERTY_MANAGER";
      return next();
    }

    // Employee
    const employee = await Employee.findById(decoded.id);
    if (!employee || employee.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!employee.isActive) {
      return res.status(403).json({ message: "Account is disabled" });
    }
    if ((employee.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)) {
      return res
        .status(401)
        .json({ message: "Session expired. Login again." });
    }
    req.user = employee;
    req.userType = "EMPLOYEE";
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
