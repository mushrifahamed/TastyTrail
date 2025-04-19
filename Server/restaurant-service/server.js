const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const restaurantRoutes = require('./routes/restaurantRoutes');
const rateLimiter = require('./utils/rateLimiter');
const errorHandler = require('./utils/errorHandler');
const cors = require('cors');
const http = require('http');  // Import HTTP to create server
const socketIo = require('socket.io');  // Import socket.io for WebSocket

dotenv.config();  // Load environment variables

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for Express app and Socket.IO
const httpServer = http.createServer(app);

// Initialize Socket.IO with the HTTP server
const io = socketIo(httpServer);

// Middleware setup
app.use(express.json());  // Parse JSON request bodies
app.use(cors());          // Enable cross-origin requests
app.use(rateLimiter);     // Apply rate limiting

// Routes
app.use('/api/restaurants', restaurantRoutes);

// MongoDB Connection
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Error handling middleware
app.use(errorHandler);

// Real-time communication with Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server and listen for incoming requests
httpServer.listen(PORT, () => {
  console.log(`Restaurant Service running on port ${PORT}`);
});
