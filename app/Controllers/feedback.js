const Feedback = require('../Models/feedback');
const User = require('../Models/user');
const errorResponse = require('../Utils/errorResponse');

/**
 * Helper: Build display name from firstName and lastName
 */
const buildDisplayName = (user) => {
  if (!user) return 'Unknown';
  return `${user.firstName} ${user.lastName}`.trim() || 'Unknown';
};

/**
 * GET /api/feedback?projectId=...
 * Public endpoint - list feedback for a project with author displayName
 */
exports.listFeedback = async (req, res) => {
  try {
    const { projectId, authorId } = req.query;
    let filter = {};

    if (!projectId) {
      return errorResponse(res, 400, 'projectId query parameter is required');
    }

    filter.projectId = projectId;
    if (authorId) filter.authorId = authorId;

    let feedback = await Feedback.find(filter).sort({ created: -1 });
    
    // Populate author name for each feedback
    for (let i = 0; i < feedback.length; i++) {
      const author = await User.findOne({ uid: feedback[i].authorId }, 'firstName lastName');
      feedback[i] = feedback[i].toObject();
      feedback[i].author = { displayName: buildDisplayName(author), uid: feedback[i].authorId };
    }
    
    res.status(200).json({
      success: true,
      data: feedback,
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
 * Body: { projectId, rating, comment?, tags? }
 * Enforces: only one feedback per author per project
 */
exports.createFeedback = async (req, res) => {
  try {
    const { projectId, rating, comment, tags } = req.body;
    const authorUid = req.user.uid;

    if (!projectId) {
      return errorResponse(res, 400, 'projectId is required');
    }

    if (rating === undefined || rating < 1 || rating > 5) {
      return errorResponse(res, 400, 'rating is required and must be between 1 and 5');
    }

    // Check if feedback already exists for this author on this project
    const existingFeedback = await Feedback.findOne({
      projectId,
      authorId: authorUid
    });

    if (existingFeedback) {
      return errorResponse(res, 409, 'You have already provided feedback for this project');
    }

    const newFeedback = new Feedback({
      projectId,
      authorId: authorUid,
      rating,
      comment: comment || '',
      tags: Array.isArray(tags) ? tags : []
    });

    await newFeedback.save();
    
    // Populate author name
    const author = await User.findOne({ uid: authorUid }, 'firstName lastName');
    const feedbackData = newFeedback.toObject();
    feedbackData.author = { displayName: buildDisplayName(author), uid: authorUid };
    
    res.status(201).json({
      success: true,
      data: feedbackData
    });
  } catch (error) {
    // Handle unique constraint violation from MongoDB
    if (error.code === 11000) {
      return errorResponse(res, 409, 'You have already provided feedback for this project');
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
 * Body: { rating?, comment?, tags? }
 */
exports.updateFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const authorUid = req.user.uid;
    const userRole = req.user.role;
    const { rating, comment, tags } = req.body;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return errorResponse(res, 404, 'Feedback not found');
    }

    // Check authorship - admin users bypass this check
    if (userRole !== 'admin' && feedback.authorId !== authorUid) {
      return errorResponse(res, 403, 'You are not authorized to perform this action');
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return errorResponse(res, 400, 'rating must be between 1 and 5');
    }

    // Update fields
    if (rating !== undefined) feedback.rating = rating;
    if (comment !== undefined) feedback.comment = comment;
    if (tags !== undefined) feedback.tags = Array.isArray(tags) ? tags : [];

    feedback.updated = new Date();
    await feedback.save();

    // Populate author name
    const author = await User.findOne({ uid: feedback.authorId }, 'firstName lastName');
    const feedbackData = feedback.toObject();
    feedbackData.author = { displayName: buildDisplayName(author), uid: feedback.authorId };

    res.status(200).json({
      success: true,
      data: feedbackData
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
    const userRole = req.user.role;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return errorResponse(res, 404, 'Feedback not found');
    }

    // Check authorship - admin users bypass this check
    if (userRole !== 'admin' && feedback.authorId !== authorUid) {
      return errorResponse(res, 403, 'You are not authorized to perform this action');
    }

    await Feedback.findByIdAndDelete(feedbackId);
    res.status(200).json({
      success: true,
      data: { message: 'Feedback deleted successfully' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting feedback',
      error: error.message
    });
  }
};
