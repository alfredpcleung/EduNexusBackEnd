var Express = require("express");
var cors = require('cors');
var createError = require('http-errors');
var logger = require('morgan');
var configDb = require('./Config/db.js');
var userRouter = require('./App/Routers/user.js');
var courseRotuer = require('./App/Routers/course.js')
var authRouter = require("./App/Routers/auth.js");
const firebaseAdmin = require("./Config/firebaseAdmin.js");

var app = Express();
configDb();
firebaseAdmin();

app.use(cors());
app.use(logger('dev') );
app.use(Express.json());
app.use(Express.urlencoded({ extended: false }));

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/courses', courseRotuer);

app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.json(
    {
      success: false,
      message: err.message
    }
  );
});


app.listen(3000, ()=> {
    console.log("Server is running at  http://localhost:3000/");
});
