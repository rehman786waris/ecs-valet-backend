const { body } = require("express-validator");

/* =====================================================
   CREATE USER VALIDATION
===================================================== */
exports.createUserSchema = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required"),

  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("company.companyName")
    .trim()
    .notEmpty()
    .withMessage("Company name is required"),
];

/* =====================================================
   LOGIN VALIDATION
===================================================== */
exports.loginSchema = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

/* =====================================================
   UPDATE USER VALIDATION
===================================================== */
exports.updateUserSchema = [
  body("firstName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("First name cannot be empty"),

  body("lastName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Last name cannot be empty"),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Email must be valid"),

  body("mobile")
    .optional()
    .matches(/^[0-9\-\+\s()]+$/)
    .withMessage("Invalid mobile number"),
];
