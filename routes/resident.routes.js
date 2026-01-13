const express = require("express");
const router = express.Router();

const residentController = require("../controllers/resident.controller");
const authMiddleware = require("../middlewares/authMiddleware");

/* ===============================
   RESIDENT ROUTES
================================ */

router.post("/", authMiddleware, residentController.createResident);

router.get("/", authMiddleware, residentController.getResidents);

router.get("/:id", authMiddleware, residentController.getResidentById);

router.put("/:id", authMiddleware, residentController.updateResident);

router.delete("/:id", authMiddleware, residentController.deleteResident);

module.exports = router;
