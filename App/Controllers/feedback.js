const Feedback = require('../Models/feedback');

/**
 * GET /api/feedback?projectId=...
 * Public endpoint - list feedback for a project
 */
exports.listFeedback = async (req, res) => {
  try {
    const { projectId, authorId } = req.query;
    let filter = {};

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId query parameter is required'
      });
    }

    filter.projectId = projectId;
    if (authorId) filter.authorId = authorId;

    const feedback = await Feedback.find(filter).sort({ created: -1 });
    res.status(200).json({
      success: true,
      feedback: feedback,
      count: feedback.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
};

/**
 * POST /api/feedback
 * Protected endpoint - create new feedback
 * Body: { projectId, rating, comment? }
 * Enforces: only one feedback per author per project
 */
exports.createFeedback = async (req, res) => {
  try {
    const { projectId, rating, comment } = req.body;
    const authorUid = req.user.uid;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId is required'
      });
    }

    if (rating === undefined || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'rating is required and must be between 1 and 5'
      });
    }

    // Check if feedback already exists for this author on this project
    const existingFeedback = await Feedback.findOne({
      projectId,
      authorId: authorUid
    });

    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        message: 'You have already provided feedback for this project'
      });
    }

    const newFeedback = new Feedback({
      projectId,
      authorId: authorUid,
      rating,
      comment: comment || ''
    });

    await newFeedback.save();
    res.status(201).json({
      success: true,
      feedback: newFeedback
    });
  } catch (error) {
    // Handle unique constraint violation from MongoDB
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already provided feedback for this project'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating feedback',
      error: error.message
    });
  }
};

/**
 * PUT /api/feedback/:feedbackId
 * Protected endpoint - update feedback (author only)
 * Body: { rating?, comment? }
 */
exports.updateFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const authorUid = req.user.uid;
    const { rating, comment } = req.body;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check authorship
    if (feedback.authorId !== authorUid) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this feedback'
      });
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'rating must be between 1 and 5'
      });
    }

    // Update fields
    if (rating !== undefined) feedback.rating = rating;
    if (comment !== undefined) feedback.comment = comment;

    feedback.updated = new Date();
    await feedback.save();

    res.status(200).json({
      success: true,
      feedback: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating feedback',
      error: error.message
    });
  }
};

/**
 * DELETE /api/feedback/:feedbackId
 * Protected endpoint - delete feedback (author only)
 */
exports.deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const authorUid = req.user.uid;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check authorship
    if (feedback.authorId !== authorUid) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this feedback'
      });
    }

    await Feedback.findByIdAndDelete(feedbackId);
    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting feedback',
      error: error.message
    });
  }
};
