const cron = require("node-cron");
const mongoose = require("mongoose");
const Opportunity = require("../models/Opportunity");
const Application = require("../models/Application");
const Notification = require("../models/Notification");
const { sendEmail } = require("./emailService");

// Check for upcoming deadlines
const checkUpcomingDeadlines = async () => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find opportunities with deadlines within 3 days
    const upcomingOpportunities = await Opportunity.find({
      deadline: { $gte: now, $lte: threeDaysFromNow },
      approvalStatus: "APPROVED",
    }).populate("createdBy", "name email");

    // Find applications with external deadlines within 3 days
    const upcomingApplications = await Application.find({
      externalDeadline: { $gte: now, $lte: threeDaysFromNow },
      externalDeadline: { $ne: null },
    }).populate("userId", "name email");

    // Process opportunity reminders
    for (const opp of upcomingOpportunities) {
      await createDeadlineReminder(
        opp.createdBy._id,
        "opportunity",
        opp.title,
        opp.deadline,
        opp._id,
        "Opportunity",
      );
    }

    // Process application reminders
    for (const app of upcomingApplications) {
      await createDeadlineReminder(
        app.userId._id,
        "application",
        app.externalTitle,
        app.externalDeadline,
        app._id,
        "Application",
      );
    }

    console.log(
      `📅 Checked deadlines: ${upcomingOpportunities.length} opportunities, ${upcomingApplications.length} applications`,
    );
  } catch (error) {
    console.error("❌ Error checking deadlines:", error.message);
  }
};

// Create deadline reminder notification
const createDeadlineReminder = async (
  userId,
  type,
  title,
  deadline,
  relatedId,
  relatedModel,
) => {
  try {
    const daysUntilDeadline = Math.ceil(
      (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24),
    );

    let notificationTitle, notificationMessage;

    if (type === "opportunity") {
      notificationTitle = "Opportunity Deadline Approaching";
      notificationMessage = `Your opportunity "${title}" has a deadline in ${daysUntilDeadline} day(s).`;
    } else {
      notificationTitle = "Application Deadline Approaching";
      notificationMessage = `Your application "${title}" has a deadline in ${daysUntilDeadline} day(s).`;
    }

    // Check if notification already exists for this deadline
    const existingNotification = await Notification.findOne({
      userId,
      relatedId,
      type: "deadline_reminder",
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Within last 24 hours
    });

    if (existingNotification) {
      return; // Already notified recently
    }

    // Create in-app notification
    const notification = new Notification({
      userId,
      type: "deadline_reminder",
      title: notificationTitle,
      message: notificationMessage,
      relatedId,
      relatedModel,
    });

    await notification.save();

    // Send email if enabled
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS === "true") {
      const user = await mongoose.model("User").findById(userId);
      if (user && user.email) {
        const emailHtml = `
          <h2>${notificationTitle}</h2>
          <p>${notificationMessage}</p>
          <p>Please take action before the deadline passes.</p>
          <br>
          <p>Best regards,<br>Opportunity Portal Team</p>
        `;

        const emailSent = await sendEmail(
          user.email,
          notificationTitle,
          emailHtml,
        );
        if (emailSent) {
          notification.sentViaEmail = true;
          await notification.save();
        }
      }
    }

    console.log(`🔔 Created deadline reminder for user ${userId}`);
  } catch (error) {
    console.error("❌ Error creating deadline reminder:", error.message);
  }
};

// Start the scheduler
const startDeadlineScheduler = () => {
  if (process.env.ENABLE_DEADLINE_REMINDERS !== "true") {
    console.log(
      "⏰ Deadline reminders disabled (ENABLE_DEADLINE_REMINDERS != true)",
    );
    return;
  }

  // Run every day at 9 AM
  cron.schedule("0 9 * * *", () => {
    console.log("⏰ Running daily deadline check...");
    checkUpcomingDeadlines();
  });

  // Also run on startup for testing
  if (process.env.NODE_ENV === "development") {
    setTimeout(() => {
      console.log("⏰ Running initial deadline check...");
      checkUpcomingDeadlines();
    }, 5000); // 5 seconds after startup
  }

  console.log("✅ Deadline reminder scheduler started");
};

module.exports = { startDeadlineScheduler, checkUpcomingDeadlines };
