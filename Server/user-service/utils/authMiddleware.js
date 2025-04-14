const jwt = require("jsonwebtoken");
const authService = require("../services/authService");
require("dotenv").config();

module.exports = (allowedRoles) => {
  return (req, res, next) => {
    // 1) Get token from header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "You are not logged in! Please log in to get access.",
      });
    }

    try {
      // 2) Verify token
      const decoded = authService.verifyToken(token);

      // 3) Check if user still exists (would need to query DB)
      // This would be added if we wanted to verify user still exists

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
        message: "Invalid token. Please log in again.",
      });
    }
  };
};
