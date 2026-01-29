const express = require("express");
const router = express.Router();

const planController = require("../controllers/plan.controller");
const auth = require("../middlewares/authMiddleware");
const superAdminAuth = require("../middlewares/superAdminAuth");

// ================= PROTECTED (SUPER ADMIN) =================
router.post("/", auth, superAdminAuth, planController.createPlan);
router.get("/", auth, superAdminAuth, planController.getPlans);
router.get("/:id", auth, superAdminAuth, planController.getPlanById);
router.put("/:id", auth, superAdminAuth, planController.updatePlan);
router.patch("/:id/toggle", auth, superAdminAuth, planController.togglePlan);
router.delete("/:id", auth, superAdminAuth, planController.deletePlan);

module.exports = router;
