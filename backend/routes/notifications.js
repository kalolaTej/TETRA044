const express = require('express');
const { registerToken, getNotifications } = require('../controllers/notificationController');

const router = express.Router();

router.get('/notifications', getNotifications);
router.post('/notifications/register', registerToken);

module.exports = router;
