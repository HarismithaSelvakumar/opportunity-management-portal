const express = require("express");
const router = express.Router();

const Application = require("../models/Application");
const Opportunity = require("../models/Opportunity");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * ✅ APPLY (PORTAL)
 * POST /api/applications
 * body: { opportunityId } OR { oppId }
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const opportunityId = req.body.opportunityId || req.body.oppId;
    if (!opportunityId) return res.status(400).json({ error: "opportunityId is required" });

    // ensure opportunity exists + approved
    const opp = await Opportunity.findById(opportunityId);
    if (!opp) return res.status(404).json({ error: "Opportunity not found" });

    // only approved can be applied by normal users
    if (req.user.role !== "admin" && opp.approvalStatus !== "APPROVED") {
      return res.status(403).json({ error: "Opportunity not approved yet" });
    }

    // duplicate check
    const existing = await Application.findOne({ userId: req.user._id, opportunityId });
    if (existing) return res.status(400).json({ error: "Already applied to this opportunity" });

    const created = await Application.create({
      userId: req.user._id,
      opportunityId,
      status: "Applied",
      notes: "",
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ ADD EXTERNAL APPLICATION
 * POST /api/applications/external
 * body: { title, company, type, deadline, link, status, notes }
 */
router.post("/external", authMiddleware, async (req, res) => {
  try {
    const { title, company, type, deadline, link, status, notes } = req.body;

    if (!title || !company) {
      return res.status(400).json({ error: "title and company are required" });
    }

    if (link && !/^https?:\/\/.+/i.test(String(link).trim())) {
      return res.status(400).json({ error: "link must start with http:// or https://" });
    }

    const created = await Application.create({
      userId: req.user._id,
      opportunityId: null,

      externalTitle: String(title).trim(),
      externalCompany: String(company).trim(),
      externalType: type || "",
      externalLink: link ? String(link).trim() : "",
      externalDeadline: deadline ? new Date(deadline) : null,

      status: status || "Applied",
      notes: notes ? String(notes) : "",
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ GET my applications (PORTAL + EXTERNAL)
 * GET /api/applications/me
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.user._id })
      .populate("opportunityId")
      .sort({ updatedAt: -1 });

    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ UPDATE application (status, notes, or external fields)
 * PATCH /api/applications/:id
 * 
 * For portal applications: { status, notes }
 * For external applications: { status, notes, externalTitle, externalCompany, externalType, externalLink, externalDeadline }
 */
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { status, notes, externalTitle, externalCompany, externalType, externalLink, externalDeadline } = req.body;

    const appDoc = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!appDoc) return res.status(404).json({ error: "Application not found" });

    // Don't allow editing final statuses
    if (["Selected", "Rejected"].includes(appDoc.status)) {
      return res.status(400).json({ error: "Final status locked. Cannot update." });
    }

    // Update general fields
    if (status) appDoc.status = status;
    if (notes !== undefined) appDoc.notes = notes;

    // Update external application fields (only if this is an external app)
    if (!appDoc.opportunityId) {
      if (externalTitle !== undefined) appDoc.externalTitle = String(externalTitle).trim();
      if (externalCompany !== undefined) appDoc.externalCompany = String(externalCompany).trim();
      if (externalType !== undefined) appDoc.externalType = externalType;
      if (externalLink !== undefined) {
        if (externalLink && !/^https?:\/\/.+/i.test(String(externalLink).trim())) {
          return res.status(400).json({ error: "Link must start with http:// or https://" });
        }
        appDoc.externalLink = externalLink ? String(externalLink).trim() : "";
      }
      if (externalDeadline !== undefined) appDoc.externalDeadline = externalDeadline ? new Date(externalDeadline) : null;
    }

    const saved = await appDoc.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ DELETE single application
 * DELETE /api/applications/:id
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const appDoc = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id,"Server error"
    });

    if (!appDoc) return res.status(404).json({ error: "Application not found" });

    // Don't allow deleting final statuses (for audit reasons)
    if (["Selected", "Rejected"].includes(appDoc.status)) {
      return res.status(400).json({ error: "Cannot delete applications with final status" });
    }

    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: "Application deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ RESET all my applications (TEST ONLY)
 */
router.delete("/reset", authMiddleware, async (req, res) => {
  try {
    await Application.deleteMany({ userId: req.user._id });
    res.json({ message: "All applications cleared" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;