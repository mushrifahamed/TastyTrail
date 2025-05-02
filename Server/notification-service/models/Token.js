const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  token: { type: String, required: true },
  role: { type: String, enum: ["customer", "admin", "delivery_personnel"], required: true },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Token", TokenSchema);
