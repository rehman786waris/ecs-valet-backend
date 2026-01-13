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

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // BLOCK disabled users from all protected endpoints
    if (!user.isEnabled) {
      return res.status(403).json({ message: "Account is disabled" });
    }

    // Token version mismatch → force logout
    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ message: "Session expired. Login again." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
