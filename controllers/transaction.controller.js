const Transaction = require("../models/transaction.model");
const Subscription = require("../models/plans/subscription.model");
const Plan = require("../models/plans/plan.model");

/* =====================================================
   PURCHASE / ACTIVATE SUBSCRIPTION
===================================================== */
exports.purchaseSubscription = async (req, res) => {
  try {
    const { plan, billingCycle, transactionId, amount, status } = req.body;

    // 1️⃣ Validate input
    if (!plan || !billingCycle || !transactionId || !amount) {
      return res.status(400).json({
        message: "plan, billingCycle, transactionId and amount are required",
      });
    }

    // 2️⃣ Find subscription
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // 3️⃣ Validate plan
    const planDoc = await Plan.findOne({
      _id: plan,
      isActive: true,
    });

    if (!planDoc) {
      return res.status(404).json({
        message: "Plan not found or inactive",
      });
    }

    // 4️⃣ Prevent duplicate transactions
    const exists = await Transaction.findOne({ transactionId });
    if (exists) {
      return res.status(409).json({
        message: "Transaction already processed",
      });
    }

    // 5️⃣ Validate transaction status
    const allowedStatuses = ["Paid", "Failed", "Refunded"];
    const transactionStatus = status || "Paid";
    if (!allowedStatuses.includes(transactionStatus)) {
      return res.status(400).json({
        message: "Invalid transaction status",
      });
    }

    // 6️⃣ Create transaction
    const transaction = await Transaction.create({
      user: req.user.id,
      company: subscription.company,
      plan,
      subscription: subscription._id,
      amount,
      billingCycle,
      status: transactionStatus,
      transactionId,
      paymentGateway: "Manual", // Stripe / PayPal later
    });

    // 7️⃣ Activate subscription
    subscription.plan = plan;
    subscription.billingCycle = billingCycle;
    subscription.status = "Active";
    subscription.startDate = new Date();
    subscription.trialEndsAt = null;
    subscription.cancelledAt = null;

    // optional: calculate endDate
    if (billingCycle === "Monthly") {
      subscription.endDate = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );
    }

    if (billingCycle === "Yearly") {
      subscription.endDate = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      );
    }

    await subscription.save();

    res.status(200).json({
      message: "Subscription activated successfully",
      transaction,
      subscription,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to activate subscription",
      error: error.message,
    });
  }
};

/* =====================================================
   GET ALL TRANSACTIONS
===================================================== */
exports.getTransactions = async (req, res) => {
    try {
      const { status, billingCycle } = req.query;
  
      const filter = {};
  
      // 🔐 Non super-admin → company scope
      if (req.user.role !== "super-admin") {
        filter.company = req.user.company;
      }
  
      if (status) filter.status = status;
      if (billingCycle) filter.billingCycle = billingCycle;
  
      const transactions = await Transaction.find(filter)
        .populate("user", "firstName lastName email")
        .populate("company", "companyName")
        .populate("plan", "name pricing")
        .populate("subscription")
        .sort({ createdAt: -1 });
  
      res.json({
        total: transactions.length,
        data: transactions,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch transactions",
        error: error.message,
      });
    }
  };
  
/* =====================================================
   GET TRANSACTION BY ID
===================================================== */
exports.getTransactionById = async (req, res) => {
    try {
      const transaction = await Transaction.findById(req.params.id)
        .populate("user", "firstName lastName email")
        .populate("company", "companyName")
        .populate("plan", "name pricing")
        .populate("subscription");
  
      if (!transaction) {
        return res.status(404).json({
          message: "Transaction not found",
        });
      }
  
      // 🔐 Company-level access control
      if (
        req.user.role !== "super-admin" &&
        transaction.company.toString() !== req.user.company.toString()
      ) {
        return res.status(403).json({
          message: "Access denied",
        });
      }
  
      res.json(transaction);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch transaction",
        error: error.message,
      });
    }
  };
/* =====================================================
   DELETE / REFUND TRANSACTION
===================================================== */
exports.deleteTransaction = async (req, res) => {
  try {
    const refundReason = req.body?.refundReason; // ✅ SAFE

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    // 🔐 Only super-admin
    if (req.user.role !== "super-admin") {
      return res.status(403).json({
        message: "Only super-admin can refund transactions",
      });
    }

    if (transaction.status === "Refunded") {
      return res.status(400).json({
        message: "Transaction already refunded",
      });
    }

    transaction.status = "Refunded";
    transaction.refundedAt = new Date();
    transaction.refundReason = refundReason || "Manual refund";

    await transaction.save();

    res.json({
      message: "Transaction refunded successfully",
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to refund transaction",
      error: error.message,
    });
  }
};

  /* =====================================================
   UPDATE TRANSACTION (ADMIN / SUPER-ADMIN)
===================================================== */
exports.updateTransaction = async (req, res) => {
    try {
      const { status, gatewayResponse, refundReason } = req.body;
  
      const transaction = await Transaction.findById(req.params.id);
  
      if (!transaction) {
        return res.status(404).json({
          message: "Transaction not found",
        });
      }
  
      // 🔐 Only super-admin allowed
      if (req.user.role !== "super-admin") {
        return res.status(403).json({
          message: "Only super-admin can update transactions",
        });
      }
  
      // Prevent illegal status changes
      const allowedStatuses = ["Paid", "Failed", "Refunded"];
      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid transaction status",
        });
      }
  
      // Apply updates
      if (status) transaction.status = status;
      if (gatewayResponse) transaction.gatewayResponse = gatewayResponse;
  
      // Handle refund logic
      if (status === "Refunded") {
        transaction.refundedAt = new Date();
        transaction.refundReason =
          refundReason || "Updated by administrator";
      }
  
      await transaction.save();
  
      res.json({
        message: "Transaction updated successfully",
        data: transaction,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to update transaction",
        error: error.message,
      });
    }
  };
  
    
