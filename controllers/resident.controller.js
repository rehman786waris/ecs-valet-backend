const Resident = require("../models/residents/resident.model");
const Building = require("../models/buildings.model");
const Property = require("../models/properties/property.model");

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildPropertyManagerAccessFilter = async (req) => {
  let allowedProperties = (req.user?.properties || []).map((id) => String(id));
  if (!allowedProperties.length && req.userType === "PROPERTY_MANAGER") {
    const ids = await Property.find({
      propertyManager: req.user?._id,
    }).distinct("_id");
    allowedProperties = ids.map((id) => String(id));
  }
  return {
    allowedProperties,
    accessFilter: {
      $or: [
        { property: { $in: allowedProperties } },
        { createdBy: req.user?._id },
      ],
    },
  };
};

/* =====================================================
   CREATE RESIDENT
===================================================== */
exports.createResident = async (req, res) => {
  try {
    if (req.body?.unit) {
      const unitValue = String(req.body.unit).trim();
      if (!unitValue) {
        return res.status(400).json({ message: "Unit is required" });
      }

      const buildingQuery = {
        "units.unitNumber": new RegExp(`^${escapeRegExp(unitValue)}$`, "i"),
      };
      if (req.body.property) {
        buildingQuery.property = req.body.property;
      }
      if (req.body.building) {
        buildingQuery._id = req.body.building;
      }
      if (!req.body.property && !req.body.building && req.userType === "PROPERTY_MANAGER") {
        const { allowedProperties } = await buildPropertyManagerAccessFilter(req);
        if (allowedProperties.length) {
          buildingQuery.property = { $in: allowedProperties };
        }
      }

      const building = await Building.findOne(buildingQuery).select(
        "_id property"
      );

      if (!building) {
        return res.status(404).json({ message: "Unit not found" });
      }

      if (
        req.body.building &&
        String(req.body.building) !== String(building._id)
      ) {
        return res.status(400).json({
          message: "Building does not match unit",
        });
      }

      if (
        req.body.property &&
        String(req.body.property) !== String(building.property)
      ) {
        return res.status(400).json({
          message: "Property does not match unit",
        });
      }

      req.body.unit = unitValue;
      req.body.building = building._id;
      req.body.property = building.property;
    }

    if (req.body.email) {
      req.body.email = String(req.body.email).trim().toLowerCase();
    }

    const { allowedProperties } = await buildPropertyManagerAccessFilter(req);
    if (
      req.body.property &&
      !allowedProperties.includes(String(req.body.property))
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.body.property && req.body.unit) {
      const existingByUnit = await Resident.findOne({
        property: req.body.property,
        unit: req.body.unit,
      }).select("_id");
      if (existingByUnit) {
        return res
          .status(409)
          .json({ message: "Resident already exists for this unit" });
      }
    }

    if (req.body.email) {
      const existingByEmail = await Resident.findOne({
        email: req.body.email,
      }).select("_id");
      if (existingByEmail) {
        return res
          .status(409)
          .json({ message: "Resident with this email already exists" });
      }
    }

    const resident = await Resident.create({
      ...req.body,
      createdBy: req.user._id, // from auth middleware
    });

    res.status(201).json({
      message: "Resident created successfully",
      data: resident,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* =====================================================
   GET ALL RESIDENTS (WITH FILTERS)
===================================================== */
exports.getResidents = async (req, res) => {
  try {
    const { property, search, isActive = true } = req.query;

    const { allowedProperties, accessFilter } =
      await buildPropertyManagerAccessFilter(req);
    const filter = { isActive };
    const and = [accessFilter];

    if (property) {
      if (!allowedProperties.includes(String(property))) {
        return res.status(403).json({ message: "Access denied" });
      }
      filter.property = property;
    }

    if (search) {
      and.push({
        $or: [
          { firstName: new RegExp(search, "i") },
          { lastName: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
          { unit: new RegExp(search, "i") },
        ],
      });
    }

    if (and.length > 0) {
      filter.$and = and;
    }

    const residents = await Resident.find(filter)
      .populate("property", "name address")
      .populate("building", "name")
      .sort({ createdAt: -1 });

    res.json({ data: residents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET SINGLE RESIDENT
===================================================== */
exports.getResidentById = async (req, res) => {
  try {
    const { accessFilter } = await buildPropertyManagerAccessFilter(req);
    const resident = await Resident.findOne({ _id: req.params.id, ...accessFilter })
      .populate("property")
      .populate("building");

    if (!resident)
      return res.status(404).json({ message: "Resident not found" });

    res.json({ data: resident });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   UPDATE RESIDENT
===================================================== */
exports.updateResident = async (req, res) => {
  try {
    const { allowedProperties, accessFilter } =
      await buildPropertyManagerAccessFilter(req);
    if (req.body.property && !allowedProperties.includes(String(req.body.property))) {
      return res.status(403).json({ message: "Access denied" });
    }

    const existing = await Resident.findOne({
      _id: req.params.id,
      ...accessFilter,
    });
    if (!existing) {
      return res.status(404).json({ message: "Resident not found" });
    }

    const nextProperty =
      req.body.property !== undefined ? req.body.property : existing.property;
    const nextUnit = req.body.unit !== undefined ? req.body.unit : existing.unit;
    let nextEmail =
      req.body.email !== undefined ? req.body.email : existing.email;

    if (nextEmail) {
      nextEmail = String(nextEmail).trim().toLowerCase();
      req.body.email = nextEmail;
    }

    if (nextProperty && nextUnit) {
      const conflictByUnit = await Resident.findOne({
        _id: { $ne: req.params.id },
        property: nextProperty,
        unit: nextUnit,
      }).select("_id");
      if (conflictByUnit) {
        return res
          .status(409)
          .json({ message: "Resident already exists for this unit" });
      }
    }

    if (nextEmail) {
      const conflictByEmail = await Resident.findOne({
        _id: { $ne: req.params.id },
        email: nextEmail,
      }).select("_id");
      if (conflictByEmail) {
        return res
          .status(409)
          .json({ message: "Resident with this email already exists" });
      }
    }

    const resident = await Resident.findOneAndUpdate(
      { _id: req.params.id, ...accessFilter },
      req.body,
      { new: true }
    );

    if (!resident)
      return res.status(404).json({ message: "Resident not found" });

    res.json({
      message: "Resident updated successfully",
      data: resident,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* =====================================================
   SOFT DELETE RESIDENT
===================================================== */
exports.deleteResident = async (req, res) => {
  try {
    const { accessFilter } = await buildPropertyManagerAccessFilter(req);
    const resident = await Resident.findOneAndUpdate(
      { _id: req.params.id, ...accessFilter },
      { isActive: false },
      { new: true }
    );

    if (!resident)
      return res.status(404).json({ message: "Resident not found" });

    res.json({ message: "Resident deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
