const Router = require('express').Router();

const CourseController = require('../Controllers/course');
const AuthMiddleware = require('../Controllers/authMiddleware');

// Public routes
Router.get('/', CourseController.list);
Router.get('/:id', CourseController.getById);
Router.get('/lookup/:school/:subject/:number', CourseController.lookup);

// Authenticated routes
Router.post('/', AuthMiddleware.requireAuth, CourseController.create);
Router.post('/find-or-create', AuthMiddleware.requireAuth, CourseController.findOrCreate);
Router.put('/:id', AuthMiddleware.requireAuth, CourseController.update);
Router.delete('/:id', AuthMiddleware.requireAuth, CourseController.delete);

module.exports = Router;
