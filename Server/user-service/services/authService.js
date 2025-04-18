const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

module.exports = {
  generateToken: (userId, role) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID for token generation");
    }
    return jwt.sign({ id: userId, role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  },

  verifyToken: (token) => {
    console.log("[AUTH] Verifying token:", token);
    if (!token) {
      throw new Error("No token provided");
    }
    return jwt.verify(token, JWT_SECRET);
  },
};
