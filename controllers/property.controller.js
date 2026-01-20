const Property = require("../models/properties/property.model");

/* =====================================================
   CREATE PROPERTY
===================================================== */
exports.createProperty = async (req, res) => {
  try {
    const data = req.body;

    if (data.redundantRouteService !== undefined) {
      data.redundantRouteService =
        data.redundantRouteService === true ||
        data.redundantRouteService === "true";
    }

    // Attach images to buildings
    if (req.files?.length && data.buildings) {
      const buildings = JSON.parse(data.buildings);

      buildings[0].images = req.files.map(
        (file) => file.location
      );

      data.buildings = buildings;
    }

    const property = await Property.create({
      ...data,
      company: req.user.company,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Property created successfully",
      data: property,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =====================================================
   GET ALL PROPERTIES (WITH FILTERS)
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
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Property.countDocuments(query);

    res.json({
      data: properties,
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
      .populate("createdBy", "firstName lastName");

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json({ data: property });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   UPDATE PROPERTY
===================================================== */
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      company: req.user.company,
      isDeleted: false,
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (req.files?.length && req.body.buildings) {
      const buildings = JSON.parse(req.body.buildings);
      buildings[0].images = [
        ...(buildings[0].images || []),
        ...req.files.map((file) => file.location),
      ];
      property.buildings = buildings;
    }

    const allowedFields = [
      "customer",
      "propertyManager",
      "redundantRouteService",
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
      if (req.body[field] !== undefined) {
        property[field] = req.body[field];
      }
    });

    await property.save();

    res.json({
      message: "Property updated successfully",
      data: property,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      return res.status(404).json({ message: "Property not found" });
    }

    property.isActive = !property.isActive;
    await property.save();

    res.json({
      message: "Property status updated",
      data: property,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      return res.status(404).json({ message: "Property not found" });
    }

    property.isDeleted = true;
    await property.save();

    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
