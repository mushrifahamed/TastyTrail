const axios = require("axios");
require("dotenv").config();

const { NOTIFICATION_SERVICE_URL } = process.env;

module.exports = {
  sendNotification: async (userId, type, message, metadata) => {
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
        userId,
        type,
        message,
        metadata,
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      // Fail silently as notification is not critical
    }
  },
};
