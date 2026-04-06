const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["deadline_reminder", "application_reminder", "general"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null }, // ID of related opportunity or application
    relatedModel: {
      type: String,
      enum: ["Opportunity", "Application"],
      default: null,
    },
    isRead: { type: Boolean, default: false },
    sentViaEmail: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", NotificationSchema);
