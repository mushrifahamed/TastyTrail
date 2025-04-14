const axios = require("axios");
require("dotenv").config();

const { NOTIFICATION_SERVICE_URL } = process.env;

module.exports = {
  sendWelcomeNotification: async (userId, email) => {
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
        userId,
        type: "welcome",
        message: "Welcome to our food delivery platform!",
        metadata: {
          email,
        },
      });
    } catch (error) {
      console.error("Error sending welcome notification:", error);
      // Fail silently as notification is not critical
    }
  },

  sendPasswordResetNotification: async (userId, resetToken) => {
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
        userId,
        type: "password_reset",
        message: "You have requested a password reset",
        metadata: {
          resetToken,
        },
      });
    } catch (error) {
      console.error("Error sending password reset notification:", error);
      // Fail silently as notification is not critical
    }
  },
};
