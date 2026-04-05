const express = require("express");
const router = express.Router();

const ContributorRequest = require("../models/ContributorRequest");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const { validateLinkedInUrl, validateNotes } = require("../utils/validation");

/* ============================================================================
   SUBMIT contributor request
   POST /api/contributor-requests
   body: { linkedInUrl, reason }
   ============================================================================ */
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "user") {
      return res
        .status(403)
        .json({ error: "Only normal users may request contributor access" });
    }

    const { linkedInUrl, reason } = req.body;

    if (
      !linkedInUrl ||
      typeof linkedInUrl !== "string" ||
      linkedInUrl.trim() === ""
    ) {
      return res
        .status(400)
        .json({ error: "LinkedIn profile URL is required" });
    }

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return res.status(400).json({ error: "Reason for request is required" });
    }

    const linkedInCheck = validateLinkedInUrl(linkedInUrl);
    if (!linkedInCheck.valid) {
      return res.status(400).json({ error: linkedInCheck.error });
    }

    const reasonCheck = validateNotes(reason);
    if (!reasonCheck.valid) {
      return res.status(400).json({ error: reasonCheck.error });
    }

    const pendingRequest = await ContributorRequest.findOne({
      userId: req.user._id,
      status: "Pending",
    });

    if (pendingRequest) {
      return res
        .status(400)
        .json({ error: "You already have a pending contributor request" });
    }

    const created = await ContributorRequest.create({
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email,
      linkedInUrl: linkedInUrl.trim(),
      reason: reason.trim(),
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("[POST /contributor-requests]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   GET current user's latest contributor request
   GET /api/contributor-requests/me
   ============================================================================ */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const latestRequest = await ContributorRequest.findOne({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    if (!latestRequest) {
      return res.status(404).json({ error: "No contributor request found" });
    }

    res.json(latestRequest);
  } catch (err) {
    console.error("[GET /contributor-requests/me]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   ADMIN: list all contributor requests
   GET /api/contributor-requests
   ============================================================================ */
router.get("/", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const requests = await ContributorRequest.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("[GET /contributor-requests]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   ADMIN: approve contributor request
   PATCH /api/contributor-requests/:id/approve
   body: { reviewComment }
   ============================================================================ */
router.patch("/:id/approve", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const request = await ContributorRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Contributor request not found" });
    }

    if (request.status !== "Pending") {
      return res
        .status(400)
        .json({ error: "Only pending requests may be approved" });
    }

    const user = await User.findById(request.userId);
    if (!user) {
      return res.status(404).json({ error: "Request user not found" });
    }

    request.status = "Approved";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.reviewComment = req.body.reviewComment || "";
    await request.save();

    if (user.role !== "contributor") {
      user.role = "contributor";
      await user.save();
    }

    res.json(request);
  } catch (err) {
    console.error("[PATCH /contributor-requests/:id/approve]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   ADMIN: reject contributor request
   PATCH /api/contributor-requests/:id/reject
   body: { reviewComment }
   ============================================================================ */
router.patch("/:id/reject", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const request = await ContributorRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Contributor request not found" });
    }

    if (request.status !== "Pending") {
      return res
        .status(400)
        .json({ error: "Only pending requests may be rejected" });
    }

    request.status = "Rejected";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.reviewComment = req.body.reviewComment || "";
    await request.save();

    res.json(request);
  } catch (err) {
    console.error("[PATCH /contributor-requests/:id/reject]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
