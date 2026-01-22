const User = require("../models/userModel");
const Company = require("../models/companyModel");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const { generateToken, generateRefreshToken } = require("../utils/generateToken");
const jwt = require("jsonwebtoken");

/* =====================================================
   CREATE USER + COMPANY
===================================================== */
exports.createUser = async (req, res) => {
  try {
    const { password, company, ...userData } = req.body;

    if (!company?.companyName) {
      return res.status(400).json({ message: "Company details are required" });
    }    

    const newCompany = await Company.create(company);
    const passwordHash = await hashPassword(password);

    const user = await User.create({
      ...userData,
      passwordHash,
      company: newCompany._id,
    });

    res.status(201).json({
      message: "User and Company created successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      company: newCompany,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   LOGIN
===================================================== */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
      isDeleted: false,
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      message: user.isEnabled
        ? "Login successful"
        : "Login allowed but account is disabled",
      disabled: !user.isEnabled,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET ALL USERS (MULTI-TENANT)
===================================================== */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({
      company: req.user.company,
      isDeleted: false,
    })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET SINGLE USER (SAFE)
===================================================== */
exports.getUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   UPDATE USER
===================================================== */
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    /* ======================
       AVATAR UPDATE (S3)
    ====================== */
    if (req.file) {
      user.profileImage = {
        url: req.file.location, // S3 public URL
        key: req.file.key,      // S3 object key
        provider: "s3",
        uploadedAt: new Date(),
      };
    }

    /* ======================
       OTHER UPDATES
    ====================== */
    const blockedFields = ["passwordHash", "company", "profileImage"];
    blockedFields.forEach((f) => delete req.body[f]);

    Object.assign(user, req.body);
    await user.save();

    res.json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =====================================================
   SOFT DELETE USER
===================================================== */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        company: req.user.company,
      },
      { isDeleted: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   ENABLE / DISABLE USER (ADMIN)
===================================================== */
exports.enableUser = async (req, res) => {
  try {
    // 🔐 Super Admin check
    if (req.user.role !== "super-admin") {
      return res.status(403).json({
        message: "Only Super Admin can enable users",
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        company: req.user.company,
        isDeleted: false,
      },
      {
        isEnabled: true,
        $inc: { tokenVersion: 1 },
      },
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User enabled successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.disableUser = async (req, res) => {
  try {
    // 🔐 Super Admin check
    if (req.user.role !== "super-admin") {
      return res.status(403).json({
        message: "Only Super Admin can disable users",
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        company: req.user.company,
        isDeleted: false,
      },
      {
        isEnabled: false,
        $inc: { tokenVersion: 1 },
      },
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User disabled successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =====================================================
   REFRESH TOKEN
===================================================== */
exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ message: "Token expired" });
    }

    res.json({
      accessToken: generateToken(user),
      refreshToken: generateRefreshToken(user),
    });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

/* =====================================================
   FORGOT / RESET PASSWORD
===================================================== */
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
      isDeleted: false,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    user.resetCodeExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    res.json({ message: "Reset code generated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({ email, isDeleted: false });

    if (!user || user.resetCode !== code || user.resetCodeExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.resetCode = null;
    user.resetCodeExpires = null;
    user.tokenVersion++;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   SEARCH USERS
===================================================== */
exports.searchUsers = async (req, res) => {
  try {
    const { query, role } = req.query;

    const filter = {
      company: req.user.company,
      isDeleted: false,
    };

    if (role) filter.role = role;

    if (query) {
      const regex = new RegExp(query, "i");
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { mobile: regex },
        { jobTitle: regex },
      ];
    }

    const users = await User.find(filter).select("-passwordHash");

    res.json({ total: users.length, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
