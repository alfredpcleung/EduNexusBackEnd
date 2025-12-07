var Router = require("express").Router();

var CourseController = require('../Controllers/course');
var authController = require('../Controllers/firebaseAuth');

Router.get('/', CourseController.list);
Router.post('/', CourseController.create);
// Router.post('/', authController.requireSignin, CourseController.create);
Router.get('/:id', CourseController.inventoryByID);
// Router.put('/:id',  authController.requireSignin, CourseController.hasAuthorization, CourseController.update);
Router.put('/:id', CourseController.update);
// Router.delete('/:id', authController.requireSignin, CourseController.hasAuthorization, CourseController.delete);
Router.delete('/:id', CourseController.delete);

module.exports = Router;