// services/notificationService.js

const axios = require("axios");

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3005";

exports.sendNotification = async (userId, role, title, body, data) => {
  try {
    const res = await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/sendToUser`, {
      userId,
      role,
      title,
      body,
      data
    });

    return res.data;
  } catch (err) {
    console.error("❌ Failed to send notification:", err.response?.data || err.message);
    throw err;
  }
};
