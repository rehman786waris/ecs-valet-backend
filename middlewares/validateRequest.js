const { validationResult } = require("express-validator");

exports.validate = (schema) => {
  return async (req, res, next) => {
    await Promise.all(schema.map((v) => v.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    next();
  };
};
