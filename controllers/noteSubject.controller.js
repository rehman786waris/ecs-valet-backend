const NoteSubject = require("../models/service/noteSubject.model");

/* =====================================================
   CREATE NOTE SUBJECT
===================================================== */
exports.createNoteSubject = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    const exists = await NoteSubject.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (exists) {
      return res.status(409).json({
        message: "Note subject already exists",
      });
    }

    const subject = await NoteSubject.create({
      name: name.trim(),
      slug: name.toLowerCase().trim().replace(/\s+/g, "_"),
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Note subject created successfully",
      data: subject,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create note subject",
      error: error.message,
    });
  }
};

/* =====================================================
   GET ALL NOTE SUBJECTS
===================================================== */
exports.getNoteSubjects = async (req, res) => {
  try {
    const { isActive } = req.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const subjects = await NoteSubject.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "firstName lastName");

    res.json({
      total: subjects.length,
      data: subjects,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch note subjects",
      error: error.message,
    });
  }
};

/* =====================================================
   GET NOTE SUBJECT BY ID
===================================================== */
exports.getNoteSubjectById = async (req, res) => {
  try {
    const subject = await NoteSubject.findById(req.params.id)
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName");

    if (!subject) {
      return res.status(404).json({
        message: "Note subject not found",
      });
    }

    res.json(subject);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch note subject",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE NOTE SUBJECT
===================================================== */
exports.updateNoteSubject = async (req, res) => {
  try {
    const subject = await NoteSubject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        message: "Note subject not found",
      });
    }

    if (subject.isSystem) {
      return res.status(403).json({
        message: "System note subjects cannot be modified",
      });
    }

    const { name, isActive } = req.body;

    if (name) {
      const exists = await NoteSubject.findOne({
        _id: { $ne: subject._id },
        name: { $regex: `^${name}$`, $options: "i" },
      });

      if (exists) {
        return res.status(409).json({
          message: "Another note subject with this name already exists",
        });
      }

      subject.name = name.trim();
      subject.slug = name.toLowerCase().trim().replace(/\s+/g, "_");
    }

    if (typeof isActive === "boolean") {
      subject.isActive = isActive;
    }

    subject.updatedBy = req.user.id;
    await subject.save();

    res.json({
      message: "Note subject updated successfully",
      data: subject,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update note subject",
      error: error.message,
    });
  }
};

/* =====================================================
   ENABLE / DISABLE NOTE SUBJECT
===================================================== */
exports.toggleNoteSubjectStatus = async (req, res) => {
  try {
    const subject = await NoteSubject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        message: "Note subject not found",
      });
    }

    if (subject.isSystem) {
      return res.status(403).json({
        message: "System note subjects cannot be disabled",
      });
    }

    subject.isActive = !subject.isActive;
    subject.updatedBy = req.user.id;
    await subject.save();

    res.json({
      message: `Note subject ${
        subject.isActive ? "enabled" : "disabled"
      } successfully`,
      data: subject,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update note subject status",
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE NOTE SUBJECT (SOFT DELETE)
===================================================== */
exports.deleteNoteSubject = async (req, res) => {
  try {
    const subject = await NoteSubject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        message: "Note subject not found",
      });
    }

    if (subject.isSystem) {
      return res.status(403).json({
        message: "System note subjects cannot be deleted",
      });
    }

    subject.isActive = false;
    subject.updatedBy = req.user.id;
    await subject.save();

    res.json({
      message: "Note subject deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete note subject",
      error: error.message,
    });
  }
};
