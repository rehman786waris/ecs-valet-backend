// services/violation.analytics.js
const Violation = require("../models/violations/violation.model");

async function getTopViolators(limit = 5) {
  return Violation.aggregate([
    {
      $group: {
        _id: {
          user: "$user",
          unitNumber: "$unitNumber",
        },
        totalViolations: { $sum: 1 },
      },
    },
    { $sort: { totalViolations: -1 } },
    { $limit: limit },
  ]);
}

module.exports = { getTopViolators };
