const User = require('../Models/user');
const Course = require('../Models/course');
const Project = require('../Models/project');
const Feedback = require('../Models/feedback');
const Review = require('../Models/review');
const errorResponse = require('../Utils/errorResponse');

/**
 * GET /api/dashboard/me
 * Protected endpoint - get user dashboard with enrolled courses, reviews, projects, and feedback
 */
exports.getDashboard = async (req, res) => {
  try {
    const userUid = req.user.uid;

    // Fetch user
    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Get courses from user's academic records (transcript)
    const transcriptCourses = [];
    if (user.academicRecords && user.academicRecords.length > 0) {
      for (const record of user.academicRecords) {
        // Find matching course in catalog
        const course = await Course.findOne({
          institution: user.schoolName,
          courseSubject: record.subject,
          courseNumber: record.courseCode
        }).select('_id institution courseSubject courseNumber title description credits');
        
        if (course) {
          transcriptCourses.push({
            ...course.toObject(),
            term: record.term,
            year: record.year,
            grade: record.grade
          });
        }
      }
    }

    // Fetch reviews authored by user
    const userReviews = await Review.find({ authorUid: userUid, status: 'active' })
      .populate('courseId', 'institution courseSubject courseNumber title')
      .select('courseId term year difficulty usefulness workload gradingFairness tags comment created');

    // Fetch projects owned by user
    const ownedProjects = await Project.find({ owner: userUid }).select('_id title description courseId tags status created updated');

    // Fetch feedback authored by user
    const authoredFeedback = await Feedback.find({ authorId: userUid }).select('_id projectId rating comment created updated');

    res.status(200).json({
      success: true,
      dashboard: {
        user: {
          uid: user.uid,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          schoolName: user.schoolName,
          programName: user.programName,
          profilePic: user.profilePic,
          bio: user.bio,
          linkedin: user.linkedin,
          created: user.created,
          updated: user.updated
        },
        enrolledCourses: {
          count: transcriptCourses.length,
          courses: transcriptCourses
        },
        userReviews: {
          count: userReviews.length,
          reviews: userReviews
        },
        ownedProjects: {
          count: ownedProjects.length,
          projects: ownedProjects
        },
        authoredFeedback: {
          count: authoredFeedback.length,
          feedback: authoredFeedback
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard',
      error: error.message
    });
  }
};
