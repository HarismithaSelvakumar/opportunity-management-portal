const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const ContributorRequest = require("../models/ContributorRequest");
const { validateLinkedInUrl } = require("../utils/validation");
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

// ✅ Priority: admin > user
const computeRoleFromEmail = (email) => {
  const e = (email || "").toLowerCase();
  if (!e) return "user";

  const adminEmails = getAdminEmails();
  if (adminEmails.includes(e)) return "admin";

  return "user";
};

const signToken = (user) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing in .env");

  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

/* ---------------- routes ---------------- */

/**
 * ✅ REGISTER (local)
 * role decided only by allowlist for admin, otherwise normal user
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing)
      return res.status(400).json({ error: "Email already exists" });

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
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ CONTRIBUTOR REQUEST SUBMISSION
 * Creates a normal user account if needed and stores a pending request.
 */
router.post("/contributor-request", async (req, res) => {
  try {
    const { name, email, password, linkedInUrl, reason, college } = req.body;

    if (!name || !email || !password || !linkedInUrl || !reason) {
      return res.status(400).json({
        error: "Name, email, password, LinkedIn URL, and reason are required",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const trimmedName = String(name).trim();
    const trimmedLinkedInUrl = String(linkedInUrl).trim();
    const trimmedReason = String(reason).trim();
    const trimmedCollege = college ? String(college).trim() : "";

    const linkedInCheck = validateLinkedInUrl(trimmedLinkedInUrl);
    if (!linkedInCheck.valid) {
      return res.status(400).json({ error: linkedInCheck.error });
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (user.provider !== "local") {
        return res.status(400).json({
          error:
            "This email is already registered with external login. Please sign in and submit a contributor request from your dashboard.",
        });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        user.password || "",
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // preserve existing contributor role if already approved
      if (user.role === "admin") {
        return res
          .status(400)
          .json({ error: "Admin accounts cannot request contributor access" });
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const role = computeRoleFromEmail(normalizedEmail);
      user = await User.create({
        name: trimmedName,
        email: normalizedEmail,
        password: hashedPassword,
        provider: "local",
        role,
      });
    }

    if (user.role === "contributor") {
      return res.status(400).json({
        error: "Your account is already approved as contributor.",
      });
    }

    const existingPending = await ContributorRequest.findOne({
      userId: user._id,
      status: "Pending",
    });

    if (existingPending) {
      return res.status(400).json({
        error: "You already have a pending contributor request.",
      });
    }

    const request = await ContributorRequest.create({
      userId: user._id,
      name: trimmedName,
      email: normalizedEmail,
      linkedInUrl: trimmedLinkedInUrl,
      reason: trimmedReason,
      college: trimmedCollege,
      status: "Pending",
    });

    res.status(201).json({
      message:
        "Contributor request submitted successfully. Please wait for admin review. Once approved, your account will receive contributor access.",
      request,
    });
  } catch (err) {
    console.error("[POST /auth/contributor-request]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ LOGIN (local)
 * role sync only for admin; preserve contributor status
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
      return res
        .status(400)
        .json({ error: "Use Google login for this account" });
    }

    if (typeof user.password !== "string" || !user.password.trim()) {
      return res.status(400).json({
        error: "This account does not have a password set. Use Google login or reset the password.",
      });
    }

    const ok = await bcrypt.compare(password, user.password || "");
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // ✅ Strict admin sync only; preserve contributor status
    const desiredRole = computeRoleFromEmail(user.email);
    if (desiredRole === "admin" && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    } else if (desiredRole !== "admin" && user.role === "admin") {
      user.role = "user";
      await user.save();
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[POST /auth/login]", err.message);
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
    if (!credential)
      return res.status(400).json({ error: "Google credential required" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = (payload?.email || "").toLowerCase().trim();
    const name = payload?.name || "User";

    if (!email)
      return res.status(400).json({ error: "Google account has no email" });

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
      if (role === "admin" && user.role !== "admin") {
        user.role = "admin";
      } else if (role !== "admin" && user.role === "admin") {
        user.role = "user";
      }
      user.name = user.name || name;
      await user.save();
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
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
