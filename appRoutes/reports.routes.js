const router = require("express").Router();
const controller = require("../controllers/reports.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");


router.get("/service-route-summary", adminAuth, controller.serviceRouteSummary);
router.get("/missed-route-checkpoints", adminAuth, controller.missedRouteCheckpoints);
router.get("/checkin-checkout-report", adminAuth,controller.checkInOutReport);
router.get("/service-report", adminAuth, controller.serviceReport);
router.get( "/property-checkin-checkout-log", adminAuth, controller.propertyCheckInOutLog);
router.get("/service-alerts-log", adminAuth, controller.serviceAlertsLog);
router.get("/recycle-reports", adminAuth, controller.recycleReports);
router.get("/task-status-report", adminAuth, controller.taskStatusReport);
router.get("/employee-clock-in-out-log", adminAuth, controller.employeeClockInOutLog);




module.exports = router;
