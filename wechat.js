var express = require('express');
var crypto = require('crypto');
var xmlparser = require('express-xml-bodyparser');
var js2xml = require('js2xmlparser');
var Canvas = require('canvas')
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var https = require('https');
var child_process = require('child_process');
var cloudServer = require('./cloudServer.js').server;
var cloudPort = require('./cloudServer.js').port;

var isIntelAccount = true;

var WeChat= function(social) {
  var app = social.app;
  var self = this;
  if (isIntelAccount) {
    self.token = 'intelilc';
  } else {
    self.token = 'thdtekyk';
  }

  //TODO: call ahead 20 seconds
  self.getAccessToken(social);
  setInterval(function(){self.getAccessToken(social);}, 7200000-20000);

  app.get('/weixin', function(req, res) {
    res.send(self.checkSignature(req, res));
  });

  app.post('/weixin', function(req, res) {
    if(self.checkSignature(req, res) == "") {
      res.send('signature Error!');
      return;
    }

    console.log('body: ' + JSON.stringify(req.body.xml));
    var body = req.body.xml;

    if (body.MsgType == 'event' && body.Event == 'subscribe') {
      self.sendTextMsg(body, res,
        'Welcome to smart mug~~, '
        + 'your account for our service is:\n'
        + body.FromUserName);
    } else if (body.MsgType == 'event' && body.Event == 'CLICK') {
      if (body.EventKey == 'register') {
        var reply = {};
        reply.ToUserName = body.FromUserName;
        reply.FromUserName = body.ToUserName;
        reply.CreateTime = body.CreateTime;
        reply.MsgType = 'text';
        //reply.Content = msg;
        reply.Content = '<a href="http://'+cloudServer+':'+cloudPort+'/weiXinMugRegisterLastStep/?openID='+body.FromUserName+'">register</a>';
        var replyXml = js2xml('xml', reply);
        res.send(replyXml);
        return;
      }
      var doll = social.doll[body.EventKey];
      if (doll) {
        // Old directory tree
        for (var user in social.account) {
          if (social.account[user].weChat) {
            for (var idx=0; idx<social.account[user].weChat.length; idx++) {
              if (social.account[user].weChat[idx]==String(body.FromUserName)) {
                /*social.handler(user, self.appName,
                  function(){
                    social.movePredefineImg(doll, user, self.appName);
                  }
                );*/
                social.handler(user, self.appName, social.movePredefineImg, doll, user, self.appName);
              }
            }
          }
        }
        self.sendTextMsg(body, res, doll);
        // New directory tree
      } else {
        self.sendTextMsg(body, res, 'More feature coming soon');
      }
    } else if (body.MsgType == 'text') {
      var deviceID = String(body.Content).match(/http:\/\/www.pia-edison.com\/getDeviceID\/\?deviceID=(([0-9a-f]{2}[:-]){5}([0-9a-f]{2}))( )*$/);
      if (deviceID == null) {
        deviceID = String(body.Content).match(/http:\/\/54.65.34.62\/getDeviceID\/\?deviceID=(([0-9a-f]{2}[:-]){5}([0-9a-f]{2}))( )*$/);
      }
      if (deviceID == null) {
        deviceID = String(body.Content).match(/^(([0-9a-f]{2}[:-]){5}([0-9a-f]{2}))( )*$/);
      }
      if (deviceID == null) {
        deviceID = String(body.Content).match(/http:\/\/www.amoudo.com\/getDeviceID\/\?deviceID=(([0-9a-f]{2}[:-]){5}([0-9a-f]{2}))( )*$/);
      }
      if (deviceID != null) {
        var mugID = deviceID[1];
        var openID = body.FromUserName[0];
        console.log('Try to link '+mugID+' '+openID+' together!');
        var account = JSON.parse(fs.readFileSync(path.join(__dirname, 'account.json'), 'utf8'));
        account[mugID] = account[mugID] || {};
        account[mugID].weChat = account[mugID].weChat || [];
        for (var idx=0; idx<account[mugID].weChat.length; idx++) {
          if (account[mugID].weChat[idx]==openID) {
            break;
          }
        }
        if (idx==account[mugID].weChat.length) {
          account[mugID].weChat.push(openID);
        }
        fs.writeFileSync(path.join(__dirname, 'account.json'), JSON.stringify(account));
        social.account = JSON.parse(fs.readFileSync(path.join(__dirname, 'account.json'), 'utf8'));
        self.sendTextMsg(body, res, 'Register Success!');
      } else {
        self.resHandleText(body, res, String(body.Content), social);
      }
    } else if (body.MsgType == 'voice') {
      if (typeof body.Recognition != 'undefined' && body.Recognition[0] != '') {
        self.resHandleText(body, res, String(body.Recognition), social);
      } else {
        self.resHandleAudio(body, res, social);
      }
    } else if (body.MsgType == 'image') {
        /*var timer = (new Date()).getTime();
        while(true) {
          if (((new Date()).getTime() - timer)>5000) {
            break;
          }
        }*/
        console.log('return a image'+body.MediaId);
        var reply = {};
        reply.ToUserName = body.FromUserName;
        reply.FromUserName = body.ToUserName;
        reply.CreateTime = body.CreateTime;
        reply.MsgType = 'image';
        reply.MediaId = body.MediaId;
        var replyXml = js2xml('xml', reply);
        res.send(replyXml);
    } else {
      var msg = 'Welcome to smart mug! '
        + 'We will continue to improve our service! '
        + 'Thanks for your attention.';
      self.sendTextMsg(body, res, msg);
    }
  });

  app.get('/weiXinAuthorize', function(req, res) {
    var url = 'https://open.weixin.qq.com/connect/oauth2/authorize/?appid='+self.appID+
      '&redirect_uri='+self.redirectPath+
      '&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect';
    res.redirect(url);
  });
  app.get('/weiXinMugRegister', function(req, res) {
    if (typeof req.query.code == 'undefined') return;
    var outerRes = res;

    // Get openID and accessToken based on code
    var data = 'appid='+self.appID+'&secret='+self.secret+'&code='+req.query.code+'&grant_type=authorization_code';
    var options = {
      hostname: 'api.weixin.qq.com',
      port: 443,
      path: '/sns/oauth2/access_token/?'+data,
      method: 'GET'
    };
    var req = https.request(options, function(res) {
      res.setEncoding('utf8');
      var body = '';
      res.on('data', function (chunk) {
        body += chunk;
      });
      res.on('end', function() {
        if (typeof JSON.parse(body).errcode != 'undefined') return;
        var openID = JSON.parse(body).openid;
        //console.log('openID='+openID);
        var url = 'http://'+cloudServer+':'+cloudPort+'/weiXinMugRegisterLastStep/?openID='+openID;
        outerRes.redirect(url);
      });
    });
    req.on('error', function(e) {
      //console.log('problem with request: ' + e.message);
    });
    req.end();
  });
  app.use('/weiXinMugRegisterLastStep', express.static(__dirname + '/weiXinMugRegister'));
  app.post('/linkOpenIDAndMugID', function(req, res) {
    var mugID = req.body.mugID;
    var openID = req.body.openID;
    //console.log('Try to link '+mugID+' '+openID+' together!');
    //console.log(JSON.stringify(req.body));
    //saveImage(req.body, res, social);
    var account = JSON.parse(fs.readFileSync(path.join(__dirname, 'account.json'), 'utf8'));
    account[mugID] = account[mugID] || {};
    account[mugID].weChat = account[mugID].weChat || [];
    for (var idx=0; idx<account[mugID].weChat.length; idx++) {
      if (account[mugID].weChat[idx]==openID) {
        break;
      }
    }
    if (idx==account[mugID].weChat.length) {
      account[mugID].weChat.push(openID);
    }
    fs.writeFileSync(path.join(__dirname, 'account.json'), JSON.stringify(account));
    social.account = JSON.parse(fs.readFileSync(path.join(__dirname, 'account.json'), 'utf8'));
    res.send('Register Success!');
  });

  app.use('/weChatMultiMedia', express.static(__dirname + '/weChatGetMultiMedia')); //weChatGetMultiMedia
};

WeChat.prototype.appName = 'weChat';
WeChat.prototype.wordLimitationEn = 40;
WeChat.prototype.wordLimitationCh = 20;
if (isIntelAccount) {
  WeChat.prototype.appID = 'wx78e4d41c5a3614b2';
  WeChat.prototype.secret = 'a1b107eff798c2ef9168c8b5ada35f0b';
} else {
  WeChat.prototype.appID = 'wx4158ccb1f452100d';
  WeChat.prototype.secret = '5bf3b3fd444cfa787da1a5d0defad3b0';
}
WeChat.prototype.redirectPath = 'http://'+cloudServer+':'+cloudPort+'/weiXinMugRegister';
WeChat.prototype.accessToken = null;
WeChat.prototype.grantType = "client_credential";

WeChat.prototype.getAccessToken = function(social) {
  var options = {
    hostname: 'api.weixin.qq.com',
    port: 443,
    path: '/cgi-bin/token?grant_type='+this.grantType+'&appid='+this.appID+'&secret='+this.secret,
    method: 'GET'
  };
  var req = https.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
      if (JSON.parse(chunk).access_token) {
        social.weChatAccessToken = (JSON.parse(chunk)).access_token;
      }
    });
  });
  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });
  req.end();
};

WeChat.prototype.sendTextMsg = function(body, res, msg) {
  var reply = {};
  reply.ToUserName = body.FromUserName;
  reply.FromUserName = body.ToUserName;
  reply.CreateTime = body.CreateTime;
  reply.MsgType = 'text';
  reply.Content = msg;
  var replyXml = js2xml('xml', reply);
  res.send(replyXml);
};

WeChat.prototype.resOutofWordLimitation = function(body, res) {
  var msg = 'Out of word limitation!\n<='
    + this.wordLimitationEn
    + ' En; <='
    + this.wordLimitationCh
    + ' Ch; one Chinese word is treated as two English characters';
  this.sendTextMsg(body, res, msg);
}

WeChat.prototype.preProcessChinese = function(body, res, text, social) {
  var self = this;

  var ret = social.preProcessChinese(text);
  if (!ret) {
    setTimeout(function(){self.preProcessChinese(body, res, text, social);}, 500);
    return;
  }

  for (var user in social.account) {
    if (social.account[user].weChat) {
      for(var idx=0; idx<social.account[user].weChat.length; idx++) {
        if(social.account[user].weChat[idx]==String(body.FromUserName)) {
          /*social.handler(user, self.appName,
            function(){
              social.text2Img(String(body.Content), null, null, user, self.appName);
            }
          );*/
          social.handler(user, self.appName, social.text2Img, String(body.Content), null, null, user, self.appName);
        }
      }
    }
  }

  self.sendTextMsg(body, res, text);
}
WeChat.prototype.resHandleText = function(body, res, text, social) {
  var self = this;
  // replace one Chinese word with two English characters
  var retv = text.replace(/[\u4E00-\u9FA5]/g, 'aa');
  if (String(retv).length > self.wordLimitationEn) {
    this.resOutofWordLimitation(body, res);
    return;
  }

  this.preProcessChinese(body, res, text, social);
  return;

  for (var user in social.account) {
    if (social.account[user].weChat) {
      for(var idx=0; idx<social.account[user].weChat.length; idx++) {
        if(social.account[user].weChat[idx]==String(body.FromUserName)) {
          /*social.handler(user, self.appName,
            function(){
              social.text2Img(String(body.Content), null, null, user, self.appName);
            }
          );*/
          social.handler(user, self.appName, social.text2Img, String(body.Content), null, null, user, self.appName);
        }
      }
    }
  }

  self.sendTextMsg(body, res, text);
}
WeChat.prototype.resHandleAudio = function(body, res, social) {
  var self = this;

  var timer = (new Date()).getTime();
  //var cmd = 'curl -G "http://file.api.weixin.qq.com/cgi-bin/media/get?access_token='+social.weChatAccessToken+'&media_id='+body.MediaId+'" -o '+path.join(__dirname, 'media', 'weChatAudio', 'audio'+timer+'.amr')+'; ffmpeg -i '+path.join(__dirname, 'media', 'weChatAudio', 'audio'+timer+'.amr')+' '+path.join(__dirname, 'media', 'weChatAudio', 'audio'+timer+'.mp3');
  if (body.Format == 'amr') {
    var cmd = 'curl -G "http://file.api.weixin.qq.com/cgi-bin/media/get?access_token='+social.weChatAccessToken+'&media_id='+body.MediaId+'" -o '+path.join(__dirname, 'media', 'weChatAudio', 'audio'+timer+'.amr');
  } else if (body.Format == 'speex') {
    var cmd = 'curl -G "http://file.api.weixin.qq.com/cgi-bin/media/get?access_token='+social.weChatAccessToken+'&media_id='+body.MediaId+'" -o '+path.join(__dirname, 'media', 'weChatAudio', 'audio'+timer+'.spx');
  }
  console.log('cmd='+cmd);
  child_process.exec(cmd, function(err, stdout, stderr) {
    console.log('get audio msg from weChat server'+err+';'+stdout+';'+stderr);
    if (body.Format == 'amr') {
      var ccmd = 'ffmpeg -i '+path.join(__dirname, 'media', 'weChatAudio', 'audio'+timer+'.amr')+' '+path.join(__dirname, 'media', 'weChatAudio', 'audio'+timer+'.mp3');
    } else if (body.Format == 'speex'){
      var ccmd = 'ffmpeg -i '+path.join(__dirname, 'media', 'weChatAudio', 'audio'+timer+'.spx')+' '+path.join(__dirname, 'media', 'weChatAudio', 'audio'+timer+'.mp3');
    }
    child_process.exec(ccmd, function(err, stdout, stderr) {
      for (var user in social.account) {
        if (social.account[user].weChat) {
          for(var idx=0; idx<social.account[user].weChat.length; idx++) {
            if(social.account[user].weChat[idx]==String(body.FromUserName)) {
              social.handler(user, self.appName, social.multiMedia2JSON, path.join(__dirname, 'media', 'weChatAudio', 'audio'+timer+'.mp3'), user, self.appName);
            }
          }
        }
      }
    });
  });

  self.sendTextMsg(body, res, "Send an audio msg");
}

function sha1(str) {
  var md5sum = crypto.createHash('sha1');
  md5sum.update(str);
  str = md5sum.digest('hex');
  return str;
}

WeChat.prototype.checkSignature = function(req, res) {
  var query = req.query;
  var signature = query.signature;
  var timestamp = query.timestamp;
  var nonce = query.nonce;
  var echostr = query.echostr;

  var oriArray = new Array();
  oriArray[0] = nonce;
  oriArray[1] = timestamp;
  oriArray[2] = this.token;
  oriArray.sort();
  var original = oriArray[0]+oriArray[1]+oriArray[2];
  var scyptoString = sha1(original);
  if (signature == scyptoString) {
    //console.log('signature OK');
    return echostr;
  }
  else {
    //console.log('signature Error!');
    return '';
  }
};

module.exports = WeChat;
