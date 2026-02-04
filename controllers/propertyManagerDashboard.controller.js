const mongoose = require("mongoose");
const Property = require("../models/properties/property.model");
const Violation = require("../models/violations/violation.model");
const ServiceNote = require("../models/service/serviceNote.model");
const Schedule = require("../models/schedule/schedule.model");
const TaskLog = require("../models/reports/taskLog.model");
const QrScanLog = require("../models/properties/qrScanLog.model");
const PropertyManager = require("../models/propertyManagerModel");

const getDayRange = (dateStr) => {
  const day = dateStr ? new Date(dateStr) : new Date();
  if (Number.isNaN(day.getTime())) return null;
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return { start, end, isoDate: start.toISOString().slice(0, 10) };
};

const getPropertyIdsForManager = async (manager) => {
  const properties = await Property.find({
    propertyManager: manager._id,
    isDeleted: false,
  }).select("_id");

  let ids = properties.map((p) => p._id);
  if (!ids.length && Array.isArray(manager.properties) && manager.properties.length) {
    ids = manager.properties;
  }
  return ids;
};

const resolveDashboardParams = (req) => {
  const source = req.method === "POST" ? req.body || {} : req.query || {};
  return {
    date: source.date,
    propertyId: source.propertyId,
    propertyManagerId: source.propertyManagerId,
    search: source.search,
    page: source.page,
    limit: source.limit,
  };
};

exports.getDashboard = async (req, res) => {
  try {
    const { date, propertyId, propertyManagerId, search, page, limit } =
      resolveDashboardParams(req);
    const safePage = Math.max(parseInt(page) || 1, 1);
    const safeLimit = Math.max(parseInt(limit) || 5, 1);
    const skip = (safePage - 1) * safeLimit;

    const dayRange = getDayRange(date);
    if (!dayRange) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    let propertyIds = [];

    if (req.userType === "PROPERTY_MANAGER") {
      propertyIds = await getPropertyIdsForManager(req.user);
    } else {
      if (propertyManagerId) {
        const pm = await PropertyManager.findById(propertyManagerId);
        if (!pm) {
          return res.status(404).json({ message: "Property Manager not found" });
        }
        propertyIds = await getPropertyIdsForManager(pm);
      } else if (propertyId) {
        propertyIds = [propertyId];
      } else {
        return res.status(400).json({
          message: "propertyManagerId or propertyId is required for admin access",
        });
      }
    }

    if (propertyId && propertyIds.length) {
      const allowed = propertyIds.some(
        (id) => id.toString() === propertyId.toString()
      );
      if (!allowed) {
        return res.status(403).json({ message: "Property access denied" });
      }
      propertyIds = [propertyId];
    }

    if (!propertyIds.length) {
      return res.json({
        date: dayRange.isoDate,
        cards: {
          violations: 0,
          unitServices: 0,
          checkInPending: 0,
          routeCheckpoints: 0,
          todaysTaskCompleted: 0,
        },
      activityLogs: {
        page: safePage,
        limit: safeLimit,
        totalRecords: 0,
        totalPages: 0,
        data: [],
      },
      });
    }

    const propertyObjectIds = propertyIds.map((id) =>
      new mongoose.Types.ObjectId(id)
    );

    const [
      violations,
      unitServices,
      checkInPending,
      routeCheckpoints,
      todaysTaskCompleted,
      activityLogs,
      activityTotal,
    ] = await Promise.all([
      Violation.countDocuments({
        property: { $in: propertyObjectIds },
        isDeleted: false,
        createdAt: { $gte: dayRange.start, $lte: dayRange.end },
      }),
      ServiceNote.countDocuments({
        property: { $in: propertyObjectIds },
        isActive: true,
        createdAt: { $gte: dayRange.start, $lte: dayRange.end },
      }),
      Schedule.countDocuments({
        property: { $in: propertyObjectIds },
        isActive: true,
        status: "Scheduled",
        date: { $gte: dayRange.start, $lte: dayRange.end },
      }),
      QrScanLog.aggregate([
        {
          $match: {
            scannedAt: { $gte: dayRange.start, $lte: dayRange.end },
          },
        },
        {
          $lookup: {
            from: "bintags",
            localField: "binTag",
            foreignField: "_id",
            as: "binTag",
          },
        },
        { $unwind: "$binTag" },
        {
          $match: {
            "binTag.property": { $in: propertyObjectIds },
            "binTag.type": "Route Checkpoint",
          },
        },
        { $count: "count" },
      ]).then((rows) => rows[0]?.count || 0),
      TaskLog.countDocuments({
        property: { $in: propertyObjectIds },
        completedAt: { $gte: dayRange.start, $lte: dayRange.end },
      }),
      QrScanLog.aggregate([
        {
          $match: {
            scannedAt: { $gte: dayRange.start, $lte: dayRange.end },
          },
        },
        {
          $lookup: {
            from: "bintags",
            localField: "binTag",
            foreignField: "_id",
            as: "binTag",
          },
        },
        { $unwind: "$binTag" },
        {
          $match: {
            "binTag.property": { $in: propertyObjectIds },
          },
        },
        {
          $lookup: {
            from: "properties",
            localField: "binTag.property",
            foreignField: "_id",
            as: "property",
          },
        },
        { $unwind: "$property" },
        {
          $lookup: {
            from: "employees",
            localField: "scannedBy",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } },
        ...(search
          ? [
              {
                $match: {
                  $or: [
                    { "employee.username": { $regex: search, $options: "i" } },
                    { "employee.email": { $regex: search, $options: "i" } },
                    {
                      $expr: {
                        $regexMatch: {
                          input: {
                            $trim: {
                              input: {
                                $concat: [
                                  { $ifNull: ["$employee.firstName", ""] },
                                  " ",
                                  { $ifNull: ["$employee.lastName", ""] },
                                ],
                              },
                            },
                          },
                          regex: search,
                          options: "i",
                        },
                      },
                    },
                  ],
                },
              },
            ]
          : []),
        { $sort: { scannedAt: -1 } },
        { $skip: skip },
        { $limit: safeLimit },
        {
          $project: {
            _id: 0,
            propertyName: "$property.propertyName",
            propertyAddress: "$property.address",
            barcodeId: "$binTag.barcode",
            username: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ["$employee.firstName", ""] },
                    " ",
                    { $ifNull: ["$employee.lastName", ""] },
                  ],
                },
              },
            },
            userEmail: "$employee.email",
            status: "Scan",
            scannedAt: 1,
          },
        },
      ]),
      QrScanLog.aggregate([
        {
          $match: {
            scannedAt: { $gte: dayRange.start, $lte: dayRange.end },
          },
        },
        {
          $lookup: {
            from: "bintags",
            localField: "binTag",
            foreignField: "_id",
            as: "binTag",
          },
        },
        { $unwind: "$binTag" },
        {
          $match: {
            "binTag.property": { $in: propertyObjectIds },
          },
        },
        {
          $lookup: {
            from: "employees",
            localField: "scannedBy",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } },
        ...(search
          ? [
              {
                $match: {
                  $or: [
                    { "employee.username": { $regex: search, $options: "i" } },
                    { "employee.email": { $regex: search, $options: "i" } },
                    {
                      $expr: {
                        $regexMatch: {
                          input: {
                            $trim: {
                              input: {
                                $concat: [
                                  { $ifNull: ["$employee.firstName", ""] },
                                  " ",
                                  { $ifNull: ["$employee.lastName", ""] },
                                ],
                              },
                            },
                          },
                          regex: search,
                          options: "i",
                        },
                      },
                    },
                  ],
                },
              },
            ]
          : []),
        { $count: "count" },
      ]).then((rows) => rows[0]?.count || 0),
    ]);

    res.json({
      date: dayRange.isoDate,
      cards: {
        violations,
        unitServices,
        checkInPending,
        routeCheckpoints,
        todaysTaskCompleted,
      },
      activityLogs: {
        page: safePage,
        limit: safeLimit,
        totalRecords: activityTotal,
        totalPages: Math.ceil(activityTotal / safeLimit),
        data: activityLogs,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
