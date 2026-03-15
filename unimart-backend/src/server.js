require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
require('./sockets/socketManager')(io);
// Initialize Express
const app = express();

// Middleware
app.use(cors());
// IMPORTANT: We use raw express.json() here, but we will bypass this for the Razorpay Webhook route later.
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Custom Error Handler Middleware
app.use(errorHandler);

const server = http.createServer(app);

// Attach Socket.io to the HTTP server
const io = new Server(server, {
  cors: {
    origin: '*', // We will restrict this to your Vercel URL in production
    methods: ['GET', 'POST']
  }
});

// Basic Health Check Route (Used by cron-job.org to prevent Render from sleeping)
app.get('/ping', (req, res) => res.status(200).send('Server is awake'));

// Socket.io Connection Logic (We will move this to socketManager.js later)
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`UniMart Backend active on port ${PORT}`);
});