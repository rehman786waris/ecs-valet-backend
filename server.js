require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectToMongo } = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const propertyManagerRoutes = require("./routes/propertyManagerRoutes");
const employeesRoutes = require("./routes/employeesRoutes");
const violationRoutes = require("./routes/violation.routes");
const violationRuleRoutes = require("./routes/violationRule.routes");
const violationActionRoutes = require("./routes/violationAction.routes");
const violationTemplateRoutes = require("./routes/violationTemplate.routes");
const propertyRoutes = require("./routes/property.routes");
const binTagRoutes = require("./routes/binTag.routes");
const qrScanLogRoutes = require("./routes/qrScanLog.routes");
const customerRoutes = require("./routes/customer.routes");
const taskRoutes = require("./routes/task.routes");
const serviceNoteRoutes = require("./routes/serviceNote.routes");
const serviceNoteActivityRoutes = require("./routes/serviceNoteActivity.routes");
const serviceNoteTypeRoutes = require("./routes/serviceNoteType.routes");
const alertRoutes = require("./routes/alert.routes");
const alertReasonRoutes = require("./routes/alertReason.routes");



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