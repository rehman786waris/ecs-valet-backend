const mongoose = require("mongoose");
const Property = require("../models/properties/property.model");
const Building = require("../models/buildings.model");
const BinTag = require("../models/properties/binTag.model");

const generateAndUploadQRCode = require("../utils/generateAndUploadQRCode");

/* =====================================================
   HELPERS
===================================================== */
const toObjectIds = (ids) =>
  (ids || [])
    .map((id) =>
      mongoose.Types.ObjectId.isValid(id)
        ? new mongoose.Types.ObjectId(id)
        : null
    )
    .filter(Boolean);

const buildPropertyAccessQuery = async (req) => {
  const base = { _id: req.params.id, isDeleted: false };

  if (req.userType === "PROPERTY_MANAGER") {
    const propertyIds = req.user.properties?.length
      ? req.user.properties
      : await Property.find({ propertyManager: req.user._id }).distinct("_id");
    const allowedIds = toObjectIds(propertyIds);
    return { $and: [base, { _id: { $in: allowedIds } }] };
  }

  if (req.userType === "EMPLOYEE") {
    const employeePropertyIds =
      Array.isArray(req.user.properties) && req.user.properties.length
        ? req.user.properties
        : req.user.property
          ? [req.user.property]
          : [];
    return { $and: [base, { _id: { $in: toObjectIds(employeePropertyIds) } }] };
  }

  if (req.user?.company) {
    return { ...base, company: req.user.company };
  }

  return base;
};

const generateUnitNumber = (bIndex, uIndex) =>
  `B${bIndex + 1}-U${uIndex + 1}`;

const generateBarcode = (propertyId, bIndex, uIndex) =>
  `BIN-${propertyId.toString().slice(-4)}-${bIndex + 1}-${uIndex + 1}`;

const generatePropertyBarcode = (propertyId) =>
  `PROP-${propertyId.toString().slice(-6)}`;

const parseBoolean = (v) => v === true || v === "true" || v === "on";
const parseNumber = (v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

const buildServiceAgreementFromBody = (body) => {
  const ag = {};
  if (body["serviceAgreement.pickupStartDate"] !== undefined) {
    ag.pickupStartDate = new Date(body["serviceAgreement.pickupStartDate"]);
  }
  if (body["serviceAgreement.pickupType"] !== undefined) {
    ag.pickupType = body["serviceAgreement.pickupType"];
  }
  if (body["serviceAgreement.binSizeWaste"] !== undefined) {
    ag.binSizeWaste = parseNumber(body["serviceAgreement.binSizeWaste"]);
  }
  if (body["serviceAgreement.binSizeRecycle"] !== undefined) {
    ag.binSizeRecycle = parseNumber(body["serviceAgreement.binSizeRecycle"]);
  }
  if (body["serviceAgreement.wasteReductionTarget"] !== undefined) {
    ag.wasteReductionTarget = parseNumber(
      body["serviceAgreement.wasteReductionTarget"]
    );
  }

  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const freq = {};
  days.forEach((d) => {
    const key = `serviceAgreement.pickupFrequency.${d}`;
    if (body[key] !== undefined) freq[d] = parseBoolean(body[key]);
  });
  if (Object.keys(freq).length) ag.pickupFrequency = freq;

  return Object.keys(ag).length ? ag : null;
};

const buildServiceAlertSMSFromBody = (body) => {
  const alert = {};
  if (body["serviceAlertSMS.propertyCheckin"] !== undefined) {
    alert.propertyCheckin = body["serviceAlertSMS.propertyCheckin"];
  }
  if (body["serviceAlertSMS.propertyCheckout"] !== undefined) {
    alert.propertyCheckout = body["serviceAlertSMS.propertyCheckout"];
  }
  if (body["serviceAlertSMS.propertyCheckInAt"] !== undefined) {
    alert.propertyCheckInAt = new Date(body["serviceAlertSMS.propertyCheckInAt"]);
  }
  if (body["serviceAlertSMS.propertyCheckOutAt"] !== undefined) {
    alert.propertyCheckOutAt = new Date(body["serviceAlertSMS.propertyCheckOutAt"]);
  }
  return Object.keys(alert).length ? alert : null;
};

const resolveEmployeeCompanyId = async (req) => {
  if (req.userType !== "EMPLOYEE") return req.user.company;
  if (req.user.company) return req.user.company;
  const employeePropertyIds =
    Array.isArray(req.user.properties) && req.user.properties.length
      ? req.user.properties
      : req.user.property
        ? [req.user.property]
        : [];
  if (!employeePropertyIds.length) return null;
  const property = await Property.findById(employeePropertyIds[0]).select(
    "company"
  );
  return property?.company || null;
};

/* =====================================================
   CREATE PROPERTY (BUILDINGS + BINTAGS + QR)
===================================================== */
exports.createProperty = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const data = req.body;

    const companyId = await resolveEmployeeCompanyId(req);
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: "Employee company is not assigned" });
    }

    if (data.redundantRouteService !== undefined) {
      data.redundantRouteService =
        req.userType === "EMPLOYEE"
          ? req.user._id
          : data.redundantRouteService;
    }

    const serviceAgreement = buildServiceAgreementFromBody(req.body);
    if (serviceAgreement) {
      data.serviceAgreement = {
        ...(data.serviceAgreement || {}),
        ...serviceAgreement,
      };
    }

    const serviceAlertSMS = buildServiceAlertSMSFromBody(req.body);
    if (serviceAlertSMS) {
      data.serviceAlertSMS = {
        ...(data.serviceAlertSMS || {}),
        ...serviceAlertSMS,
      };
    }

    const buildingsPayload = data.buildings
      ? JSON.parse(data.buildings)
      : [];
    const propertyLogoFile = req.files?.propertyLogo?.[0];

    // 1️⃣ Property
    const property = await Property.create({
      ...data,
      company: companyId,
      propertyLogo: propertyLogoFile?.location || data.propertyLogo,
      createdBy: currentUserId,
      buildings: [],
    });

    if (!property.propertyBarcode) {
      const propertyBarcode = generatePropertyBarcode(property._id);
      const propertyQrCodeImage = await generateAndUploadQRCode(propertyBarcode);
      property.propertyBarcode = propertyBarcode;
      property.propertyQrCodeImage = propertyQrCodeImage;
      await property.save();
    }

    const files = Array.isArray(req.files)
      ? req.files
      : req.files?.images || [];
    let fileIndex = 0;
    const buildingIds = [];

    // 2️⃣ Buildings + BinTags
    for (let i = 0; i < buildingsPayload.length; i++) {
      const b = buildingsPayload[i];
      const unitsPayload = Array.isArray(b.units) ? b.units : [];

      const images = [];
      const imageCount = Number(b.imageCount || 0);

      for (let j = 0; j < imageCount; j++) {
        if (files[fileIndex]) {
          images.push({ url: files[fileIndex].location });
          fileIndex++;
        }
      }

      const numberOfUnits =
        typeof b.numberOfUnits === "number"
          ? b.numberOfUnits
          : unitsPayload.length;

      const units =
        unitsPayload.length > 0
          ? unitsPayload
          : Array.from({ length: numberOfUnits }, (_, u) => ({
            unitNumber: generateUnitNumber(i, u),
          }));

      const building = await Building.create({
        property: property._id,
        name: b.name,
        numberOfUnits,
        units,
        buildingOrder: b.buildingOrder || 0,
        address: b.address,
        images,
      });

      buildingIds.push(building._id);

      const binTags = [];

      for (let u = 0; u < numberOfUnits; u++) {
        const barcode = generateBarcode(property._id, i, u);
        const qrCodeImage = await generateAndUploadQRCode(barcode);

        binTags.push({
          company: companyId,
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
          units: [{ unitNumber: generateUnitNumber(i, u) }],
          barcode,
          qrCodeImage,
          type: "Bin",
          createdBy: currentUserId,
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
      .populate("redundantRouteService", "firstName lastName email username")
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
    const property = await Property.findOne(await buildPropertyAccessQuery(req))
      .populate("customer")
      .populate("propertyManager")
      .populate("redundantRouteService", "firstName lastName email username")
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
    const property = await Property.findOne(await buildPropertyAccessQuery(req));

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (req.body.redundantRouteService !== undefined) {
      property.redundantRouteService =
        req.userType === "EMPLOYEE"
          ? req.user._id
          : req.body.redundantRouteService;
    }

    const serviceAgreement = buildServiceAgreementFromBody(req.body);
    if (serviceAgreement) {
      property.serviceAgreement = {
        ...(property.serviceAgreement?.toObject
          ? property.serviceAgreement.toObject()
          : property.serviceAgreement || {}),
        ...serviceAgreement,
      };
    }

    const serviceAlertSMS = buildServiceAlertSMSFromBody(req.body);
    if (serviceAlertSMS) {
      property.serviceAlertSMS = {
        ...(property.serviceAlertSMS?.toObject
          ? property.serviceAlertSMS.toObject()
          : property.serviceAlertSMS || {}),
        ...serviceAlertSMS,
      };
    }

    if (req.body.violationReminder !== undefined) {
      property.violationReminder = req.body.violationReminder;
    }

    if (req.files?.propertyLogo?.[0]?.location) {
      property.propertyLogo = req.files.propertyLogo[0].location;
    }

    let fields = [
      "customer",
      "propertyManager",
      "propertyName",
      "propertyType",
      "addressType",
      "address",
      "radiusMiles",
      "serviceAgreement",
      "serviceAlertSMS",
      "propertyLogo",
      "propertyCheckIn",
      "propertyCheckOut",
      "propertyCheckInAt",
      "propertyCheckOutAt",
      "violationReminder",
      "isActive",
    ];

    if (req.userType === "PROPERTY_MANAGER") {
      fields = fields.filter((f) => f !== "propertyManager");
    }

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
    const property = await Property.findOne(await buildPropertyAccessQuery(req));

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
    const property = await Property.findOne(await buildPropertyAccessQuery(req));

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
