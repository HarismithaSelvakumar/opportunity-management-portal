// server/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const User = require("./models/User");

const app = express();

/* ---------------- MIDDLEWARE ---------------- */
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

/* ---------------- DB CONNECTION ---------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Connection Error:", err));

/* ---------------- ROUTES ---------------- */
const authRoutes = require("./routes/authRoutes");
const opportunityRoutes = require("./routes/opportunityRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);

/* ---------------- ✅ DEV ROUTES (TEST ONLY) ----------------
   Remove before deployment.
----------------------------------------------------------- */

// List all users
app.get("/api/auth/dev/list-users", async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role provider createdAt")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set/reset password for any email
app.post("/api/auth/dev/set-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: "email and newPassword are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ error: "User not found" });

    const hash = await bcrypt.hash(newPassword, 10);

    user.password = hash;
    user.provider = "local";

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    user.role = adminEmails.includes(user.email) ? "admin" : "user";

    await user.save();
    res.json({ message: "Password updated", email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- TEST ROUTE ---------------- */
app.get("/", (req, res) => {
  res.send("Opportunity Portal API Running");
});

/* ---------------- SERVER START ---------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Loaded ADMIN_EMAILS =", process.env.ADMIN_EMAILS);
  console.log("JWT_SECRET exists =", !!process.env.JWT_SECRET);
  console.log("MONGO_URI =", process.env.MONGO_URI);
});