const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const detectionRateLimiter = require('../middleware/rateLimiter');

const {
  createDetection,
  getDetections,
  getDetectionById,
} = require('../controllers/detectionController');

// memory storage for file buffer processing before uploading to supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = express.Router();

// unauthenticated POST endpoint for edge AI camera ingestion with rate limiting
router.post(
  '/detection',
  detectionRateLimiter,
  upload.single('image'),
  createDetection
);

// authenticated GET endpoints for detection logs
router.get('/detections', authMiddleware, getDetections);
router.get('/detections/:id', authMiddleware, getDetectionById);

module.exports = router;