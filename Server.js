var Express = require("express");

var app = Express();



app.Listen(3000, ()=> {
    console.log("Server is running at  http://localhost:3000/");
});
