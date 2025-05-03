const admin = require("firebase-admin");
const serviceAccount = require("../tastytrail-c628e-firebase-adminsdk-fbsvc-d49e61e481.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendNotification = async (token, title, body, data = {}) => {
  const message = {
    token,
    notification: { title, body },
    data,
  };

  return await admin.messaging().send(message);
};

const sendNotificationflutter = async (token, title, body, data = {}) => {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      token,
    };

    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
    return response;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

module.exports = { sendNotification, sendNotificationflutter };
