module.exports = (req, res, next) => {
    if (req.user.role !== "super-admin") {
      return res.status(403).json({
        message: "Access denied. Super Admin only.",
      });
    }
    next();
  };
  