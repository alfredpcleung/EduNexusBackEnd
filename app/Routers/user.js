var Router = require('express').Router();
var UserController = require('../Controllers/user');
var AuthMiddleware = require('../Controllers/authMiddleware');

Router.get('/', UserController.list);
Router.post('/', UserController.create);
Router.put('/setadmin/:userID',  
    AuthMiddleware.requireAuth,
    UserController.setAdmin);

Router.get('/:uid', 
    UserController.SetUserByUID,
    UserController.read);
Router.put('/:uid', 
    AuthMiddleware.requireAuth,
    UserController.update);
Router.delete('/:uid', 
    AuthMiddleware.requireAuth,
    UserController.delete);

module.exports = Router;
