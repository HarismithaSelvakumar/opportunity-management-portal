// server/routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const requireContributorOrAdmin = require("../middleware/requireContributorOrAdmin");

const User = require("../models/User");
const Opportunity = require("../models/Opportunity");
const Application = require("../models/Application");
const ContributorRequest = require("../models/ContributorRequest");

/**
 * ✅ USER DASHBOARD (only their applications)
 * GET /api/dashboard/user
 */
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // user can see only APPROVED opportunities
    const totalOpportunities = await Opportunity.countDocuments({
      approvalStatus: "APPROVED",
    });

    const myApplications = await Application.find({ userId });

    const statusCounts = myApplications.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    const now = new Date();
    const next14 = new Date();
    next14.setDate(now.getDate() + 14);

    const upcomingDeadlines = await Opportunity.find({
      approvalStatus: "APPROVED",
      deadline: { $gte: now, $lte: next14 },
    })
      .sort({ deadline: 1 })
      .limit(10)
      .select("title company type deadline");

    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      totals: {
        totalOpportunities,
        myApplications: myApplications.length,
      },
      statusCounts,
      upcomingDeadlines,
      // include raw application list for client-side charts/trends
      applications: myApplications,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ CONTRIBUTOR ANALYTICS
 * GET /api/dashboard/contributor
 * - only their submissions
 * - applicants count per opportunity
 */
router.get(
  "/contributor",
  authMiddleware,
  requireContributorOrAdmin,
  async (req, res) => {
    try {
      const contributorId = req.user._id;

      // 1) My submissions
      const myOpps = await Opportunity.find({ createdBy: contributorId })
        .sort({ createdAt: -1 })
        .select("title company type approvalStatus rejectedReason createdAt");

      // 2) Approval counts
      const approvalCounts = myOpps.reduce(
        (acc, o) => {
          const st = o.approvalStatus || "PENDING";
          acc[st] = (acc[st] || 0) + 1;
          return acc;
        },
        { PENDING: 0, APPROVED: 0, REJECTED: 0 },
      );

      // 3) Applicants per opportunity (for my opps)
      const myOppIds = myOpps.map((o) => o._id);

      const applicantsAgg = await Application.aggregate([
        { $match: { opportunityId: { $in: myOppIds } } },
        { $group: { _id: "$opportunityId", applicants: { $sum: 1 } } },
      ]);

      const applicantsMap = applicantsAgg.reduce((acc, row) => {
        acc[String(row._id)] = row.applicants;
        return acc;
      }, {});

      // 4) Table rows
      const submissions = myOpps.map((o) => ({
        opportunityId: o._id,
        title: o.title,
        company: o.company,
        type: o.type,
        approvalStatus: o.approvalStatus,
        rejectedReason: o.rejectedReason || "",
        createdAt: o.createdAt,
        applicants: applicantsMap[String(o._id)] || 0,
      }));

      // 5) Top by applicants
      const topByApplicants = [...submissions]
        .sort((a, b) => b.applicants - a.applicants)
        .slice(0, 8);

      res.json({
        contributor: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
        totals: {
          mySubmissions: submissions.length,
        },
        approvalCounts,
        topByApplicants,
        submissions,
      });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
);

/**
 * ✅ ADMIN DASHBOARD (platform-level)
 * GET /api/dashboard/admin
 */
router.get("/admin", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalOpportunities,
      totalApplications,
      contributorRequests,
    ] = await Promise.all([
      User.countDocuments(),
      Opportunity.countDocuments(),
      Application.countDocuments(),
      ContributorRequest.find().select("status").lean(),
    ]);

    const statusCountsAgg = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statusCounts = statusCountsAgg.reduce((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {});

    // Count contributor requests by status
    const contributorRequestCounts = contributorRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});

    const totalContributors = await User.countDocuments({
      role: "contributor",
    });

    res.json({
      admin: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      totals: {
        totalUsers,
        totalOpportunities,
        totalApplications,
        totalContributors,
      },
      statusCounts,
      contributorRequests: contributorRequestCounts,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ ADMIN CONTRIBUTOR PROFILES
 * GET /api/dashboard/admin-contributors
 */
router.get(
  "/admin-contributors",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const contributors = await User.find({ role: "contributor" })
        .select("name email provider createdAt")
        .lean();

      const totalsByContributor = await Opportunity.aggregate([
        {
          $group: {
            _id: "$createdBy",
            totalSubmissions: { $sum: 1 },
            approved: {
              $sum: {
                $cond: [{ $eq: ["$approvalStatus", "APPROVED"] }, 1, 0],
              },
            },
            pending: {
              $sum: {
                $cond: [{ $eq: ["$approvalStatus", "PENDING"] }, 1, 0],
              },
            },
            rejected: {
              $sum: {
                $cond: [{ $eq: ["$approvalStatus", "REJECTED"] }, 1, 0],
              },
            },
          },
        },
      ]);

      const totalsMap = totalsByContributor.reduce((acc, item) => {
        acc[String(item._id)] = item;
        return acc;
      }, {});

      const contributorProfiles = contributors.map((contributor) => {
        const totals = totalsMap[String(contributor._id)] || {
          totalSubmissions: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        };

        return {
          id: contributor._id,
          name: contributor.name,
          email: contributor.email,
          provider: contributor.provider,
          joinedAt: contributor.createdAt,
          totalSubmissions: totals.totalSubmissions,
          approvedSubmissions: totals.approved,
          pendingSubmissions: totals.pending,
          rejectedSubmissions: totals.rejected,
        };
      });

      res.json({ contributors: contributorProfiles });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
);

module.exports = router;
