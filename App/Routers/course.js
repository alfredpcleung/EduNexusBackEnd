var Router = require("express").Router();

var CourseController = require('../Controllers/course');
var authController = require('../Controllers/auth');

Router.get('/', CourseController.list);
Router.post('/', authController.requireSignin, CourseController.create);
Router.get('/:id', CourseController.inventoryByID);
Router.put('/:id',  authController.requireSignin, CourseController.hasAuthorization, CourseController.update);
Router.delete('/:id', authController.requireSignin, CourseController.hasAuthorization, CourseController.delete);

module.exports = Router;