
var Router = require('express').Router();
var UserController = require('../Controllers/user');
var AuthMiddleware = require('../Controllers/authMiddleware');

// Account settings update (email/password) - moved to top to avoid shadowing
const AccountSettingsController = require('../Controllers/accountSettings');
Router.patch('/settings', 
    AuthMiddleware.requireAuth,
    AccountSettingsController.updateSettings);

Router.get('/', AuthMiddleware.requireAuth, UserController.list);
// Router.post('/', UserController.create); // Disabled direct user creation for security; use /api/auth/signup
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
