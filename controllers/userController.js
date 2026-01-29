const User = require("../models/userModel");
const Company = require("../models/companyModel");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const { generateToken, generateRefreshToken } = require("../utils/generateToken");
const jwt = require("jsonwebtoken");

const Subscription = require("../models/plans/subscription.model");
const Plan = require("../models/plans/plan.model");

async function createTrialSubscription(companyId) {
  const trialPlan = await Plan.findOne({
    isActive: true,
    "trial.isAvailable": true,
  });

  if (!trialPlan) return null;

  const now = new Date();
  const trialEndsAt = new Date(
    now.getTime() + trialPlan.trial.durationDays * 86400000
  );

  return await Subscription.create({
    company: companyId,
    plan: trialPlan._id,
    status: "Trial",
    startDate: now,
    trialEndsAt,
  });
}


/* =====================================================
   CREATE USER + COMPANY
===================================================== */
exports.createUser = async (req, res) => {
  try {
    const { password, company, ...userData } = req.body;

    if (!company?.companyName) {
      return res.status(400).json({ message: "Company details are required" });
    }

    // 1️⃣ Find or create company
    let existingCompany = await Company.findOne({
      companyName: company.companyName.trim(),
    });

    let subscription = null;
    let isNewCompany = false;

    if (!existingCompany) {
      existingCompany = await Company.create(company);
      isNewCompany = true;

      // ✅ Create trial subscription
      subscription = await createTrialSubscription(existingCompany._id);
    } else {
      subscription = await Subscription.findOne({
        company: existingCompany._id,
      });
    }

    // 2️⃣ Check duplicate email
    const emailExists = await User.findOne({
      email: userData.email,
      company: existingCompany._id,
      isDeleted: false,
    });

    if (emailExists) {
      return res.status(409).json({
        message: "Email already exists in this company",
      });
    }

    // 3️⃣ Check duplicate username
    const usernameExists = await User.findOne({
      username: userData.username,
      company: existingCompany._id,
      isDeleted: false,
    });

    if (usernameExists) {
      return res.status(409).json({
        message: "Username already exists in this company",
      });
    }

    // 4️⃣ Create user
    const passwordHash = await hashPassword(password);

    const user = await User.create({
      ...userData,
      passwordHash,
      company: existingCompany._id,
      subscription: subscription?._id || null,
    });

    // 5️⃣ Populate subscription for response
    const populatedSubscription = subscription
      ? await Subscription.findById(subscription._id)
        .populate("plan", "name pricing features")
      : null;

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      company: existingCompany,
      subscription: populatedSubscription,
      mode: isNewCompany ? "Trial started" : "Existing company",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate email or username",
      });
    }
    res.status(500).json({ message: error.message });
  }
};


/* =====================================================
   LOGIN
===================================================== */
exports.login = async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
      isDeleted: false,
    })
      .select("+passwordHash")
      .populate("subscription");

    if (!user || !user.isEnabled) {
      return res.status(401).json({ message: "Account disabled or invalid" });
    }

    const isMatch = await comparePassword(req.body.password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const subscription = user.subscription
      ? await Subscription.findById(user.subscription)
        .populate("plan", "name pricing features")
      : null;

    res.json({
      accessToken: generateToken(user),
      refreshToken: generateRefreshToken(user),
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      subscription,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* =====================================================
   GET ALL USERS (MULTI-TENANT)
===================================================== */
exports.getUsers = async (req, res) => {
  try {
    const filter = { isDeleted: false };

    if (req.user.role !== "super-admin") {
      filter.company = req.user.company;
    }

    const users = await User.find(filter)
      .populate("company", "companyName")
      .populate("subscription")
      .select("-passwordHash -resetCode")
      .sort({ createdAt: -1 });

    res.json({
      total: users.length,
      data: users,
    });
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
    })
      .select("-passwordHash -resetCode")
      .populate("subscription");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const subscription = user.subscription
      ? await Subscription.findById(user.subscription)
        .populate("plan", "name pricing features")
      : null;

    res.json({
      ...user.toObject(),
      subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




/* =====================================================
   UPDATE USER
===================================================== */
exports.updateUser = async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    company: req.user.company,
    isDeleted: false,
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Block dangerous fields
  const forbidden = [
    "passwordHash",
    "company",
    "tokenVersion",
    "resetCode",
  ];
  forbidden.forEach((f) => delete req.body[f]);

  if (req.file) {
    user.profileImage = {
      url: req.file.location,
      key: req.file.key,
      provider: "s3",
      uploadedAt: new Date(),
    };
  }

  Object.assign(user, req.body);
  await user.save();

  res.json({
    message: "User updated successfully",
    user,
  });
};



/* =====================================================
   SOFT DELETE USER
===================================================== */
exports.deleteUser = async (req, res) => {
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, company: req.user.company },
    { isDeleted: true },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ message: "User deleted successfully" });
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

/* =====================================================
   CHANGE PASSWORD (AUTH REQUIRED)
===================================================== */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    // 1️⃣ Load user with password
    const user = await User.findOne({
      _id: req.user.id,
      isDeleted: false,
    }).select("+passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2️⃣ Verify current password
    const isMatch = await comparePassword(
      currentPassword,
      user.passwordHash
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    // 3️⃣ Prevent reusing same password
    const isSame = await comparePassword(
      newPassword,
      user.passwordHash
    );

    if (isSame) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    // 4️⃣ Hash & update password
    user.passwordHash = await hashPassword(newPassword);

    // 5️⃣ Invalidate old tokens
    user.tokenVersion += 1;

    await user.save();

    res.json({
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

