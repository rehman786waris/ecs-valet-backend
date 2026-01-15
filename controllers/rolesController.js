const Role = require("../models/employees/role.model");

/* ================= CREATE ROLE (ADMIN) ================= */
exports.createRole = async (req, res) => {
  try {
    const { displayName, description, permissions, isSystemRole } = req.body;

    if (!displayName) {
      return res.status(400).json({ message: "Display name is required" });
    }

    const slug = displayName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_");

    const exists = await Role.findOne({ slug });
    if (exists) {
      return res.status(409).json({ message: "Role already exists" });
    }

    const role = new Role({
      displayName,
      slug,
      description,
      permissions,
      isSystemRole: isSystemRole || false,
      createdBy: req.user.id, // Admin (User)
    });

    await role.save();

    res.status(201).json({
      message: "Role created successfully",
      role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET ALL ROLES ================= */
exports.getRoles = async (req, res) => {
  const roles = await Role.find({ isActive: true })
    .sort({ createdAt: -1 });

  res.json(roles);
};

/* ================= GET SINGLE ROLE ================= */
exports.getRoleById = async (req, res) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return res.status(404).json({ message: "Role not found" });
  }

  res.json(role);
};

/* ================= UPDATE ROLE ================= */
exports.updateRole = async (req, res) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return res.status(404).json({ message: "Role not found" });
  }

  if (role.isSystemRole) {
    return res.status(403).json({
      message: "System roles cannot be modified",
    });
  }

  Object.assign(role, req.body);
  role.updatedBy = req.user.id;

  await role.save();

  res.json({
    message: "Role updated successfully",
    role,
  });
};

/* ================= ENABLE / DISABLE ROLE ================= */
exports.toggleRoleStatus = async (req, res) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return res.status(404).json({ message: "Role not found" });
  }

  if (role.isSystemRole) {
    return res.status(403).json({
      message: "System roles cannot be disabled",
    });
  }

  role.isActive = !role.isActive;
  role.updatedBy = req.user.id;

  await role.save();

  res.json({
    message: `Role ${role.isActive ? "enabled" : "disabled"} successfully`,
  });
};

/* ================= DELETE ROLE (SOFT) ================= */
exports.deleteRole = async (req, res) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return res.status(404).json({ message: "Role not found" });
  }

  if (role.isSystemRole) {
    return res.status(403).json({
      message: "System roles cannot be deleted",
    });
  }

  role.isActive = false;
  role.updatedBy = req.user.id;

  await role.save();

  res.json({ message: "Role deleted successfully" });
};
