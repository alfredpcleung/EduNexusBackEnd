/**
 * Stats Controller
 * Provides aggregate metrics for homepage cards
 */

const User = require('../Models/user');
const Course = require('../Models/course');
const Project = require('../Models/project');
const Review = require('../Models/review');
const Feedback = require('../Models/feedback');

// Active period: 90 days
const ACTIVE_DAYS = 90;

/**
 * GET /api/stats/registered-students
 * Count of users with role: "student"
 */
module.exports.registeredStudents = async function (req, res, next) {
  try {
    const count = await User.countDocuments({ role: 'student' });
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/stats/courses-with-reviews
 * Count of courses with at least one review
 */
module.exports.coursesWithReviews = async function (req, res, next) {
  try {
    const count = await Course.countDocuments({ numReviews: { $gte: 1 } });
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/stats/active-students
 * Students who logged in OR created content within last 90 days
 * 
 * Definition: A student is "active" if ANY of the following is true:
 * - lastLogin within 90 days
 * - Created a review within 90 days
 * - Created a project within 90 days
 * - Created feedback within 90 days
 */
module.exports.activeStudents = async function (req, res, next) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ACTIVE_DAYS);

    // Get UIDs of students who logged in recently
    const recentLogins = await User.find(
      { role: 'student', lastLogin: { $gte: cutoffDate } },
      { uid: 1 }
    ).lean();
    const loginUids = new Set(recentLogins.map(u => u.uid));

    // Get UIDs of users who created reviews recently
    const recentReviewers = await Review.distinct('authorUid', {
      createdAt: { $gte: cutoffDate },
      status: 'active'
    });

    // Get UIDs of users who created projects recently
    const recentProjectOwners = await Project.distinct('owner', {
      created: { $gte: cutoffDate }
    });

    // Get UIDs of users who created feedback recently
    const recentFeedbackAuthors = await Feedback.distinct('authorId', {
      created: { $gte: cutoffDate }
    });

    // Combine all unique UIDs
    const allActiveUids = new Set([
      ...loginUids,
      ...recentReviewers,
      ...recentProjectOwners,
      ...recentFeedbackAuthors
    ]);

    // Filter to only students (verify UIDs belong to students)
    const studentCount = await User.countDocuments({
      uid: { $in: Array.from(allActiveUids) },
      role: 'student'
    });

    res.json({ count: studentCount });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/stats/projects-recruiting
 * Count of projects with status: "active" AND recruiting: true
 */
module.exports.projectsRecruiting = async function (req, res, next) {
  try {
    const count = await Project.countDocuments({
      status: 'active',
      recruiting: true
    });
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/stats/all
 * Returns all four metrics in a single response (for efficiency)
 */
module.exports.all = async function (req, res, next) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ACTIVE_DAYS);

    // Run all queries in parallel
    const [
      registeredStudents,
      coursesWithReviews,
      projectsRecruiting,
      recentLogins,
      recentReviewers,
      recentProjectOwners,
      recentFeedbackAuthors
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Course.countDocuments({ numReviews: { $gte: 1 } }),
      Project.countDocuments({ status: 'active', recruiting: true }),
      User.find({ role: 'student', lastLogin: { $gte: cutoffDate } }, { uid: 1 }).lean(),
      Review.distinct('authorUid', { createdAt: { $gte: cutoffDate }, status: 'active' }),
      Project.distinct('owner', { created: { $gte: cutoffDate } }),
      Feedback.distinct('authorId', { created: { $gte: cutoffDate } })
    ]);

    // Calculate active students
    const allActiveUids = new Set([
      ...recentLogins.map(u => u.uid),
      ...recentReviewers,
      ...recentProjectOwners,
      ...recentFeedbackAuthors
    ]);

    const activeStudents = await User.countDocuments({
      uid: { $in: Array.from(allActiveUids) },
      role: 'student'
    });

    res.json({
      registeredStudents,
      coursesWithReviews,
      activeStudents,
      projectsRecruiting
    });
  } catch (error) {
    next(error);
  }
};
