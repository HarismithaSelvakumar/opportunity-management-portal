const express = require("express");
const router = express.Router();

const Opportunity = require("../models/Opportunity");
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const requireContributorOrAdmin = require("../middleware/requireContributorOrAdmin");

/* ------------------------------------------------------------------
   GET opportunities (role-based visibility + pagination + filtering)
   - user: only APPROVED
   - contributor: APPROVED + own submissions (PENDING/REJECTED)
   - admin: ALL
   
   Query params:
   - page: 1 (default)
   - limit: 10 (default)
   - type: Internship, Job, Hackathon, Scholarship
   - company: search string
------------------------------------------------------------------- */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const role = req.user.role;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    let filter = {};
    
    // Role-based visibility
    if (role === "user") {
      filter = { approvalStatus: "APPROVED" };
    } else if (role === "contributor") {
      filter = {
        $or: [{ approvalStatus: "APPROVED" }, { createdBy: req.user._id }],
      };
    } else if (role === "admin") {
      filter = {};
    }

    // Type filter
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Company search (case-insensitive)
    if (req.query.company) {
      filter.company = { $regex: req.query.company, $options: "i" };
    }

    const [data, total] = await Promise.all([
      Opportunity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Opportunity.countDocuments(filter),
    ]);

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------------------------------------------------------
   ADMIN: Create opportunity (direct publish)
   POST /api/opportunities
------------------------------------------------------------------- */
router.post("/", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { title, company, type, deadline, link, notes } = req.body;

    if (!title || !company || !type) {
      return res.status(400).json({ error: "title, company, type required" });
    }

    const doc = await Opportunity.create({
      title: String(title).trim(),
      company: String(company).trim(),
      type,
      deadline: deadline ? new Date(deadline) : null,
      link: link ? String(link).trim() : "",
      notes: notes ? String(notes).trim() : "",

      createdBy: req.user._id,
      approvalStatus: "APPROVED",
      approvedBy: req.user._id,
      approvedAt: new Date(),
      rejectedReason: "",
      rejectedAt: null,
    });

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------------------------------------------------------
   CONTRIBUTOR: Submit opportunity (PENDING)
   POST /api/opportunities/submit
------------------------------------------------------------------- */
router.post("/submit", authMiddleware, requireContributorOrAdmin, async (req, res) => {
  try {
    const { title, company, type, deadline, link, notes } = req.body;

    if (!title || !company || !type) {
      return res.status(400).json({ error: "title, company, type required" });
    }

    const doc = await Opportunity.create({
      title: String(title).trim(),
      company: String(company).trim(),
      type,
      deadline: deadline ? new Date(deadline) : null,
      link: link ? String(link).trim() : "",
      notes: notes ? String(notes).trim() : "",

      createdBy: req.user._id,
      approvalStatus: "PENDING",
      approvedBy: null,
      approvedAt: null,
      rejectedReason: "",
      rejectedAt: null,
    });

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------------------------------------------------------
   CONTRIBUTOR: My submissions
   GET /api/opportunities/submissions/me
------------------------------------------------------------------- */
router.get("/submissions/me", authMiddleware, requireContributorOrAdmin, async (req, res) => {
  try {
    const list = await Opportunity.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------------------------------------------------------
   ADMIN: View pending submissions
   GET /api/opportunities/moderation/pending
------------------------------------------------------------------- */
router.get("/moderation/pending", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const pending = await Opportunity.find({ approvalStatus: "PENDING" })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role");
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------------------------------------------------------
   ADMIN: Approve submission
   PATCH /api/opportunities/moderation/:id/approve
------------------------------------------------------------------- */
router.patch("/moderation/:id/approve", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const updated = await Opportunity.findOneAndUpdate(
      { _id: req.params.id, approvalStatus: "PENDING" },
      {
        approvalStatus: "APPROVED",
        approvedBy: req.user._id,
        approvedAt: new Date(),
        rejectedReason: "",
        rejectedAt: null,
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Pending opportunity not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------------------------------------------------------
   ADMIN: Reject submission
   PATCH /api/opportunities/moderation/:id/reject
   body: { reason: "..." }
------------------------------------------------------------------- */
router.patch("/moderation/:id/reject", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const reason = String(req.body?.reason || "").trim();
    if (!reason) return res.status(400).json({ error: "Rejection reason is required" });

    const updated = await Opportunity.findOneAndUpdate(
      { _id: req.params.id, approvalStatus: "PENDING" },
      {
        approvalStatus: "REJECTED",
        rejectedReason: reason,
        rejectedAt: new Date(),
        approvedBy: null,
        approvedAt: null,
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Pending opportunity not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------------------------------------------------------
   ADMIN: Update/Delete
------------------------------------------------------------------- */
router.put("/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const updated = await Opportunity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    await Opportunity.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

