require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectToMongo } = require("./config/db");

const userRoutes = require("./appRoutes/userRoutes");
const propertyManagerRoutes = require("./appRoutes/propertyManagerRoutes");
const employeesRoutes = require("./appRoutes/employeesRoutes");
const violationRoutes = require("./appRoutes/violation.routes");
const violationRuleRoutes = require("./appRoutes/violationRule.routes");
const violationActionRoutes = require("./appRoutes/violationAction.routes");
const violationTemplateRoutes = require("./appRoutes/violationTemplate.routes");
const propertyRoutes = require("./appRoutes/property.routes");
const binTagRoutes = require("./appRoutes/binTag.routes");
const qrScanLogRoutes = require("./appRoutes/qrScanLog.routes");
const customerRoutes = require("./appRoutes/customer.routes");
const taskRoutes = require("./appRoutes/task.routes");
const serviceNoteRoutes = require("./appRoutes/serviceNote.routes");
const serviceNoteActivityRoutes = require("./appRoutes/serviceNoteActivity.routes");
const serviceNoteTypeRoutes = require("./appRoutes/serviceNoteType.routes");
const alertRoutes = require("./appRoutes/alert.routes");
const alertReasonRoutes = require("./appRoutes/alertReason.routes");
const scheduleRoutes = require("./appRoutes/schedule.routes");
const residentRoutes = require("./appRoutes/resident.routes");
const serviceRouteSummaryRoutes = require("./appRoutes/reports.routes");



const app = express();
const PORT = process.env.PORT || 8000;

// ✅ MIDDLEWARE MUST COME FIRST
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ ROUTES AFTER MIDDLEWARE
app.use("/api/users", userRoutes);
app.use("/api/property-managers", propertyManagerRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/violations", violationRoutes);
app.use("/api/violation-rules", violationRuleRoutes);
app.use("/api/violation-actions", violationActionRoutes);
app.use("/api/violation-templates", violationTemplateRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bin-tags", binTagRoutes);
app.use("/api/qr-scan-logs", qrScanLogRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/service-notes", serviceNoteRoutes);
app.use("/api/service-note-activities", serviceNoteActivityRoutes);
app.use("/api/service-note-types", serviceNoteTypeRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/alert-reasons", alertReasonRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/reports", serviceRouteSummaryRoutes);

app.get("/", (req, res) => {
  res.send("Server running with dotenv!");
});

// DB + SERVER
connectToMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://16.16.26.27:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err);
  });

  ///chmod 400 "ECSValet.pem"
  ///ssh -i "ECSValet.pem" ubuntu@ec2-16-16-26-27.eu-north-1.compute.amazonaws.com
 ///16.16.26.27
 ///ubuntu
 ///localhost
 ///https://959284555433.signin.aws.amazon.com/console