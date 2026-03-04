const express = require("express");
const router = express.Router();

const Opportunity = require("../models/Opportunity");
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const requireContributor = require("../middleware/requireContributor");

/* ------------------------------------------------------------------
   ✅ GET Opportunities (role-based visibility)
   - user: only APPROVED
   - contributor: APPROVED + own submissions (PENDING/REJECTED)
   - admin: ALL
------------------------------------------------------------------- */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const role = req.user.role;

    let filter = {};

    if (role === "user") {
      filter = { approvalStatus: "APPROVED" };
    } else if (role === "contributor") {
      filter = {
        $or: [
          { approvalStatus: "APPROVED" },
          { createdBy: req.user._id }, // contributor can see own pending/rejected
        ],
      };
    } else if (role === "admin") {
      filter = {}; // admin sees all
    }

    const data = await Opportunity.find(filter).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------
   ✅ CONTRIBUTOR: SUBMIT Opportunity (PENDING)
   POST /api/opportunities/submit
------------------------------------------------------------------- */
router.post("/submit", authMiddleware, requireContributor, async (req, res) => {
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
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------
   ✅ CONTRIBUTOR: My Submissions
   GET /api/opportunities/submissions/me
------------------------------------------------------------------- */
router.get("/submissions/me", authMiddleware, requireContributor, async (req, res) => {
  try {
    const list = await Opportunity.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------
   ✅ ADMIN: View Pending Submissions
   GET /api/opportunities/moderation/pending
------------------------------------------------------------------- */
router.get("/moderation/pending", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const pending = await Opportunity.find({ approvalStatus: "PENDING" })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role");
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------
   ✅ ADMIN: Approve Submission
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
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------
   ✅ ADMIN: Reject Submission (with reason)
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
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------
   ✅ ADMIN: Update/Delete (for expired listing management)
   - Admin can edit approved ones, or cleanup rejected/expired etc
------------------------------------------------------------------- */
router.put("/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const updated = await Opportunity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    await Opportunity.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;