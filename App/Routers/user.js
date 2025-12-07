var Router = require('express').Router();
var UserController = require('../Controllers/user');
// var UserAuth = require('../Controllers/firebaseAuth');

Router.get('/', UserController.list);
Router.post('/', UserController.create);
Router.put('/setadmin/:userID',  
    UserController.setAdmin);

Router.get('/:id', 
    UserController.SetUserByID,
    UserController.read);
Router.put('/:id', 
    UserController.update);
Router.delete('/:id', 
    UserController.delete);

module.exports = Router;