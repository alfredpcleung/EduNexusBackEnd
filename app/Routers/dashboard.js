const express = require('express');
const router = express.Router();
const dashboardController = require('../Controllers/dashboard');
const { requireAuth } = require('../Controllers/authMiddleware');

// Protected route - get user's dashboard
router.get('/me', requireAuth, dashboardController.getDashboard);

module.exports = router;
