const express = require("express");
const router = express.Router();

const Opportunity = require("../models/Opportunity");
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const requireContributorOrAdmin = require("../middleware/requireContributorOrAdmin");
const {
  validateTitleCompany,
  validateType,
  validateDeadline,
  validateUrl,
  validateNotes,
} = require("../utils/validation");

/* ============================================================================
   GET opportunities (role-based visibility + pagination + filtering)
   - user: only APPROVED
   - contributor: APPROVED + own submissions (PENDING/REJECTED)
   - admin: ALL
   
   Query params:
   - page: 1 (default)
   - limit: 10 (default)
   - type: valid opportunity type
   - company: search string
   ============================================================================ */
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
    console.error("[GET /opportunities]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   GET single opportunity
   GET /api/opportunities/:id
   ============================================================================ */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );

    if (!opp) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    // Authorization: user can only see approved, contributor can see own
    if (req.user.role === "user" && opp.approvalStatus !== "APPROVED") {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (
      req.user.role === "contributor" &&
      opp.approvalStatus !== "APPROVED" &&
      !opp.createdBy._id.equals(req.user._id)
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(opp);
  } catch (err) {
    console.error("[GET /opportunities/:id]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   ADMIN: Create opportunity (direct publish)
   POST /api/opportunities
   ============================================================================ */
router.post("/", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { title, company, type, deadline, link, notes } = req.body;

    // Validate all fields
    const titleCompanyCheck = validateTitleCompany(title, company);
    if (!titleCompanyCheck.valid) {
      return res.status(400).json({ error: titleCompanyCheck.error });
    }

    const typeCheck = validateType(type);
    if (!typeCheck.valid) {
      return res.status(400).json({ error: typeCheck.error });
    }

    const deadlineCheck = validateDeadline(deadline);
    if (!deadlineCheck.valid) {
      return res.status(400).json({ error: deadlineCheck.error });
    }

    const linkCheck = validateUrl(link);
    if (!linkCheck.valid) {
      return res.status(400).json({ error: linkCheck.error });
    }

    const notesCheck = validateNotes(notes);
    if (!notesCheck.valid) {
      return res.status(400).json({ error: notesCheck.error });
    }

    const doc = await Opportunity.create({
      title: title.trim(),
      company: company.trim(),
      type,
      deadline: deadline ? new Date(deadline) : null,
      link: link ? link.trim() : "",
      notes: notes ? notes.trim() : "",

      createdBy: req.user._id,
      approvalStatus: "APPROVED",
      approvedBy: req.user._id,
      approvedAt: new Date(),
      rejectedReason: "",
      rejectedAt: null,
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error("[POST /opportunities]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   CONTRIBUTOR: Submit opportunity (PENDING)
   POST /api/opportunities/submit
   ============================================================================ */
router.post(
  "/submit",
  authMiddleware,
  requireContributorOrAdmin,
  async (req, res) => {
    try {
      const { title, company, type, deadline, link, notes } = req.body;

      // Validate all fields (same as admin create)
      const titleCompanyCheck = validateTitleCompany(title, company);
      if (!titleCompanyCheck.valid) {
        return res.status(400).json({ error: titleCompanyCheck.error });
      }

      const typeCheck = validateType(type);
      if (!typeCheck.valid) {
        return res.status(400).json({ error: typeCheck.error });
      }

      const deadlineCheck = validateDeadline(deadline);
      if (!deadlineCheck.valid) {
        return res.status(400).json({ error: deadlineCheck.error });
      }

      const linkCheck = validateUrl(link);
      if (!linkCheck.valid) {
        return res.status(400).json({ error: linkCheck.error });
      }

      const notesCheck = validateNotes(notes);
      if (!notesCheck.valid) {
        return res.status(400).json({ error: notesCheck.error });
      }

      const doc = await Opportunity.create({
        title: title.trim(),
        company: company.trim(),
        type,
        deadline: deadline ? new Date(deadline) : null,
        link: link ? link.trim() : "",
        notes: notes ? notes.trim() : "",

        createdBy: req.user._id,
        approvalStatus: "PENDING",
        approvedBy: null,
        approvedAt: null,
        rejectedReason: "",
        rejectedAt: null,
      });

      res.status(201).json(doc);
    } catch (err) {
      console.error("[POST /opportunities/submit]", err.message);
      res.status(500).json({ error: "Server error" });
    }
  },
);

/* ============================================================================
   CONTRIBUTOR: My submissions
   GET /api/opportunities/submissions/me
   ============================================================================ */
router.get(
  "/submissions/me",
  authMiddleware,
  requireContributorOrAdmin,
  async (req, res) => {
    try {
      const list = await Opportunity.find({ createdBy: req.user._id }).sort({
        createdAt: -1,
      });
      res.json(list);
    } catch (err) {
      console.error("[GET /opportunities/submissions/me]", err.message);
      res.status(500).json({ error: "Server error" });
    }
  },
);

/* ============================================================================
   ADMIN: View pending submissions
   GET /api/opportunities/moderation/pending
   ============================================================================ */
router.get(
  "/moderation/pending",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const pending = await Opportunity.find({ approvalStatus: "PENDING" })
        .sort({ createdAt: -1 })
        .populate("createdBy", "name email role");
      res.json(pending);
    } catch (err) {
      console.error("[GET /opportunities/moderation/pending]", err.message);
      res.status(500).json({ error: "Server error" });
    }
  },
);

/* ============================================================================
   ADMIN: Approve submission
   PATCH /api/opportunities/moderation/:id/approve
   ============================================================================ */
router.patch(
  "/moderation/:id/approve",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
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
        { new: true },
      );

      if (!updated) {
        return res.status(404).json({ error: "Pending opportunity not found" });
      }

      res.json(updated);
    } catch (err) {
      console.error(
        "[PATCH /opportunities/moderation/:id/approve]",
        err.message,
      );
      res.status(500).json({ error: "Server error" });
    }
  },
);

/* ============================================================================
   ADMIN: Reject submission
   PATCH /api/opportunities/moderation/:id/reject
   body: { reason: "..." }
   ============================================================================ */
router.patch(
  "/moderation/:id/reject",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const reason = String(req.body?.reason || "").trim();
      if (!reason || reason.length === 0) {
        return res.status(400).json({ error: "Rejection reason is required" });
      }

      if (reason.length > 1000) {
        return res
          .status(400)
          .json({ error: "Rejection reason must be 1000 characters or less" });
      }

      const updated = await Opportunity.findOneAndUpdate(
        { _id: req.params.id, approvalStatus: "PENDING" },
        {
          approvalStatus: "REJECTED",
          rejectedReason: reason,
          rejectedAt: new Date(),
          approvedBy: null,
          approvedAt: null,
        },
        { new: true },
      );

      if (!updated) {
        return res.status(404).json({ error: "Pending opportunity not found" });
      }

      res.json(updated);
    } catch (err) {
      console.error(
        "[PATCH /opportunities/moderation/:id/reject]",
        err.message,
      );
      res.status(500).json({ error: "Server error" });
    }
  },
);

/* ============================================================================
   ADMIN: Update opportunity
   PUT /api/opportunities/:id
   
   ⚠️  Only title, company, type, deadline, link, notes can be updated
   ⚠️  Approval status cannot be changed via PUT (use moderation endpoints)
   ============================================================================ */
router.put("/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { title, company, type, deadline, link, notes } = req.body;

    // Find the opportunity first
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    // Validate provided fields
    if (title !== undefined) {
      const check = validateTitleCompany(title, company || opp.company);
      if (!check.valid) {
        return res.status(400).json({ error: check.error });
      }
      opp.title = title.trim();
    }

    if (company !== undefined) {
      const check = validateTitleCompany(title || opp.title, company);
      if (!check.valid) {
        return res.status(400).json({ error: check.error });
      }
      opp.company = company.trim();
    }

    if (type !== undefined) {
      const check = validateType(type);
      if (!check.valid) {
        return res.status(400).json({ error: check.error });
      }
      opp.type = type;
    }

    if (deadline !== undefined) {
      const check = validateDeadline(deadline);
      if (!check.valid) {
        return res.status(400).json({ error: check.error });
      }
      opp.deadline = deadline ? new Date(deadline) : null;
    }

    if (link !== undefined) {
      const check = validateUrl(link);
      if (!check.valid) {
        return res.status(400).json({ error: check.error });
      }
      opp.link = link ? link.trim() : "";
    }

    if (notes !== undefined) {
      const check = validateNotes(notes);
      if (!check.valid) {
        return res.status(400).json({ error: check.error });
      }
      opp.notes = notes ? notes.trim() : "";
    }

    const updated = await opp.save();
    res.json(updated);
  } catch (err) {
    console.error("[PUT /opportunities/:id]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   ADMIN: Delete opportunity (HARD DELETE)
   DELETE /api/opportunities/:id
   
   ⚠️  This permanently removes the opportunity. Consider soft-delete if needed.
   ============================================================================ */
router.delete("/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const result = await Opportunity.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    res.json({ message: "Opportunity deleted successfully" });
  } catch (err) {
    console.error("[DELETE /opportunities/:id]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
