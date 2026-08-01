const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
  getCameras,
  createCamera,
  updateCameraStatus,
} = require('../controllers/cameraController');

const router = express.Router();

router.get('/cameras', authMiddleware, getCameras);
router.post('/cameras', authMiddleware, createCamera);
router.patch('/cameras/:id/status', authMiddleware, updateCameraStatus);

module.exports = router;
