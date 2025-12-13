require('dotenv').config();

var Express = require("express");
var cors = require('cors');
var createError = require('http-errors');
var logger = require('morgan');
var configDb = require('./Config/db.js');
var authRouter = require('./App/Routers/auth.js');
var userRouter = require('./App/Routers/user.js');
var courseRotuer = require('./App/Routers/course.js');
var projectRouter = require('./App/Routers/project.js');
var feedbackRouter = require('./App/Routers/feedback.js');
var dashboardRouter = require('./App/Routers/dashboard.js');

var app = Express();
configDb();

app.use(cors());
app.use(logger('dev') );
app.use(Express.json());
app.use(Express.urlencoded({ extended: false }));

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/courses', courseRotuer);
app.use('/api/projects', projectRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/dashboard', dashboardRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  
  let statusCode = err.status || 500;
  let message = err.message;
  
  // Check if it's a Mongoose error by checking properties
  const isMongooseValidationError = err.errors !== undefined || err.name === 'ValidationError';
  
  // Handle Mongoose validation errors
  if (isMongooseValidationError || err.name === 'ValidationError') {
    statusCode = 400;
    if (err.errors) {
      const errors = Object.values(err.errors).map(e => e.message || e);
      message = errors.join(', ') || 'Validation failed';
    }
  }
  
  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError' || err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  
  // Handle Mongoose duplicate key errors
  if (err.code === 11000 || err.message.includes('duplicate key')) {
    statusCode = 400;
    if (err.keyPattern) {
      const fields = Object.keys(err.keyPattern);
      message = `Duplicate value for field(s): ${fields.join(', ')}`;
    }
  }
  
  res.status(statusCode);
  res.json(
    {
      success: false,
      message: message
    }
  );
});


app.listen(3000 || 1000, ()=> {
    console.log("Server is running at  http://localhost:3000/");
    //SebastianVelasco
});
