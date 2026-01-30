const ServiceNote = require("../models/service/serviceNote.model");
const ServiceNoteStatus = require("../models/service/serviceNoteStatus.model");
const mongoose = require("mongoose");

/* =====================================================
   CREATE SERVICE NOTE (WITH IMAGES)
===================================================== */
exports.createServiceNote = async (req, res) => {
  try {
    // 1️⃣ Default status
    const defaultStatus = await ServiceNoteStatus.findOne({
      code: "NEW",
      isActive: true,
    });

    if (!defaultStatus) {
      return res.status(400).json({
        message: "Default status (NEW) is not configured",
      });
    }

    // 2️⃣ Images
    const images =
      req.files?.map((file) => ({
        url: file.location,
        uploadedBy: new mongoose.Types.ObjectId(req.user._id),
        uploadedAt: new Date(),
      })) || [];

    // 3️⃣ Create note
    const note = await ServiceNote.create({
      user: new mongoose.Types.ObjectId(req.user._id),
      property: req.body.property,
      unitNumber: req.body.unitNumber,
      subject: req.body.subject,
      noteType: req.body.noteType,
      description: req.body.description,

      status: defaultStatus._id,
      images,
      createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    // 4️⃣ RE-FETCH WITH POPULATE (IMPORTANT)
    const populatedNote = await ServiceNote.findById(note._id)
      .populate("user", "username")
      .populate("property", "propertyName")
      .populate("subject", "name")
      .populate("noteType", "name")
      .populate("status", "name code")
      .lean();

    // 5️⃣ FORMAT RESPONSE
    const response = {
      _id: populatedNote._id,
      unitNumber: populatedNote.unitNumber,
      description: populatedNote.description,
      images: populatedNote.images,
      readAt: populatedNote.readAt,
      createdAt: populatedNote.createdAt,

      status: populatedNote.status,
      noteType: populatedNote.noteType,

      // ✅ USER
      userId: populatedNote.user?._id ?? null,
      username: populatedNote.user?.username ?? null,

      // ✅ PROPERTY
      propertyId: populatedNote.property?._id ?? null,
      propertyName: populatedNote.property?.propertyName ?? null,

      // ✅ SUBJECT
      subjectId: populatedNote.subject?._id ?? null,
      subjectName: populatedNote.subject?.name ?? null,
    };

    return res.status(201).json({
      message: "Service note created successfully",
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create service note",
      error: error.message,
    });
  }
};



/* =====================================================
   GET ALL SERVICE NOTES
===================================================== */
exports.getServiceNotes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      noteType,
      property,
      subject,
      user,
    } = req.query;

    const query = { isActive: true };

    /* ================= STATUS ================= */
    if (status) {
      if (mongoose.Types.ObjectId.isValid(status)) {
        query.status = status;
      } else {
        const statusDoc = await ServiceNoteStatus.findOne({
          code: status.toUpperCase(),
          isActive: true,
        }).lean();

        if (!statusDoc) {
          return res.status(400).json({ message: "Invalid status filter" });
        }

        query.status = statusDoc._id;
      }
    }

    /* ================= NOTE TYPE ================= */
    if (noteType) {
      query.noteType = noteType;
    }

    /* ================= PROPERTY ================= */
    if (property) {
      query.property = property;
    }

    /* ================= SUBJECT ================= */
    if (subject) {
      if (mongoose.Types.ObjectId.isValid(subject)) {
        query.subject = subject;
      } else {
        const subjectDoc = await ServiceNoteSubject.findOne({
          name: { $regex: subject, $options: "i" },
          isActive: true,
        }).lean();

        if (!subjectDoc) {
          return res.status(400).json({ message: "Invalid subject filter" });
        }

        query.subject = subjectDoc._id;
      }
    }

    /* ================= USER ================= */
    if (user) {
      if (mongoose.Types.ObjectId.isValid(user)) {
        query.user = user;
      } else {
        const userDoc = await User.findOne({
          username: { $regex: user, $options: "i" },
          isActive: true,
        }).lean();

        if (!userDoc) {
          return res.status(400).json({ message: "Invalid user filter" });
        }

        query.user = userDoc._id;
      }
    }

    /* ================= SEARCH ================= */
    if (search) {
      query.$or = [
        { unitNumber: { $regex: search, $options: "i" } },
      ];
    }

    /* ================= FETCH ================= */
    const notes = await ServiceNote.find(query)
      .populate("user", "username")              // ✅ FIXED
      .populate("property", "propertyName")      // ✅ FIXED
      .populate("subject", "name")
      .populate("noteType", "name")
      .populate("status", "name code")
      .populate("createdBy", "userName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await ServiceNote.countDocuments(query);

    /* ================= FORMAT ================= */
    const formattedNotes = notes.map((n) => ({
      _id: n._id,
      unitNumber: n.unitNumber,
      description: n.description,
      images: n.images,
      readAt: n.readAt,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,

      // STATUS
      status: n.status,

      // NOTE TYPE
      noteType: n.noteType,

      // USER
      userId: n.user?._id ?? null,
      username: n.user?.username ?? null,

      // PROPERTY
      propertyId: n.property?._id ?? null,
      propertyName: n.property?.propertyName ?? null,

      // SUBJECT
      subjectId: n.subject?._id ?? null,
      subjectName: n.subject?.name ?? null,
    }));

    return res.status(200).json({
      total,
      page: Number(page),
      limit: Number(limit),
      data: formattedNotes,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch service notes",
      error: error.message,
    });
  }
};



/* =====================================================
   GET SERVICE NOTE BY ID
===================================================== */
exports.getServiceNoteById = async (req, res) => {
  try {
    const note = await ServiceNote.findById(req.params.id)
      .populate("user", "userName")
      .populate("property", "PropertyName")
      .populate("subject", "name")
      .populate("noteType", "name")
      .populate("status", "name code")
      .populate("createdBy", "name");

    if (!note) {
      return res.status(404).json({
        message: "Service note not found",
      });
    }

    return res.status(200).json(note);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch service note",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE SERVICE NOTE (WITH IMAGES & STATUS)
===================================================== */
exports.updateServiceNote = async (req, res) => {
  try {
    const note = await ServiceNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        message: "Service note not found",
      });
    }

    const previousStatus = note.status?.toString();

    Object.assign(note, req.body);

    // 🔹 Append images
    if (req.files?.length) {
      const images = req.files.map((file) => ({
        url: file.location,
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
      }));
      note.images.push(...images);
    }

    // 🔹 Handle status change
    if (req.body.status && req.body.status !== previousStatus) {
      const statusObj = await ServiceNoteStatus.findById(req.body.status);

      if (!statusObj || !statusObj.isActive) {
        return res.status(400).json({
          message: "Invalid or inactive status",
        });
      }

      // 📌 READ logic
      if (statusObj.code === "READ") {
        note.readAt = new Date();
      }
    }

    await note.save();

    return res.status(200).json({
      message: "Service note updated successfully",
      data: note,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update service note",
      error: error.message,
    });
  }
};

/* =====================================================
   ENABLE / DISABLE SERVICE NOTE
===================================================== */
exports.toggleServiceNoteStatus = async (req, res) => {
  try {
    const note = await ServiceNote.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Service note not found",
      });
    }

    note.isActive = !note.isActive;
    await note.save();

    return res.status(200).json({
      message: `Service note ${
        note.isActive ? "enabled" : "disabled"
      } successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update service note status",
      error: error.message,
    });
  }
};

/* =====================================================
   SOFT DELETE SERVICE NOTE
===================================================== */
exports.deleteServiceNote = async (req, res) => {
  try {
    const note = await ServiceNote.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({
        message: "Service note not found",
      });
    }

    return res.status(200).json({
      message: "Service note deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete service note",
      error: error.message,
    });
  }
};
