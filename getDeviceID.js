var express = require('express');

var getDeviceID = function(social) {
  var app = social.app;
  app.use('/getDeviceID', express.static(__dirname + '/getDeviceID'));
}

module.exports = getDeviceID;
