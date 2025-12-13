/**
 * Review Service
 * Handles review validation against transcripts and aggregate calculations
 */

const Review = require('../Models/review');
const Course = require('../Models/course');
const User = require('../Models/user');
const { REVIEWABLE_GRADES, MIN_REVIEWS_FOR_AGGREGATES } = require('../Constants/reviewTags');

/**
 * Validate that user can review a course
 * Checks if user has a transcript entry for the course/term with reviewable grade
 * 
 * @param {string} userUid - User's uid
 * @param {ObjectId} courseId - Course ID
 * @param {string} term - Term (Fall, Winter, etc.)
 * @param {number} year - Year
 * @returns {Object} { valid: boolean, error?: string, transcriptEntry?: Object }
 */
async function validateReviewEligibility(userUid, courseId, term, year) {
  try {
    // Get the course
    const course = await Course.findById(courseId);
    if (!course) {
      return { valid: false, error: 'Course not found' };
    }

    // Get the user with academic records
    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return { valid: false, error: 'User not found' };
    }

    // Check user's school matches course institution
    if (user.schoolName !== course.institution) {
      return { 
        valid: false, 
        error: 'You can only review courses from your institution' 
      };
    }

    // Find matching transcript entry
    const transcriptEntry = user.academicRecords.find(record =>
      record.subject === course.courseSubject &&
      record.courseCode === course.courseNumber &&
      record.term === term &&
      record.year === year
    );

    if (!transcriptEntry) {
      return { 
        valid: false, 
        error: 'No transcript entry found for this course/term. You must have taken the course to review it.' 
      };
    }

    // Check if grade allows review
    if (!REVIEWABLE_GRADES.includes(transcriptEntry.grade)) {
      return { 
        valid: false, 
        error: `Cannot review course with grade "${transcriptEntry.grade}". Course must be completed or withdrawn.` 
      };
    }

    // Check for existing review
    const existingReview = await Review.findOne({
      courseId,
      authorUid: userUid,
      term,
      year,
      status: 'active'
    });

    if (existingReview) {
      return { 
        valid: false, 
        error: 'You have already reviewed this course for this term' 
      };
    }

    return { valid: true, transcriptEntry };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Recalculate and update course aggregates from reviews
 * Sets aggregates to null if < MIN_REVIEWS_FOR_AGGREGATES
 * 
 * @param {ObjectId} courseId - Course ID to update
 * @param {Date} syllabusRevisionDate - Optional filter for reviews after this date
 * @returns {Object} Updated aggregate metrics
 */
async function recalculateCourseAggregates(courseId, syllabusRevisionDate = null) {
  // Build query for active reviews
  const query = { courseId, status: 'active' };
  
  // Optionally filter by syllabus revision date
  if (syllabusRevisionDate) {
    query.createdAt = { $gte: syllabusRevisionDate };
  }

  // Get all active reviews for the course
  const reviews = await Review.find(query);
  const numReviews = reviews.length;

  let aggregates;

  if (numReviews < MIN_REVIEWS_FOR_AGGREGATES) {
    // Not enough reviews - set aggregates to null
    aggregates = {
      avgDifficulty: null,
      avgUsefulness: null,
      avgWorkload: null,
      avgGradingFairness: null,
      numReviews,
      topTags: [],
      lastReviewAt: numReviews > 0 ? reviews[numReviews - 1].createdAt : null
    };
  } else {
    // Calculate averages
    const totals = reviews.reduce((acc, review) => {
      acc.difficulty += review.difficulty;
      acc.usefulness += review.usefulness;
      acc.workload += review.workload;
      acc.gradingFairness += review.gradingFairness;
      return acc;
    }, { difficulty: 0, usefulness: 0, workload: 0, gradingFairness: 0 });

    // Calculate top tags (most frequent)
    const tagCounts = {};
    reviews.forEach(review => {
      review.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Find most recent review date
    const lastReviewAt = reviews.reduce((latest, review) => 
      review.createdAt > latest ? review.createdAt : latest,
      reviews[0].createdAt
    );

    aggregates = {
      avgDifficulty: parseFloat((totals.difficulty / numReviews).toFixed(2)),
      avgUsefulness: parseFloat((totals.usefulness / numReviews).toFixed(2)),
      avgWorkload: parseFloat((totals.workload / numReviews).toFixed(2)),
      avgGradingFairness: parseFloat((totals.gradingFairness / numReviews).toFixed(2)),
      numReviews,
      topTags,
      lastReviewAt
    };
  }

  // Update course with new aggregates
  await Course.findByIdAndUpdate(courseId, aggregates);

  return aggregates;
}

/**
 * Find or create a course based on transcript entry
 * Used for auto-catalog expansion when student adds transcript
 * 
 * @param {string} institution - Institution name (from user.schoolName)
 * @param {string} subject - Course subject code
 * @param {string} number - Course number
 * @param {string} title - Optional course title
 * @returns {Object} Course document
 */
async function findOrCreateCourse(institution, subject, number, title = null) {
  let course = await Course.findOne({
    institution,
    courseSubject: subject,
    courseNumber: number
  });

  if (!course) {
    course = await Course.create({
      institution,
      courseSubject: subject,
      courseNumber: number,
      title: title || `${subject} ${number}`,
      description: ''
    });
  }

  return course;
}

/**
 * Get course with aggregates, respecting syllabus filter preference
 * 
 * @param {ObjectId} courseId - Course ID
 * @param {boolean} filterBySyllabus - Whether to filter reviews by syllabus date
 * @returns {Object} Course with potentially recalculated aggregates
 */
async function getCourseWithAggregates(courseId, filterBySyllabus = false) {
  const course = await Course.findById(courseId);
  if (!course) return null;

  if (filterBySyllabus && course.syllabusRevisionDate) {
    // Recalculate with filter (doesn't persist, just returns)
    const query = {
      courseId,
      status: 'active',
      createdAt: { $gte: course.syllabusRevisionDate }
    };
    
    const reviews = await Review.find(query);
    const numReviews = reviews.length;

    if (numReviews < MIN_REVIEWS_FOR_AGGREGATES) {
      return {
        ...course.toJSON(),
        avgDifficulty: null,
        avgUsefulness: null,
        avgWorkload: null,
        avgGradingFairness: null,
        numReviews,
        filteredBySyllabus: true
      };
    }

    // Calculate filtered aggregates
    const totals = reviews.reduce((acc, review) => {
      acc.difficulty += review.difficulty;
      acc.usefulness += review.usefulness;
      acc.workload += review.workload;
      acc.gradingFairness += review.gradingFairness;
      return acc;
    }, { difficulty: 0, usefulness: 0, workload: 0, gradingFairness: 0 });

    return {
      ...course.toJSON(),
      avgDifficulty: parseFloat((totals.difficulty / numReviews).toFixed(2)),
      avgUsefulness: parseFloat((totals.usefulness / numReviews).toFixed(2)),
      avgWorkload: parseFloat((totals.workload / numReviews).toFixed(2)),
      avgGradingFairness: parseFloat((totals.gradingFairness / numReviews).toFixed(2)),
      numReviews,
      filteredBySyllabus: true
    };
  }

  return course;
}

module.exports = {
  validateReviewEligibility,
  recalculateCourseAggregates,
  findOrCreateCourse,
  getCourseWithAggregates,
  MIN_REVIEWS_FOR_AGGREGATES
};
