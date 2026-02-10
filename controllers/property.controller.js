const mongoose = require("mongoose");
const Property = require("../models/properties/property.model");
const Building = require("../models/buildings.model");
const BinTag = require("../models/properties/binTag.model");

const generateAndUploadQRCode = require("../utils/generateAndUploadQRCode");

/* =====================================================
   HELPERS
===================================================== */
const parseBoolean = (v) => v === true || v === "true" || v === "on";

const generateUnitNumber = (bIndex, uIndex) =>
  `B${bIndex + 1}-U${uIndex + 1}`;

const generateBarcode = (propertyId, bIndex, uIndex) =>
  `BIN-${propertyId.toString().slice(-4)}-${bIndex + 1}-${uIndex + 1}`;

/* =====================================================
   CREATE PROPERTY (BUILDINGS + BINTAGS + QR)
===================================================== */
exports.createProperty = async (req, res) => {
  try {
    const data = req.body;

    if (data.redundantRouteService !== undefined) {
      data.redundantRouteService = parseBoolean(data.redundantRouteService);
    }

    const buildingsPayload = data.buildings
      ? JSON.parse(data.buildings)
      : [];

    // 1️⃣ Property
    const property = await Property.create({
      ...data,
      company: req.user.company,
      createdBy: req.user._id,
      buildings: [],
    });

    const files = req.files || [];
    let fileIndex = 0;
    const buildingIds = [];

    // 2️⃣ Buildings + BinTags
    for (let i = 0; i < buildingsPayload.length; i++) {
      const b = buildingsPayload[i];

      const images = [];
      const imageCount = Number(b.imageCount || 0);

      for (let j = 0; j < imageCount; j++) {
        if (files[fileIndex]) {
          images.push({ url: files[fileIndex].location });
          fileIndex++;
        }
      }

      const building = await Building.create({
        property: property._id,
        name: b.name,
        numberOfUnits: b.numberOfUnits,
        buildingOrder: b.buildingOrder || 0,
        address: b.address,
        images,
      });

      buildingIds.push(building._id);

      const binTags = [];

      for (let u = 0; u < b.numberOfUnits; u++) {
        const barcode = generateBarcode(property._id, i, u);
        const qrCodeImage = await generateAndUploadQRCode(barcode);

        binTags.push({
          company: req.user.company,
          property: property._id,
          propertySnapshot: {
            propertyName: property.propertyName,
            address: `${property.address.street}, ${property.address.city}`,
          },
          building: {
            name: building.name,
            order: building.buildingOrder,
            address: building.address,
          },
          unitNumber: generateUnitNumber(i, u),
          barcode,
          qrCodeImage,
          type: "Bin",
          createdBy: req.user._id,
        });
      }

      if (binTags.length) {
        await BinTag.insertMany(binTags);
      }
    }

    property.buildings = buildingIds;
    await property.save();

    res.status(201).json({
      success: true,
      message: "Property, Buildings, BinTags & QR Codes created successfully",
      data: property,
    });
  } catch (error) {
    console.error("CREATE PROPERTY ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =====================================================
   GET ALL PROPERTIES
===================================================== */
exports.getProperties = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive, customer, propertyManager } =
      req.query;

    const toObjectIds = (ids) =>
      (ids || [])
        .map((id) =>
          mongoose.Types.ObjectId.isValid(id)
            ? new mongoose.Types.ObjectId(id)
            : null
        )
        .filter(Boolean);

    const query = {
      isDeleted: false,
    };

    if (req.userType === "PROPERTY_MANAGER") {
      const propertyIds = req.user.properties?.length
        ? req.user.properties
        : await Property.find({ propertyManager: req.user._id }).distinct("_id");
      query._id = { $in: toObjectIds(propertyIds) };
    } else if (req.userType === "EMPLOYEE") {
      const employeePropertyIds =
        Array.isArray(req.user.properties) && req.user.properties.length
          ? req.user.properties
          : req.user.property
            ? [req.user.property]
            : [];
      if (!employeePropertyIds.length) {
        return res
          .status(403)
          .json({ success: false, message: "No property assigned" });
      }
      query._id = { $in: toObjectIds(employeePropertyIds) };
    } else if (req.user?.company) {
      query.company = req.user.company;
    }

    if (isActive !== undefined) query.isActive = isActive === "true";
    if (customer) query.customer = customer;
    if (propertyManager) query.propertyManager = propertyManager;

    if (search) {
      query.$or = [
        { propertyName: { $regex: search, $options: "i" } },
        { "address.city": { $regex: search, $options: "i" } },
        { "address.state": { $regex: search, $options: "i" } },
      ];
    }

    const data = await Property.find(query)
      .populate("customer", "name")
      .populate("propertyManager", "firstName lastName")
      .populate("buildings")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Property.countDocuments(query);

    res.json({
      success: true,
      data,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   GET SINGLE PROPERTY
===================================================== */
exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    })
      .populate("customer")
      .populate("propertyManager")
      .populate("buildings");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    res.json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   UPDATE PROPERTY (NO REGEN)
===================================================== */
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (req.body.redundantRouteService !== undefined) {
      property.redundantRouteService = parseBoolean(
        req.body.redundantRouteService
      );
    }

    const fields = [
      "customer",
      "propertyManager",
      "propertyName",
      "propertyType",
      "addressType",
      "address",
      "radiusMiles",
      "serviceAgreement",
      "serviceAlertSMS",
      "isActive",
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) property[f] = req.body[f];
    });

    await property.save();

    res.json({ success: true, message: "Property updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   TOGGLE STATUS
===================================================== */
exports.togglePropertyStatus = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    property.isActive = !property.isActive;
    await property.save();

    res.json({ success: true, message: "Property status updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   SOFT DELETE
===================================================== */
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    property.isDeleted = true;
    await property.save();

    res.json({ success: true, message: "Property deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
