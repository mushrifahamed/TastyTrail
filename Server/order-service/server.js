require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const winston = require("winston");

// Import routes
const orderRoutes = require("./routes/orderRoutes");
const trackingRoutes = require("./routes/trackingRoutes");

// Initialize express app
const app = express();

// Database connection
require("./config/db");

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("combined"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logger configuration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Routes
app.use("/api/orders", orderRoutes);
app.use("/api/tracking", trackingRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Order Service is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  logger.info(`Order Service running on port ${PORT}`);
  console.log(`Order Service running on port ${PORT}`);
});

module.exports = app; // for testing
