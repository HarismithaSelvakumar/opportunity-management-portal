const mongoose = require("mongoose");

const OpportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },

    type: {
      type: String,
      enum: ["Job", "Internship", "Hackathon", "Scholarship"],
      required: true,
    },

    deadline: { type: Date },
    link: { type: String, default: "" },
    notes: { type: String, default: "" },

    // ✅ Moderation fields
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    approvalStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },

    rejectedReason: { type: String, default: "" },
    rejectedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Opportunity", OpportunitySchema);