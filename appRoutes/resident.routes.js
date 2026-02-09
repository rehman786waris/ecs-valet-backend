const express = require("express");
const router = express.Router();

const residentController = require("../controllers/resident.controller");
const adminManagerEmployeeAuth = require("../middlewares/adminManagerEmployeeAuth");
const roleAuth = require("../middlewares/roleAuth");

/* ===============================
   RESIDENT ROUTES
================================ */

router.post(
  "/",
  adminManagerEmployeeAuth,
  roleAuth("PROPERTY_MANAGER"),
  residentController.createResident
);

router.get(
  "/",
  adminManagerEmployeeAuth,
  roleAuth("PROPERTY_MANAGER"),
  residentController.getResidents
);

router.get(
  "/:id",
  adminManagerEmployeeAuth,
  roleAuth("PROPERTY_MANAGER"),
  residentController.getResidentById
);

router.put(
  "/:id",
  adminManagerEmployeeAuth,
  roleAuth("PROPERTY_MANAGER"),
  residentController.updateResident
);

router.delete(
  "/:id",
  adminManagerEmployeeAuth,
  roleAuth("PROPERTY_MANAGER"),
  residentController.deleteResident
);

module.exports = router;
