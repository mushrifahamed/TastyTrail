const admin = require("firebase-admin");
const serviceAccount = require("../config/firebase-key.json");

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
