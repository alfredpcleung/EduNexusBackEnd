var CourseModel = require("../Models/course");
var UserModel = require("../Models/user");
var errorResponse = require("../Utils/errorResponse");

// Create a new course
module.exports.create = async function (req, res, next) {
    try {
        console.log("body: ", req.body);

        let newItem = req.body;

        // Validate required fields
        if (!newItem.title || !newItem.title.trim()) {
            return errorResponse(res, 400, 'Course title is required');
        }

        if (!newItem.description) {
            return errorResponse(res, 400, 'Course description is required');
        }

        // Handle tags: accept either array or comma-separated string
        if (Array.isArray(req.body.tags)) {
            newItem.tags = req.body.tags;
        } else if (typeof req.body.tags === "string") {
            newItem.tags = req.body.tags.split(",").map(word => word.trim());
        } else {
            newItem.tags = [];
        }

        // Set owner to the authenticated user's custom uid
        newItem.owner = req.user.uid;

        let result = await CourseModel.create(newItem);
        res.status(201).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.log(error);
        
        // Handle MongoDB validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }

        next(error);
    }
};

// List all courses
module.exports.list = async function (req, res, next) {
    try {
        let list = await CourseModel.find();
        res.json({
            success: true,
            data: list
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

// Get course by ID
module.exports.inventoryByID = async function (req, res, next) {
    try {
        let inventory = await CourseModel.findOne({ _id: req.params.id });
        if (!inventory) {
            return errorResponse(res, 404, "Course not found");
        }
        res.json({
            success: true,
            data: inventory
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

// Update course
module.exports.update = async function (req, res, next) {
    try {
        console.log("body: ", req.body);

        let result = await CourseModel.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!result) {
            return errorResponse(res, 404, "Course not found");
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

// Delete course
module.exports.delete = async function (req, res, next) {
    try {
        let result = await CourseModel.deleteOne({ _id: req.params.id });

        if (result.deletedCount > 0) {
            res.json({
                success: true,
                data: { message: "Course deleted successfully." }
            });
        } else {
            return errorResponse(res, 404, "Course not found");
        }
    } catch (error) {
        console.log(error);
        next(error);
    }
};