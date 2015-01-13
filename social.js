// Social mug
var express = require('express');
var crypto = require('crypto');
var xmlparser = require('express-xml-bodyparser');
var js2xml = require('js2xmlparser');
var Canvas = require('canvas');
var Image = Canvas.Image;
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var busboy = require('connect-busboy');
var child_process = require('child_process');
var https = require('https');
var cloudServer = require('./cloudServer.js').server;
var cloudPort = require('./cloudServer.js').port;

var Social = function(app) {
  var self = this;
  // Used for image creator, get preview
  app.use(express.static(path.join(__dirname, 'media')));
  app.use(xmlparser({'normalize': false}));

  this.app = app;
  this.doll = (JSON.parse(fs.readFileSync(path.join(__dirname, 'key2doll.json'), 'utf8'))).key2doll;
  this.enCharacter = JSON.parse(fs.readFileSync(path.join(__dirname, 'enCharacter.json'), 'utf8'));
  this.account = JSON.parse(fs.readFileSync(path.join(__dirname, 'account.json'), 'utf8'));
  for (var user in this.account) {
    if (!fs.existsSync(path.join(__dirname, 'media', user))) {
      fs.mkdirSync(path.join(__dirname, 'media', user));
    }
  }

  app.get('/mug', function(req, res) {
    var mugID = req.query.mugID;
    var app = req.query.app;

    /*if (app == 'weChat') {
      var latest = null
      for (var i=0; i<self.account[mugID].weChat.length; i++) {
      }
    }*/
    if (self.isMediaFileReady[mugID+'@'+app] == true) {
      self.isMediaFileReady[mugID+'@'+app] = false;
      //console.log('file name='+path.join(__dirname, 'media', mugID, app, 'media.json'));
      fs.readFile(path.join(__dirname, 'media', mugID, app, 'media.json'),
        function(err, data) {
          if (err) throw err;
          //console.log('read file');
          res.send(data);
          self.isMediaFileReady[mugID+'@'+app] = true;
        }
      );
    } else {
      res.send('');
    }
  });

  app.get('/getChineseImg', function(req, res) {
    var text = req.query.text;
    self.preProcessChinese(text);

    res.send('');
  });

  app.get('/downloadFile', function(req, res) {
    var fileName = req.query.fileName;
    var file = __dirname + '/media/' + fileName;
    console.log('in downloadFile'+file);
    res.download(file);
  });

  //app.use(busboy({immediate:true}));
  app.use(busboy());
  app.post('/uploadImage', function(req, res) {
    var fstream;
    var mugID = null;
    var app = null;
    var isImage = null;
    var isAudio = null;
    var isVideo = null;

    req.pipe(req.busboy);
    req.busboy.on('field', function(key, value, keyTruncated, valueTruncated) {
      console.log(key+'='+value);
      if (key=='mugID') {
        mugID = value;
      }
      if (key=='app') {
        app = value;
      }
      if (key=='isImage') {
        isImage = (value=='true')?true:false;
      }
      if (key=='isAudio') {
        isAudio = (value=='true')?true:false;
      }
      if (key=='isVideo') {
        isVideo = (value=='true')?true:false;
      }
    });
    req.busboy.on('file', function (fieldname, file, filename) {
      if (mugID!=null && app!=null &&
        ((isImage==true&&isAudio==null&&isVideo==null) ||
         (isImage==null&&isAudio==true&&isVideo==null) ||
         (isImage==null&&isAudio==null&&isVideo==true))) {
        if (!fs.existsSync(path.join(__dirname, 'media', mugID))) {
          fs.mkdirSync(path.join(__dirname, 'media', mugID));
        }
        if (!fs.existsSync(path.join(__dirname, 'media', mugID, app))) {
          fs.mkdirSync(path.join(__dirname, 'media', mugID, app));
        }
        var timer = (new Date()).getTime();
        if (isImage) {
          var fileName = path.join(__dirname, 'media', mugID, app, 'image'+timer+'.jpg');
        } else if (isAudio) {
          var fileName = path.join(__dirname, 'media', mugID, app, 'audio'+timer+'.mp3');
        } else if (isVideo){
          var fileName = path.join(__dirname, 'media', mugID, app, 'video'+timer+'.mp4');
        }
        fstream = fs.createWriteStream(fileName);
        file.pipe(fstream);
        fstream.on('close', function () {
          res.send('upload '+filename+' successfully!\n');
          if (isImage) {
            var fileName = path.join('/', mugID, app, 'image'+timer+'.jpg');
            var uploadCmd = 'curl -F media=@'+path.join(__dirname, 'media', mugID, app, 'image'+timer+'.jpg')+' "http://file.api.weixin.qq.com/cgi-bin/media/upload?access_token='+self.weChatAccessToken+'&type=image"';
          } else if (isAudio) {
            var fileName = path.join('/', mugID, app, 'audio'+timer+'.mp3');
            var uploadCmd = 'curl -F media=@'+path.join(__dirname, 'media', mugID, app, 'audio'+timer+'.mp3')+' "http://file.api.weixin.qq.com/cgi-bin/media/upload?access_token='+self.weChatAccessToken+'&type=voice"';
          } else {
            var fileName = path.join('/', mugID, app, 'video'+timer+'.mp4');
            var uploadCmd = 'curl -F media=@'+path.join(__dirname, 'media', mugID, app, 'video'+timer+'.mp4')+' "http://file.api.weixin.qq.com/cgi-bin/media/upload?access_token='+self.weChatAccessToken+'&type=video"';
          }
          child_process.exec(uploadCmd, function(err, stdout, stderr) {
            try {
            var mediaID = JSON.parse(stdout).media_id;
            self.sendToWeChatClient(mugID, isImage, isAudio, isVideo, fileName, mediaID);
            } catch(ex) {
              console.log(ex);
            }
          });
          //self.sendToWeChatClient(mugID, isImage, isAudio, isVideo, fileName);
          /*child_process.exec('curl -F media=@'+
            fileName+
            ' "http://file.api.weixin.qq.com/cgi-bin/media/upload?access_token='+
            self.weChatAccessToken+'&type=image"',
            function(error, stdout, stderr) {
              console.log(stdout);
              //Del the file after upload to weChat's server

            }
          );*/
        });
      } else {
        res.send('upload '+filename+' fail, mugID or app or isVideo is null!\n');
      }
    });
  });

};

Social.prototype.ledWidth = 16;
Social.prototype.ledHeight = 12;
Social.prototype.defaultStep = 2;
Social.prototype.defaultColor = 1; //RED
Social.prototype.isMediaFileReady = {};
Social.prototype.weChatAccessToken = null;

//Social.prototype.doll = (JSON.parse(fs.readFileSync(path.join(__dirname, 'key2doll.json'), 'utf8'))).key2doll;
//Social.prototype.account = JSON.parse(fs.readFileSync(path.join(__dirname, 'account.json'), 'utf8'));
Social.prototype.multiMedia2JSON = function(mediaFile, userID, app) {
  var self = this;
  var media = {};
  media.isAudio = true;
  media.file = '/'+userID+'/'+app+'/'+path.basename(mediaFile);

  fs.readFile(mediaFile,
    function(err, data) {
      if (err) {/*throw err;*/ console.log('!!!!! fatal error:'+err); return;}
      fs.writeFile(path.join(__dirname, 'media', userID, app, path.basename(mediaFile)),
        data,
        function(err) {
          if (err) throw err;
          fs.writeFile(path.join(__dirname, 'media', userID, app, 'media.json'),
            JSON.stringify(media),
            function(err) {
              if (err) throw err;
              self.isMediaFileReady[userID+'@'+app] = true;
            }
          );
        }
      );
    }
  );
};

var isNativeMultimedia = true;
Social.prototype.sendToWeChatClient = function(mugID, isImage, isAudio, isVideo, fileName, mediaID) {
  if (this.account[mugID] && this.account[mugID].weChat) {
    for (var idx=0; idx<this.account[mugID].weChat.length; idx++) {
      if (isNativeMultimedia) {
        if (isVideo) {
          var data = {
            "touser":this.account[mugID].weChat[idx],
            "msgtype":"video",
            "video": { "media_id":mediaID,
                       "thumb_media_id":"MEDIA_ID",
                       "title":"TITLE",
                       "description":"DESCRIPTION"
            }
          };
        } else if (isImage) {
          var data = {
            "touser":this.account[mugID].weChat[idx],
            "msgtype":"image",
            "image": {"media_id":mediaID}
          };
        } else if (isAudio) {
          var data = {
            "touser":this.account[mugID].weChat[idx],
            "msgtype":"voice",
            "voice": {"media_id":mediaID}
          };
        }
      } else {
        if (isVideo) {
          var data = {
            "touser":this.account[mugID].weChat[idx],
            "msgtype":"text",
            "text": {
              "content":'<a href="http://'+cloudServer+':'+cloudPort+'/weChatMultiMedia/?video='+fileName+'">video</a>'
            }
          };
        } else if (isImage) {
          var data = {
            "touser":this.account[mugID].weChat[idx],
            "msgtype":"text",
            "text": {
              "content":'<a href="http://'+cloudServer+':'+cloudPort+'/weChatMultiMedia/?image='+fileName+'">image</a>'
            }
          };
        } else if (isAudio) {
          var data = {
            "touser":this.account[mugID].weChat[idx],
            "msgtype":"text",
            "text": {
              "content":'<a href="http://'+cloudServer+':'+cloudPort+'/weChatMultiMedia/?audio='+fileName+'">audio</a>'
            }
          };
        }
      }

      var options = {
        hostname: 'api.weixin.qq.com',
        port: 443,
        path: '/cgi-bin/message/custom/send?access_token='+this.weChatAccessToken,
        method: 'POST',
        headers: {
          "Content-Type": 'application/x-www-form-urlencoded',
          "Content-Length": JSON.stringify(data).length
        }
      };
      var req = https.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          console.log('BODY: ' + chunk);
        });
      });
      req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
      });
      req.write(JSON.stringify(data));
      req.end();
    }
  }
};
Social.prototype.preProcessChinese = function(text) {
    var stringText = String(text);
    var isChineseImgExist = true;
    for (var i=0; i<stringText.length; i++) {
      var c = stringText[i];
      if (c.match(/[\u4E00-\u9FA5]/)) {
        if (!fs.existsSync(path.join(__dirname, 'media', 'Chinese', c+'.jpg'))) {
          var cmd = 'convert -page 16x12 -size 16x12 xc:black -font "'+path.join(__dirname, 'fontBitmap_9pt.bdf')+'" -fill white -draw "text 0,10 \''+c+'\'" '+path.join(__dirname, 'media', 'Chinese', c+'.jpg');
          console.log('trying to create jpg file cmd='+cmd);
          child_process.exec(cmd, function(error, stdout, stderr) { });
          isChineseImgExist = false;
        }
      }
    }
    return isChineseImgExist;
}

// set isMediaFileReady false, reate a empty directory, call cb, then set true
Social.prototype.handler = function(userID, app, action, p1, p2, p3, p4, p5) {
  //console.log('In social handler');
  var self = this;
  if (this.isMediaFileReady[userID+'@'+app] == false) {
    setTimeout(function(){self.handler(userID, app, action, p1, p2, p3, p4, p5);}, 500);
    return;
  }

  this.isMediaFileReady[userID+'@'+app] = false;
  // Create a empty ./media/userID/
  var dirName = path.join(__dirname, 'media', String(userID), app);
  var exist = fs.existsSync(path.join(__dirname, 'media', String(userID)));
  if (!exist) {
    fs.mkdirSync(path.join(__dirname, 'media', String(userID)));
  }
  var exist = fs.existsSync(dirName);
  if (!exist) {
    fs.mkdirSync(dirName);
  }

  if (action == self.movePredefineImg) {
    self.movePredefineImg(p1, p2, p3);
  } else if (action == self.text2Img) {
    self.text2Img(p1, p2, p3, p4, p5);
  } else if (action == self.multiMedia2JSON) {
    self.multiMedia2JSON(p1, p2, p3);
  } else {
    action();
  }

/*  rimraf(dirName, function (er) {
    if (er) {throw er;}
    fs.exists(path.join(__dirname, 'media', String(userID)),
      function(exists) {
        if (exists) {
          fs.mkdir(dirName, function (ex) {
            if (ex) {throw ex;}
            //console.log('Create directory:'+dirName);
            //set isMediaFileReady[String(body.FromUserName)] = true in action
            if (action == self.movePredefineImg) {
              self.movePredefineImg(p1, p2, p3);
            } else if (action == self.text2Img) {
              self.text2Img(p1, p2, p3, p4, p5);
            } else if (action == self.multiMedia2JSON) {
                self.multiMedia2JSON(p1, p2, p3);
            } else {
              action();
              //console.log('Action error');
            }
          });
        } else {
          fs.mkdir(path.join(__dirname, 'media', String(userID)), function(ex) {
            if (ex) {throw ex;}
            fs.mkdir(dirName, function (ex) {
              if (ex) {throw ex;}
              //console.log('Create directory:'+dirName);
              //set isMediaFileReady[String(body.FromUserName)] = true in action
              //action();
              if (action == self.movePredefineImg) {
                self.movePredefineImg(p1, p2, p3);
              } else if (action == self.text2Img) {
                self.text2Img(p1, p2, p3, p4, p5);
              } else if (action == self.multiMedia2JSON) {
                self.multiMedia2JSON(p1, p2, p3);
              } else {
                action();
                //console.log('Action error');
              }
            });
          });
        }
      }
    );
  });*/
};

Social.prototype.textAnalyzer = function(text) {
  try {
    var a = JSON.parse(text);
    if (a['emotion'] && this.doll[a['emotion']]) {
      return this.doll[a['emotion']]
    }
    if (a['doll'] && this.doll[a['doll']]) {
      return this.doll[a['doll']];
    }
    return null;
  } catch(ex) {
    return null;
  }
  var emotion = text.match(/^{emotion:\'(.*)\'}$/);
  if (emotion) {
    if (this.doll[emotion[1]]) {
      return this.doll[emotion[1]];
    }
  }

  var doll = text.match(/^{doll:\'(.*)\'}$/);
  if (doll) {
    if (this.doll[doll[1]]) {
      return this.doll[doll[1]];
    }
  }
  return null;
};

Social.prototype.movePredefineImg = function(key, userID, app) {
  if (typeof key == undefined ||
      typeof userID == undefined ||
      typeof app == undefined) {
    return;
  }

  var self = this;
  fs.readFile(path.join(__dirname, 'media', 'predefine', key, 'media.json'),
    function(err, data) {
      if (err) throw err;
      fs.writeFile(path.join(__dirname, 'media', userID, app, 'media.json'),
        data,
        function(err){
          if (err) throw err;
          self.isMediaFileReady[userID+'@'+app] = true;
          //console.log('Copy sucessefully');
        }
      );
    }
  );
};

Social.prototype.splitChEn = function(string) {
  var ch = [];
  var copy = string;
  while(true) {
    var m = copy.match(/[\u4E00-\u9FA5]+/);
    if (!m) break;
    copy = copy.slice(m.index+m[0].length);
    ch.push(m[0]);
  }
  var en = string.split(/[\u4E00-\u9FA5]+/);

  var result = [];
  if (string.match(/^[\u4E00-\u9FA5]/)) {
    for (var j=0; j<ch.length; j++) {
      result[j*2] = ch[j];
    }
    var index = 1;
    for (j=0; j<en.length; j++) {
      if (en[j]!='') {
        result[index] = en[j];
        index+=2;
      }
    }
  } else {
    var index = 0;
    for (var j=0; j<en.length; j++) {
      if (en[j]!='') {
        result[index] = en[j];
        index+=2;
      }
    }
    for (j=0; j<ch.length; j++) {
      result[j*2+1] = ch[j];
    }
  }
  return result;
}

// For mixture of Chinese and English characters,
// Fix vertical layout problem for mixture
Social.prototype.specialFill = function(text, ctx) {
  var splitedText = this.splitChEn(text);
  var index = 0;
  for (var i=0; i<splitedText.length; i++) {
    if (splitedText[i].match(/[\u4E00-\u9FA5]/)) {
      ctx.fillText(splitedText[i], index, this.ledHeight-2);
    } else {
      ctx.fillText(splitedText[i], index, this.ledHeight-1);
    }
    var te = ctx.measureText(splitedText[i]);
    var textWidth = parseInt(te.width);
    index += textWidth;
  }
};

Social.prototype.text2ImgEn = function(text, step, color, userID, app) {
  //console.log('Input text are English charactors!');

  var self = this;
  step = step || this.defaultStep;
  color = color || this.defaultColor;
  var stringText = String(text);
  var width = 0;
  for (var i=0; i<stringText.length; i++) {
    var c = stringText[i];
    if (stringText[i] == ' ') {
      width = width + 1 + 1;
    } else {
      if (this.enCharacter[c]) {
        width = width + this.enCharacter[c].len + 1;
      } else if (c.match(/[\u4E00-\u9FA5]/)) {
        width = width + 11 + 1; // Chinese word is 11 width
      } else {
        return -1;
      }
    }
  }
  var pureTextWidth = width - 5;
  // Two blanks are 4 column and 1 column at the end of one useful character
  if ((width-5) <= this.ledWidth) {
    var canvas = new Canvas(this.ledWidth, this.ledHeight);
  } else {
    var canvas = new Canvas(width, this.ledHeight);
  }
  var ctx = canvas.getContext('2d');
  var position = 0;
  for (var i=0; i<stringText.length; i++) {
    var c = stringText[i];
    if (c == ' ') {
      position = position + 1 + 1;
    } else if (this.enCharacter[c]) {
      var cImg = new Image;
      cImg.src = fs.readFileSync(path.join(__dirname, 'media', 'predefine', 'enCharacter', this.enCharacter[c].img));
      ctx.drawImage(cImg, position, 0, this.ledWidth, this.ledHeight);
      position = position + this.enCharacter[c].len + 1;
    } else if (c.match(/[\u4E00-\u9FA5]/)) {
      var cImg = new Image;
      cImg.src = fs.readFileSync(path.join(__dirname, 'media', 'Chinese', c+'.jpg'));
      ctx.drawImage(cImg, position, 0, this.ledWidth, this.ledHeight);
      position = position + 11 + 1;
    }
  }
  fs.writeFileSync(path.join(__dirname, 'media', 'predefine', 'enCharacter', 'image.jpg'),
      self.decodeBase64Image(canvas.toDataURL()).data);

  var targetDir = path.join(__dirname, 'media', userID, app);
  var imageJSON = {};
  if ((width-5) <= this.ledWidth) {
    var img = [];
    var p = ctx.getImageData(0, 0, this.ledWidth, this.ledHeight);
    for (var x=0; x<p.data.length; x+=8) {
      var pixels = 0;
      if (p.data[x]>128) {
        pixels += color;

        p.data[x] = 0;
        p.data[x+1] = 255; // Green
        p.data[x+2] = 0;
        p.data[x+3] = 255;
      } else {
        p.data[x+3] = 0;
      }
      if (p.data[x+4]>128) {
        pixels += color*16;

        p.data[x+4] = 0;
        p.data[x+5] = 255; // Green
        p.data[x+6] = 0;
        p.data[x+7] = 255;
      } else {
        p.data[x+7] = 0;
      }
      img.push(pixels);
    }
    imageJSON['img0'] = img;
    imageJSON.numberOfImg = 1;
    imageJSON.textEnd = [0];

    ctx.putImageData(p, 0, 0);
    fs.writeFile(path.join(targetDir, 'img0.jpg'),
      self.decodeBase64Image(canvas.toDataURL()).data,
      function (err) {if (err) throw err;});

    fs.writeFile(
      path.join(targetDir, 'media.json'),
      JSON.stringify(imageJSON),
      function (err) {
        if (err) throw err;
        self.isMediaFileReady[userID+'@'+app] = true;
      }
    );
    return 0;
  }

  // Create perfect imgs
  for (var n=1; n<=step; n++) {
    if ((width*n)%step == 0) {
      break;
    }
  }
  var canvas = new Canvas(width*(n+1), this.ledHeight);
  var ctx = canvas.getContext('2d');
  var position = 0;
  for (var i=0; i<n+1; i++) {
    var cImg = new Image;
    cImg.src = fs.readFileSync(path.join(__dirname, 'media', 'predefine', 'enCharacter', 'image.jpg'));
    ctx.drawImage(cImg, position, 0, width, this.ledHeight);
    position = position + width;
  }
  fs.writeFileSync(path.join(__dirname, 'media', 'predefine', 'enCharacter', 'image.jpg'),
      self.decodeBase64Image(canvas.toDataURL()).data);

  imageJSON.numberOfImg = (width*n)/step;
  imageJSON.textEnd = [];
  var textEnd = pureTextWidth;
  var cImg = new Image;
  cImg.src = fs.readFileSync(path.join(__dirname, 'media', 'predefine', 'enCharacter', 'image.jpg'));
  for (var i=0; i<width*n; i+=step) {
    canvas = new Canvas(this.ledWidth, this.ledHeight);
    ctx = canvas.getContext('2d');
    ctx.translate(-(i),0);

    //var cImg = new Image;
    //cImg.src = fs.readFileSync(path.join(__dirname, 'media', 'predefine', 'enCharacter', 'image.jpg'));
    ctx.drawImage(cImg, 0, 0, width*(n+1), this.ledHeight);

    var img = [];
    var p = ctx.getImageData(0, 0, this.ledWidth, this.ledHeight);
    for (var x=0; x<p.data.length; x+=8) {
      var pixels = 0;

      if (p.data[x]>128) {
        pixels += color;

        p.data[x] = 0;
        p.data[x+1] = 255; // Green
        p.data[x+2] = 0;
        p.data[x+3] = 255;
      } else {
        p.data[x+3] = 0;
      }
      if (p.data[x+4]>128) {
        pixels += color*16;

        p.data[x+4] = 0;
        p.data[x+5] = 255; // Green
        p.data[x+6] = 0;
        p.data[x+7] = 255;
      } else {
        p.data[x+7] = 0;
      }
      img.push(pixels);
    }
    imageJSON['img'+(i/step)] = img;
    if ((i+this.ledWidth)>=textEnd) {
      textEnd += width;
      imageJSON.textEnd.push(i/step);
    }
    ctx.putImageData(p, 0, 0);
    fs.writeFile(path.join(targetDir, 'img'+(i/step)+'.jpg'),
      self.decodeBase64Image(canvas.toDataURL()).data,
      function (err) {if (err) throw err;});
  }
  fs.writeFile(
    path.join(targetDir, 'media.json'),
    JSON.stringify(imageJSON),
    function (err) {
      if (err) throw err;
      self.isMediaFileReady[userID+'@'+app] = true;
    }
  );
  return 0;
};

// color = 0, B, G, R
Social.prototype.text2Img = function(text, step, color, userID, app) {
  // add two blank at the end of user input text, be careful to modify this point
  text = text.replace(/\n/, ' ');
  var originalText = text;
  text = text + '  ';
  var rev = this.text2ImgEn(text, step, color, userID, app);
  if (rev == 0) {
    console.log('Input text are English charactors!');
    return;
  }

  var self = this;
  step = step || this.defaultStep;
  color = color || this.defaultColor;
  var targetDir = path.join(__dirname, 'media', userID, app);

  var hasChineseWord = text.match(/[\u4E00-\u9FA5]/);
  var canvas = new Canvas(this.ledWidth, this.ledHeight);
  var ctx = canvas.getContext('2d');
  if (hasChineseWord) {
    ctx.font = this.ledHeight+'px "Microsoft YaHei", Impact, serif';
  } else {
    ctx.font = this.ledHeight+'px';
  }
  var te = ctx.measureText(originalText);
  var pureTextWidth = parseInt(te.width);
  var te = ctx.measureText(text);
  var textWidth = parseInt(te.width);
  var imageJSON = {};

  // Two blanks are 8((3+1)*2) column and 1 column at the end of one useful character
  if ((textWidth-9)<=this.ledWidth) {
    if (hasChineseWord) {
      //ctx.fillText(text, 0, this.ledHeight-2);
      this.specialFill(text, ctx);
    } else {
      ctx.fillText(text, 0, this.ledHeight-2);
    }

    var img = [];
    var p = ctx.getImageData(0, 0, this.ledWidth, this.ledHeight);
    //for (var x=0; x<p.data.length; x+=4) {
    //  console.log(p.data[x]+', '+p.data[x+1]+', '+p.data[x+2]+', '+p.data[x+3]);
    //}
    for (var x=0; x<p.data.length; x+=8) {
      var pixels = 0;

      if (p.data[x+3]>=100) {
        pixels += color;

        p.data[x] = 0;
        p.data[x+1] = 255; // Green
        p.data[x+2] = 0;
        p.data[x+3] = 255;
      } else {
        p.data[x+3] = 0;
      }
      if (p.data[x+7]>=100) {
        pixels += color*16;

        p.data[x+4] = 0;
        p.data[x+5] = 255; // Green
        p.data[x+6] = 0;
        p.data[x+7] = 255;
      } else {
        p.data[x+7] = 0;
      }
      img.push(pixels);
    }
    imageJSON['img0'] = img;
    imageJSON.numberOfImg = 1;
    imageJSON.textEnd = [0];

    ctx.putImageData(p, 0, 0);
    fs.writeFile(path.join(targetDir, 'img0.jpg'),
      self.decodeBase64Image(canvas.toDataURL()).data,
      function (err) {if (err) throw err;});

    fs.writeFile(
      path.join(targetDir, 'media.json'),
      JSON.stringify(imageJSON),
      function (err) {
        if (err) throw err;
        self.isMediaFileReady[userID+'@'+app] = true;
        //console.log('It\'s saved!');
      }
    );
    return;
  }

  // Create perfect imgs
  for (var n=1; n<=step; n++) {
    if ((textWidth*n)%step == 0) {
      break;
    }
  }
  var multiText = '';
  for (var i=0; i<n+1; i++) {
    multiText += text;
  }

  imageJSON.numberOfImg = (textWidth*n)/step;
  imageJSON.textEnd = [];
  for (var i=0; i<textWidth*n; i+=step) {
    canvas = new Canvas(this.ledWidth, this.ledHeight);
    ctx = canvas.getContext('2d');
    if (hasChineseWord) {
      ctx.font = this.ledHeight+'px "Microsoft YaHei", Impact, serif';
    } else {
      ctx.font = this.ledHeight+'px';
    }
    ctx.translate(-(i),0);
    if (hasChineseWord) {
      //ctx.fillText(multiText, 0, this.ledHeight-2);
      this.specialFill(multiText, ctx);
    } else {
      ctx.fillText(multiText, 0, this.ledHeight-2);
    }

    var img = [];
    var p = ctx.getImageData(0, 0, this.ledWidth, this.ledHeight);
    for (var x=0; x<p.data.length; x+=8) {
      var pixels = 0;

      if (p.data[x+3]>=100) {
        pixels += color;

        p.data[x] = 0;
        p.data[x+1] = 255; // Green
        p.data[x+2] = 0;
        p.data[x+3] = 255;
      } else {
        p.data[x+3] = 0;
      }
      if (p.data[x+7]>=100) {
        pixels += color*16;

        p.data[x+4] = 0;
        p.data[x+5] = 255; // Green
        p.data[x+6] = 0;
        p.data[x+7] = 255;
      } else {
        p.data[x+7] = 0;
      }
      img.push(pixels);
    }
    imageJSON['img'+(i/step)] = img;
    if ((i+this.ledWidth)>=pureTextWidth) {
      pureTextWidth += textWidth;
      imageJSON.textEnd.push(i/step);
    }

    ctx.putImageData(p, 0, 0);
    fs.writeFile(path.join(targetDir, 'img'+(i/step)+'.jpg'),
      self.decodeBase64Image(canvas.toDataURL()).data,
      function (err) {if (err) throw err;});
  }
  fs.writeFile(
    path.join(targetDir, 'media.json'),
    JSON.stringify(imageJSON),
    function (err) {
      if (err) throw err;
      self.isMediaFileReady[userID+'@'+app] = true;
      //console.log('It\'s saved!');
    }
  );
};

Social.prototype.decodeBase64Image = function(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
}

module.exports = Social;
