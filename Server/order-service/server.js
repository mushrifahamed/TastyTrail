const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const errorHandler = require("./utils/errorHandler");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Database connection
connectDB();
const quickOrderRoutes = require('./routes/orderRoutes'); // path to your routes
app.use('/api', quickOrderRoutes);

// Routes
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});

module.exports = app;
