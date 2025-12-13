const express = require('express');
const router = express.Router();
const projectController = require('../Controllers/project');
const { requireAuth } = require('../Controllers/authMiddleware');

// Public routes
router.get('/', projectController.listProjects);
router.get('/:projectId', projectController.getProject);

// Protected routes (require authentication)
router.post('/', requireAuth, projectController.createProject);
router.put('/:projectId', requireAuth, projectController.updateProject);
router.delete('/:projectId', requireAuth, projectController.deleteProject);

module.exports = router;
