const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getFarms, createFarm } = require('../controllers/farmController');

const router = express.Router();

router.get('/farms', authMiddleware, getFarms);
router.post('/farms', authMiddleware, createFarm);

module.exports = router;
