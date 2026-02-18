const router = require("express").Router();
const controller = require("../controllers/reports.controller");
const adminAuth = require("../middlewares/adminAuthMiddleware");
const adminManagerEmployeeAuth = require("../middlewares/adminManagerEmployeeAuth");

const assertHandler = (name, handler) => {
  if (typeof handler !== "function") {
    throw new TypeError(
      `[reports.routes] "${name}" must be a function, got ${typeof handler}`
    );
  }
  return handler;
};

const requireController = (name) => assertHandler(`controller.${name}`, controller[name]);
const requireMiddleware = (name, handler) =>
  assertHandler(`middleware.${name}`, handler);

router.get(
  "/service-route-summary",
  requireMiddleware("adminAuth", adminAuth),
  requireController("serviceRouteSummary")
);
router.get(
  "/missed-route-checkpoints",
  requireMiddleware("adminAuth", adminAuth),
  requireController("missedRouteCheckpoints")
);
router.get(
  "/checkin-checkout-historical-report",
  requireMiddleware("adminAuth", adminAuth),
  requireController("checkInOutHistoricalReport")
);
router.get(
  "/service-report",
  requireMiddleware("adminAuth", adminAuth),
  requireController("serviceReport")
);
router.get(
  "/property-checkin-checkout",
  requireMiddleware("adminManagerEmployeeAuth", adminManagerEmployeeAuth),
  requireController("getPropertyCheckInOut")
);
router.get(
  "/property-checkin-checkout-log",
  requireMiddleware("adminAuth", adminAuth),
  requireController("propertyCheckInOutLog")
);
router.get(
  "/service-alerts-log",
  requireMiddleware("adminAuth", adminAuth),
  requireController("serviceAlertsLog")
);
router.get(
  "/recycle-reports",
  requireMiddleware("adminManagerEmployeeAuth", adminManagerEmployeeAuth),
  requireController("recycleReports")
);
router.get(
  "/task-status-report",
  requireMiddleware("adminManagerEmployeeAuth", adminManagerEmployeeAuth),
  requireController("taskStatusReport")
);
router.get(
  "/employee-clock-in-out-log",
  requireMiddleware("adminAuth", adminAuth),
  requireController("employeeClockInOutLog")
);




module.exports = router;
