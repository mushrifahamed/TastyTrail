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

module.exports = { sendNotification };
