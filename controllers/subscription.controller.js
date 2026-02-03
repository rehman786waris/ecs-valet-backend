const Subscription = require("../models/plans/subscription.model");
const Plan = require("../models/plans/plan.model");

const Transaction = require("../models/transaction.model");

exports.purchaseSubscription = async (req, res) => {
  try {
    const { plan, billingCycle, transactionId, amount, status } = req.body;

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const planDoc = await Plan.findOne({ _id: plan, isActive: true });
    if (!planDoc) {
      return res.status(404).json({ message: "Plan not found or inactive" });
    }

    // Validate transaction status
    const allowedStatuses = ["Paid", "Failed", "Refunded"];
    const transactionStatus = status || "Paid";
    if (!allowedStatuses.includes(transactionStatus)) {
      return res.status(400).json({ message: "Invalid transaction status" });
    }

    // Create transaction
    await Transaction.create({
      user: req.user.id,
      company: subscription.company,
      plan,
      subscription: subscription._id,
      amount,
      billingCycle,
      status: transactionStatus,
      transactionId,
    });

    // Activate subscription
    subscription.plan = plan;
    subscription.billingCycle = billingCycle;
    subscription.status = "Active";
    subscription.startDate = new Date();
    subscription.trialEndsAt = null;
    subscription.endDate = null;

    await subscription.save();

    res.json({
      message: "Subscription activated successfully",
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =====================================================
   CREATE / ASSIGN SUBSCRIPTION (ONE PER COMPANY)
===================================================== */
exports.createSubscription = async (req, res) => {
  try {
    const { company, plan, billingCycle } = req.body;

    // Ensure plan exists & active
    const planExists = await Plan.findOne({ _id: plan, isActive: true });
    if (!planExists) {
      return res.status(404).json({ message: "Plan not found or inactive" });
    }

    // One subscription per company
    const existing = await Subscription.findOne({ company });
    if (existing) {
      return res.status(409).json({
        message: "Company already has a subscription",
      });
    }

    const now = new Date();
    const trialEndsAt = new Date(
      now.getTime() + planExists.trial.durationDays * 24 * 60 * 60 * 1000
    );

    const subscription = await Subscription.create({
      company,
      plan,
      billingCycle: billingCycle || "Monthly",
      status: planExists.trial.isAvailable ? "Trial" : "Active",
      startDate: now,
      trialEndsAt: planExists.trial.isAvailable ? trialEndsAt : null,
    });

    res.status(201).json({
      message: "Subscription created successfully",
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET ALL SUBSCRIPTIONS
===================================================== */
exports.getSubscriptions = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const subscriptions = await Subscription.find(filter)
      .populate("company", "companyName")
      .populate("plan", "name pricing")
      .sort({ createdAt: -1 });

    res.json({
      total: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET SUBSCRIPTION BY ID
===================================================== */
exports.getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate("company", "companyName")
      .populate("plan", "name pricing features");

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   UPDATE SUBSCRIPTION (PLAN / BILLING CYCLE)
===================================================== */
exports.updateSubscription = async (req, res) => {
  try {
    const { plan, billingCycle, status } = req.body;

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (plan) {
      const planExists = await Plan.findOne({ _id: plan, isActive: true });
      if (!planExists) {
        return res.status(404).json({ message: "Plan not found or inactive" });
      }
      subscription.plan = plan;
    }

    if (billingCycle) subscription.billingCycle = billingCycle;
    if (status) subscription.status = status;

    await subscription.save();

    res.json({
      message: "Subscription updated successfully",
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   CANCEL SUBSCRIPTION
===================================================== */
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    subscription.status = "Cancelled";
    subscription.cancelledAt = new Date();
    subscription.endDate = new Date();

    await subscription.save();

    res.json({
      message: "Subscription cancelled successfully",
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
