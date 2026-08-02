const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const authRoutes = require('./routes/auth');
const detectionRoutes = require('./routes/detections');
const cameraRoutes = require('./routes/cameras');
const farmRoutes = require('./routes/farms');
const notificationRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// initialize socket.io for fallback realtime broadcast
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[socket] client connected: ${socket.id} (total: ${io.sockets.sockets.size})`);
  socket.on('disconnect', () => {
    console.log(`[socket] client disconnected: ${socket.id} (total: ${io.sockets.sockets.size})`);
  });
});

// middleware
app.use(cors());
app.use(express.json());

// request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// api routes
app.use('/api', authRoutes);
app.use('/api', detectionRoutes);
app.use('/api', cameraRoutes);
app.use('/api', farmRoutes);
app.use('/api', notificationRoutes);
app.use('/api', settingsRoutes);

// health check endpoints
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Animal Intrusion Backend API is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// centralized error handling middleware (must be mounted last)
app.use(errorHandler);

server.listen(port, () => {
  console.log(`server running on port ${port}`);
});

// graceful shutdown handling
const shutdown = (signal) => {
  console.log(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
