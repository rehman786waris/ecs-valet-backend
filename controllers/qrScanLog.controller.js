const QrScanLog = require("../models/properties/qrScanLog.model");
const BinTag = require("../models/properties/binTag.model");

/* =====================================================
   CREATE SCAN LOG (AUTO – MOBILE SCAN)
===================================================== */
exports.createScanLog = async (req, res) => {
  try {
    const { barcode, location } = req.body;

    if (!barcode) {
      return res.status(400).json({ message: "Barcode is required" });
    }

    const binTag = await BinTag.findOne({
      barcode,
      company: req.user.company,
      status: "Active",
      isDeleted: false,
    }).populate("property", "propertyName");

    if (!binTag) {
      return res.status(404).json({ message: "Invalid or inactive QR code" });
    }

    const scanLog = await QrScanLog.create({
      company: req.user.company,
      binTag: binTag._id,
      scannedBy: req.user._id,
      location,
      snapshot: {
        propertyName: binTag.propertySnapshot?.propertyName,
        unitNumber: binTag.unitNumber,
        barcode: binTag.barcode,
      },
    });

    // Update bin tag stats
    binTag.scanCount += 1;
    binTag.lastScannedAt = new Date();
    binTag.lastScannedBy = req.user._id;
    await binTag.save();

    res.status(201).json({
      message: "QR scan logged successfully",
      data: scanLog,
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

    const query = {
      company: req.user.company,
    };

    if (binTag) query.binTag = binTag;

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
      .populate("scannedBy", "firstName lastName")
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
    const log = await QrScanLog.findOne({
      _id: req.params.id,
      company: req.user.company,
    })
      .populate("binTag")
      .populate("scannedBy", "firstName lastName");

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
