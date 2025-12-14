// Minimal Express app for Supertest (no listen)
const Express = require('express');
const cors = require('cors');
const logger = require('morgan');
const createError = require('http-errors');
const configDb = require('../config/db.js');
const authRouter = require('./Routers/auth.js');
const userRouter = require('./Routers/user.js');
const courseRotuer = require('./Routers/course.js');
const projectRouter = require('./Routers/project.js');
const feedbackRouter = require('./Routers/feedback.js');
const dashboardRouter = require('./Routers/dashboard.js');
const reviewRouter = require('./Routers/review.js');
const statsRouter = require('./Routers/stats.js');

const app = Express();
configDb();

app.use(cors());
app.use(logger('dev'));
app.use(Express.json());
app.use(Express.urlencoded({ extended: false }));

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/courses', courseRotuer);
app.use('/api/projects', projectRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/stats', statsRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  let statusCode = err.status || 500;
  let message = err.message;
  const isMongooseValidationError = err.errors !== undefined || err.name === 'ValidationError';
  if (isMongooseValidationError || err.name === 'ValidationError') {
    statusCode = 400;
    if (err.errors) {
      const errors = Object.values(err.errors).map(e => e.message || e);
      message = errors.join(', ') || 'Validation failed';
    }
  }
  if (err.name === 'CastError' || err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  if (err.code === 11000 || (err.message && err.message.includes('duplicate key'))) {
    statusCode = 400;
    if (err.keyPattern) {
      const fields = Object.keys(err.keyPattern);
      message = `Duplicate value for field(s): ${fields.join(', ')}`;
    }
  }
  res.status(statusCode);
  res.json({ success: false, message });
});

module.exports = app;
