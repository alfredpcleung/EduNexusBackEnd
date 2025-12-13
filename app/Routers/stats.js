/**
 * Stats Router
 * Homepage metrics endpoints
 */

const express = require('express');
const router = express.Router();
const statsController = require('../Controllers/stats');

// Individual metric endpoints
router.get('/registered-students', statsController.registeredStudents);
router.get('/courses-with-reviews', statsController.coursesWithReviews);
router.get('/active-students', statsController.activeStudents);
router.get('/projects-recruiting', statsController.projectsRecruiting);

// Combined endpoint (all metrics in one call)
router.get('/all', statsController.all);

module.exports = router;
