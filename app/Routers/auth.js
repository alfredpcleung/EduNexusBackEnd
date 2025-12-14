
const Router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const AuthController = require('../Controllers/auth');

// Rate limiting: relaxed for test, strict for production
const authLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: process.env.NODE_ENV === 'test' ? 1000 : 5,
	message: { success: false, message: 'Too many attempts, please try again later.' }
});

// Validation and sanitization for signup
const signupValidation = [
	body('firstName').trim().notEmpty().withMessage('First name is required'),
	body('lastName').trim().notEmpty().withMessage('Last name is required'),
	body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
	body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
	body('school').optional().trim().escape(),
	body('fieldOfStudy').optional().trim().escape(),
	body('role').optional().isIn(['student', 'admin']),
	body('github').optional().trim().escape(),
	body('personalWebsite').optional().trim().escape(),
	body('linkedin').optional().trim().escape(),
	body('bio').optional().trim().escape(),
	body('profilePic').optional().trim().escape()
];

// Validation and sanitization for signin
const signinValidation = [
	body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
	body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Sign up endpoint - Create a new user
Router.post('/signup', authLimiter, signupValidation, AuthController.signup);

// Sign in endpoint - Authenticate user
Router.post('/signin', authLimiter, signinValidation, AuthController.signin);

module.exports = Router;
