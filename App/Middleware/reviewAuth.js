/**
 * Review Authorization Middleware
 * Validates review eligibility and ownership
 */

const Review = require('../Models/review');
const { validateReviewEligibility } = require('../Services/reviewService');
const errorResponse = require('../Utils/errorResponse');

/**
 * Middleware to validate review eligibility before creation
 * Checks transcript entry and reviewable grade
 */
async function validateReviewCreation(req, res, next) {
  try {
    const { courseId, term, year } = req.body;
    const userUid = req.user.uid;

    if (!courseId || !term || !year) {
      return errorResponse(res, 400, 'courseId, term, and year are required');
    }

    const validation = await validateReviewEligibility(userUid, courseId, term, year);
    
    if (!validation.valid) {
      return errorResponse(res, 403, validation.error);
    }

    // Attach validation result to request for controller use
    req.reviewValidation = validation;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to check if user is review author or admin
 * For update/delete operations
 */
async function isReviewAuthorOrAdmin(req, res, next) {
  try {
    const { reviewId } = req.params;
    const userUid = req.user.uid;
    const userRole = req.user.role;

    const review = await Review.findById(reviewId);
    
    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }

    if (review.status === 'deleted') {
      return errorResponse(res, 404, 'Review has been deleted');
    }

    // Admin can modify any review
    if (userRole === 'admin') {
      req.review = review;
      return next();
    }

    // Author can modify their own review
    if (review.authorUid === userUid) {
      req.review = review;
      return next();
    }

    return errorResponse(res, 403, 'You can only modify your own reviews');
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to check if user can view non-anonymous author info
 * Only author themselves or admin can see authorUid on anonymous reviews
 */
async function filterAnonymousReviews(req, res, next) {
  try {
    // This middleware transforms the response
    // Actual filtering happens in toJSON transform
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateReviewCreation,
  isReviewAuthorOrAdmin,
  filterAnonymousReviews
};
