// server/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

/* ============================================================================
   SECURITY MIDDLEWARE
   ============================================================================ */

// Add security headers (helmet)
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per 15 minutes
  message: "Too many login attempts, please try again later",
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Apply rate limiting to all requests
app.use(limiter);

// More aggressive limiting for auth endpoints
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

/* ============================================================================
   CORS & BODY PARSING
   ============================================================================ */

const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));

/* ============================================================================
   DATABASE CONNECTION
   ============================================================================ */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    // Start deadline reminder scheduler after DB connection
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

app.use("/api/auth", authRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/contributor-requests", contributorRequestRoutes);
app.use("/api/notifications", notificationRoutes);

/* ============================================================================
   ⚠️  DEV ROUTES (DISABLED IN PRODUCTION)
   ⚠️  These routes are commented out for security. Enable only locally.
   ⚠️  Before deploying, verify these remain disabled.
   ============================================================================ */
// DEV_MODE check - set this environment variable only in local/dev environments
// const DEV_MODE = process.env.DEV_MODE === "true";
// if (DEV_MODE) {
//   const User = require("./models/User");
//   const bcrypt = require("bcryptjs");
//
//   // List all users
//   app.get("/api/auth/dev/list-users", async (req, res) => {
//     const users = await User.find().select("name email role provider createdAt");
//     res.json(users);
//   });
//
//   // Set password (TEST ONLY)
//   app.post("/api/auth/dev/set-password", async (req, res) => {
//     const { email, newPassword } = req.body;
//     if (!email || !newPassword) return res.status(400).json({ error: "Missing fields" });
//
//     const user = await User.findOne({ email: email.toLowerCase() });
//     if (!user) return res.status(404).json({ error: "User not found" });
//
//     user.password = await bcrypt.hash(newPassword, 10);
//     await user.save();
//     res.json({ message: "Password updated", email: user.email });
//   });
// }

/* ============================================================================
   HEALTH CHECK
   ============================================================================ */
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Opportunity Portal API Running" });
});

/* ============================================================================
   ERROR HANDLING MIDDLEWARE
   ============================================================================ */

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler - catches all errors and sends generic response
app.use((err, req, res, next) => {
  // Log the full error server-side for debugging
  console.error("[ERROR]", err.message);
  console.error("[STACK]", err.stack);

  // Send generic error response to client (no internal details)
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: "Server error" });
});

/* ============================================================================
   SERVER STARTUP
   ============================================================================ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🔒 CORS origins: ${process.env.CLIENT_URL || "http://localhost:5173"}`,
  );
  console.log(`✅ Rate limiting: enabled (100 req/15min per IP)\n`);
});
