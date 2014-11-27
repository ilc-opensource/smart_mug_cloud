var https = require('https');
var path = require('path');
var cloudServer = require('./cloudServer.js').server;
var cloudPort = require('./cloudServer.js').port;

var WeiBo = function(social) {
  var self = this;
  var app = social.app;

  // Guide user to authorize mug to access his weiBo content
  app.use('/weibo_smart_mug', function(req, res) {
    var url = 'https://api.weibo.com/oauth2/authorize?client_id='
      +self.appkey+'&redirect_uri='+self.redirect_uri+'&response_type=code';
    res.redirect(url);
  });

  app.get(self.redirectPath, function (req, res) {
    self.code = req.query.code;
    var selfRes = res;

    // Get accessToken based on code
    var data = 'client_id='+self.appkey+'&client_secret='+self.appsecret
      +'&grant_type='+self.grant_type+'&code='+self.code+'&redirect_uri='+self.redirect_uri;
    var options = {
      hostname: 'api.weibo.com',
      port: 443,
      path: '/oauth2/access_token',
      method: 'POST',
      headers: {
        "Content-Type": 'application/x-www-form-urlencoded',
        "Content-Length": data.length
      }
    };
    var req = https.request(options, function(res) {
      //console.log('STATUS: ' + res.statusCode);
      //console.log('HEADERS: ' + JSON.stringify(res.headers));
      res.setEncoding('utf8');
      var body = '';
      res.on('data', function (chunk) {
        body += chunk;
      });
      res.on('end', function() {
        self.updateAuthorization(body);
        if (JSON.parse(body).uid) {
          selfRes.send('authorize to smart mug, your account for our service is:\n'+JSON.parse(body).uid);
        }
      });
    });
    req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
    });
    req.write(data);
    req.end();
  });

  setInterval(function(){self.queryWeiBo(social)}, 10000);
}

WeiBo.prototype.grant_type = 'authorization_code';
WeiBo.prototype.appkey = '905115180';
WeiBo.prototype.appsecret = 'a5db4bfe7eadf33ebd74fdc5d4de6d0e';
WeiBo.prototype.redirectPath = '/weibo';
WeiBo.prototype.redirect_uri = 'http://'+cloudServer+':'+cloudPort+'/weibo';
// Get code first, then get accessToken
WeiBo.prototype.code = null;

WeiBo.prototype.appName = 'weiBo';
//uid:{timeLine, accessToken}
WeiBo.prototype.validAuthorization = {};
WeiBo.prototype.latestWeiBo = {};

// get latest weibo and process
WeiBo.prototype.action = function(uid, accessToken, social) {
  var self = this;
  var options = {
    hostname: 'api.weibo.com',
    port: 443,
    path: '/2/statuses/home_timeline.json?access_token='+accessToken,
    method: 'GET',
  };
  //console.log('url='+'https://api.weibo.com/2/statuses/home_timeline.json?access_token='+accessToken);
  var req = https.request(options, function(res) {
    //console.log('STATUS: ' + res.statusCode);
    //console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      //console.log(body);
      var msg = JSON.parse(body);
      if (msg.error) {
        console.log("Error, weiBo."+body);
        return;
      }
      for (var i=0; i<msg.statuses.length; i++) {
        //var user = msg.statuses[i].user.id;
        if (msg.statuses[i].user.id == uid) {
          var text = msg.statuses[i].text;
          console.log('Latest weibo='+text+'; uid='+uid);
          if (self.latestWeiBo[uid] != text) {
            self.latestWeiBo[uid] = text;
            var retv = social.textAnalyzer(text);
            if (retv) {
              for (var user in social.account) {
                if (social.account[user].weiBo && social.account[user].weiBo==uid) {
                  /*social.handler(user, self.appName,
                    function(){
                      social.movePredefineImg(retv, user, self.appName);
                    }
                  );*/
                  social.handler(user, self.appName, social.movePredefineImg, retv, user, self.appName);
                }
              }
              /*social.handler(user, self.appName,
                function(){
                  social.movePredefineImg(retv, user, self.appName);
                }
              );*/
            } else {
              for (var user in social.account) {
                if (social.account[user].weiBo && social.account[user].weiBo==uid) {
                  /*social.handler(user, self.appName,
                    function(){
                      social.text2Img(text, null, null, user, self.appName);
                    }
                  );*/
                  social.handler(user, self.appName, social.text2Img, text, null, null, user, self.appName);
                }
              }
              /*social.handler(user, self.appName,
                function(){
                  social.text2Img(text, null, null, user, self.appName);
                }
              );*/
            }
          }
          break;
        }
      }
    });
  });
  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });
  req.end();
}

WeiBo.prototype.queryWeiBo = function(social) {
  for (var uid in this.validAuthorization) {
    if ((new Date()).getTime() < this.validAuthorization[uid].timeLine) {
      this.action(uid, this.validAuthorization[uid].accessToken, social);
    } else {
      delete this.validAuthorization[uid];
    }
  }
}

WeiBo.prototype.updateAuthorization = function(data) {
  var msg = JSON.parse(data);
  var now = (new Date()).getTime(); //milliseconds
  if (msg.uid) {
    this.validAuthorization[msg.uid] = {
      //subtract 1000 milliseconds
      'timeLine':now + msg.expires_in*1000 - 1000,
      'accessToken':msg.access_token
    };
  }
}

module.exports = WeiBo;
