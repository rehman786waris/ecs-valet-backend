const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware");
const transactionController = require("../controllers/transaction.controller");

// Purchase / activate subscription
router.post(
  "/subscriptions/:id/purchase",
  auth,
  transactionController.purchaseSubscription
);

// Get all transactions
router.get("/", auth, transactionController.getTransactions);

// Get single transaction
router.get("/:id", auth, transactionController.getTransactionById);

// Update transaction
router.put("/:id", auth, transactionController.updateTransaction);

// Refund / delete transaction
router.delete("/:id", auth, transactionController.deleteTransaction);

module.exports = router;
