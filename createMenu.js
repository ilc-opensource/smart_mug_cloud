var https = require('https');
var fs = require('fs');
var path = require('path');

var userDefinedMenu = (JSON.parse(fs.readFileSync(path.join(__dirname, 'key2doll.json'), 'utf8'))).menu;

var isIntelAccount = true;

var grant_type = "client_credential";
if (isIntelAccount) {
  var appid = 'wx78e4d41c5a3614b2';
  var secret = 'a1b107eff798c2ef9168c8b5ada35f0b';
} else {
  var appid = 'wx4158ccb1f452100d';
  var secret = '5bf3b3fd444cfa787da1a5d0defad3b0';
}

function getAccessToken() {
  var options = {
    hostname: 'api.weixin.qq.com',
    port: 443,
    path: '/cgi-bin/token?grant_type='+grant_type+'&appid='+appid+'&secret='+secret,
    method: 'GET'
  };
  var req = https.request(options, function(res) {
    //console.log('STATUS: ' + res.statusCode);
    //console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
      var access_token = (JSON.parse(chunk)).access_token;
      setMenu(access_token);
    });
  });
  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });
  // write data to request body
  req.end();
}

function setMenu(access_token) {
  //var access_token = '65tnPGmPgP8Feylw1Fi8ri4TwWYyUCsztIrH8akAq_N981frOOtaKhTjmbpQ69YdXWyiFi_zeedmmNYQt9eJBA';
  var options = {
    hostname: 'api.weixin.qq.com',
    port: 443,
    path: '/cgi-bin/menu/create?access_token='+access_token,
    method: 'POST'
  };
  var req = https.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
    });
  });
  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });
  // write data to request body
  //console.log(JSON.stringify(userDefinedMenu));
  req.write(JSON.stringify(userDefinedMenu));
  req.end();
}

getAccessToken();
//setMenu(null);
