// server/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = (
  process.env.CLIENT_URL || "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

/* ============================================================================
   SECURITY MIDDLEWARE
============================================================================ */

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
});

const authWindowMs =
  Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const authMaxAttempts =
  Number(process.env.AUTH_RATE_LIMIT_MAX) || (isProduction ? 5 : 50);

const authLimiter = rateLimit({
  windowMs: authWindowMs,
  max: authMaxAttempts,
  message: { error: "Too many login attempts, please wait and try again." },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
});

app.use(limiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use(express.json({ limit: "10mb" }));

/* ============================================================================
   DATABASE CONNECTION
============================================================================ */

console.log("🔗 Connecting to DB:", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    const {
      startDeadlineScheduler,
    } = require("./services/deadlineReminderService");
    startDeadlineScheduler();
  })
  .catch((err) => {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  });

/* ============================================================================
   APPLICATION ROUTES
============================================================================ */

const authRoutes = require("./routes/authRoutes");
const opportunityRoutes = require("./routes/opportunityRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const contributorRequestRoutes = require("./routes/contributorRequestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const ratingRoutes = require("./routes/ratingRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/contributor-requests", contributorRequestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ratings", ratingRoutes);

/* ============================================================================
   HEALTH CHECK
============================================================================ */

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Opportunity Portal API Running" });
});

/* ============================================================================
   ERROR HANDLING
============================================================================ */

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  console.error("[STACK]", err.stack);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: "Server error" });
});

/* ============================================================================
   SERVER START
============================================================================ */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔒 CORS origins: ${allowedOrigins.join(", ")}`);
  console.log(`✅ Rate limiting: enabled\n`);
});