const Project = require('../Models/project');
const errorResponse = require('../Utils/errorResponse');

/**
 * GET /api/projects
 * Public endpoint - list all projects with optional filters
 */
exports.listProjects = async (req, res) => {
  try {
    const { courseId, owner, status } = req.query;
    let filter = {};

    if (courseId) filter.courseId = courseId;
    if (owner) filter.owner = owner;
    if (status) filter.status = status;

    const projects = await Project.find(filter).sort({ created: -1 });
    res.status(200).json({
      success: true,
      data: projects,
      count: projects.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
};

/**
 * GET /api/projects/:projectId
 * Public endpoint - get single project by ID
 */
exports.getProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
};

/**
 * POST /api/projects
 * Protected endpoint - create new project
 * Body: { title, description, courseId?, tags?, status? }
 */
exports.createProject = async (req, res) => {
  try {
    const { title, description, courseId, tags, status } = req.body;
    const ownerUid = req.user.uid;

    if (!title) {
      return errorResponse(res, 400, 'Title is required');
    }

    const newProject = new Project({
      title,
      description,
      owner: ownerUid,
      courseId,
      tags: tags || [],
      status: status || 'active'
    });

    await newProject.save();
    res.status(201).json({
      success: true,
      data: newProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  }
};

/**
 * PUT /api/projects/:projectId
 * Protected endpoint - update project (owner only)
 * Body: { title?, description?, tags?, status? }
 */
exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const ownerUid = req.user.uid;
    const { title, description, tags, status } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    // Check ownership
    if (project.owner !== ownerUid) {
      return errorResponse(res, 403, 'You are not authorized to perform this action');
    }

    // Update fields
    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (tags !== undefined) project.tags = tags;
    if (status !== undefined) project.status = status;

    project.updated = new Date();
    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message
    });
  }
};

/**
 * DELETE /api/projects/:projectId
 * Protected endpoint - delete project (owner only)
 */
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const ownerUid = req.user.uid;

    const project = await Project.findById(projectId);
    if (!project) {
      return errorResponse(res, 404, 'Project not found');
    }

    // Check ownership
    if (project.owner !== ownerUid) {
      return errorResponse(res, 403, 'You are not authorized to perform this action');
    }

    await Project.findByIdAndDelete(projectId);
    res.status(200).json({
      success: true,
      data: { message: 'Project deleted successfully' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
};
