const Token = require("../models/Token");
const { sendNotification } = require("./fcmService");

exports.sendToUser = async ({ userId, role, title, body, data }) => {
  const user = await Token.findOne({ userId, role });
  if (!user) {
    console.warn(`Token not found for user ${userId} (${role})`);
    return;
  }

  try {
    await sendNotification(user.token, title, body, data);
    console.log(`📨 Notification sent to ${role} (${userId}): ${title}`);
  } catch (error) {
    console.error(`❌ Failed to notify ${role} (${userId}):`, error.message);
  }
};
