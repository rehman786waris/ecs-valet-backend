const MessageBroadcast = require("../models/message_broadcast/messageBroadcast.model");
const MessageBroadcastLog = require("../models/message_broadcast/messageBroadcastLog.model");
const Employee = require("../models/employees/employee.model");
const Property = require("../models/properties/property.model");

const resolveCreatedByType = (userType) => {
  if (userType === "PROPERTY_MANAGER") return "PropertyManager";
  if (userType === "EMPLOYEE") return "Employee";
  return "User";
};

const resolveCompanyId = async (req) => {
  if (req.user?.company) return req.user.company;

  if (req.userType === "PROPERTY_MANAGER") {
    const propertyId = Array.isArray(req.user.properties)
      ? req.user.properties[0]
      : null;
    if (propertyId) {
      const property = await Property.findById(propertyId).select("company");
      return property?.company || null;
    }
  }

  if (req.userType === "EMPLOYEE") {
    const employeeProperties =
      Array.isArray(req.user.properties) && req.user.properties.length
        ? req.user.properties
        : req.user.property
          ? [req.user.property]
          : [];
    if (!employeeProperties.length) return null;
    const property = await Property.findById(employeeProperties[0]).select(
      "company"
    );
    return property?.company || null;
  }

  return null;
};

const normalizeRecipients = (body) => {
  if (Array.isArray(body.recipients)) return body.recipients;
  if (Array.isArray(body.userIds)) return body.userIds;
  if (body.recipientId) return [body.recipientId];
  if (body.userId) return [body.userId];
  return [];
};

/* =====================================================
   CREATE MESSAGE BROADCAST
===================================================== */
exports.createMessageBroadcast = async (req, res) => {
  try {
    const { title, message, channel, propertyId } = req.body;
    const recipientsInput = normalizeRecipients(req.body);

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    let property = null;
    if (propertyId) {
      property = await Property.findById(propertyId).select("company");
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
    }

    let recipients = [];
    if (recipientsInput.length) {
      const query = { _id: { $in: recipientsInput }, isDeleted: false };
      if (propertyId) {
        query.$or = [{ property: propertyId }, { properties: propertyId }];
      }
      const employees = await Employee.find(query).select(
        "_id email role property isActive"
      );
      const activeEmployees = employees.filter((e) => e.isActive);
      recipients = activeEmployees.map((e) => e._id);

      if (!recipients.length) {
        return res.status(400).json({
          message: "No active recipients found for the selected property",
        });
      }
    } else if (propertyId) {
      const employees = await Employee.find({
        $or: [{ property: propertyId }, { properties: propertyId }],
        isDeleted: false,
        isActive: true,
      }).select("_id email role property");
      recipients = employees.map((e) => e._id);
    }

    if (!recipients.length) {
      return res.status(400).json({
        message: "Recipients are required (select user or property)",
      });
    }

    let companyId = property?.company;
    if (!companyId) {
      const firstEmployee = await Employee.findById(recipients[0]).select(
        "property properties"
      );
      const firstPropertyId =
        firstEmployee?.properties?.[0] || firstEmployee?.property || null;
      if (!firstPropertyId) {
        return res
          .status(400)
          .json({ message: "Unable to resolve company for recipients" });
      }
      const prop = await Property.findById(firstPropertyId).select(
        "company"
      );
      companyId = prop?.company;
    }

    if (!companyId) {
      return res
        .status(400)
        .json({ message: "Unable to resolve company for recipients" });
    }

    const createdByType = resolveCreatedByType(req.userType);

    const broadcast = await MessageBroadcast.create({
      title,
      message,
      channel,
      company: companyId,
      recipients,
      createdBy: { id: req.user._id, type: createdByType },
      status: "Sent",
      sentAt: new Date(),
    });

    const employees = await Employee.find({ _id: { $in: recipients } }).select(
      "_id email role"
    );

    if (employees.length) {
      const logs = employees.map((e) => ({
        broadcast: broadcast._id,
        recipient: e._id,
        email: e.email,
        role: e.role,
        status: "Sent",
      }));
      await MessageBroadcastLog.insertMany(logs);
    }

    return res.status(201).json({
      message: "Message broadcast created successfully",
      data: broadcast,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create message broadcast",
      error: error.message,
    });
  }
};

/* =====================================================
   GET MESSAGE BROADCASTS (FILTERS + PAGINATION)
===================================================== */
exports.getMessageBroadcasts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      channel,
      propertyId,
      recipientId,
    } = req.query;
    const safePage = Math.max(parseInt(page) || 1, 1);
    const safeLimit = Math.max(parseInt(limit) || 10, 1);

    const companyId = await resolveCompanyId(req);
    if (!companyId) {
      return res.status(400).json({ message: "Company not resolved" });
    }

    const query = { company: companyId };
    if (status) query.status = status;
    if (channel) query.channel = channel;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }
    if (recipientId) {
      query.recipients = recipientId;
    }
    if (propertyId) {
      const employeeIds = await Employee.find({
        $or: [{ property: propertyId }, { properties: propertyId }],
        isDeleted: false,
      }).distinct("_id");
      if (!employeeIds.length) {
        return res.status(200).json({
          total: 0,
          page: safePage,
          limit: safeLimit,
          data: [],
        });
      }
      query.recipients = { $in: employeeIds };
    }

    const broadcasts = await MessageBroadcast.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean();

    const total = await MessageBroadcast.countDocuments(query);

    const allRecipientIds = [
      ...new Set(
        broadcasts.flatMap((b) => (Array.isArray(b.recipients) ? b.recipients : []))
      ),
    ];
    const recipientsMap = {};
    if (allRecipientIds.length) {
      const employees = await Employee.find({ _id: { $in: allRecipientIds } })
        .select("firstName lastName email username")
        .lean();
      employees.forEach((e) => {
        recipientsMap[e._id.toString()] = {
          id: e._id,
          name: `${e.firstName || ""} ${e.lastName || ""}`.trim(),
          email: e.email,
          username: e.username,
        };
      });
    }

    const data = broadcasts.map((b) => {
      const recipientIds = Array.isArray(b.recipients) ? b.recipients : [];
      const preview = recipientIds
        .slice(0, 3)
        .map((id) => recipientsMap[id.toString()])
        .filter(Boolean);
      return {
        ...b,
        recipientsCount: recipientIds.length,
        recipientsPreview: preview,
      };
    });

    return res.status(200).json({
      total,
      page: safePage,
      limit: safeLimit,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch message broadcasts",
      error: error.message,
    });
  }
};
