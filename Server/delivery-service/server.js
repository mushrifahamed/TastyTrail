require('dotenv').config(); // Load environment variables from .env file
const connectDB = require("./config/db");
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const messageBroker = require('./utils/messagebroker_neworder'); // Correctly import your message broker
const deliveryRoutes = require('./routes/deliveryRoutes'); // Delivery routes

const app = express();

// MongoDB connection
connectDB();

// Start listening for new orders from RabbitMQ
messageBroker.listenForNewOrders(); // Make sure listenForNewOrders() is implemented correctly

// Create server and setup socket.io
const server = http.createServer(app);
const io = socketIo(server);

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('statusUpdate', (data) => {
    io.emit('statusUpdate', data); // Broadcast the update to all connected clients
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Middleware setup (if you need to parse JSON or set headers)
app.use(express.json()); // This will parse incoming requests with JSON payloads

// Use delivery routes
app.use('/api/delivery', deliveryRoutes);

// Define the server port
const PORT = process.env.PORT || 3008;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
