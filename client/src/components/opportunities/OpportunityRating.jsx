import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import api from "../../services/api";

export default function OpportunityRating({
  opportunityId,
  onRatingSubmitted,
  isApproved = true,
}) {
  const [userRating, setUserRating] = useState(null);
  const [comment, setComment] = useState("");
  const [stats, setStats] = useState({
    totalRatings: 0,
    averageRating: 0,
    ratingCounts: {},
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Fetch ratings and user's rating
  useEffect(() => {
    if (!opportunityId) return;

    const fetchRatings = async () => {
      try {
        const [statsRes, myRatingRes] = await Promise.all([
          api.get(`/ratings/opportunity/${opportunityId}`),
          api.get(`/ratings/${opportunityId}/my-rating`),
        ]);

        setStats(statsRes.data);
        if (myRatingRes.data.hasRated && myRatingRes.data.rating) {
          setUserRating(myRatingRes.data.rating.rating);
          setComment(myRatingRes.data.rating.comment || "");
        }
      } catch (err) {
        console.error("Error fetching ratings:", err);
      }
    };

    fetchRatings();
  }, [opportunityId]);

  const handleSubmitRating = async () => {
    if (!userRating) {
      setError("Please select a rating");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await api.post("/ratings", {
        opportunityId,
        rating: userRating,
        comment,
      });

      // Refresh ratings
      const statsRes = await api.get(`/ratings/opportunity/${opportunityId}`);
      setStats(statsRes.data);
      setShowForm(false);

      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRating = async (ratingId) => {
    try {
      setDeleting(true);
      setError("");
      await api.delete(`/ratings/${ratingId}`);
      setUserRating(null);
      setComment("");

      // Refresh ratings
      const statsRes = await api.get(`/ratings/opportunity/${opportunityId}`);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error deleting rating:", err);
      setError(err?.response?.data?.error || "Failed to delete rating");
    } finally {
      setDeleting(false);
    }
  };

  if (!isApproved) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          User Ratings & Reviews
        </h3>
        <div className="text-gray-500 text-center py-8">
          Ratings will be available once this opportunity is approved.
        </div>
      </div>
    );
  }

  const ratingPercentages = {};
  for (let i = 1; i <= 5; i++) {
    const count = stats.ratingCounts[i] || 0;
    ratingPercentages[i] =
      stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        User Ratings & Reviews
      </h3>

      {/* Rating Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 mb-4">
          <div>
            <div className="text-4xl font-bold text-gray-900">
              {stats.averageRating || "—"}
            </div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={
                    i < Math.round(stats.averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }
                />
              ))}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.totalRatings}{" "}
              {stats.totalRatings === 1 ? "rating" : "ratings"}
            </div>
          </div>

          {/* Rating distribution */}
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-600 w-6">{star}★</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${ratingPercentages[star]}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-6">
                  {stats.ratingCounts[star] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit/Edit Rating Form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-sm font-medium"
        >
          {userRating ? "Edit Your Rating" : "Rate This Opportunity"}
        </button>
      ) : (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          {error && (
            <div className="text-sm text-red-600 mb-3 p-2 bg-red-50 rounded">
              {error}
            </div>
          )}

          <label className="block text-sm font-medium text-gray-900 mb-3">
            Your Rating
          </label>

          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setUserRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition"
              >
                <Star
                  size={32}
                  className={
                    star <= (hoverRating || userRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }
                />
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-gray-900 mb-2">
            Comment (optional)
          </label>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this opportunity..."
            className="w-full p-2 border border-gray-300 rounded-lg mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />

          <div className="flex gap-2">
            <button
              onClick={handleSubmitRating}
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium"
            >
              {submitting ? "Submitting..." : "Submit Rating"}
            </button>

            <button
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 transition text-sm font-medium"
            >
              Cancel
            </button>

            {userRating && (
              <button
                onClick={() => {
                  // Find the rating ID from stats
                  const myRatingObj = stats.ratings?.find(
                    (r) => r.rating === userRating,
                  );
                  if (myRatingObj) {
                    handleDeleteRating(myRatingObj.id);
                    setShowForm(false);
                  }
                }}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 transition text-sm font-medium"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent Ratings */}
      {stats.ratings && stats.ratings.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Recent Reviews
          </h4>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats.ratings.slice(0, 5).map((rating) => (
              <div key={rating.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {rating.userName}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < rating.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(rating.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {rating.comment && (
                  <p className="text-sm text-gray-600">{rating.comment}</p>
                )}
              </div>
            ))}
          </div>

          {stats.ratings.length > 5 && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              +{stats.ratings.length - 5} more reviews
            </p>
          )}
        </div>
      )}
    </div>
  );
}
