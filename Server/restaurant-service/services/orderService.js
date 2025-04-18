const http = require('http');
const socketIo = require('socket.io');
const express = require('express');
const app = express();

// Create HTTP server from Express app
const httpServer = http.createServer(app);

// Initialize socket.io with the HTTP server
const io = socketIo(httpServer);

// This will listen for connection events on the WebSocket
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Export the HTTP server and io instance for use in other parts of the app
module.exports = { httpServer, io };