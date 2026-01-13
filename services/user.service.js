const User = require("../models/user.model");

async function listUsersByCompany(company) {
  return User.find({
    company,
    isDeleted: false,
  })
    .populate({
      path: "subscription",
      select: "startDate endDate status",
      populate: {
        path: "plan",
        select: "name",
      },
    })
    .select("username email status subscription")
    .sort({ createdAt: -1 });
}


module.exports = { listUsersByCompany };
