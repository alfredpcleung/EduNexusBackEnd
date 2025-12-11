const User = require('../Models/user');
const Course = require('../Models/course');
const Project = require('../Models/project');
const Feedback = require('../Models/feedback');

/**
 * GET /api/dashboard/me
 * Protected endpoint - get user dashboard with owned courses, projects, and feedback
 */
exports.getDashboard = async (req, res) => {
  try {
    const userUid = req.user.uid;

    // Fetch user
    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Fetch courses owned by user
    const ownedCourses = await Course.find({ owner: userUid }).select('_id title description credits instructor');

    // Fetch projects owned by user
    const ownedProjects = await Project.find({ owner: userUid }).select('_id title description courseId tags status created updated');

    // Fetch feedback authored by user
    const authoredFeedback = await Feedback.find({ authorId: userUid }).select('_id projectId rating comment created updated');

    res.status(200).json({
      success: true,
      dashboard: {
        user: {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          profilePic: user.profilePic,
          bio: user.bio,
          linkedin: user.linkedin,
          created: user.created,
          updated: user.updated
        },
        ownedCourses: {
          count: ownedCourses.length,
          courses: ownedCourses
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
