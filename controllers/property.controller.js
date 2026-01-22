const Property = require("../models/properties/property.model");
const Building = require("../models/buildings.model");

/* =====================================================
   HELPER: PARSE BOOLEAN
===================================================== */
const parseBoolean = (value) =>
  value === true || value === "true" || value === "on";

/* =====================================================
   CREATE PROPERTY
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

    // Create property
    const property = await Property.create({
      ...data,
      company: req.user.company,
      createdBy: req.user._id,
      buildings: [],
    });

    const files = req.files || [];
    let fileIndex = 0;

    const createdBuildings = [];

    for (let i = 0; i < buildingsPayload.length; i++) {
      const b = buildingsPayload[i];

      // Assign files sequentially per building
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

      createdBuildings.push(building._id);
    }

    property.buildings = createdBuildings;
    await property.save();

    res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: property,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* =====================================================
   GET ALL PROPERTIES
===================================================== */
exports.getProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      customer,
      propertyManager,
    } = req.query;

    const query = {
      company: req.user.company,
      isDeleted: false,
    };

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

    const properties = await Property.find(query)
      .populate("customer", "name")
      .populate("propertyManager", "firstName lastName")
      .populate({
        path: "buildings",
        select: "name numberOfUnits buildingOrder images isActive",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Property.countDocuments(query);

    res.json({
      success: true,
      data: properties,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
      },
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
      .populate("createdBy", "firstName lastName")
      .populate("buildings");

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    res.json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   UPDATE PROPERTY (PROPERTY ONLY)
===================================================== */
exports.updateProperty = async (req, res) => {
  try {
    const data = req.body;

    const property = await Property.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    /* ======================
       BOOLEAN FIX
    ====================== */
    if (data.redundantRouteService !== undefined) {
      property.redundantRouteService = parseBoolean(
        data.redundantRouteService
      );
    }

    /* ======================
       UPDATE PROPERTY FIELDS
    ====================== */
    const allowedFields = [
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

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        property[field] = data[field];
      }
    });

    /* ======================
       UPDATE BUILDING IMAGES
    ====================== */
    if (data.buildings && req.files?.length) {
      const buildingsPayload = JSON.parse(data.buildings);
      const files = req.files;
      let fileIndex = 0;

      for (let i = 0; i < buildingsPayload.length; i++) {
        const b = buildingsPayload[i];

        if (!b._id || !b.imageCount) continue;

        const building = await Building.findOne({
          _id: b._id,
          property: property._id,
        });

        if (!building) continue;

        for (let j = 0; j < b.imageCount; j++) {
          if (files[fileIndex]) {
            building.images.push({
              url: files[fileIndex].location,
            });
            fileIndex++;
          }
        }

        // 🔥 THIS updates building.updatedAt
        await building.save();
      }
    }

    // 🔥 THIS updates property.updatedAt
    await property.save();

    res.json({
      success: true,
      message: "Property updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   TOGGLE PROPERTY STATUS
===================================================== */
exports.togglePropertyStatus = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    property.isActive = !property.isActive;
    await property.save();

    res.json({
      success: true,
      message: "Property status updated",
      data: property,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   SOFT DELETE PROPERTY
===================================================== */
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    property.isDeleted = true;
    await property.save();

    res.json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
