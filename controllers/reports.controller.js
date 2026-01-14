const mongoose = require("mongoose");

// ROUTES
const ServiceRoute = require("../models/routes/serviceRoute.model");

// REPORT MODELS
const ScanEvent = require("../models/reports/scanEvent.model");
const Checkpoint = require("../models/reports/checkpoint.model");

/* ===============================
   SERVICE ROUTE SUMMARY
================================ */
exports.serviceRouteSummary = async (req, res) => {
  try {
    const { date, propertyId } = req.query;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);

    const routes = await ServiceRoute.find({ property: propertyId })
      .populate("checkpoints")
      .skip(skip)
      .limit(limit)
      .lean();

    const totalRoutes = await ServiceRoute.countDocuments({
      property: propertyId,
    });

    const scans = await ScanEvent.aggregate([
      {
        $match: {
          property: new mongoose.Types.ObjectId(propertyId),
          scannedAt: { $gte: dayStart, $lte: dayEnd },
        },
      },
      { $group: { _id: "$checkpoint" } },
    ]);

    const scannedCheckpointIds = scans.map((s) => s._id.toString());

    const data = routes.map((route) => {
      const scannedCount = route.checkpoints.filter((cp) =>
        scannedCheckpointIds.includes(cp._id.toString())
      ).length;

      return {
        routeName: route.routeName,
        totalCheckpoints: route.checkpoints.length,
        checkpointsScanned: scannedCount,
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
exports.checkInOutReport = async (req, res) => {
  try {
    const { startDate, endDate, propertyId, employeeId } = req.query;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const match = {
      scannedAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (propertyId) match.property = propertyId;
    if (employeeId) match.employee = employeeId;

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
        },
      },
    ];

    const totalRecords = (
      await ScanEvent.aggregate([...pipeline, { $count: "count" }])
    )[0]?.count || 0;

    const report = await ScanEvent.aggregate([
      ...pipeline,
      { $sort: { firstScan: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $addFields: {
          serviceDurationSeconds: {
            $divide: [{ $subtract: ["$lastScan", "$firstScan"] }, 1000],
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
        $project: {
          _id: 0,
          employeeName: "$employee.name",
          barcodeId: "$checkpoint.barcodeId",
          checkIn: "$firstScan",
          checkOut: "$lastScan",
          serviceDurationSeconds: 1,
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
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (page - 1) * limit;

    const match = {};

    if (date) {
      match.scannedAt = {
        $gte: new Date(`${date}T00:00:00`),
        $lte: new Date(`${date}T23:59:59`),
      };
    }

    if (propertyId) {
      match.property = new mongoose.Types.ObjectId(propertyId);
    }

    if (employeeId) {
      match.employee = new mongoose.Types.ObjectId(employeeId);
    }

    if (activity) {
      match.activityType = activity; // stored in ScanEvent
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
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "property.name": { $regex: search, $options: "i" } },
            { "building.name": { $regex: search, $options: "i" } },
            { "employee.name": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    const totalRecords = (
      await ScanEvent.aggregate([...pipeline, { $count: "count" }])
    )[0]?.count || 0;

    pipeline.push(
      { $sort: { scannedAt: -1 } },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 0,
          property: "$property.name",
          buildingName: "$building.name",
          unit: "$checkpoint.name",
          scanDate: "$scannedAt",
          activity: "$activityType",
          volume: "$volume",
          scanBy: "$employee.name",
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


