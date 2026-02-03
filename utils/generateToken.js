const jwt = require("jsonwebtoken");

exports.generateToken = (user) => {
  const id = user?._id ?? user?.id;
  const tokenVersion = user?.tokenVersion ?? 0;
  return jwt.sign(
    { id, tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

exports.generateRefreshToken = (user) => {
  const id = user?._id ?? user?.id;
  const tokenVersion = user?.tokenVersion ?? 0;
  return jwt.sign(
    { id, tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};
