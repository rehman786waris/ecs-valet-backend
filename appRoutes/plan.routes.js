const express = require("express");
const router = express.Router();

const planController = require("../controllers/plan.controller");
const auth = require("../middlewares/authMiddleware");
const roleAuth = require("../middlewares/roleAuth");

// ================= READ (ADMIN + SUPER ADMIN) =================
router.get("/", planController.getPlans);
router.get("/:id", auth, roleAuth("admin", "super-admin"), planController.getPlanById);

// ================= WRITE (SUPER ADMIN ONLY) =================
router.post(
    "/",
    auth,
    roleAuth("super-admin"),
    planController.createPlan
  );
  
router.put("/:id", auth, roleAuth("super-admin"), planController.updatePlan);
router.patch("/:id/toggle", auth, roleAuth("super-admin"), planController.togglePlan);
router.delete("/:id", auth, roleAuth("super-admin"), planController.deletePlan);

module.exports = router;
