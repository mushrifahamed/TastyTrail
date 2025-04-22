const axios = require("axios");
require("dotenv").config();

const { NOTIFICATION_SERVICE_URL } = process.env;

module.exports = {
  sendNotification: async (userId, type, message, metadata) => {
    try {
      // Check if notification service URL is defined
      if (!NOTIFICATION_SERVICE_URL) {
        console.log(
          "Notification service URL not defined, skipping notification"
        );
        return;
      }

      await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
        userId,
        type,
        message,
        metadata,
      });
    } catch (error) {
      console.error("Error sending notification:", error.message);
      // Fail silently as notification is not critical
    }
  },
};
