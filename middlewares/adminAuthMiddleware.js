// middlewares/adminAuthMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load the caller (admin) from DB to check tokenVersion and isEnabled
    const caller = await User.findById(decoded.id);
    if (!caller) return res.status(404).json({ message: "User not found" });

    // Caller must be enabled
    if (!caller.isEnabled) {
      return res.status(403).json({ message: "Account is disabled" });
    }

    // Token version must match
    if ((caller.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)) {
      return res.status(401).json({ message: "Session expired. Login again." });
    }

    // Check role
    const allowedRoles = ["admin", "super-admin", "property-manager"]; // adjust as needed
    if (!allowedRoles.includes(caller.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    // attach caller
    req.user = caller;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
