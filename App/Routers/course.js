var Router = require("express").Router();

var CourseController = require('../Controllers/course');
var AuthMiddleware = require('../Controllers/authMiddleware');
var OwnershipMiddleware = require('../Controllers/ownershipMiddleware');

Router.get('/', CourseController.list);
Router.post('/', AuthMiddleware.requireAuth, CourseController.create);
Router.get('/:id', CourseController.inventoryByID);
Router.put('/:id', AuthMiddleware.requireAuth, OwnershipMiddleware.checkCourseOwnership, CourseController.update);
Router.delete('/:id', AuthMiddleware.requireAuth, OwnershipMiddleware.checkCourseOwnership, CourseController.delete);

module.exports = Router;