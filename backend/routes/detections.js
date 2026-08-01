const express = require('express');
const multer = require('multer');
const { createDetection } = require('../controllers/detectionController');

// memory storage for file buffer processing before uploading to supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = express.Router();

// unauthenticated POST endpoint for edge AI camera ingestion
router.post('/detection', upload.single('image'), createDetection);

module.exports = router;
