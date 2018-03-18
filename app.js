var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const requestIp = require('request-ip');
var firebase = require("firebase");
require('firebase/database');
var config = {
  apiKey: "AIzaSyB7hwFl69Wkp_cC62nNOOEDQzFGn7MnAWE",
  authDomain: "rate-limiter.firebaseapp.com",
  databaseURL: "https://rate-limiter.firebaseio.com",
  projectId: "rate-limiter",
  storageBucket: "",
  messagingSenderId: "249092173677"
};
firebase.initializeApp(config);
var database = firebase.database();
firebase.auth().signInWithEmailAndPassword("sample@sample.com", "samplepassword").then(function(user) {
    console.dir('database-connect');
  }, function(error) {
    console.dir('database-error');
});

var index = require('./routes/index');
var users = require('./routes/users');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var CheckLimit = function (req, res, next) {
  var ip = String(requestIp.getClientIp(req)).replace(/:/g,'?').replace(/\./g,'!');
  var d = new Date();
  var timestamp = "D" + String(d.getFullYear())+String(d.getMonth())+String(d.getDate())+String(d.getHours());
  console.log('check:'+ip+' timestamp:'+timestamp+' realip:'+requestIp.getClientIp(req));
  firebase.database().ref('/users/' + ip + '/'+timestamp).once('value').then(function(snapshot) {
      var data = snapshot.val();
      if(data!=null){
        if(data.time>=1000){
          res.sendStatus(429);
        }else{
          firebase.database().ref('users/' + ip + '/'+timestamp).set({
            time: parseInt(data.time)+1
          }).then(function(){
            next();
          });
        }
      }else{
        firebase.database().ref('users/' + ip + '/'+timestamp).set({
          time: 1
        }).then(function(){
            next();
        });
      }
  });
};
app.use(CheckLimit);

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
