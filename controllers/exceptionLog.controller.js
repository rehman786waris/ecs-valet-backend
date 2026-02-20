const ExceptionLog = require("../models/reports/exceptionLog.model");
const Property = require("../models/properties/property.model");

/* ===============================
   CREATE EXCEPTION LOG
================================ */
exports.createExceptionLog = async (req, res) => {
  try {
    const {
      title,
      description,
      exceptionType,
      employee,
      property,
    } = req.body;

    const prop = await Property.findById(property).lean();
    if (!prop) {
      return res.status(404).json({ message: "Property not found" });
    }

    const exception = await ExceptionLog.create({
      title,
      description,
      exceptionType,
      employee,
      property,
      propertySnapshot: {
        address: prop.address
          ? `${prop.address.street || ""} ${prop.address.city || ""} ${prop.address.state || ""} ${prop.address.zip || ""}`.trim()
          : "",
        type: prop.propertyType,
      },
    });

    res.status(201).json(exception);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   LIST EXCEPTIONS (MANAGE SCREEN)
================================ */
exports.getExceptionLogs = async (req, res) => {
  try {
    const {
      propertyId,
      exceptionType,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (page - 1) * limit;

    const match = { isActive: true };

    if (propertyId) match.property = propertyId;
    if (exceptionType) match.exceptionType = exceptionType;
    if (status) match.status = status;

    const totalRecords = await ExceptionLog.countDocuments(match);

    const logs = await ExceptionLog.find(match)
      .populate("exceptionType", "name category")
      .populate("employee", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    res.json({
      page: Number(page),
      limit: Number(limit),
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      data: logs.map((log) => ({
        title: log.title,
        description: log.description,
        exceptionType: log.exceptionType.name,
        employeeId: log.employee?._id || null,
        employeeName: log.employee
          ? `${log.employee.firstName || ""} ${log.employee.lastName || ""}`.trim()
          : "Unknown",
        propertyDetail: log.propertySnapshot,
        status: log.status,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   RESOLVE EXCEPTION
================================ */
exports.resolveException = async (req, res) => {
  try {
    const { id } = req.params;

    const exception = await ExceptionLog.findById(id);
    if (!exception) {
      return res.status(404).json({ message: "Exception not found" });
    }

    exception.status = "Resolved";
    exception.resolvedAt = new Date();

    await exception.save();

    res.json({ message: "Exception resolved successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
