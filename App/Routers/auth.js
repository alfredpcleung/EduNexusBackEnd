const Router = require('express').Router();
const AuthController = require('../Controllers/auth');

// Sign up endpoint - Create a new user
Router.post('/signup', AuthController.signup);

// Sign in endpoint - Authenticate user
Router.post('/signin', AuthController.signin);

module.exports = Router;
