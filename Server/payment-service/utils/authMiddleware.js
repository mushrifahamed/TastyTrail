const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();

module.exports = (allowedRoles) => {
  return (req, res, next) => {
    // First check for internal API key
    if (req.headers["x-api-key"] === process.env.INTERNAL_API_KEY) {
      // For internal service calls, create a valid ObjectId instead of "system"

      console.log(req.headers["x-api-key"]);
      req.user = {
        id: new mongoose.Types.ObjectId("000000000000000000000000"),
        role: "internal_service",
      };

      // Check if internal_service role is allowed
      if (!allowedRoles.includes("internal_service")) {
        return res
          .status(403)
          .json({ message: "Insufficient permissions for internal service" });
      }

      return next();
    }

    // If no internal API key, proceed with JWT authentication
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};
