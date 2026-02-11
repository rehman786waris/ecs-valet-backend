const Resident = require("../models/residents/resident.model");
const Building = require("../models/buildings.model");

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildPropertyManagerAccessFilter = (req) => {
  const allowedProperties = (req.user?.properties || []).map((id) => String(id));
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

      const building = await Building.findOne({
        "units.unitNumber": new RegExp(`^${escapeRegExp(unitValue)}$`, "i"),
      }).select("_id property");

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

    const { allowedProperties } = buildPropertyManagerAccessFilter(req);
    if (
      req.body.property &&
      !allowedProperties.includes(String(req.body.property))
    ) {
      return res.status(403).json({ message: "Access denied" });
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

    const { allowedProperties, accessFilter } = buildPropertyManagerAccessFilter(req);
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
    const { accessFilter } = buildPropertyManagerAccessFilter(req);
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
    const { allowedProperties, accessFilter } = buildPropertyManagerAccessFilter(req);
    if (req.body.property && !allowedProperties.includes(String(req.body.property))) {
      return res.status(403).json({ message: "Access denied" });
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
    const { accessFilter } = buildPropertyManagerAccessFilter(req);
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
