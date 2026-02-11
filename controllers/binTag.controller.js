const BinTag = require("../models/properties/binTag.model");
const Property = require("../models/properties/property.model");
const generateAndUploadQRCode = require("../utils/generateAndUploadQRCode");

/* =====================================================
   CREATE BIN TAG (WITH QR UPLOAD)
===================================================== */
exports.createBinTag = async (req, res) => {
  try {
    const { property, unitNumber, barcode, type, building, units } = req.body;
    const resolvedUnits = Array.isArray(units) ? units : [];
    const resolvedUnitNumber =
      unitNumber || (resolvedUnits[0] && resolvedUnits[0].unitNumber);

    if (!property || !resolvedUnitNumber || !barcode || !type) {
      return res.status(400).json({
        message: "Property, Unit Number, Barcode, and Type are required",
      });
    }

    // Validate property
    const propertyDoc = await Property.findOne({
      _id: property,
      company: req.user.company,
      isDeleted: false,
    });

    if (!propertyDoc) {
      return res.status(404).json({ message: "Property not found" });
    }

    // 🔥 Generate QR Code
    const qrCodeImage = await generateAndUploadQRCode(barcode);

    const binTag = await BinTag.create({
      company: req.user.company,
      property,
      propertySnapshot: {
        propertyName: propertyDoc.propertyName,
        address: `${propertyDoc.address.street}, ${propertyDoc.address.city}`,
      },
      building,
      unitNumber: resolvedUnitNumber,
      units:
        resolvedUnits.length > 0
          ? resolvedUnits
          : [{ unitNumber: resolvedUnitNumber }],
      barcode,
      qrCodeImage,
      type,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Bin tag created successfully",
      data: binTag,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET ALL BIN TAGS
===================================================== */
exports.getBinTags = async (req, res) => {
  try {
    const { page = 1, limit = 10, property, status, type, search } = req.query;

    const query = {
      company: req.user.company,
      isDeleted: false,
    };

    if (property) query.property = property;
    if (status) query.status = status;
    if (type) query.type = type;

    if (search) {
      query.$or = [
        { unitNumber: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ];
    }

    const data = await BinTag.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await BinTag.countDocuments(query);

    res.json({
      data,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET SINGLE BIN TAG
===================================================== */
exports.getBinTagById = async (req, res) => {
  try {
    const binTag = await BinTag.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!binTag) {
      return res.status(404).json({ message: "Bin tag not found" });
    }

    res.json({ data: binTag });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   UPDATE BIN TAG
===================================================== */
exports.updateBinTag = async (req, res) => {
  try {
    const binTag = await BinTag.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!binTag) {
      return res.status(404).json({ message: "Bin tag not found" });
    }

    const allowedFields = ["unitNumber", "units", "status", "type", "building"];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        binTag[field] = req.body[field];
      }
    });
    if (
      req.body.units &&
      Array.isArray(req.body.units) &&
      req.body.units[0]?.unitNumber
    ) {
      binTag.unitNumber = req.body.units[0].unitNumber;
    }

    await binTag.save();

    res.json({
      message: "Bin tag updated successfully",
      data: binTag,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   SOFT DELETE BIN TAG
===================================================== */
exports.deleteBinTag = async (req, res) => {
  try {
    const binTag = await BinTag.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!binTag) {
      return res.status(404).json({ message: "Bin tag not found" });
    }

    binTag.isDeleted = true;
    await binTag.save();

    res.json({ message: "Bin tag deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   QR SCAN (MOBILE)
===================================================== */
exports.scanBinTag = async (req, res) => {
  try {
    const { barcode } = req.body;

    const binTag = await BinTag.findOne({
      barcode,
      company: req.user.company,
      status: "Active",
      isDeleted: false,
    });

    if (!binTag) {
      return res.status(404).json({ message: "Invalid or inactive QR code" });
    }

    binTag.scanCount += 1;
    binTag.lastScannedAt = new Date();
    binTag.lastScannedBy = req.user._id;

    await binTag.save();

    res.json({
      message: "QR scanned successfully",
      data: binTag,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
