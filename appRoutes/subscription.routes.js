const express = require("express");
const router = express.Router();

const subscriptionController = require("../controllers/subscription.controller");
const auth = require("../middlewares/authMiddleware");
const superAdminAuth = require("../middlewares/superAdminAuth");

// ================= CREATE =================

router.post(
  "/:id/purchase",
  auth,
  subscriptionController.purchaseSubscription
);

router.post(
  "/",
  auth,
  superAdminAuth,
  subscriptionController.createSubscription
);

// ================= READ =================
router.get("/", auth, superAdminAuth, subscriptionController.getSubscriptions);
router.get(
  "/:id",
  auth,
  superAdminAuth,
  subscriptionController.getSubscriptionById
);

// ================= UPDATE =================
router.put(
  "/:id",
  auth,
  superAdminAuth,
  subscriptionController.updateSubscription
);

// ================= CANCEL =================
router.patch(
  "/:id/cancel",
  auth,
  superAdminAuth,
  subscriptionController.cancelSubscription
);

module.exports = router;
