const nodemailer = require("nodemailer");
require("dotenv").config();

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.G_USER,
    pass: process.env.G_PASS,
  },
});

// Email options
const mailOptions = {
  from: `"Bob from Your Business" <${process.env.G_USER}>`,
  to: "segroup80@gmail.com",
  subject: "Welcome! Your free trial is ready.",
  text: "Hey there! Welcome to Your Business. We're happy to have you!",
  html: `
    <p>Hey there!</p>
    <p>Welcome to Your Business, we're happy to have you here!</p>
    <p>Your free trial awaits — just log in and get started.</p>
    <br>
    <p>Regards,</p>
    <p>The Your Business Team</p>
  `,
};

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error("Error sending email:", error);
  } else {
    console.log("Email sent successfully:", info.response);
  }
});
