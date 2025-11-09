var Express = require("express");
var cors = require('cors');
var createError = require('http-errors');
var logger = require('morgan');
var configDb = require('./Config/db.js');


var app = Express();

configDb();


app.listen(3000, ()=> {
    console.log("Server is running at  http://localhost:3000/");
});
