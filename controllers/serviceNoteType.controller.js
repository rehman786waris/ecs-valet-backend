const ServiceNoteType = require(
  "../models/service/serviceNoteType.model"
);

/* =====================================================
   CREATE SERVICE NOTE TYPE
===================================================== */
exports.createNoteType = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    const exists = await ServiceNoteType.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (exists) {
      return res.status(409).json({
        message: "Service note type already exists",
      });
    }

    const noteType = await ServiceNoteType.create({
      name: name.trim(),
      description,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Service note type created successfully",
      data: noteType,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create service note type",
      error: error.message,
    });
  }
};

/* =====================================================
   GET ALL SERVICE NOTE TYPES
===================================================== */
exports.getNoteTypes = async (req, res) => {
  try {
    const { isActive } = req.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    } else {
      query.isActive = true;
    }

    const noteTypes = await ServiceNoteType.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "firstName lastName");

    res.json({
      total: noteTypes.length,
      data: noteTypes,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch service note types",
      error: error.message,
    });
  }
};

/* =====================================================
   GET SERVICE NOTE TYPE BY ID
===================================================== */
exports.getNoteTypeById = async (req, res) => {
  try {
    const noteType = await ServiceNoteType.findById(req.params.id)
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName");

    if (!noteType) {
      return res.status(404).json({
        message: "Service note type not found",
      });
    }

    res.json(noteType);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch service note type",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE SERVICE NOTE TYPE
===================================================== */
exports.updateNoteType = async (req, res) => {
  try {
    const noteType = await ServiceNoteType.findById(req.params.id);

    if (!noteType) {
      return res.status(404).json({
        message: "Service note type not found",
      });
    }

    if (noteType.isSystem) {
      return res.status(403).json({
        message: "System note types cannot be modified",
      });
    }

    const { name, description, isActive } = req.body;

    if (name) {
      const exists = await ServiceNoteType.findOne({
        _id: { $ne: noteType._id },
        name: { $regex: `^${name}$`, $options: "i" },
      });

      if (exists) {
        return res.status(409).json({
          message: "Another service note type with this name already exists",
        });
      }

      noteType.name = name.trim();
      noteType.slug = name.toLowerCase().replace(/\s+/g, "_");
    }

    if (description !== undefined) {
      noteType.description = description;
    }

    if (typeof isActive === "boolean") {
      noteType.isActive = isActive;
    }

    noteType.updatedBy = req.user.id;
    await noteType.save();

    res.json({
      message: "Service note type updated successfully",
      data: noteType,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update service note type",
      error: error.message,
    });
  }
};

/* =====================================================
   ENABLE / DISABLE SERVICE NOTE TYPE
===================================================== */
exports.toggleNoteTypeStatus = async (req, res) => {
  try {
    const noteType = await ServiceNoteType.findById(req.params.id);

    if (!noteType) {
      return res.status(404).json({
        message: "Service note type not found",
      });
    }

    if (noteType.isSystem) {
      return res.status(403).json({
        message: "System note types cannot be disabled",
      });
    }

    noteType.isActive = !noteType.isActive;
    noteType.updatedBy = req.user.id;
    await noteType.save();

    res.json({
      message: `Service note type ${
        noteType.isActive ? "enabled" : "disabled"
      } successfully`,
      data: noteType,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update service note type status",
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE SERVICE NOTE TYPE (SOFT DELETE)
===================================================== */
exports.deleteNoteType = async (req, res) => {
  try {
    const noteType = await ServiceNoteType.findById(req.params.id);

    if (!noteType) {
      return res.status(404).json({
        message: "Service note type not found",
      });
    }

    if (noteType.isSystem) {
      return res.status(403).json({
        message: "System note types cannot be deleted",
      });
    }

    if (!noteType.isActive) {
      return res.status(400).json({
        message: "Service note type already deleted",
      });
    }

    noteType.isActive = false;
    noteType.deletedAt = new Date();
    noteType.updatedBy = req.user.id;
    await noteType.save();

    res.json({
      message: "Service note type deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete service note type",
      error: error.message,
    });
  }
};
