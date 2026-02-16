const BinTag = require("../models/properties/binTag.model");
const Property = require("../models/properties/property.model");
const generateAndUploadQRCode = require("../utils/generateAndUploadQRCode");
const mongoose = require("mongoose");

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return undefined;
};

const normalizeBinTagType = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  if (
    normalized === "route checkpoint" ||
    normalized === "route_checkpoint" ||
    normalized === "routecheckpoint"
  ) {
    return "Route Checkpoint";
  }

  if (normalized === "unit" || normalized === "bin") {
    return "unit";
  }

  return null;
};

/* =====================================================
   CREATE BIN TAG (WITH QR UPLOAD)
===================================================== */
exports.createBinTag = async (req, res) => {
  try {
    const { property, unitNumber, barcode, type, building, units, select, selectAll } = req.body;
    const normalizedType = normalizeBinTagType(type);
    const resolvedUnits = Array.isArray(units) ? units : [];
    const resolvedUnitNumber =
      unitNumber || (resolvedUnits[0] && resolvedUnits[0].unitNumber);

    if (!property || !resolvedUnitNumber || !barcode || !normalizedType) {
      return res.status(400).json({
        message: "Property, Unit Number, Barcode, and valid Type are required",
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
      type: normalizedType,
      select: parseBoolean(select),
      selectAll: parseBoolean(selectAll),
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
    const {
      page = 1,
      limit = 10,
      property,
      status,
      type,
      search,
      select,
      selectAll,
      deleted,
    } = req.query;

    const query = {
      company: req.user.company,
      isDeleted: false,
    };

    if (deleted === "true") query.isDeleted = true;
    if (deleted === "false") query.isDeleted = false;

    if (property) query.property = property;
    if (type) {
      const normalizedType = normalizeBinTagType(type);
      if (!normalizedType) {
        return res.status(400).json({
          message: "Invalid type. Use Route Checkpoint or unit",
        });
      }
      query.type = normalizedType;
    }

    const shouldSelectAll = parseBoolean(selectAll) === true;
    if (!shouldSelectAll) {
      if (status) {
        query.status = status;
      } else if (typeof select === "string") {
        const selectValue = select.toLowerCase();
        if (selectValue === "active") query.status = "Active";
        if (selectValue === "inactive") query.status = "Inactive";
      }
    }

    if (search) {
      query.$or = [
        { unitNumber: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ];
    }

    const countersQuery = { ...query };
    delete countersQuery.status;

    const [data, total, totalActive, totalInactive] = await Promise.all([
      BinTag.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      BinTag.countDocuments(query),
      BinTag.countDocuments({ ...countersQuery, status: "Active" }),
      BinTag.countDocuments({ ...countersQuery, status: "Inactive" }),
    ]);

    res.json({
      data,
      pagination: { total, page: Number(page), limit: Number(limit) },
      counters: {
        active: totalActive,
        inactive: totalInactive,
      },
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bin tag id" });
    }

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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bin tag id" });
    }

    const binTag = await BinTag.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!binTag) {
      return res.status(404).json({ message: "Bin tag not found" });
    }

    const allowedFields = [
      "unitNumber",
      "units",
      "status",
      "type",
      "building",
      "select",
      "selectAll",
    ];

    if (req.body.type !== undefined) {
      const normalizedType = normalizeBinTagType(req.body.type);
      if (!normalizedType) {
        return res.status(400).json({
          message: "Invalid type. Use Route Checkpoint or unit",
        });
      }
      req.body.type = normalizedType;
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "select" || field === "selectAll") {
          const parsed = parseBoolean(req.body[field]);
          if (typeof parsed === "boolean") {
            binTag[field] = parsed;
          }
          return;
        }
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
   UPDATE BIN TAG STATUS (ACTIVE / INACTIVE)
===================================================== */
exports.updateBinTagStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bin tag id" });
    }

    const binTag = await BinTag.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!binTag) {
      return res.status(404).json({ message: "Bin tag not found" });
    }

    const requestedStatus = req.body?.status;
    if (requestedStatus !== undefined) {
      if (requestedStatus !== "Active" && requestedStatus !== "Inactive") {
        return res.status(400).json({
          message: "Invalid status. Use Active or Inactive",
        });
      }
      binTag.status = requestedStatus;
    } else {
      binTag.status = binTag.status === "Active" ? "Inactive" : "Active";
    }

    await binTag.save();

    return res.status(200).json({
      message: `Bin tag ${binTag.status === "Active" ? "activated" : "inactivated"} successfully`,
      data: binTag,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   SOFT DELETE BIN TAG
===================================================== */
exports.deleteBinTag = async (req, res) => {
  try {
    if (req.params.id === "bulk-delete") {
      return exports.bulkDeleteBinTags(req, res);
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bin tag id" });
    }

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
   BULK SOFT DELETE BIN TAGS
===================================================== */
exports.bulkDeleteBinTags = async (req, res) => {
  try {
    const payload = req.body && Object.keys(req.body).length ? req.body : req.query;
    const queryIds = req.query?.ids;
    const normalizedIds = Array.isArray(payload.ids)
      ? payload.ids
      : typeof payload.ids === "string" && payload.ids.trim()
        ? payload.ids.split(",")
        : Array.isArray(queryIds)
          ? queryIds
          : typeof queryIds === "string" && queryIds.trim()
            ? queryIds.split(",")
            : [];

    const {
      selectAll = false,
      property,
      status,
      type,
      search,
    } = payload || {};

    const query = {
      company: req.user.company,
      isDeleted: false,
    };

    const shouldSelectAll = parseBoolean(selectAll) === true;

    if (shouldSelectAll) {
      if (property) query.property = property;
      if (status) query.status = status;
      if (type) {
        const normalizedType = normalizeBinTagType(type);
        if (!normalizedType) {
          return res.status(400).json({
            message: "Invalid type. Use Route Checkpoint or unit",
          });
        }
        query.type = normalizedType;
      }
      if (search) {
        query.$or = [
          { unitNumber: { $regex: search, $options: "i" } },
          { barcode: { $regex: search, $options: "i" } },
        ];
      }
    } else {
      const uniqueIds = [...new Set(normalizedIds.map(String))];
      const validIds = uniqueIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (!validIds.length) {
        return res.status(400).json({
          message: "ids (array of BinTag IDs) is required when selectAll is false",
        });
      }

      query._id = { $in: validIds };
    }

    const result = await BinTag.updateMany(query, { isDeleted: true });

    return res.status(200).json({
      message: "Selected bin tags deleted successfully",
      matched: result.matchedCount || 0,
      deleted: result.modifiedCount || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
