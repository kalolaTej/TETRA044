const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = app.listen(port, () => {
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
