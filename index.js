var express = require("express");
var app = express();
let router  = require('./routes/github');
let bodyParser = require("body-parser")
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

//use github routes
app.use('/api/v1',router);


app.listen(200,()=>{
     console.log("Server started");
})