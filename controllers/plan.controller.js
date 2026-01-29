const Plan = require("../models/plans/plan.model");

/* =====================================================
   CREATE PLAN
===================================================== */
exports.createPlan = async (req, res) => {
  try {
    const plan = await Plan.create(req.body);

    res.status(201).json({
      message: "Plan created successfully",
      data: plan,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Plan with this name already exists",
      });
    }

    res.status(500).json({
      message: "Failed to create plan",
      error: error.message,
    });
  }
};

/* =====================================================
   GET ALL PLANS (ADMIN)
===================================================== */
exports.getPlans = async (req, res) => {
  try {
    const { active } = req.query;

    const filter = {};
    if (active !== undefined) {
      filter.isActive = active === "true";
    }

    const plans = await Plan.find(filter)
      .sort({ displayOrder: 1, createdAt: -1 });

    res.json({
      total: plans.length,
      data: plans,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch plans",
      error: error.message,
    });
  }
};

/* =====================================================
   GET SINGLE PLAN
===================================================== */
exports.getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json({ data: plan });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch plan",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE PLAN
===================================================== */
exports.updatePlan = async (req, res) => {
  try {
    // protect system fields
    delete req.body.isActive;
    delete req.body.createdAt;
    delete req.body.updatedAt;

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json({
      message: "Plan updated successfully",
      data: plan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update plan",
      error: error.message,
    });
  }
};

/* =====================================================
   TOGGLE PLAN (ENABLE / DISABLE)
===================================================== */
exports.togglePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    plan.isActive = !plan.isActive;
    await plan.save();

    res.json({
      message: `Plan ${plan.isActive ? "enabled" : "disabled"} successfully`,
      data: plan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to toggle plan status",
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE PLAN (HARD DELETE – optional)
===================================================== */
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json({
      message: "Plan deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete plan",
      error: error.message,
    });
  }
};
