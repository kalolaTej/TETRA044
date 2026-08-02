const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');

const router = express.Router();

router.get('/settings', getSettings);
router.post('/settings', updateSettings);

module.exports = router;
