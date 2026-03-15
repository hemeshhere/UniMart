require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

connectDB();

app.use(cors({
  origin: true, // Allow frontend origin
  credentials: true // Crucial for HttpOnly Cookies to work
}));

app.use(cookieParser());

// THE WEBHOOK TRAP FIX
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), require('./routes/paymentRoutes'));

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Custom Error Handler Middleware
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

// Health check
app.get('/ping', (req, res) => res.status(200).send('Awake'));

require('./sockets/socketManager')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`UniMart Backend active on port ${PORT}`);
});