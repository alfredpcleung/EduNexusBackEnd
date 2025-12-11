const CourseModel = require('../Models/course');

// Middleware to check if user owns the course
module.exports.checkCourseOwnership = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.userId; // From auth middleware

        const course = await CourseModel.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Check if the user is the owner
        if (course.owner.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to perform this action. Only the course owner can modify it."
            });
        }

        // Store course in request for potential use in controller
        req.course = course;
        next();

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Error checking course ownership"
        });
    }
};
