const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ---------------- helpers ---------------- */

// comma separated => lowercase trimmed array
const parseEmailList = (value) =>
  (value || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

// ✅ allowlists
const getAdminEmails = () => parseEmailList(process.env.ADMIN_EMAILS);
const getContributorEmails = () => parseEmailList(process.env.CONTRIBUTOR_EMAILS);

// ✅ Priority: admin > contributor > user
const computeRoleFromEmail = (email) => {
  const e = (email || "").toLowerCase();
  if (!e) return "user";

  const adminEmails = getAdminEmails();
  if (adminEmails.includes(e)) return "admin";

  const contributorEmails = getContributorEmails();
  if (contributorEmails.includes(e)) return "contributor";

  return "user";
};

const signToken = (user) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing in .env");

  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/* ---------------- routes ---------------- */

/**
 * ✅ REGISTER (local)
 * role decided only by allowlist
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const role = computeRoleFromEmail(normalizedEmail);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: passwordHash,
      provider: "local",
      role,
    });

    const token = signToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ LOGIN (local)
 * role will ALWAYS be synced from allowlist on every login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // Google-only accounts can't use password login
    if (user.provider === "google" && !user.password) {
      return res.status(400).json({ error: "Use Google login for this account" });
    }

    const ok = await bcrypt.compare(password, user.password || "");
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // ✅ STRICT ROLE SYNC
    const desiredRole = computeRoleFromEmail(user.email);
    if (user.role !== desiredRole) {
      user.role = desiredRole;
      await user.save();
    }

    const token = signToken(user);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ GOOGLE LOGIN
 * role ONLY from allowlist (strict)
 */
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "Google credential required" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = (payload?.email || "").toLowerCase().trim();
    const name = payload?.name || "User";

    if (!email) return res.status(400).json({ error: "Google account has no email" });

    const role = computeRoleFromEmail(email);

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: "",
        provider: "google",
        role,
      });
    } else {
      // ✅ keep role synced strictly
      user.role = role;
      // keep existing name, else set name
      user.name = user.name || name;
      await user.save();
    }

    const token = signToken(user);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    // keep message simple for security
    res.status(401).json({ error: "Google login failed" });
  }
});

/**
 * ✅ ME
 */
router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;