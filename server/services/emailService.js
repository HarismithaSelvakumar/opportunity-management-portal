const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email service connected");
  } catch (error) {
    console.error("❌ Email service error:", error.message);
  }
};

// Send email
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"Opportunity Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Email send error:", error.message);
    return false;
  }
};

module.exports = { verifyConnection, sendEmail };
