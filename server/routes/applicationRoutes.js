const express = require("express");
const router = express.Router();

const Application = require("../models/Application");
const Opportunity = require("../models/Opportunity");
const authMiddleware = require("../middleware/authMiddleware");
const {
  validateApplicationStatus,
  validateExternalApplication,
  validateUrl,
  validateNotes,
} = require("../utils/validation");

/* ============================================================================
   APPLY to portal opportunity
   POST /api/applications
   body: { opportunityId }
   ============================================================================ */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const opportunityId = req.body.opportunityId || req.body.oppId;
    if (!opportunityId) {
      return res.status(400).json({ error: "opportunityId is required" });
    }

    // Ensure opportunity exists and is approved
    const opp = await Opportunity.findById(opportunityId);
    if (!opp) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    // Only approved opportunities can be applied by normal users
    if (req.user.role !== "admin" && opp.approvalStatus !== "APPROVED") {
      return res.status(403).json({ error: "Opportunity not approved yet" });
    }

    // Duplicate check
    const existing = await Application.findOne({
      userId: req.user._id,
      opportunityId,
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: "Already applied to this opportunity" });
    }

    const created = await Application.create({
      userId: req.user._id,
      opportunityId,
      status: "Applied",
      notes: "",
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("[POST /applications]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   ADD external application
   POST /api/applications/external
   body: { title, company, type, deadline, link, status, notes }
   ============================================================================ */
router.post("/external", authMiddleware, async (req, res) => {
  try {
    const { title, company, type, deadline, link, status, notes } = req.body;

    // Validate external application fields
    const validation = validateExternalApplication(title, company, type, link);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Validate status if provided
    if (status) {
      const statusCheck = validateApplicationStatus(status);
      if (!statusCheck.valid) {
        return res.status(400).json({ error: statusCheck.error });
      }
    }

    // Validate notes if provided
    if (notes) {
      const notesCheck = validateNotes(notes);
      if (!notesCheck.valid) {
        return res.status(400).json({ error: notesCheck.error });
      }
    }

    const created = await Application.create({
      userId: req.user._id,
      opportunityId: null,

      externalTitle: title.trim(),
      externalCompany: company.trim(),
      externalType: type || "",
      externalLink: link ? link.trim() : "",
      externalDeadline: deadline ? new Date(deadline) : null,

      status: status || "Applied",
      notes: notes ? notes.trim() : "",
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("[POST /applications/external]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   GET my applications (PORTAL + EXTERNAL)
   GET /api/applications/me
   ============================================================================ */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.user._id })
      .populate("opportunityId")
      .sort({ updatedAt: -1 });

    res.json(apps);
  } catch (err) {
    console.error("[GET /applications/me]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   UPDATE application (status, notes, or external fields)
   PATCH /api/applications/:id
   
   For portal applications: { status, notes }
   For external: { status, notes, externalTitle, externalCompany, externalType, externalLink, externalDeadline }
   ============================================================================ */
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const {
      status,
      notes,
      externalTitle,
      externalCompany,
      externalType,
      externalLink,
      externalDeadline,
    } = req.body;

    const appDoc = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!appDoc) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Don't allow editing final statuses
    if (["Selected", "Rejected"].includes(appDoc.status)) {
      return res
        .status(400)
        .json({ error: "Final status locked. Cannot update." });
    }

    // Update status if provided
    if (status !== undefined) {
      const statusCheck = validateApplicationStatus(status);
      if (!statusCheck.valid) {
        return res.status(400).json({ error: statusCheck.error });
      }
      appDoc.status = status;
    }

    // Update notes if provided
    if (notes !== undefined) {
      if (notes) {
        const notesCheck = validateNotes(notes);
        if (!notesCheck.valid) {
          return res.status(400).json({ error: notesCheck.error });
        }
      }
      appDoc.notes = notes || "";
    }

    // Update external application fields (only if this is an external app)
    if (!appDoc.opportunityId) {
      if (externalTitle !== undefined) {
        if (
          !externalTitle ||
          typeof externalTitle !== "string" ||
          externalTitle.trim().length === 0
        ) {
          return res.status(400).json({ error: "Title is required" });
        }
        appDoc.externalTitle = externalTitle.trim();
      }

      if (externalCompany !== undefined) {
        if (
          !externalCompany ||
          typeof externalCompany !== "string" ||
          externalCompany.trim().length === 0
        ) {
          return res.status(400).json({ error: "Company is required" });
        }
        appDoc.externalCompany = externalCompany.trim();
      }

      if (externalType !== undefined) {
        if (externalType && externalType !== "") {
          const typeCheck = validateExternalApplication(
            appDoc.externalTitle,
            appDoc.externalCompany,
            externalType,
            appDoc.externalLink,
          );
          if (!typeCheck.valid) {
            return res.status(400).json({ error: typeCheck.error });
          }
        }
        appDoc.externalType = externalType || "";
      }

      if (externalLink !== undefined) {
        if (externalLink) {
          const linkCheck = validateUrl(externalLink);
          if (!linkCheck.valid) {
            return res.status(400).json({ error: linkCheck.error });
          }
        }
        appDoc.externalLink = externalLink ? externalLink.trim() : "";
      }

      if (externalDeadline !== undefined) {
        appDoc.externalDeadline = externalDeadline
          ? new Date(externalDeadline)
          : null;
      }
    }

    const saved = await appDoc.save();
    res.json(saved);
  } catch (err) {
    console.error("[PATCH /applications/:id]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   DELETE single application
   DELETE /api/applications/:id
   
   Cannot delete applications with final status (for audit purposes)
   ============================================================================ */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const appDoc = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!appDoc) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Don't allow deleting final statuses (for audit reasons)
    if (["Selected", "Rejected"].includes(appDoc.status)) {
      return res
        .status(400)
        .json({ error: "Cannot delete applications with final status" });
    }

    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: "Application deleted" });
  } catch (err) {
    console.error("[DELETE /applications/:id]", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   ⚠️  RESET all applications (DEV/TEST ONLY - DISABLED)
   ⚠️  This route is commented out for security. Enable only for local testing.
   ============================================================================ */
// router.delete("/reset", authMiddleware, async (req, res) => {
//   if (process.env.DEV_MODE !== "true") {
//     return res.status(403).json({ error: "Not available" });
//   }
//   try {
//     await Application.deleteMany({ userId: req.user._id });
//     res.json({ message: "All applications cleared" });
//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

module.exports = router;
