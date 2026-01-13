module.exports = (req, res, next) => {
    if (!req.user?.companyId)
      return res.status(403).json({ message: "No company assigned" });
  
    req.companyId = req.user.companyId;
    next();
  };
  