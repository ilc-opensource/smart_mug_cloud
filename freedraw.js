var express = require('express');
var Canvas = require('canvas')
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');

// imgCreator==null, save image to /media/predefine/imgDir/imgName.jpg
// otherwise, save image to /media/imgCreator/imgName.jpg
// imgName should be 'img'+i
function saveImage(imageData, res, social) {
  var imgDir = imageData.dir;
  var imgName = imageData.name;
  var imgCreator = imageData.creator;
  var imgTimeStamp = imageData.timeStamp;
  var imgWidth = parseInt(imageData.width);
  var imgHeight = parseInt(imageData.height);

  var canvas = new Canvas(imgWidth, imgHeight);
  var ctx = canvas.getContext('2d');
  var p = ctx.getImageData(0, 0, imgWidth, imgHeight);

  if (imgCreator == '') {
    var JSONFile = path.join(__dirname, 'media', 'predefine', imgDir, 'media.json');
  } else {
    var JSONFile = path.join(__dirname, 'media', imgCreator, 'freeDraw', 'media.json');
  }
  if (fs.existsSync(JSONFile)) {
    var imageJSON = JSON.parse(fs.readFileSync(JSONFile, 'utf8'));
  } else {
    var imageJSON = {};
  }

  var img = [];
  for (var x=0; x<p.data.length; x+=8) {
    var pixels = 0;

    var color = imageData.data[x/4];
    if (color==-1) { //Background
      p.data[x+3] = 0;
    } else {
      p.data[x] = color%2!=0?255:0;
      p.data[x+1] = (color>>1)%2!=0?255:0;
      p.data[x+2] = (color>>2)%2!=0?255:0;
      p.data[x+3] = 255;
      pixels += color;
    }

    color = imageData.data[x/4+1];
    if (color==-1) { //Background
      p.data[x+7] = 0;
    } else {
      p.data[x+4] = color%2!=0?255:0;
      p.data[x+5] = (color>>1)%2!=0?255:0;
      p.data[x+6] = (color>>2)%2!=0?255:0;
      p.data[x+7] = 255;
      pixels += color*16;
    }
    img.push(pixels);
  }
  imageJSON[imgName] = img;
  ctx.putImageData(p, 0, 0);

  // Validate media.json
  var count = 0;
  delete imageJSON.numberOfImg;
  for (var i in imageJSON) {
    if (!imageJSON['img'+count]) {
      console.log('Error, image file invalid');
    }
    count++;
  }
  imageJSON.numberOfImg = count;

  if (imgCreator == '') {
    social.handler('predefine', imgDir,
      function() {
        saveAndPreview(imageJSON, 'predefine', imgDir, social, imgName, imgTimeStamp, canvas, res);
      }
    );
  } else {
    social.handler(imgCreator, 'freeDraw',
      function() {
        saveAndPreview(imageJSON, imgCreator, 'freeDraw', social, imgName, imgTimeStamp, canvas, res);
      }
    );
  }
  /*rimraf(dirName, function (er) {
    if (er) {throw er;}
    fs.mkdir(dirName, function (ex) {
      if (ex) {throw ex;}
      // Validate media.json
      var count = 0;
      delete imageJSON.numberOfImg;
      for (var i in imageJSON) {
        if (!imageJSON['img'+count]) {
         console.log('Error, image file invalid');
        }
        count++;
      }
      imageJSON.numberOfImg = count;
      fs.writeFile(path.join(dirName, 'media.json'),
        JSON.stringify(imageJSON),
        function (err) {
          if (err) throw err;
          console.log('It\'s saved!');
          social.isMediaFileReady[imgCreator] = true;});
      fs.writeFile(path.join(dirName, imgName+'_'+imgTimeStamp+'.jpg'),
        social.decodeBase64Image(canvas.toDataURL()).data,
        function (err) {if (err) throw err; res.send("Preview image ready");});
    });
  });*/
}

function saveAndPreview(imageJSON, user, app, social, imgName, imgTimeStamp, canvas, res) {
  var dirName = path.join(__dirname, 'media', user, app);
  fs.writeFile(path.join(dirName, 'media.json'),
    JSON.stringify(imageJSON),
    function (err) {
      if (err) throw err;
      console.log('It\'s saved!');
      social.isMediaFileReady[user+'@'+app] = true;});
  fs.writeFile(path.join(dirName, imgName+'_'+imgTimeStamp+'.jpg'),
    social.decodeBase64Image(canvas.toDataURL()).data,
    function (err) {if (err) throw err; res.send("Preview image ready");});
}

var freeDraw = function(social) {
  var app = social.app;

  app.use('/freedraw', express.static(__dirname + '/freedraw'));

  app.post('/uploadImg', function(req, res) {
    //console.log(JSON.stringify(req.body));
    saveImage(req.body, res, social);
  });
}

module.exports = freeDraw;
