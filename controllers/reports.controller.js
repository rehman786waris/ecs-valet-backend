const mongoose = require("mongoose");

// ROUTES
const ServiceRoute = require("../models/routes/serviceRoute.model");

// REPORT MODELS
const ScanEvent = require("../models/reports/scanEvent.model");
const Checkpoint = require("../models/reports/checkpoint.model");
const RecycleReport = require("../models/reports/recycleReport.model");
const ServiceAlertLog = require("../models/reports/serviceAlertLog.model");
const TaskLog = require("../models/reports/taskLog.model");
const Task = require("../models/tasks/task.model");
const EmployeeClockLog = require("../models/reports/employeeClockLog.model");
const Property = require("../models/properties/property.model");
const PropertyCheckLog = require("../models/reports/propertyCheckLog.model");
const QrScanLog = require("../models/properties/qrScanLog.model");
const BinTag = require("../models/properties/binTag.model");

const resolvePropertyIdsForReport = async (req) => {
  if (req.userType === "EMPLOYEE") {
    const ids =
      Array.isArray(req.user?.properties) && req.user.properties.length
        ? req.user.properties
        : req.user?.property
          ? [req.user.property]
          : [];
    return ids;
  }

  if (req.userType === "PROPERTY_MANAGER") {
    const managerId = req.user?._id;
    if (!managerId) return [];
    const properties = await Property.find({
      $or: [
        { propertyManager: managerId },
        { _id: { $in: req.user.properties || [] } },
      ],
      isDeleted: false,
    }).select("_id");
    return properties.map((p) => p._id);
  }

  return null; // admin: no restriction
};



/* ===============================
   SERVICE ROUTE SUMMARY
================================ */
exports.serviceRouteSummary = async (req, res) => {
  try {
    const { date, propertyId } = req.query;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    if (!date || !propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.json({
        page,
        limit,
        totalRecords: 0,
        totalPages: 0,
        data: [],
      });
    }

    const allowedPropertyIds = await resolvePropertyIdsForReport(req);
    if (
      Array.isArray(allowedPropertyIds) &&
      allowedPropertyIds.length &&
      !allowedPropertyIds.some((id) => id.toString() === propertyId)
    ) {
      return res.json({
        page,
        limit,
        totalRecords: 0,
        totalPages: 0,
        data: [],
      });
    }

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const binTagMatch = {
      property: new mongoose.Types.ObjectId(propertyId),
      type: "Route Checkpoint",
      isDeleted: false,
    };

    const totalRoutes = await BinTag.countDocuments(binTagMatch);

    const binTags = await BinTag.find(binTagMatch)
      .sort({ unitNumber: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const binTagIds = binTags.map((b) => b._id);
    const scanAgg = binTagIds.length
      ? await QrScanLog.aggregate([
          {
            $match: {
              binTag: { $in: binTagIds },
              scannedAt: { $gte: dayStart, $lte: dayEnd },
            },
          },
          {
            $group: {
              _id: "$binTag",
              scanCount: { $sum: 1 },
              firstScan: { $min: "$scannedAt" },
              lastScan: { $max: "$scannedAt" },
            },
          },
        ])
      : [];

    const scanMap = new Map(
      scanAgg.map((s) => [s._id.toString(), s])
    );

    const data = binTags.map((tag) => {
      const scan = scanMap.get(tag._id.toString());
      return {
        routeName: tag.unitNumber,
        propertyName: tag.propertySnapshot?.propertyName || null,
        barcodeId: tag.barcode,
        routeCheckpoint: tag.qrCodeImage || null,
        totalCheckpoints: 1,
        checkpointsScanned: scan ? 1 : 0,
        scanCount: scan?.scanCount || 0,
        checkIn: scan?.firstScan || null,
        checkOut: scan?.lastScan || null,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      };
    });

    res.json({
      page,
      limit,
      totalRecords: totalRoutes,
      totalPages: Math.ceil(totalRoutes / limit),
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ===============================
   MISSED ROUTE CHECKPOINTS
================================ */
exports.missedRouteCheckpoints = async (req, res) => {
  try {
    const { date, propertyId } = req.query;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);

    const scanned = await ScanEvent.distinct("checkpoint", {
      property: propertyId,
      scannedAt: { $gte: dayStart, $lte: dayEnd },
    });

    const totalMissed = await Checkpoint.countDocuments({
      property: propertyId,
      _id: { $nin: scanned },
    });

    const missed = await Checkpoint.find({
      property: propertyId,
      _id: { $nin: scanned },
    })
      .populate("property")
      .populate("building")
      .skip(skip)
      .limit(limit);

    const data = missed.map((c) => ({
      property: c.property.name,
      building: c.building.name,
      barcodeId: c.barcodeId,
      address: c.property.address,
    }));

    res.json({
      page,
      limit,
      totalRecords: totalMissed,
      totalPages: Math.ceil(totalMissed / limit),
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ===============================
   CHECK IN / OUT REPORT
================================ */
exports.checkInOutHistoricalReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      date,
      propertyId,
      property,
      employeeId,
      user,
      activity,
      search,
      scanBy,
    } = req.query;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const match = {};
    const normalizedUser = typeof user === "string" ? user.trim() : "";
    const normalizedProperty = typeof property === "string" ? property.trim() : "";
    const effectiveEmployeeId =
      employeeId ||
      (normalizedUser && mongoose.Types.ObjectId.isValid(normalizedUser)
        ? normalizedUser
        : null);
    const effectivePropertyId =
      propertyId ||
      (normalizedProperty && mongoose.Types.ObjectId.isValid(normalizedProperty)
        ? normalizedProperty
        : null);

    if (date) {
      match.scannedAt = {
        $gte: new Date(`${date}T00:00:00`),
        $lte: new Date(`${date}T23:59:59`),
      };
    } else if (startDate || endDate) {
      const startHasTime = typeof startDate === "string" && startDate.includes("T");
      const endHasTime = typeof endDate === "string" && endDate.includes("T");
      const from = startDate
        ? new Date(startHasTime ? startDate : `${startDate}T00:00:00.000Z`)
        : new Date(`${endDate}T00:00:00.000Z`);
      const to = endDate
        ? new Date(endHasTime ? endDate : `${endDate}T23:59:59.999Z`)
        : new Date(from);
      if (!endDate && startDate) {
        to.setHours(23, 59, 59, 999);
      }
      match.scannedAt = { $gte: from, $lte: to };
    }

    if (effectivePropertyId && mongoose.Types.ObjectId.isValid(effectivePropertyId)) {
      match.property = new mongoose.Types.ObjectId(effectivePropertyId);
    }
    if (effectiveEmployeeId && mongoose.Types.ObjectId.isValid(effectiveEmployeeId)) {
      match.employee = new mongoose.Types.ObjectId(effectiveEmployeeId);
    }
    if (activity) {
      match.activityType = activity;
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            employee: "$employee",
            checkpoint: "$checkpoint",
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$scannedAt" },
            },
          },
          firstScan: { $min: "$scannedAt" },
          lastScan: { $max: "$scannedAt" },
          activity: { $first: "$activityType" },
          scanCount: { $sum: 1 },
          createdAt: { $min: "$createdAt" },
          updatedAt: { $max: "$updatedAt" },
        },
      },
      {
        $addFields: {
          checkOutResolved: {
            $cond: [{ $gt: ["$scanCount", 1] }, "$lastScan", null],
          },
          serviceDurationSeconds: {
            $cond: [
              { $gt: ["$scanCount", 1] },
              { $divide: [{ $subtract: ["$lastScan", "$firstScan"] }, 1000] },
              null,
            ],
          },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id.employee",
          foreignField: "_id",
          as: "employee",
        },
      },
      {
        $lookup: {
          from: "checkpoints",
          localField: "_id.checkpoint",
          foreignField: "_id",
          as: "checkpoint",
        },
      },
      { $unwind: "$employee" },
      { $unwind: "$checkpoint" },
      {
        $lookup: {
          from: "properties",
          localField: "checkpoint.property",
          foreignField: "_id",
          as: "property",
        },
      },
      {
        $lookup: {
          from: "buildings",
          localField: "checkpoint.building",
          foreignField: "_id",
          as: "building",
        },
      },
      { $unwind: { path: "$property", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$building", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          employeeName: {
            $let: {
              vars: {
                fullName: {
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
              },
              in: {
                $ifNull: [
                  {
                    $cond: [
                      { $ne: ["$$fullName", ""] },
                      "$$fullName",
                      { $ifNull: ["$employee.username", "$employee.email"] },
                    ],
                  },
                  "",
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          employeeNameResolved: {
            $cond: [
              { $ne: [{ $ifNull: ["$employeeName", ""] }, ""] },
              "$employeeName",
              "Unknown Employee",
            ],
          },
        },
      },
    ];

    if (scanBy) {
      const scanByRegex = new RegExp(scanBy, "i");
      const scanByMatch = {
        $or: [
          { "employee.firstName": scanByRegex },
          { "employee.lastName": scanByRegex },
          { "employee.username": scanByRegex },
          { "employee.email": scanByRegex },
          { employeeName: scanByRegex },
        ],
      };
      if (mongoose.Types.ObjectId.isValid(scanBy)) {
        scanByMatch.$or.push({
          "employee._id": new mongoose.Types.ObjectId(scanBy),
        });
      }
      pipeline.push({ $match: scanByMatch });
    }

    if (normalizedUser && !mongoose.Types.ObjectId.isValid(normalizedUser)) {
      const userRegex = new RegExp(normalizedUser, "i");
      pipeline.push({
        $match: {
          $or: [
            { "employee.firstName": userRegex },
            { "employee.lastName": userRegex },
            { "employee.username": userRegex },
            { "employee.email": userRegex },
            { employeeName: userRegex },
            { employeeNameResolved: userRegex },
          ],
        },
      });
    }

    if (normalizedProperty && !mongoose.Types.ObjectId.isValid(normalizedProperty)) {
      const propertyRegex = new RegExp(normalizedProperty, "i");
      pipeline.push({
        $match: {
          $or: [{ "property.propertyName": propertyRegex }],
        },
      });
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      pipeline.push({
        $match: {
          $or: [
            { employeeName: searchRegex },
            { "checkpoint.name": searchRegex },
            { "checkpoint.barcodeId": searchRegex },
            { "property.propertyName": searchRegex },
            { "building.name": searchRegex },
          ],
        },
      });
    }

    const totalRecords = (
      await ScanEvent.aggregate([...pipeline, { $count: "count" }])
    )[0]?.count || 0;

    if (totalRecords === 0) {
      const qrMatch = {};
      if (match.scannedAt) qrMatch.scannedAt = match.scannedAt;
      if (effectiveEmployeeId && mongoose.Types.ObjectId.isValid(effectiveEmployeeId)) {
        qrMatch.scannedBy = new mongoose.Types.ObjectId(effectiveEmployeeId);
      }

      const qrPipeline = [
        { $match: qrMatch },
        {
          $lookup: {
            from: "bintags",
            localField: "binTag",
            foreignField: "_id",
            as: "binTag",
          },
        },
        { $unwind: "$binTag" },
      ];

      if (effectivePropertyId && mongoose.Types.ObjectId.isValid(effectivePropertyId)) {
        qrPipeline.push({
          $match: { "binTag.property": new mongoose.Types.ObjectId(effectivePropertyId) },
        });
      }

      if (activity) {
        const normalized = String(activity).trim().toLowerCase();
        if (normalized.includes("route check")) {
          qrPipeline.push({ $match: { "binTag.type": "Route Checkpoint" } });
        } else if (normalized.includes("violation")) {
          qrPipeline.push({ $match: { "binTag.type": { $ne: "Route Checkpoint" } } });
        } else {
          qrPipeline.push({ $match: { _id: null } });
        }
      }

      qrPipeline.push(
        { $sort: { scannedAt: -1, createdAt: -1 } },
        {
          $group: {
            _id: {
              employee: "$scannedBy",
              binTag: "$binTag._id",
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$scannedAt" },
              },
            },
            firstScan: { $min: "$scannedAt" },
            lastScan: { $max: "$scannedAt" },
            scanCount: { $sum: 1 },
            createdAt: { $min: "$createdAt" },
            updatedAt: { $max: "$updatedAt" },
            scannedBySnapshot: { $first: "$scannedBySnapshot" },
          },
        },
        {
          $addFields: {
            checkOutResolved: {
              $cond: [{ $gt: ["$scanCount", 1] }, "$lastScan", null],
            },
            serviceDurationSeconds: {
              $cond: [
                { $gt: ["$scanCount", 1] },
                { $divide: [{ $subtract: ["$lastScan", "$firstScan"] }, 1000] },
                null,
              ],
            },
          },
        },
        {
          $lookup: {
            from: "employees",
            localField: "_id.employee",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "_id.employee",
            foreignField: "_id",
            as: "userAccount",
          },
        },
        { $unwind: { path: "$userAccount", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "propertymanagers",
            localField: "_id.employee",
            foreignField: "_id",
            as: "managerAccount",
          },
        },
        { $unwind: { path: "$managerAccount", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "bintags",
            localField: "_id.binTag",
            foreignField: "_id",
            as: "binTag",
          },
        },
        { $unwind: { path: "$binTag", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "properties",
            localField: "binTag.property",
            foreignField: "_id",
            as: "property",
          },
        },
        { $unwind: { path: "$property", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            employeeName: {
              $let: {
                vars: {
                  fullName: {
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
                },
                in: {
                  $ifNull: [
                    {
                      $cond: [
                        { $ne: ["$$fullName", ""] },
                        "$$fullName",
                        { $ifNull: ["$employee.username", "$employee.email"] },
                      ],
                    },
                    "",
                  ],
                },
              },
            },
            userName: {
              $let: {
                vars: {
                  fullName: {
                    $trim: {
                      input: {
                        $concat: [
                          { $ifNull: ["$userAccount.firstName", ""] },
                          " ",
                          { $ifNull: ["$userAccount.lastName", ""] },
                        ],
                      },
                    },
                  },
                },
                in: {
                  $ifNull: [
                    {
                      $cond: [
                        { $ne: ["$$fullName", ""] },
                        "$$fullName",
                        { $ifNull: ["$userAccount.username", "$userAccount.email"] },
                      ],
                    },
                    "",
                  ],
                },
              },
            },
            managerName: {
              $let: {
                vars: {
                  fullName: {
                    $trim: {
                      input: {
                        $concat: [
                          { $ifNull: ["$managerAccount.firstName", ""] },
                          " ",
                          { $ifNull: ["$managerAccount.lastName", ""] },
                        ],
                      },
                    },
                  },
                },
                in: {
                  $ifNull: [
                    {
                      $cond: [
                        { $ne: ["$$fullName", ""] },
                        "$$fullName",
                        {
                          $ifNull: [
                            "$managerAccount.username",
                            "$managerAccount.email",
                          ],
                        },
                      ],
                    },
                    "",
                  ],
                },
              },
            },
            scannedBySnapshotName: {
              $let: {
                vars: {
                  fullName: {
                    $trim: {
                      input: {
                        $concat: [
                          { $ifNull: ["$scannedBySnapshot.firstName", ""] },
                          " ",
                          { $ifNull: ["$scannedBySnapshot.lastName", ""] },
                        ],
                      },
                    },
                  },
                },
                in: {
                  $ifNull: [
                    {
                      $cond: [
                        { $ne: ["$$fullName", ""] },
                        "$$fullName",
                        {
                          $ifNull: [
                            "$scannedBySnapshot.username",
                            "$scannedBySnapshot.email",
                          ],
                        },
                      ],
                    },
                    "",
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            employeeNameResolved: {
              $let: {
                vars: {
                  e: { $ifNull: ["$employeeName", ""] },
                  u: { $ifNull: ["$userName", ""] },
                  m: { $ifNull: ["$managerName", ""] },
                  s: { $ifNull: ["$scannedBySnapshotName", ""] },
                },
                in: {
                  $cond: [
                    { $ne: ["$$e", ""] },
                    "$$e",
                    {
                      $cond: [
                        { $ne: ["$$u", ""] },
                        "$$u",
                        {
                          $cond: [
                            { $ne: ["$$m", ""] },
                            "$$m",
                            {
                              $cond: [
                                { $ne: ["$$s", ""] },
                                "$$s",
                                "Unknown Employee",
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        }
      );

      if (scanBy) {
        const scanByRegex = new RegExp(scanBy, "i");
        const scanByMatch = {
          $or: [
            { "employee.firstName": scanByRegex },
            { "employee.lastName": scanByRegex },
            { "employee.username": scanByRegex },
            { "employee.email": scanByRegex },
            { "userAccount.firstName": scanByRegex },
            { "userAccount.lastName": scanByRegex },
            { "userAccount.username": scanByRegex },
            { "userAccount.email": scanByRegex },
            { "managerAccount.firstName": scanByRegex },
            { "managerAccount.lastName": scanByRegex },
            { "managerAccount.username": scanByRegex },
            { "managerAccount.email": scanByRegex },
            { employeeName: scanByRegex },
            { userName: scanByRegex },
            { managerName: scanByRegex },
            { employeeNameResolved: scanByRegex },
          ],
        };
        if (mongoose.Types.ObjectId.isValid(scanBy)) {
          scanByMatch.$or.push({
            "employee._id": new mongoose.Types.ObjectId(scanBy),
          });
          scanByMatch.$or.push({
            "userAccount._id": new mongoose.Types.ObjectId(scanBy),
          });
          scanByMatch.$or.push({
            "managerAccount._id": new mongoose.Types.ObjectId(scanBy),
          });
        }
        qrPipeline.push({ $match: scanByMatch });
      }

      if (normalizedUser && !mongoose.Types.ObjectId.isValid(normalizedUser)) {
        const userRegex = new RegExp(normalizedUser, "i");
        qrPipeline.push({
          $match: {
            $or: [
              { "employee.firstName": userRegex },
              { "employee.lastName": userRegex },
              { "employee.username": userRegex },
              { "employee.email": userRegex },
              { "userAccount.firstName": userRegex },
              { "userAccount.lastName": userRegex },
              { "userAccount.username": userRegex },
              { "userAccount.email": userRegex },
              { "managerAccount.firstName": userRegex },
              { "managerAccount.lastName": userRegex },
              { "managerAccount.username": userRegex },
              { "managerAccount.email": userRegex },
              { employeeName: userRegex },
              { userName: userRegex },
              { managerName: userRegex },
              { employeeNameResolved: userRegex },
            ],
          },
        });
      }

      if (normalizedProperty && !mongoose.Types.ObjectId.isValid(normalizedProperty)) {
        const propertyRegex = new RegExp(normalizedProperty, "i");
        qrPipeline.push({
          $match: {
            $or: [
              { "property.propertyName": propertyRegex },
              { "binTag.propertySnapshot.propertyName": propertyRegex },
            ],
          },
        });
      }

      if (search) {
        const searchRegex = new RegExp(search, "i");
        qrPipeline.push({
          $match: {
            $or: [
              { employeeName: searchRegex },
              { "binTag.unitNumber": searchRegex },
              { "binTag.barcode": searchRegex },
              { "binTag.building.name": searchRegex },
              { "property.propertyName": searchRegex },
            ],
          },
        });
      }

      const qrTotal = (
        await QrScanLog.aggregate([...qrPipeline, { $count: "count" }])
      )[0]?.count || 0;

      const qrReport = await QrScanLog.aggregate([
        ...qrPipeline,
        { $sort: { firstScan: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            user: "$employeeNameResolved",
            propertyName: {
              $ifNull: ["$property.propertyName", "$binTag.propertySnapshot.propertyName"],
            },
            barcodeId: "$binTag.barcode",
            checkIn: "$firstScan",
            checkOut: "$checkOutResolved",
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      return res.json({
        page,
        limit,
        totalRecords: qrTotal,
        totalPages: Math.ceil(qrTotal / limit),
        data: qrReport,
      });
    }

    const report = await ScanEvent.aggregate([
      ...pipeline,
      { $sort: { firstScan: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          user: "$employeeNameResolved",
          propertyName: { $ifNull: ["$property.propertyName", "Unknown Property"] },
          barcodeId: "$checkpoint.barcodeId",
          checkIn: "$firstScan",
          checkOut: "$checkOutResolved",
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    res.json({
      page,
      limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      data: report,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/* ===============================
   SERVICE REPORT
================================ */

exports.serviceReport = async (req, res) => {
  try {
    const {
      date,
      propertyId,
      activity,
      employeeId,
      scanBy,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (page - 1) * limit;

    const match = {};
    const normalizedActivity = typeof activity === "string" ? activity.trim() : "";
    const normalizedScanBy = typeof scanBy === "string" ? scanBy.trim() : scanBy;
    const normalizedSearch = typeof search === "string" ? search.trim() : search;

    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(`${date}T23:59:59.999Z`);
      match.scannedAt = {
        $gte: dayStart,
        $lte: dayEnd,
      };
    }

    if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
      match.property = new mongoose.Types.ObjectId(propertyId);
    }

    if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
      match.employee = new mongoose.Types.ObjectId(employeeId);
    }

    if (normalizedActivity) {
      match.activityType = {
        $regex: `^${normalizedActivity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      };
    }

    const pipeline = [
      { $match: match },

      {
        $lookup: {
          from: "properties",
          localField: "property",
          foreignField: "_id",
          as: "property",
        },
      },
      { $unwind: "$property" },

      {
        $lookup: {
          from: "checkpoints",
          localField: "checkpoint",
          foreignField: "_id",
          as: "checkpoint",
        },
      },
      { $unwind: "$checkpoint" },

      {
        $lookup: {
          from: "buildings",
          localField: "checkpoint.building",
          foreignField: "_id",
          as: "building",
        },
      },
      { $unwind: "$building" },

      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $addFields: {
          scanBy: {
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
        },
      },
    ];

    if (normalizedScanBy) {
      const scanByRegex = new RegExp(normalizedScanBy, "i");
      const scanByMatch = {
        $or: [
          { "employee.firstName": scanByRegex },
          { "employee.lastName": scanByRegex },
          { "employee.username": scanByRegex },
          { "employee.email": scanByRegex },
          { scanBy: scanByRegex },
        ],
      };
      if (mongoose.Types.ObjectId.isValid(normalizedScanBy)) {
        scanByMatch.$or.push({
          "employee._id": new mongoose.Types.ObjectId(normalizedScanBy),
        });
      }
      pipeline.push({ $match: scanByMatch });
    }

    if (normalizedSearch) {
      const searchRegex = new RegExp(normalizedSearch, "i");
      pipeline.push({
        $match: {
          $or: [
            { "property.propertyName": searchRegex },
            { "building.name": searchRegex },
            { "checkpoint.name": searchRegex },
            { "checkpoint.barcodeId": searchRegex },
            { "employee.firstName": searchRegex },
            { "employee.lastName": searchRegex },
            { "employee.username": searchRegex },
            { "employee.email": searchRegex },
            { scanBy: searchRegex },
          ],
        },
      });
    }

    const totalRecords = (
      await ScanEvent.aggregate([...pipeline, { $count: "count" }])
    )[0]?.count || 0;

    if (totalRecords === 0) {
      const qrMatch = {};
      if (match.scannedAt) qrMatch.scannedAt = match.scannedAt;
      if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
        qrMatch.scannedBy = new mongoose.Types.ObjectId(employeeId);
      }

      const qrPipeline = [
        { $match: qrMatch },
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
        {
          $addFields: {
            scanBy: {
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
            activity: {
              $cond: [
                { $eq: ["$binTag.type", "Route Checkpoint"] },
                "Route Check Point",
                "Violation Reported",
              ],
            },
          },
        },
      ];

      if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
        qrPipeline.push({
          $match: { "property._id": new mongoose.Types.ObjectId(propertyId) },
        });
      }

      if (normalizedActivity) {
        const lower = normalizedActivity.toLowerCase();
        if (lower.includes("route check")) {
          qrPipeline.push({ $match: { "binTag.type": "Route Checkpoint" } });
        } else if (lower.includes("violation")) {
          qrPipeline.push({ $match: { "binTag.type": { $ne: "Route Checkpoint" } } });
        } else {
          qrPipeline.push({ $match: { _id: null } });
        }
      }

      if (normalizedScanBy) {
        const scanByRegex = new RegExp(normalizedScanBy, "i");
        const scanByMatch = {
          $or: [
            { "employee.firstName": scanByRegex },
            { "employee.lastName": scanByRegex },
            { "employee.username": scanByRegex },
            { "employee.email": scanByRegex },
            { scanBy: scanByRegex },
          ],
        };
        if (mongoose.Types.ObjectId.isValid(normalizedScanBy)) {
          scanByMatch.$or.push({
            "employee._id": new mongoose.Types.ObjectId(normalizedScanBy),
          });
        }
        qrPipeline.push({ $match: scanByMatch });
      }

      if (normalizedSearch) {
        const searchRegex = new RegExp(normalizedSearch, "i");
        qrPipeline.push({
          $match: {
            $or: [
              { "property.propertyName": searchRegex },
              { "binTag.building.name": searchRegex },
              { "binTag.unitNumber": searchRegex },
              { "snapshot.unitNumber": searchRegex },
              { "snapshot.barcode": searchRegex },
              { scanBy: searchRegex },
            ],
          },
        });
      }

      const qrTotal = (
        await QrScanLog.aggregate([...qrPipeline, { $count: "count" }])
      )[0]?.count || 0;

      qrPipeline.push(
        { $sort: { scannedAt: -1 } },
        { $skip: Number(skip) },
        { $limit: Number(limit) },
        {
          $project: {
            _id: 0,
            property: "$property.propertyName",
            buildingName: "$binTag.building.name",
            unit: { $ifNull: ["$binTag.unitNumber", "$snapshot.unitNumber"] },
            scanDate: "$scannedAt",
            activity: "$activity",
            volume: null,
            scanBy: "$scanBy",
          },
        }
      );

      const qrData = await QrScanLog.aggregate(qrPipeline);
      return res.json({
        page: Number(page),
        limit: Number(limit),
        totalRecords: qrTotal,
        totalPages: Math.ceil(qrTotal / limit),
        data: qrData,
      });
    }

    pipeline.push(
      { $sort: { scannedAt: -1 } },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 0,
          property: "$property.propertyName",
          buildingName: "$building.name",
          unit: "$checkpoint.name",
          scanDate: "$scannedAt",
          activity: "$activityType",
          volume: "$volume",
          scanBy: "$scanBy",
        },
      }
    );

    const data = await ScanEvent.aggregate(pipeline);

    res.json({
      page: Number(page),
      limit: Number(limit),
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
PROPERTY CHECK IN/OUT (LIST)
================================ */
exports.getPropertyCheckInOut = async (req, res) => {
  try {
    const { propertyId, employeeId, date, startDate, endDate } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const query = {};

    if (propertyId) {
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        return res.status(400).json({ message: "Invalid propertyId" });
      }
      query.property = new mongoose.Types.ObjectId(propertyId);
    }

    if (employeeId) {
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({ message: "Invalid employeeId" });
      }
      query.employee = new mongoose.Types.ObjectId(employeeId);
    }

    if (date) {
      query.checkIn = {
        $gte: new Date(`${date}T00:00:00.000Z`),
        $lte: new Date(`${date}T23:59:59.999Z`),
      };
    } else if (startDate || endDate) {
      query.checkIn = {};
      if (startDate) query.checkIn.$gte = new Date(startDate);
      if (endDate) query.checkIn.$lte = new Date(endDate);
    }

    const allowedPropertyIds = await resolvePropertyIdsForReport(req);
    if (Array.isArray(allowedPropertyIds)) {
      if (!allowedPropertyIds.length) {
        return res.json({
          page,
          limit,
          totalRecords: 0,
          totalPages: 0,
          data: [],
        });
      }
      if (query.property) {
        const isAllowed = allowedPropertyIds.some(
          (id) => id.toString() === query.property.toString()
        );
        if (!isAllowed) {
          return res.status(403).json({ message: "Access denied for this property" });
        }
      } else {
        query.property = {
          $in: allowedPropertyIds.map((id) => new mongoose.Types.ObjectId(id)),
        };
      }
    }

    if (req.userType === "EMPLOYEE") {
      query.employee = req.user._id;
    }

    const totalRecords = await PropertyCheckLog.countDocuments(query);
    const data = await PropertyCheckLog.find(query)
      .populate("property", "propertyName address")
      .populate("employee", "firstName lastName email username")
      .sort({ checkIn: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      page,
      limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      data,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* ===============================
PROPERTY CHECK IN/OUT LOG
================================ */

exports.propertyCheckInOutLog = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      propertyId,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (page - 1) * limit;

    const match = {};

    if (startDate && endDate) {
      match.scannedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (propertyId) {
      match.property = new mongoose.Types.ObjectId(propertyId);
    }

    const basePipeline = [
      { $match: match },

      {
        $group: {
          _id: {
            property: "$property",
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$scannedAt",
              },
            },
          },
          checkIn: { $min: "$scannedAt" },
          checkOut: { $max: "$scannedAt" },
        },
      },

      {
        $lookup: {
          from: "properties",
          localField: "_id.property",
          foreignField: "_id",
          as: "property",
        },
      },
      { $unwind: "$property" },
    ];

    const totalRecords =
      (
        await ScanEvent.aggregate([
          ...basePipeline,
          { $count: "count" },
        ])
      )[0]?.count || 0;

    const data = await ScanEvent.aggregate([
      ...basePipeline,
      { $sort: { checkIn: -1 } },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 0,
          name: "$property.name",
          propertyDetail: {
            address: "$property.address",
            type: "$property.type",
          },
          checkIn: 1,
          checkOut: 1,
        },
      },
    ]);

    res.json({
      page: Number(page),
      limit: Number(limit),
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   SERVICE ALERTS LOG
================================ */
exports.serviceAlertsLog = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (page - 1) * limit;

    const match = { isActive: true };

    if (startDate && endDate) {
      match.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status) match.status = status;

    const pipeline = [
      { $match: match },

      {
        $lookup: {
          from: "employees",
          localField: "sender",
          foreignField: "_id",
          as: "sender",
        },
      },
      { $unwind: "$sender" },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { mobile: { $regex: search, $options: "i" } },
            { "sender.name": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    const totalRecords =
      (
        await ServiceAlertLog.aggregate([
          ...pipeline,
          { $count: "count" },
        ])
      )[0]?.count || 0;

    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 0,
          propertyDetail: "$propertySnapshot",
          mobile: 1,
          sender: "$sender.name",
          status: 1,
          createdAt: 1,
        },
      }
    );

    const data = await ServiceAlertLog.aggregate(pipeline);

    res.json({
      page: Number(page),
      limit: Number(limit),
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   RECYCLE REPORTS
================================ */
exports.recycleReports = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      scannedBy,
      status,
      propertyId,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (page - 1) * limit;

    const match = {};

    const scopedPropertyIds = await resolvePropertyIdsForReport(req);
    if (Array.isArray(scopedPropertyIds)) {
      if (!scopedPropertyIds.length) {
        return res.json({
          summary: {
            totalRecycle: 0,
            totalContaminated: 0,
            totalViolations: 0,
          },
          page: Number(page),
          limit: Number(limit),
          totalRecords: 0,
          totalPages: 0,
          data: [],
        });
      }
      match.property = { $in: scopedPropertyIds };
    }

    if (propertyId) {
      if (match.property && !match.property.$in.map(String).includes(String(propertyId))) {
        return res.status(403).json({ message: "Property access denied" });
      }
      match.property = propertyId;
    }

    if (startDate && endDate) {
      match.scanDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (scannedBy) match.scannedBy = scannedBy;
    if (status) match.status = status;

    /* ===== SUMMARY COUNTS ===== */
    const summaryMatch = { ...match };
    const [totalRecycle, totalContaminated, totalViolations] =
      await Promise.all([
        RecycleReport.countDocuments({ ...summaryMatch, recycle: true }),
        RecycleReport.countDocuments({ ...summaryMatch, contaminated: true }),
        RecycleReport.countDocuments({
          ...summaryMatch,
          status: "Violation Reported",
        }),
      ]);

    /* ===== DATA LIST ===== */
    const pipeline = [
      { $match: match },

      {
        $lookup: {
          from: "properties",
          localField: "property",
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
          as: "scannedBy",
        },
      },
      { $unwind: "$scannedBy" },
    ];

    const totalRecords =
      (
        await RecycleReport.aggregate([
          ...pipeline,
          { $count: "count" },
        ])
      )[0]?.count || 0;

    pipeline.push(
      { $sort: { scanDate: -1 } },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 0,
          property: {
            id: "$property._id",
            name: "$property.propertyName",
            address: "$property.address",
          },
          scanDate: 1,
          recycle: 1,
          contaminated: 1,
          status: 1,
          scanBy: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$scannedBy.firstName", ""] },
                  " ",
                  { $ifNull: ["$scannedBy.lastName", ""] },
                ],
              },
            },
          },
        },
      }
    );

    const data = await RecycleReport.aggregate(pipeline);

    res.json({
      summary: {
        totalRecycle,
        totalContaminated,
        totalViolations,
      },
      page: Number(page),
      limit: Number(limit),
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ===============================
   TASK STATUS REPORT
================================ */
exports.taskStatusReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      propertyId,
      scannedBy,
      hasMedia,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (page - 1) * limit;
    const match = {};

    const scopedPropertyIds = await resolvePropertyIdsForReport(req);
    if (Array.isArray(scopedPropertyIds)) {
      if (!scopedPropertyIds.length) {
        return res.json({
          page: Number(page),
          limit: Number(limit),
          totalRecords: 0,
          totalPages: 0,
          data: [],
        });
      }
      match.property = { $in: scopedPropertyIds };
    }

    if (propertyId) {
      if (
        match.property &&
        !match.property.$in.map(String).includes(String(propertyId))
      ) {
        return res.status(403).json({ message: "Property access denied" });
      }
      match.property = propertyId;
    }

    if (scannedBy) match.taskOwner = scannedBy;

    if (startDate && endDate) {
      match.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (hasMedia === "true") match.photoRequired = true;
    if (hasMedia === "false") match.photoRequired = false;

    const totalRecords = await Task.countDocuments(match);

    const tasks = await Task.find(match)
      .populate("property", "propertyName address")
      .populate("taskOwner", "firstName lastName")
      .sort({ startDate: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    const taskIds = tasks.map((t) => t._id);
    const taskLogs = await TaskLog.find({ task: { $in: taskIds } })
      .populate("scannedBy", "firstName lastName")
      .lean();

    const logByTaskId = {};
    taskLogs.forEach((log) => {
      const key = log.task.toString();
      if (!logByTaskId[key]) {
        logByTaskId[key] = log;
      }
    });

    const data = tasks.map((t) => {
      const log = logByTaskId[t._id.toString()];
      const scanner = log?.scannedBy
        ? `${log.scannedBy.firstName || ""} ${log.scannedBy.lastName || ""}`.trim()
        : null;

      return {
        task: t.title,
        property: t.property
          ? {
              id: t.property._id,
              name: t.property.propertyName,
              address: t.property.address,
            }
          : null,
        completionDate: log?.completedAt || t.completedAt,
        date: t.startDate,
        scanBy: scanner,
        media: log?.mediaCount ?? t.photoRequired,
        status: t.status,
      };
    });

    res.json({
      page: Number(page),
      limit: Number(limit),
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ===============================
   EMPLOYEE CLOCK IN / OUT LOG
================================ */
exports.employeeClockInOutLog = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      employeeId,
      reportingManager,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (page - 1) * limit;
    const match = {};

    if (employeeId) match.employee = employeeId;

    if (startDate && endDate) {
      match.checkIn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const pipeline = [
      { $match: match },

      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },

      {
        $lookup: {
          from: "employees",
          localField: "employee.reportingManager",
          foreignField: "_id",
          as: "reportingManager",
        },
      },
      {
        $unwind: {
          path: "$reportingManager",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (reportingManager) {
      pipeline.push({
        $match: { "reportingManager._id": reportingManager },
      });
    }

    const totalRecords =
      (
        await EmployeeClockLog.aggregate([
          ...pipeline,
          { $count: "count" },
        ])
      )[0]?.count || 0;

    pipeline.push(
      { $sort: { checkIn: -1 } },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 0,
          reportingManager: "$reportingManager.name",
          clockIn: "$checkIn",
          clockOut: "$checkOut",
          reason: { $ifNull: ["$reason", "-"] },
        },
      }
    );

    const data = await EmployeeClockLog.aggregate(pipeline);

    res.json({
      page: Number(page),
      limit: Number(limit),
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
