require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const setupSocketHandlers = require('./socket/socketHandler');

// Routes
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const screenshotRoutes = require('./routes/screenshots');
const requestRoutes = require('./routes/requests');

const app = express();
const server = http.createServer(app);

const EC2_IP = '16.170.98.132';
const PORT = process.env.PORT || 5677;
const allowedOrigins = '*';

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded screenshots as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/screenshots', screenshotRoutes);
app.use('/api/requests', requestRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Socket.IO
setupSocketHandlers(io);

// Start server — bind to 0.0.0.0 so EC2 accepts external connections
connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[${process.env.NODE_ENV || 'development'}] Server running on 0.0.0.0:${PORT}`);
    console.log(`API: http://${EC2_IP}:${PORT}/api`);
  });
});
