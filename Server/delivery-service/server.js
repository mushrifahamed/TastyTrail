require('dotenv').config(); // Load environment variables from .env file
const connectDB = require("./config/db");
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const http = require('http');
const socketIo = require('socket.io');

const deliveryRoutes = require('./routes/deliveryRoutes'); // delivery routes

// MongoDB connection
connectDB();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('statusUpdate', (data) => {
    io.emit('statusUpdate', data); // Broadcast the update to all connected clients
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
// Use delivery routes
app.use('/api/delivery', deliveryRoutes); 
// Other server setup
const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
