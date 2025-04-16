const jwt = require("jsonwebtoken");
const authService = require("../services/authService");
const User = require("../models/User");
const mongoose = require("mongoose");
require("dotenv").config();

module.exports = (allowedRoles) => {
  return async (req, res, next) => {
    // 1) Get token from header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    console.log("[DEBUG] Token from header:", req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        message: "You are not logged in! Please log in to get access.",
      });
    }

    try {
      // 2) Verify token
      const decoded = authService.verifyToken(token);
      console.log("[DEBUG] Decoded Token:", decoded);

      if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
        return res.status(401).json({ message: "Invalid user ID in token" });
      }

      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      console.log("[DEBUG] Current User:", currentUser);
      if (!currentUser) {
        return res.status(401).json({
          message: "User no longer exists",
        });
      }

      // 4) Check if user role is allowed
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          message: "You do not have permission to perform this action",
        });
      }

      // 5) Grant access to protected route
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        message: "Invalid token. Please log in again. by AuthMiddleware",
      });
    }
  };
};
