const Task = require("../models/tasks/task.model");

/* =====================================================
   CREATE TASK
===================================================== */
exports.createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);

    return res.status(201).json({
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    return res.status(500).json({
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
    const { page = 1, limit = 10, search = "", status } = req.query;

    const query = {
      isActive: true,
    };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { unitNumber: { $regex: search, $options: "i" } },
      ];
    }

    const tasks = await Task.find(query)
      .populate("taskOwner", "name")
      .populate("property", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Task.countDocuments(query);

    return res.status(200).json({
      total,
      page: Number(page),
      limit: Number(limit),
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({
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
      .populate("taskOwner", "name")
      .populate("property", "name")
      .populate("createdBy", "name");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json(task);
  } catch (error) {
    return res.status(500).json({
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
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Auto set completedAt when task is completed
    if (req.body.status === "Completed") {
      task.completedAt = new Date();
      await task.save();
    }

    return res.status(200).json({
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      message: `Task ${task.isActive ? "enabled" : "disabled"} successfully`,
      data: task,
    });
  } catch (error) {
    return res.status(500).json({
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
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete task",
      error: error.message,
    });
  }
};
