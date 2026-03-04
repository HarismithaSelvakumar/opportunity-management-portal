const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ✅ Portal-based application (optional now)
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: "Opportunity", default: null },

    // ✅ External application fields (optional)
    externalTitle: { type: String, default: "" },
    externalCompany: { type: String, default: "" },
    externalType: {
      type: String,
      enum: ["Job", "Internship", "Hackathon", "Scholarship", ""],
      default: "",
    },
    externalLink: { type: String, default: "" },
    externalDeadline: { type: Date, default: null },

    status: {
      type: String,
      enum: ["Saved", "Applied", "Test", "Interview", "Selected", "Rejected", "Offer"],
      default: "Applied",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// ✅ Prevent duplicate portal applications (same user + same opportunityId)
ApplicationSchema.index(
  { userId: 1, opportunityId: 1 },
  { unique: true, partialFilterExpression: { opportunityId: { $type: "objectId" } } }
);

module.exports = mongoose.model("Application", ApplicationSchema);