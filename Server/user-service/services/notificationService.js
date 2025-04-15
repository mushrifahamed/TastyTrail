const twilio = require("twilio");
const nodemailer = require("nodemailer");
require("dotenv").config();

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  ADMIN_EMAIL,
} = process.env;

const smsClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const emailTransporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

module.exports = {
  // SMS Notifications
  sendSMSNotification: async (phoneNumber, message) => {
    try {
      await smsClient.messages.create({
        body: message,
        from: TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      return true;
    } catch (error) {
      console.error("Error sending SMS:", error);
      return false;
    }
  },

  // Email Notifications
  sendEmailNotification: async (email, subject, message) => {
    try {
      await emailTransporter.sendMail({
        from: `"Food Delivery App" <${EMAIL_USER}>`,
        to: email,
        subject,
        text: message,
        html: `<p>${message}</p>`,
      });
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  },

  // Verification Email
  sendVerificationEmail: async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const message = `Please verify your email by clicking the link: ${verificationUrl}`;

    return this.sendEmailNotification(
      email,
      "Verify Your Email Address",
      message
    );
  },

  // Welcome Notifications
  sendWelcomeNotification: async (
    userId,
    email,
    message = "Welcome to our platform!"
  ) => {
    return this.sendEmailNotification(
      email,
      "Welcome to Food Delivery App",
      message
    );
  },

  // Admin Notifications
  sendAdminNotification: async (subject, message) => {
    return this.sendEmailNotification(ADMIN_EMAIL, subject, message);
  },

  // Password Reset
  sendPasswordResetEmail: async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const message = `You requested a password reset. Click here to reset: ${resetUrl}`;

    return this.sendEmailNotification(email, "Password Reset Request", message);
  },
};
