const express = require('express');
const router = express.Router();
const feedbackController = require('../Controllers/feedback');
const { requireAuth } = require('../Controllers/authMiddleware');

// Public route - list feedback (filtered by projectId)
router.get('/', feedbackController.listFeedback);

// Protected routes (require authentication)
router.post('/', requireAuth, feedbackController.createFeedback);
router.put('/:feedbackId', requireAuth, feedbackController.updateFeedback);
router.delete('/:feedbackId', requireAuth, feedbackController.deleteFeedback);

module.exports = router;
