const mongoose = require("mongoose");

const ContributorRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    linkedInUrl: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true, maxlength: 2000 },
    college: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    reviewComment: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ContributorRequest", ContributorRequestSchema);
