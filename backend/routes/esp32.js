const express = require('express');
const router = express.Router();
const { triggerESP32, getESP32Status } = require('../controllers/esp32Controller');

router.post('/esp32/trigger', triggerESP32);
router.get('/esp32/status', getESP32Status);

module.exports = router;
