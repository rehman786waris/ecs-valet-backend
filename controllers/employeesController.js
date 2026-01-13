const Employee = require("../models/employees/employee.model");
const { generateToken, generateRefreshToken } = require("../utils/generateToken");

/* ================= CREATE EMPLOYEE ================= */
exports.createEmployee = async (req, res) => {
  try {
    const { password, ...data } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const exists = await Employee.findOne({
      email: data.email.toLowerCase(),
      isDeleted: false,
    });

    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const employee = new Employee({
      ...data,
      email: data.email.toLowerCase(),
      passwordHash: password,
      createdBy: req.user.id,
    });

    await employee.save();

    res.status(201).json({
      message: "Employee created successfully",
      employee: {
        id: employee._id,
        email: employee.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    employee.lastLogin = new Date();
    await employee.save();

    const payload = {
      id: employee._id,
      role: "EMPLOYEE",
      tokenVersion: employee.tokenVersion,
    };

    res.json({
      message: "Login successful",
      accessToken: generateToken(payload),
      refreshToken: generateRefreshToken(payload),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   GET ALL EMPLOYEES (ADMIN)
===================================================== */
exports.getEmployees = async (req, res) => {
  const employees = await Employee.find({ isDeleted: false })
    .populate("property", "name")
    .populate("reportingManager", "firstName lastName")
    .select("-passwordHash")
    .sort({ createdAt: -1 });

  res.json(employees);
};

/* =====================================================
   GET SINGLE EMPLOYEE
===================================================== */
exports.getEmployeeById = async (req, res) => {
  const employee = await Employee.findOne({
    _id: req.params.id,
    isDeleted: false,
  })
    .populate("property")
    .populate("reportingManager")
    .select("-passwordHash");

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json(employee);
};

/* =====================================================
   UPDATE EMPLOYEE
===================================================== */
exports.updateEmployee = async (req, res) => {
  const employee = await Employee.findOne({
    _id: req.params.id,
    isDeleted: false,
  }).select("+passwordHash");

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  Object.assign(employee, req.body);

  // 🔐 Hash password safely
  if (req.body.password) {
    employee.passwordHash = req.body.password;
  }

  await employee.save(); // ✅ pre-save runs

  res.json({ message: "Employee updated", employee });
};


/* =====================================================
   ENABLE / DISABLE EMPLOYEE
===================================================== */
exports.toggleEmployeeStatus = async (req, res) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee || employee.isDeleted) {
    return res.status(404).json({ message: "Employee not found" });
  }

  employee.isActive = !employee.isActive;
  employee.tokenVersion += 1;
  await employee.save();

  res.json({
    message: `Employee ${employee.isActive ? "enabled" : "disabled"} successfully`,
  });
};

/* =====================================================
   SOFT DELETE EMPLOYEE
===================================================== */
exports.deleteEmployee = async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true, isActive: false, tokenVersion: 999 },
    { new: true }
  );

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json({ message: "Employee deleted successfully" });
};
