const PropertyManager = require("../models/propertyManagerModel");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const { generateToken, generateRefreshToken } = require("../utils/generateToken");

/* =====================================================
   CREATE PROPERTY MANAGER (ADMIN)
===================================================== */
exports.createPropertyManager = async (req, res) => {
  try {
    const { password, ...data } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const passwordHash = await hashPassword(password);

    const manager = await PropertyManager.create({
      ...data,
      email: data.email.toLowerCase(),
      passwordHash,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Property Manager created successfully",
      data: {
        id: manager._id,
        name: manager.fullName,
        email: manager.email,
        role: manager.role,
        isEnabled: manager.isEnabled,
        permissions: manager.permissions,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   PROPERTY MANAGER LOGIN
===================================================== */
exports.propertyManagerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const manager = await PropertyManager.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    }).select("+passwordHash");

    if (!manager || !manager.isEnabled) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await comparePassword(password, manager.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    manager.lastLogin = new Date();
    await manager.save();

    const payload = {
      id: manager._id,
      role: manager.role,
      tokenVersion: manager.tokenVersion,
    };

    res.json({
      accessToken: generateToken(payload),
      refreshToken: generateRefreshToken(payload),
      user: {
        id: manager._id,
        name: manager.fullName,
        email: manager.email,
        role: manager.role,
        permissions: manager.permissions,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   ENABLE / DISABLE (ADMIN)
===================================================== */
exports.enablePropertyManager = async (req, res) => {
  const manager = await PropertyManager.findByIdAndUpdate(
    req.params.id,
    { isEnabled: true, $inc: { tokenVersion: 1 } },
    { new: true }
  );

  if (!manager)
    return res.status(404).json({ message: "Property Manager not found" });

  res.json({ message: "Property Manager enabled" });
};

exports.disablePropertyManager = async (req, res) => {
  const manager = await PropertyManager.findByIdAndUpdate(
    req.params.id,
    { isEnabled: false, $inc: { tokenVersion: 1 } },
    { new: true }
  );

  if (!manager)
    return res.status(404).json({ message: "Property Manager not found" });

  res.json({ message: "Property Manager disabled" });
};

/* =====================================================
   GET LIST (ADMIN)
===================================================== */
exports.getPropertyManagers = async (req, res) => {
  const managers = await PropertyManager.find({ isDeleted: false })
    .select("-passwordHash")
    .sort({ createdAt: -1 });

  res.json(managers);
};

/* =====================================================
   GET SINGLE (ADMIN)
===================================================== */
exports.getPropertyManager = async (req, res) => {
  const manager = await PropertyManager.findOne({
    _id: req.params.id,
    isDeleted: false,
  }).select("-passwordHash");

  if (!manager)
    return res.status(404).json({ message: "Property Manager not found" });

  res.json(manager);
};

/* =====================================================
   UPDATE (ADMIN)
===================================================== */
exports.updatePropertyManager = async (req, res) => {
  const manager = await PropertyManager.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    req.body,
    { new: true }
  ).select("-passwordHash");

  if (!manager)
    return res.status(404).json({ message: "Property Manager not found" });

  res.json(manager);
};

/* =====================================================
   SOFT DELETE (ADMIN)
===================================================== */
exports.deletePropertyManager = async (req, res) => {
  const manager = await PropertyManager.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true, $inc: { tokenVersion: 1 } },
    { new: true }
  );

  if (!manager)
    return res.status(404).json({ message: "Property Manager not found" });

  res.json({ message: "Property Manager deleted successfully" });
};
