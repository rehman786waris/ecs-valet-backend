const Task = require("../models/tasks/task.model");

/* =====================================================
   CREATE TASK
===================================================== */
exports.createTask = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const {
      title,
      description,
      startDate,
      endDate,
      frequency,
      taskOwner,
      property,
      photoRequired,
      notifyPropertyManager,
    } = req.body;

    const task = await Task.create({
      title,
      description,
      startDate,
      endDate,
      frequency,
      taskOwner,
      property,
      photoRequired,
      notifyPropertyManager,
      createdBy: currentUserId,
    });

    res.status(201).json({
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create task",
      error: error.message,
    });
  }
};


/* =====================================================
   GET ALL TASKS (pagination + search)
===================================================== */
exports.getTasks = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const { search = "", status } = req.query;

    const query = { isActive: true };

    if (status) query.status = status;

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate("taskOwner", "firstName lastName")
        .populate("property", "propertyName")
        .populate("createdBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Task.countDocuments(query),
    ]);

    res.json({
      total,
      page,
      limit,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};


/* =====================================================
   GET TASK BY ID
===================================================== */
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("taskOwner", "firstName lastName")
      .populate("property", "name")
      .populate("createdBy", "firstName lastName");

    if (!task || !task.isActive) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch task",
      error: error.message,
    });
  }
};


/* =====================================================
   UPDATE TASK
===================================================== */
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task || !task.isActive) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Protect system fields
    delete req.body.createdBy;
    delete req.body.completedAt;

    Object.assign(task, req.body);

    // Auto-set completedAt
    if (req.body.status === "Completed") {
      task.completedAt = new Date();
    }

    if (req.body.status && req.body.status !== "Completed") {
      task.completedAt = null;
    }

    await task.save();

    res.json({
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update task",
      error: error.message,
    });
  }
};



/* =====================================================
   ENABLE / DISABLE TASK
===================================================== */
exports.toggleTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.isActive = !task.isActive;
    await task.save();

    res.json({
      message: `Task ${task.isActive ? "enabled" : "disabled"} successfully`,
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update task status",
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE TASK (SOFT DELETE)
===================================================== */
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.isActive = false;
    task.status = "Cancelled";
    await task.save();

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete task",
      error: error.message,
    });
  }
};

