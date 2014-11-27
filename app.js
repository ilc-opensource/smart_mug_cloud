var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var users = require('./routes/users');
var fs = require('fs');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());

app.use('/', routes);
app.use('/users', users);

var Social = require('./social.js');
var social = new Social(app);

var WeChat = require("./wechat.js");
var weChat = new WeChat(social);

var WeiBo = require("./weibo.js");
var weiBo = new WeiBo(social);

var FreeDraw = require('./freedraw.js');
var freeDraw = new FreeDraw(social);

var Weather = require('./weather.js');
var weather = new Weather(social);

var Twitter = require('./twitter.js');
var twitter = new Twitter(social);

var GetDeviceID = require('./getDeviceID.js');
var getDeviceID = new GetDeviceID(social);

fs.watch(path.join(__dirname, 'account.json'), function(e, filename) {
  social.account = JSON.parse(fs.readFileSync(path.join(__dirname, 'account.json'), 'utf8'));
});

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});



module.exports = app;
