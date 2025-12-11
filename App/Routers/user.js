var Router = require('express').Router();
var UserController = require('../Controllers/user');
var AuthMiddleware = require('../Controllers/authMiddleware');

Router.get('/', UserController.list);
Router.post('/', UserController.create);
Router.put('/setadmin/:userID',  
    AuthMiddleware.requireAuth,
    UserController.setAdmin);

Router.get('/:id', 
    UserController.SetUserByID,
    UserController.read);
Router.put('/:id', 
    AuthMiddleware.requireAuth,
    UserController.update);
Router.delete('/:id', 
    AuthMiddleware.requireAuth,
    UserController.delete);

module.exports = Router;