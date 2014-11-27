var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');

var userID = 1641036711;
//console.log(JSON.parse(fs.readFileSync(path.join(__dirname, 'media.json'), 'utf8')));
var dirName = path.join(__dirname, 'media', String(userID));
  rimraf(dirName, function (er) {
    if (er) {throw er;}
    fs.mkdir(dirName, function (ex) {
      if (ex) {throw ex;}
      console.log('Create directory:'+dirName);
      //set isMediaFileReady[String(body.FromUserName)] = true in action
      //action;
    });
  });

