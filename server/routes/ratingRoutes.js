const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const Opportunity = require("../models/Opportunity");
const Rating = require("../models/Rating");

// Get ratings for an opportunity (with stats)
router.get("/opportunity/:opportunityId", async (req, res) => {
  try {
    const { opportunityId } = req.params;

    const ratings = await Rating.find({ opportunityId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    // Calculate stats
    let totalRatings = ratings.length;
    let averageRating = 0;
    let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (totalRatings > 0) {
      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      averageRating = (sum / totalRatings).toFixed(1);

      ratings.forEach((r) => {
        ratingCounts[r.rating]++;
      });
    }

    res.json({
      opportunityId,
      totalRatings,
      averageRating: parseFloat(averageRating),
      ratingCounts,
      ratings: ratings.map((r) => ({
        id: r._id,
        userId: r.userId._id,
        userName: r.userId.name,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching ratings:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Submit a rating
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { opportunityId, rating, comment } = req.body;
    const userId = req.user._id;

    if (!opportunityId || !rating) {
      return res.status(400).json({ error: "Missing opportunityId or rating" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Check if opportunity exists and is approved
    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    if (opportunity.approvalStatus !== "APPROVED") {
      return res.status(400).json({ error: "Can only rate approved opportunities" });
    }

    // Check for existing rating
    let existingRating = await Rating.findOne({ opportunityId, userId });

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.comment = comment || "";
      await existingRating.save();
      res.json({
        message: "Rating updated",
        rating: existingRating,
      });
    } else {
      // Create new rating
      const newRating = new Rating({
        opportunityId,
        userId,
        rating,
        comment: comment || "",
      });

      await newRating.save();
      res.status(201).json({
        message: "Rating submitted",
        rating: newRating,
      });
    }
  } catch (error) {
    console.error("Error submitting rating:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user's rating for an opportunity
router.get("/:opportunityId/my-rating", authMiddleware, async (req, res) => {
  try {
    const { opportunityId } = req.params;
    const userId = req.user._id;

    const rating = await Rating.findOne({ opportunityId, userId });

    res.json({
      hasRated: !!rating,
      rating: rating || null,
    });
  } catch (error) {
    console.error("Error fetching user rating:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a rating
router.delete("/:ratingId", authMiddleware, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const userId = req.user._id;

    const rating = await Rating.findById(ratingId);

    if (!rating) {
      return res.status(404).json({ error: "Rating not found" });
    }

    // Check if user owns this rating
    if (rating.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Rating.deleteOne({ _id: ratingId });
    res.json({ message: "Rating deleted" });
  } catch (error) {
    console.error("Error deleting rating:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;