var CourseModel = require("../Models/course");
var UserModel = require("../Models/user");

// Create a new course
module.exports.create = async function (req, res, next) {
    try {
        console.log("body: ", req.body);

        let newItem = req.body;

        // Handle tags: accept either array or comma-separated string
        if (Array.isArray(req.body.tags)) {
            newItem.tags = req.body.tags;
        } else if (typeof req.body.tags === "string") {
            newItem.tags = req.body.tags.split(",").map(word => word.trim());
        } else {
            newItem.tags = [];
        }

        // Use owner from request body instead of req.auth
        newItem.owner = req.body.owner || "Unknown";

        let result = await CourseModel.create(newItem);
        res.json(result);

    } catch (error) {
        console.log(error);
        next(error);
    }
};

// List all courses
module.exports.list = async function (req, res, next) {
    try {
        let list = await CourseModel.find();
        res.json(list);
    } catch (error) {
        console.log(error);
        next(error);
    }
};

// Get course by ID
module.exports.inventoryByID = async function (req, res, next) {
    try {
        let inventory = await CourseModel.findOne({ _id: req.params.id });
        res.json(inventory);
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
            return res.status(404).json({ success: false, message: "Not Found" });
        }

        res.json({ success: true, data: result });
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
            res.json({ success: true, message: "Course deleted successfully." });
        } else {
            res.json({ success: false, message: "Course not deleted. Are you sure it exists?" });
        }
    } catch (error) {
        console.log(error);
        next(error);
    }
};