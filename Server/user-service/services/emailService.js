// ./server/user-service/services/emailService.js
const nodemailer = require("nodemailer");
require("dotenv").config();

async function sendEmail(to, subject, text, html) {
  // Create a transporter using Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.G_USER, // your Gmail address
      pass: process.env.G_PASS, // your App Password (not Gmail password)
    },
  });

  // Send mail with defined transport object
  let info = await transporter.sendMail({
    from: `"TastyTrail" <${process.env.G_USER}>`,
    to,
    subject,
    text,
    html,
  });

  console.log("Message sent: %s", info.messageId);
  return info;
}

module.exports = { sendEmail };
