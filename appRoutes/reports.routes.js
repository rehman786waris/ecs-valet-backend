const router = require("express").Router();
const controller = require("../controllers/reports.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");


router.get("/service-route-summary", adminAuth, controller.serviceRouteSummary);
router.get("/missed-route-checkpoints", adminAuth, controller.missedRouteCheckpoints);
router.get("/checkin-checkout-report", adminAuth,controller.checkInOutReport);
router.get("/service-report", adminAuth, controller.serviceReport);


module.exports = router;
