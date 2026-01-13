const express = require("express");
const router = express.Router();
const controller = require("../controllers/binTag.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");

/* ======================
   BIN TAG ROUTES
====================== */

router.post("/", adminAuth, controller.createBinTag);
router.get("/", adminAuth, controller.getBinTags);
router.get("/:id", adminAuth, controller.getBinTagById);
router.put("/:id", adminAuth, controller.updateBinTag);
router.delete("/:id", adminAuth, controller.deleteBinTag);

/* ======================
   MOBILE QR SCAN
====================== */
router.post("/scan", adminAuth, controller.scanBinTag);

module.exports = router;
