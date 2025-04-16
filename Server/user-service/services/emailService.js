// ./server/user-service/services/emailService.js
const nodemailer = require("nodemailer");

// Create a reusable transporter object using Ethereal
let testAccountPromise = nodemailer.createTestAccount();

async function sendEmail(to, subject, text, html) {
  // Wait for test account to be created
  const testAccount = await testAccountPromise;

  console.log("Test account created:", testAccount.user, testAccount.pass);

  // Create a transporter using Ethereal SMTP
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure, // true for 465, false for other ports
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // Send mail with defined transport object
  let info = await transporter.sendMail({
    from: `"TastyTrail Test" <${testAccount.user}>`,
    to,
    subject,
    text,
    html,
  });

  // Preview URL for Ethereal
  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  return info;
}

module.exports = { sendEmail };
