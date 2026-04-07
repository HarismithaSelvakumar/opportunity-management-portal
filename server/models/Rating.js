const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema(
  {
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Opportunity",
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

// Prevent duplicate ratings (one rating per user per opportunity)
RatingSchema.index(
  { opportunityId: 1, userId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Rating", RatingSchema);