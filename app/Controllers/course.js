const CourseModel = require('../Models/course');
const { findOrCreateCourse, getCourseWithAggregates } = require('../Services/reviewService');
const errorResponse = require('../Utils/errorResponse');

/**
 * POST /api/courses
 * Create a new course catalog entry
 * Any authenticated user can create if course doesn't exist (Option D)
 */
module.exports.create = async function (req, res, next) {
  try {
    const { institution, courseSubject, courseNumber, title, description, credits, syllabusRevisionDate, prerequisites, corequisites } = req.body;

    // Validate required fields
    if (!institution || !institution.trim()) {
      return errorResponse(res, 400, 'Institution is required');
    }
    if (!courseSubject || !courseSubject.trim()) {
      return errorResponse(res, 400, 'Course subject is required');
    }
    if (!courseNumber || !courseNumber.trim()) {
      return errorResponse(res, 400, 'Course number is required');
    }
    if (!title || !title.trim()) {
      return errorResponse(res, 400, 'Course title is required');
    }

    // Normalize subject to uppercase
    const normalizedSubject = courseSubject.toUpperCase();

    // Check if course already exists
    const existingCourse = await CourseModel.findOne({
      institution,
      courseSubject: normalizedSubject,
      courseNumber
    });

    if (existingCourse) {
      return errorResponse(res, 409, `Course ${normalizedSubject} ${courseNumber} already exists for ${institution}`);
    }

    // Create new course
    const newCourse = await CourseModel.create({
      institution,
      courseSubject: normalizedSubject,
      courseNumber,
      title,
      description: description || '',
      credits: credits || 4,
      syllabusRevisionDate: syllabusRevisionDate || null,
      prerequisites: prerequisites || [],
      corequisites: corequisites || []
    });

    res.status(201).json({
      success: true,
      data: newCourse
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, 400, messages.join(', '));
    }
    if (error.code === 11000) {
      return errorResponse(res, 409, 'Course already exists');
    }
    next(error);
  }
};

/**
 * GET /api/courses
 * List all courses with optional filters
 * Query params: institution, courseSubject, search, filterBySyllabus
 */
module.exports.list = async function (req, res, next) {
  try {
    const { institution, courseSubject, search, limit = 50, skip = 0 } = req.query;

    // Build query
    const query = {};
    if (institution) query.institution = institution;
    if (courseSubject) query.courseSubject = courseSubject.toUpperCase();
    
    // Text search on title/description
    if (search) {
      query.$text = { $search: search };
    }

    const courses = await CourseModel.find(query)
      .sort({ institution: 1, courseSubject: 1, courseNumber: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await CourseModel.countDocuments(query);

    res.json({
      success: true,
      data: courses,
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
 * GET /api/courses/:id
 * Get course by ID with aggregates
 * Query params: filterBySyllabus (boolean)
 */
module.exports.getById = async function (req, res, next) {
  try {
    const { id } = req.params;
    const filterBySyllabus = req.query.filterBySyllabus === 'true';

    const course = await getCourseWithAggregates(id, filterBySyllabus);
    
    if (!course) {
      return errorResponse(res, 404, 'Course not found');
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/courses/lookup/:institution/:subject/:number
 * Lookup course by institution + subject + number
 */
module.exports.lookup = async function (req, res, next) {
  try {
    const { institution, subject, number } = req.params;

    const course = await CourseModel.findOne({
      institution,
      courseSubject: subject.toUpperCase(),
      courseNumber: number
    });

    if (!course) {
      return errorResponse(res, 404, 'Course not found');
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/courses/:id
 * Update course metadata (admin only or community edit)
 * Cannot modify aggregates directly - they are calculated from reviews
 */
module.exports.update = async function (req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, credits, syllabusRevisionDate, prerequisites, corequisites } = req.body;

    // Only allow updating metadata fields, not aggregates
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (credits !== undefined) updateData.credits = credits;
    if (syllabusRevisionDate !== undefined) updateData.syllabusRevisionDate = syllabusRevisionDate;
    if (prerequisites !== undefined) updateData.prerequisites = prerequisites;
    if (corequisites !== undefined) updateData.corequisites = corequisites;

    const course = await CourseModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!course) {
      return errorResponse(res, 404, 'Course not found');
    }

    res.json({
      success: true,
      data: course
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
 * DELETE /api/courses/:id
 * Delete course (admin only)
 * Note: Should also handle associated reviews
 */
module.exports.delete = async function (req, res, next) {
  try {
    const { id } = req.params;

    const result = await CourseModel.findByIdAndDelete(id);

    if (!result) {
      return errorResponse(res, 404, 'Course not found');
    }

    // TODO: Also soft-delete associated reviews
    // await ReviewModel.updateMany({ courseId: id }, { status: 'deleted' });

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/courses/find-or-create
 * Find existing course or create new one (for transcript auto-creation)
 */
module.exports.findOrCreate = async function (req, res, next) {
  try {
    const { institution, courseSubject, courseNumber, title } = req.body;

    if (!institution || !courseSubject || !courseNumber) {
      return errorResponse(res, 400, 'institution, courseSubject, and courseNumber are required');
    }

    const course = await findOrCreateCourse(
      institution,
      courseSubject.toUpperCase(),
      courseNumber,
      title
    );

    res.json({
      success: true,
      data: course,
      created: !course.title || course.title === `${courseSubject.toUpperCase()} ${courseNumber}`
    });
  } catch (error) {
    next(error);
  }
};

// Legacy alias for backward compatibility
module.exports.inventoryByID = module.exports.getById;
