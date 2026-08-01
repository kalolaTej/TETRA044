const express = require('express');
const {
  getCameras,
  createCamera,
  updateCameraStatus,
  updateCameraHeartbeat,
} = require('../controllers/cameraController');

const router = express.Router();

router.get('/cameras', getCameras);
router.post('/cameras', createCamera);
router.post('/cameras/heartbeat', updateCameraHeartbeat);
router.patch('/cameras/:id/status', updateCameraStatus);

module.exports = router;
