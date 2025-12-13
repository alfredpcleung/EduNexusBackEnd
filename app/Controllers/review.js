const ReviewModel = require('../Models/review');
const CourseModel = require('../Models/course');
const { recalculateCourseAggregates } = require('../Services/reviewService');
const { REVIEW_TAGS } = require('../Constants/reviewTags');
const errorResponse = require('../Utils/errorResponse');

/**
 * POST /api/reviews
 * Create a new review (requires validateReviewCreation middleware)
 */
module.exports.create = async function (req, res, next) {
  try {
    const { courseId, term, year, difficulty, usefulness, workload, gradingFairness, tags, comment, isAnonymous } = req.body;
    const authorUid = req.user.uid;

    // Validate metrics (1-5)
    const metrics = { difficulty, usefulness, workload, gradingFairness };
    for (const [key, value] of Object.entries(metrics)) {
      if (value === undefined || value < 1 || value > 5) {
        return errorResponse(res, 400, `${key} must be between 1 and 5`);
      }
    }

    // Validate tags if provided
    if (tags && tags.length > 0) {
      const invalidTags = tags.filter(tag => !REVIEW_TAGS.includes(tag));
      if (invalidTags.length > 0) {
        return errorResponse(res, 400, `Invalid tags: ${invalidTags.join(', ')}`);
      }
    }

    // Create review
    const review = await ReviewModel.create({
      courseId,
      authorUid,
      term,
      year,
      difficulty,
      usefulness,
      workload,
      gradingFairness,
      tags: tags || [],
      comment: comment || '',
      isAnonymous: isAnonymous || false
    });

    // Recalculate course aggregates
    await recalculateCourseAggregates(courseId);

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 409, 'You have already reviewed this course for this term');
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, 400, messages.join(', '));
    }
    next(error);
  }
};

/**
 * GET /api/reviews
 * List reviews with filters
 * Query params: courseId, authorUid, term, year, limit, skip
 */
module.exports.list = async function (req, res, next) {
  try {
    const { courseId, authorUid, term, year, limit = 20, skip = 0 } = req.query;

    // Build query (only active reviews)
    const query = { status: 'active' };
    if (courseId) query.courseId = courseId;
    if (authorUid) query.authorUid = authorUid;
    if (term) query.term = term;
    if (year) query.year = parseInt(year);

    const reviews = await ReviewModel.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ReviewModel.countDocuments(query);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reviews/:reviewId
 * Get single review by ID
 */
module.exports.getById = async function (req, res, next) {
  try {
    const { reviewId } = req.params;

    const review = await ReviewModel.findOne({ _id: reviewId, status: 'active' });

    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reviews/course/:courseId
 * Get all reviews for a course
 * Query params: term, year, limit, skip
 */
module.exports.getByCourse = async function (req, res, next) {
  try {
    const { courseId } = req.params;
    const { term, year, limit = 20, skip = 0 } = req.query;

    // Verify course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return errorResponse(res, 404, 'Course not found');
    }

    // Build query
    const query = { courseId, status: 'active' };
    if (term) query.term = term;
    if (year) query.year = parseInt(year);

    const reviews = await ReviewModel.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ReviewModel.countDocuments(query);

    res.json({
      success: true,
      data: reviews,
      course: {
        id: course._id,
        courseCode: course.courseCode,
        title: course.title
      },
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/reviews/:reviewId
 * Update review (requires isReviewAuthorOrAdmin middleware)
 */
module.exports.update = async function (req, res, next) {
  try {
    const review = req.review; // Set by middleware
    const { difficulty, usefulness, workload, gradingFairness, tags, comment, isAnonymous } = req.body;

    // Validate metrics if provided
    const metrics = { difficulty, usefulness, workload, gradingFairness };
    for (const [key, value] of Object.entries(metrics)) {
      if (value !== undefined && (value < 1 || value > 5)) {
        return errorResponse(res, 400, `${key} must be between 1 and 5`);
      }
    }

    // Validate tags if provided
    if (tags && tags.length > 0) {
      const invalidTags = tags.filter(tag => !REVIEW_TAGS.includes(tag));
      if (invalidTags.length > 0) {
        return errorResponse(res, 400, `Invalid tags: ${invalidTags.join(', ')}`);
      }
    }

    // Update allowed fields
    if (difficulty !== undefined) review.difficulty = difficulty;
    if (usefulness !== undefined) review.usefulness = usefulness;
    if (workload !== undefined) review.workload = workload;
    if (gradingFairness !== undefined) review.gradingFairness = gradingFairness;
    if (tags !== undefined) review.tags = tags;
    if (comment !== undefined) review.comment = comment;
    if (isAnonymous !== undefined) review.isAnonymous = isAnonymous;

    await review.save();

    // Recalculate course aggregates
    await recalculateCourseAggregates(review.courseId);

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, 400, messages.join(', '));
    }
    next(error);
  }
};

/**
 * DELETE /api/reviews/:reviewId
 * Soft delete review (requires isReviewAuthorOrAdmin middleware)
 */
module.exports.delete = async function (req, res, next) {
  try {
    const review = req.review; // Set by middleware
    const courseId = review.courseId;

    // Soft delete
    review.status = 'deleted';
    await review.save();

    // Recalculate course aggregates
    await recalculateCourseAggregates(courseId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reviews/refresh-aggregates/:courseId
 * Manually refresh course aggregates (admin only)
 */
module.exports.refreshAggregates = async function (req, res, next) {
  try {
    const { courseId } = req.params;
    const { filterBySyllabus } = req.query;

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return errorResponse(res, 404, 'Course not found');
    }

    const syllabusDate = filterBySyllabus === 'true' ? course.syllabusRevisionDate : null;
    const aggregates = await recalculateCourseAggregates(courseId, syllabusDate);

    res.json({
      success: true,
      data: aggregates,
      message: 'Aggregates refreshed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reviews/tags
 * Get controlled vocabulary of review tags
 */
module.exports.getTags = async function (req, res, next) {
  try {
    res.json({
      success: true,
      data: REVIEW_TAGS
    });
  } catch (error) {
    next(error);
  }
};
