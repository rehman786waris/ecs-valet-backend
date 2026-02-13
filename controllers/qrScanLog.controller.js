const QrScanLog = require("../models/properties/qrScanLog.model");
const BinTag = require("../models/properties/binTag.model");
const RecycleReport = require("../models/reports/recycleReport.model");
const Property = require("../models/properties/property.model");

const getEmployeeCompanyId = async (req) => {
  let companyId = req.user.company;
  if (companyId || req.userType !== "EMPLOYEE") return companyId;

  const employeeProperties =
    Array.isArray(req.user.properties) && req.user.properties.length
      ? req.user.properties
      : req.user.property
        ? [req.user.property]
        : [];
  if (!employeeProperties.length) return null;
  const property = await Property.findById(employeeProperties[0]).select(
    "company"
  );
  return property?.company || null;
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

/* =====================================================
   CREATE SCAN LOG (AUTO – MOBILE SCAN)
===================================================== */
exports.createScanLog = async (req, res) => {
  try {
    const { barcode, location } = req.body;

    if (!barcode) {
      return res.status(400).json({ message: "Barcode is required" });
    }

    let companyId = await getEmployeeCompanyId(req);
    if (!companyId && req.userType === "EMPLOYEE") {
      return res
        .status(400)
        .json({ message: "Employee property is not assigned" });
    }

    const binTag = await BinTag.findOne({
      barcode,
      company: companyId,
      status: "Active",
      isDeleted: false,
    }).populate("property", "propertyName");

    if (!binTag) {
      return res.status(404).json({ message: "Invalid or inactive QR code" });
    }

    const scanLog = await QrScanLog.create({
      company: companyId,
      binTag: binTag._id,
      scannedBy: req.user._id,
      location,
      snapshot: {
        propertyName: binTag.propertySnapshot?.propertyName,
        unitNumber: binTag.unitNumber,
        units: binTag.unitNumber ? [{ unitNumber: binTag.unitNumber }] : [],
        barcode: binTag.barcode,
      },
    });

    // Update bin tag stats
    binTag.scanCount += 1;
    binTag.lastScannedAt = new Date();
    binTag.lastScannedBy = req.user._id;
    await binTag.save();

    const property = await Property.findById(binTag.property).select(
      "address propertyType"
    );
    const addressObj = property?.address || {};
    const addressParts = [
      addressObj.street,
      addressObj.city,
      addressObj.state,
      addressObj.zip,
    ].filter(Boolean);
    const addressString = addressParts.join(", ");
    const status =
      binTag.type === "Route Checkpoint"
        ? "Route Check Point"
        : "Violation Reported";

    await RecycleReport.create({
      property: binTag.property,
      propertySnapshot: addressString || null,
      scanDate: scanLog.scannedAt,
      recycle: binTag.type !== "Route Checkpoint",
      contaminated: false,
      status,
      scannedBy: req.user._id,
    });

    const populatedScanLog = await QrScanLog.findById(scanLog._id)
      .populate("binTag", "unitNumber barcode type")
      .populate("scannedBy", "firstName lastName email username");

    res.status(201).json({
      message: "QR scan logged successfully",
      data: populatedScanLog || scanLog,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET ALL SCAN LOGS (ADMIN)
===================================================== */
exports.getScanLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      binTag,
      fromDate,
      toDate,
      search,
    } = req.query;

    const query = {};

    if (req.userType === "EMPLOYEE") {
      const companyId = await getEmployeeCompanyId(req);
      if (!companyId) {
        return res
          .status(400)
          .json({ message: "Employee property is not assigned" });
      }
      query.company = companyId;
      query.scannedBy = req.user._id;
    } else if (req.userType === "PROPERTY_MANAGER") {
      const propertyIds = await getPropertyIdsForManager(req.user);
      if (!propertyIds.length) {
        return res.json({
          data: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit),
          },
        });
      }
      const binTagIds = await BinTag.find({
        property: { $in: propertyIds },
        isDeleted: false,
      }).select("_id");
      const allowedBinTagIds = binTagIds.map((b) => b._id);
      if (binTag && !allowedBinTagIds.some((id) => id.toString() === binTag)) {
        return res.json({
          data: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit),
          },
        });
      }
      query.binTag = binTag ? binTag : { $in: allowedBinTagIds };
    } else {
      query.company = req.user.company;
    }

    if (binTag && req.userType !== "PROPERTY_MANAGER") query.binTag = binTag;

    if (fromDate || toDate) {
      query.scannedAt = {};
      if (fromDate) query.scannedAt.$gte = new Date(fromDate);
      if (toDate) query.scannedAt.$lte = new Date(toDate);
    }

    if (search) {
      query.$or = [
        { "snapshot.barcode": { $regex: search, $options: "i" } },
        { "snapshot.unitNumber": { $regex: search, $options: "i" } },
        { "snapshot.propertyName": { $regex: search, $options: "i" } },
      ];
    }

    const logs = await QrScanLog.find(query)
      .populate("binTag", "unitNumber barcode type")
      .populate("scannedBy", "firstName lastName email username")
      .sort({ scannedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await QrScanLog.countDocuments(query);

    res.json({
      data: logs,
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

/* =====================================================
   GET SINGLE SCAN LOG
===================================================== */
exports.getScanLogById = async (req, res) => {
  try {
    let log;
    if (req.userType === "EMPLOYEE") {
      log = await QrScanLog.findOne({
        _id: req.params.id,
        scannedBy: req.user._id,
      })
        .populate("binTag")
        .populate("scannedBy", "firstName lastName email username");
    } else if (req.userType === "PROPERTY_MANAGER") {
      const propertyIds = await getPropertyIdsForManager(req.user);
      if (!propertyIds.length) {
        return res.status(404).json({ message: "Scan log not found" });
      }
      log = await QrScanLog.findById(req.params.id)
        .populate("binTag")
        .populate("scannedBy", "firstName lastName email username");
      if (
        log?.binTag?.property &&
        !propertyIds.some(
          (id) => id.toString() === log.binTag.property.toString()
        )
      ) {
        log = null;
      }
    } else {
      log = await QrScanLog.findOne({
        _id: req.params.id,
        company: req.user.company,
      })
        .populate("binTag")
        .populate("scannedBy", "firstName lastName email username");
    }

    if (!log) {
      return res.status(404).json({ message: "Scan log not found" });
    }

    res.json({ data: log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   DELETE SCAN LOG (ADMIN ONLY)
===================================================== */
exports.deleteScanLog = async (req, res) => {
  try {
    const log = await QrScanLog.findOneAndDelete({
      _id: req.params.id,
      company: req.user.company,
    });

    if (!log) {
      return res.status(404).json({ message: "Scan log not found" });
    }

    res.json({ message: "Scan log deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
