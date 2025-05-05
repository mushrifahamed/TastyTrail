const Token = require("../models/Token");
const { sendNotification } = require("../services/fcmService");

// Register token
exports.registerToken = async (req, res) => {
  const { userId, token, role } = req.body;

  if (!userId || !token || !role) {
    return res.status(400).json({ message: "Missing fields" });
  }

  let savedToken;

  const existing = await Token.findOne({ userId, role });
  if (existing) {
    existing.token = token;
    existing.updatedAt = new Date();
    savedToken = await existing.save();
  } else {
    savedToken = await Token.create({ userId, token, role });
  }

  return res.json({
    message: "Token registered successfully",
    fcmToken: savedToken.token, // ✅ returning the actual FCM token
  });
};


// Send to a specific user
exports.sendToUser = async (req, res) => {
  const { userId, role, title, body, data } = req.body;
  console.log("📨 Spesific user received:", req.body);

  const user = await Token.findOne({ userId, role });
  if (!user) return res.status(404).json({ message: "Token not found" });

  try {
    await sendNotification(user.token, title, body, data);
    console.log("📨 Notification sent to user:", user.userId,"fcm--",user.token);
    res.json({ message: "Notification sent" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send", error: err.message });
  }
};

// Broadcast to all users by role
exports.broadcast = async (req, res) => {
  console.log("📨 Broadcast received:", req.body); // ✅ Add this

  const { role, title, body, data } = req.body;
  const users = await Token.find({ role });
  let results = [];

  for (const user of users) {
    try {
      const res = await sendNotification(user.token, title, body, data);
      results.push({ userId: user.userId, result: res });
      console.log("📨 Notification sent to user:", user.userId,"fcm--",user.token);
    } catch (err) {
      results.push({ userId: user.userId, error: err.message });
    }
  }

  

  res.json({ message: "Broadcast complete", results });
};


exports.logout = async (req, res) => {
  const { userId, token, role } = req.body;

  if (!userId || !token || !role) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const result = await Token.findOneAndDelete({ userId, token, role });
    if (!result) {
      return res.status(404).json({ message: "Token not found or already deleted" });
    }

    res.json({ message: "Token deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete token", error: err.message });
  }
};

