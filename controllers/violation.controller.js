const mongoose = require("mongoose");
const Violation = require("../models/violations/violation.model");
const TopViolator = require("../models/violations/topViolator.model");
const Property = require("../models/properties/property.model");

const User = require("../models/userModel");


/* =====================================================
   CREATE VIOLATION (MANUAL / SCAN)
===================================================== */
exports.createViolation = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const {
      property,
      user,
      rule,
      action,
      unitNumber,
      building,
      floor,
      notes,
      select,
      selectAll,
      source = "Manual",
      binTagId,
    } = req.body;

    if (!property || !user || !rule) {
      return res.status(400).json({
        message: "Property, user, and rule are required",
      });
    }

    if (source === "Scan" && !binTagId) {
      return res.status(400).json({
        message: "Bin Tag ID is required for scan violations",
      });
    }

    // ✅ Map uploaded images
    const images = (req.files || []).map(file => ({
      url: file.location,
      key: file.key,
    }));

    const violation = await Violation.create({
      company: req.user.company,
      property,
      user,
      rule,
      action: action || null,
      unitNumber,
      building,
      floor,
      notes,
      select: typeof select === "boolean" ? select : undefined,
      selectAll: typeof selectAll === "boolean" ? selectAll : undefined,
      source,
      binTagId,
      images,
      createdBy: currentUserId,
      submittedFromMobile: source === "Scan",
    });

    res.status(201).json({
      message: "Violation created successfully",
      data: violation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   GET ALL VIOLATIONS (ADMIN)
===================================================== */

exports.getViolations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      property,
      rule,
      action,
      search,
      user,
    } = req.query;

    const query = {
      isDeleted: false,
    };

    if (req.user?.company) {
      query.company = req.user.company;
    }

    // ================= PROPERTY ACCESS CONTROL =================
    if (req.userType === "PROPERTY_MANAGER") {
      const allowedProperties = (req.user.properties || []).map((id) => String(id));
      if (allowedProperties.length === 0) {
        return res.status(403).json({ message: "No properties assigned" });
      }
      if (property && !allowedProperties.includes(String(property))) {
        return res.status(403).json({ message: "Access denied" });
      }
      query.property = property || { $in: allowedProperties };
    }

    if (req.userType === "EMPLOYEE") {
      const employeeProperties =
        Array.isArray(req.user.properties) && req.user.properties.length
          ? req.user.properties.map((id) => String(id))
          : req.user.property
            ? [String(req.user.property)]
            : [];
      if (!employeeProperties.length) {
        return res.status(403).json({ message: "No property assigned" });
      }
      if (property && !employeeProperties.includes(String(property))) {
        return res.status(403).json({ message: "Access denied" });
      }
      query.property = property || { $in: employeeProperties };
    }

    if (status) query.status = status;
    if (property && !query.property) query.property = property;
    if (rule) query.rule = rule;
    if (action) query.action = action;

    // ================= SEARCH (BIN / UNIT) =================
    if (search) {
      query.$or = [
        { unitNumber: { $regex: search, $options: "i" } },
        { binTagId: { $regex: search, $options: "i" } },
      ];
    }

    // ================= USER NAME SEARCH =================
    if (user) {
      const nameParts = user.trim().split(/\s+/);

      const users = await User.find({
        $or: [
          { firstName: { $regex: nameParts[0], $options: "i" } },
          {
            lastName: {
              $regex: nameParts[nameParts.length - 1],
              $options: "i",
            },
          },
        ],
      }).select("_id");

      query.user = { $in: users.map((u) => u._id) };
    }

    const violations = await Violation.find(query)
      .select("+images")
      .populate("company", "companyName") // ✅ ADDED
      .populate("user", "firstName lastName")
      .populate("property", "name address")
      .populate("rule", "name")
      .populate("action", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Violation.countDocuments(query);

    res.json({
      data: violations,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


///---

/* =====================================================
   GET SINGLE VIOLATION
===================================================== */
exports.getViolationById = async (req, res) => {
  try {
    const violation = await Violation.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    })
      .select("+images")
      .populate("user")
      .populate("property")
      .populate("rule")
      .populate("action")
      .populate("createdBy", "firstName lastName");

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    res.json({ data: violation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   UPDATE VIOLATION (DETAILS ONLY)
===================================================== */
exports.updateViolation = async (req, res) => {
  try {
    const violation = await Violation.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (violation.status === "Closed") {
      return res.status(400).json({
        message: "Closed violations cannot be modified",
      });
    }

    const allowedFields = [
      "rule",
      "action",
      "unitNumber",
      "building",
      "floor",
      "notes",
      "select",
      "selectAll",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        violation[field] = req.body[field];
      }
    });

    // ✅ If new images uploaded → replace old images
    if (req.files && req.files.length > 0) {
      violation.images = req.files.map((file) => ({
        url: file.location,
        key: file.key,
      }));
    }

    await violation.save();

    res.json({
      message: "Violation updated successfully",
      data: violation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   UPDATE STATUS (WORKFLOW SAFE)
===================================================== */
exports.updateViolationStatus = async (req, res) => {
  try {
    const { status, action } = req.body;

    if (!["New", "Submitted", "Pending", "Closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const violation = await Violation.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (status === "Submitted" && !violation.action && !action) {
      return res.status(400).json({
        message: "Action is required when submitting a violation",
      });
    }

    violation.status = status;
    violation.statusUpdatedAt = new Date();

    if (action) violation.action = action;

    if (status === "Submitted" && !violation.submittedAt) {
      violation.submittedAt = new Date();
    }

    await violation.save();

    res.json({
      message: "Status updated successfully",
      data: violation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///---

/* =====================================================
   SOFT DELETE VIOLATION
===================================================== */
exports.deleteViolation = async (req, res) => {
  try {
    const violation = await Violation.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    violation.isDeleted = true;
    await violation.save();

    res.json({ message: "Violation deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET TOP VIOLATORS
   GET /api/top-violators
===================================================== */
exports.getTopViolators = async (req, res) => {
  try {
    const {
      top = 5,                 // dropdown: Top 5 / Top 10
      period = "all",          // daily | weekly | monthly | all
    } = req.query;

    const toObjectIds = (ids) =>
      (ids || [])
        .map((id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null))
        .filter(Boolean);

    let companyIds = [];
    let allowedPropertyIds = null;
    if (req.user?.company) {
      companyIds = [req.user.company];
    } else if (req.userType === "PROPERTY_MANAGER") {
      let propertyIds = req.user.properties || [];
      if (!propertyIds.length) {
        const managedProps = await Property.find({
          propertyManager: req.user._id,
        }).select("_id");
        propertyIds = managedProps.map((p) => p._id);
      }

      allowedPropertyIds = toObjectIds(propertyIds);

      if (propertyIds.length) {
        const propertyCompanies = await Property.distinct("company", {
          _id: { $in: propertyIds },
        });
        companyIds = propertyCompanies.map((id) => String(id));
      }

      if (!companyIds.length && propertyIds.length) {
        const violationCompanies = await Violation.distinct("company", {
          property: { $in: propertyIds },
          isDeleted: false,
        });
        companyIds = violationCompanies.map((id) => String(id));
      }
    }

    if (!companyIds.length) {
      return res.status(403).json({ message: "No properties assigned" });
    }

    const companyObjectIds = toObjectIds(companyIds);
    if (!companyObjectIds.length) {
      return res.status(403).json({ message: "No properties assigned" });
    }

    // ================= FETCH TOP VIOLATORS =================
    const topViolators = await TopViolator.find({
      company: { $in: companyObjectIds },
      period,
    })
      .sort({ totalViolations: -1 })
      .limit(Number(top))
      .select("binTagId buildingName totalViolations propertyLabel");

    let totalAgg = await TopViolator.aggregate([
      {
        $match: {
          company: { $in: companyObjectIds },
          period,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalViolations" },
        },
      },
    ]);

    // ================= FALLBACK: COMPUTE FROM VIOLATIONS =================
    if (topViolators.length === 0) {
      const match = {
        isDeleted: false,
        company: { $in: companyObjectIds },
      };

      if (allowedPropertyIds?.length) {
        match.property = { $in: allowedPropertyIds };
      }

      if (period === "daily") {
        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);
        match.createdAt = { $gte: start };
      } else if (period === "weekly") {
        const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        match.createdAt = { $gte: start };
      } else if (period === "monthly") {
        const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        match.createdAt = { $gte: start };
      }

      const computedTop = await Violation.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              binTagId: "$binTagId",
              building: "$building",
              property: "$property",
            },
            totalViolations: { $sum: 1 },
          },
        },
        { $sort: { totalViolations: -1 } },
        { $limit: Number(top) },
        {
          $lookup: {
            from: "properties",
            localField: "_id.property",
            foreignField: "_id",
            as: "property",
          },
        },
        { $unwind: { path: "$property", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            binTagId: "$_id.binTagId",
            buildingName: "$_id.building",
            totalViolations: 1,
            propertyLabel: "$property.propertyName",
          },
        },
      ]);

      const totalComputed = await Violation.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
          },
        },
      ]);

      return res.json({
        data: computedTop,
        summary: {
          totalViolations: totalComputed[0]?.total || 0,
          period,
          top: Number(top),
        },
      });
    }

    res.json({
      data: topViolators,
      summary: {
        totalViolations: totalAgg[0]?.total || 0,
        period,
        top: Number(top),
      },
    });
  } catch (error) {
    console.error("Top Violators Error:", error);
    res.status(500).json({
      message: "Failed to fetch top violators",
    });
  }
};
