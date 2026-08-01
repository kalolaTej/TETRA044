const express = require('express');
const authMiddleware = require('../middleware/auth');
const { registerToken } = require('../controllers/notificationController');

const router = express.Router();

router.post('/notifications/register', authMiddleware, registerToken);

module.exports = router;
