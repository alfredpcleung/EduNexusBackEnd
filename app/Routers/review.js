const Router = require('express').Router();

const ReviewController = require('../Controllers/review');
const AuthMiddleware = require('../Controllers/authMiddleware');
const { validateReviewCreation, isReviewAuthorOrAdmin } = require('../Middleware/reviewAuth');

// Defensive check: throw clear error if middleware is not a function
if (typeof validateReviewCreation !== 'function') {
  throw new Error('validateReviewCreation middleware is not a function. Check app/Middleware/reviewAuth.js export.');
}
if (typeof isReviewAuthorOrAdmin !== 'function') {
  throw new Error('isReviewAuthorOrAdmin middleware is not a function. Check app/Middleware/reviewAuth.js export.');
}

// Public routes
Router.get('/', ReviewController.list);
Router.get('/tags', ReviewController.getTags);
Router.get('/course/:courseId', ReviewController.getByCourse);
Router.get('/:reviewId', ReviewController.getById);

// Authenticated routes
Router.post('/',
  AuthMiddleware.requireAuth,
  validateReviewCreation,
  ReviewController.create
);

Router.put('/:reviewId',
  AuthMiddleware.requireAuth,
  isReviewAuthorOrAdmin,
  ReviewController.update
);

Router.delete('/:reviewId',
  AuthMiddleware.requireAuth,
  isReviewAuthorOrAdmin,
  ReviewController.delete
);

// Admin routes
Router.post('/refresh-aggregates/:courseId',
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireAdmin,
  ReviewController.refreshAggregates
);

module.exports = Router;
