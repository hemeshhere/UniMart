require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const adminRoutes = require('./routes/adminRoutes');
const app = express();

// Connect Database
connectDB();

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL,    
  'http://localhost:5173',   
  'http://localhost:3000',
  'https://theunimart.in',
  'https://www.theunimart.in'    
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`); 
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
};

// Apply CORS
app.use(cors(corsOptions));
app.use('/api/wallet/webhook', express.raw({ type: 'application/json' }));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/canteens', require('./routes/canteenRoutes'));
app.use('/api/admin', adminRoutes);

// Error Handler
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

// Initialize Socket Manager
require('./sockets/socketManager')(io);

// Health check 
app.get('/ping', (req, res) => {
  res.status(200).send('Server is awake');
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`UniMart Backend active on port ${PORT}`);
});