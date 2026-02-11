const Employee = require("../models/employees/employee.model");
const Role = require("../models/employees/role.model");
const Property = require("../models/properties/property.model");
const mongoose = require("mongoose");


const { generateToken, generateRefreshToken } = require("../utils/generateToken");

const normalizeEmployeeProperties = (payload) => {
  if (Array.isArray(payload.properties)) {
    payload.property = payload.properties[0] || null;
    return;
  }
  if (payload.property) {
    payload.properties = [payload.property];
  }
};

/* ================= PICK EMPLOYEE (SAFE RESPONSE) ================= */
const pickEmployee = (employee) => {
  if (!employee) return null;

  return {
    id: employee._id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    username: employee.username,
    phone: employee.phone,
    profileImage: employee.profileImage || null,
    role: employee.role,
    property: employee.property || employee.properties?.[0] || null,
    properties: employee.properties || (employee.property ? [employee.property] : []),
    reportingManager: employee.reportingManager,
    isActive: employee.isActive,
    lastLogin: employee.lastLogin,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
};

/* ================= CREATE EMPLOYEE (ADMIN) ================= */
exports.createEmployee = async (req, res) => {
  try {
    const { password, ...data } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (!data.username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const exists = await Employee.findOne({
      email: data.email.toLowerCase(),
      isDeleted: false,
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const usernameExists = await Employee.findOne({
      username: data.username.toLowerCase(),
      isDeleted: false,
    });

    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    const createdByType =
      req.userType === "PROPERTY_MANAGER"
        ? "PropertyManager"
        : req.userType === "EMPLOYEE"
          ? "Employee"
          : "User";
    const currentUserId = req.user?._id || req.user?.id;

    const employee = new Employee({
      ...data,
      email: data.email.toLowerCase(),
      username: data.username.toLowerCase(),
      passwordHash: password, // hashed via schema middleware
      createdBy: { id: currentUserId, type: createdByType },
    });
    normalizeEmployeeProperties(employee);

    await employee.save();

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: pickEmployee(employee),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ================= LOGIN EMPLOYEE ================= */
exports.loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    const employee = await Employee.findOne({
      email: email.toLowerCase(),
      isActive: true,
      isDeleted: false,
    }).select("+passwordHash");

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    employee.lastLogin = new Date();
    await employee.save();

    const payload = {
      id: employee._id,
      type: "EMPLOYEE",
      tokenVersion: employee.tokenVersion,
    };

    res.json({
      success: true,
      message: "Login successful",
      data: {
        employee: pickEmployee(employee),
        accessToken: generateToken(payload),
        refreshToken: generateRefreshToken(payload),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ================= GET ALL EMPLOYEES (ADMIN) ================= */
exports.getEmployees = async (req, res) => {
  const employees = await Employee.find({ isDeleted: false })
    .populate("property", "name")
    .populate("properties", "name")
    .populate("role", "displayName")
    .populate("reportingManager", "firstName lastName")
    .select("-passwordHash")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: employees.map(pickEmployee),
  });
};

/* ================= GET SINGLE EMPLOYEE ================= */
exports.getEmployeeById = async (req, res) => {
  const employee = await Employee.findOne({
    _id: req.params.id,
    isDeleted: false,
  })
    .populate("property")
    .populate("properties")
    .populate("role")
    .populate("reportingManager")
    .select("-passwordHash");

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found",
    });
  }

  res.json({
    success: true,
    data: pickEmployee(employee),
  });
};

/* ================= UPDATE EMPLOYEE ================= */
exports.updateEmployee = async (req, res) => {
  try {
    req.body = req.body || {}; // ✅ FIX

    const employee = await Employee.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).select("+passwordHash");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    /* ======================
       ROLE HANDLING (SAFE)
    ====================== */
    if (req.body.role) {
      if (mongoose.Types.ObjectId.isValid(req.body.role)) {
        const roleExists = await Role.exists({
          _id: req.body.role,
          isActive: true,
        });

        if (!roleExists) {
          return res.status(400).json({
            success: false,
            message: "Invalid role",
          });
        }

        req.body.role = roleExists._id;
      } else {
        const roleDoc = await Role.findOne({
          $or: [
            { slug: req.body.role.toLowerCase() },
            { displayName: req.body.role },
          ],
          isActive: true,
        });

        if (!roleDoc) {
          return res.status(400).json({
            success: false,
            message: "Invalid role",
          });
        }

        req.body.role = roleDoc._id;
      }
    }

    /* ======================
       USERNAME UNIQUENESS
    ====================== */
    if (req.body.username) {
      const usernameExists = await Employee.findOne({
        _id: { $ne: employee._id },
        username: req.body.username.toLowerCase(),
        isDeleted: false,
      });

      if (usernameExists) {
        return res.status(409).json({
          success: false,
          message: "Username already exists",
        });
      }

      req.body.username = req.body.username.toLowerCase();
    }

    /* ======================
       PROFILE IMAGE UPDATE
    ====================== */
    if (req.file) {
      employee.profileImage = {
        url: req.file.location,
        key: req.file.key,
        provider: "s3",
        uploadedAt: new Date(),
      };
    }

    /* ======================
       APPLY OTHER UPDATES
    ====================== */
    const blockedFields = ["passwordHash", "profileImage"];
    blockedFields.forEach((f) => delete req.body[f]);

    if (req.body.reportingManager) {
      const type = req.body.reportingManagerType || "Employee";
      const modelByType = {
        Employee,
        PropertyManager: require("../models/propertyManagerModel"),
        User: require("../models/userModel"),
      };
      const ManagerModel = modelByType[type];

      if (!ManagerModel) {
        return res.status(400).json({
          success: false,
          message: "Invalid reportingManagerType",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(req.body.reportingManager)) {
        return res.status(400).json({
          success: false,
          message: "Invalid reportingManager",
        });
      }

      const managerExists = await ManagerModel.exists({
        _id: req.body.reportingManager,
      });

      if (!managerExists) {
        return res.status(404).json({
          success: false,
          message: "Reporting manager not found",
        });
      }

      req.body.reportingManagerType = type;
    }

    Object.assign(employee, req.body);
    normalizeEmployeeProperties(employee);

    if (req.body.password) {
      employee.passwordHash = req.body.password;
    }

    await employee.save();

    res.json({
      success: true,
      message: "Employee updated successfully",
      data: pickEmployee(employee),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/* ================= ENABLE / DISABLE EMPLOYEE ================= */
exports.toggleEmployeeStatus = async (req, res) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee || employee.isDeleted) {
    return res.status(404).json({
      success: false,
      message: "Employee not found",
    });
  }

  employee.isActive = !employee.isActive;
  employee.tokenVersion += 1;
  await employee.save();

  res.json({
    success: true,
    message: `Employee ${employee.isActive ? "enabled" : "disabled"} successfully`,
  });
};

/* ================= SOFT DELETE EMPLOYEE ================= */
exports.deleteEmployee = async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
      isActive: false,
      tokenVersion: 999,
    },
    { new: true }
  );

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found",
    });
  }

  res.json({
    success: true,
    message: "Employee deleted successfully",
  });
};

/* ================= ASSIGN PROPERTIES (ADMIN) ================= */
exports.assignEmployeeProperty = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.propertyIds)
      ? req.body.propertyIds
      : req.body.propertyId
        ? [req.body.propertyId]
        : [];
    if (!ids.length) {
      return res.status(400).json({ message: "propertyIds are required" });
    }
    const uniqueIds = [...new Set(ids.map(String))];

    const propertyCount = await Property.countDocuments({
      _id: { $in: uniqueIds },
      isDeleted: false,
    });
    if (propertyCount !== uniqueIds.length) {
      return res.status(404).json({ message: "Invalid property selection" });
    }

    const employee = await Employee.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.properties = uniqueIds;
    employee.property = uniqueIds[0] || null;
    await employee.save();

    return res.json({
      message: "Employee properties assigned successfully",
      data: {
        id: employee._id,
        property: employee.property,
        properties: employee.properties,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
