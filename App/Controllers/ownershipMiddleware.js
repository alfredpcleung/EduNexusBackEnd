const CourseModel = require('../Models/course');
const errorResponse = require('../Utils/errorResponse');

// Middleware to check if user owns the course or is admin
module.exports.checkCourseOwnership = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const userUid = req.user.uid; // From auth middleware - use UID since course.owner is a UID
        const userRole = req.user.role; // Get user role for admin check

        const course = await CourseModel.findById(courseId);

        if (!course) {
            return errorResponse(res, 404, "Course not found");
        }

        // Admin users bypass ownership check
        if (userRole === 'admin') {
            req.course = course;
            return next();
        }

        // Check if the user is the owner (compare by UID string)
        if (course.owner !== userUid) {
            return errorResponse(res, 403, "You are not authorized to perform this action.");
        }

        // Store course in request for potential use in controller
        req.course = course;
        next();

    } catch (error) {
        console.log(error);
        errorResponse(res, 500, "Error checking course ownership");
    }
};
