var https = require('https');
var http = require('http');
var fs = require('fs');
var exec = require('child_process').exec;

//var needle = require('needle');

/*var access_token = null;
var grant_type = "client_credential";
var appid = "wx78e4d41c5a3614b2";
var secret = "a1b107eff798c2ef9168c8b5ada35f0b";
var options = {
  hostname: 'api.weixin.qq.com',
  port: 443,
  path: '/cgi-bin/token?grant_type='+grant_type+'&appid='+appid+'&secret='+secret,
  method: 'GET'
};

var req = https.request(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
    access_token = chunk.access_token;
//    upload();
  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

// write data to request body
req.end();
*/

var userDefinedMenu = {
  "button":[
    {
      "name":"表情",
      "sub_button":[
        {
          "type":"click",
          "name":"爱心",
          "key":"menu_1_1"
        },
        {
          "type":"click",
          "name":"高兴",
          "key":"menu_1_2"
        },
        {
          "type":"click",
          "name":"哭",
          "key":"menu_1_3"
        },
        {
          "type":"click",
          "name":"愤怒",
          "key":"menu_1_4"
        },
        {
          "type":"click",
          "name":"睡觉",
          "key":"menu_1_5"
        }
      ]
    },
    {
      "name":"玩偶",
      "sub_button":[
        {
          "type":"click",
          "name":"房子",
          "key":"menu_2_1"
        },
        {
          "type":"click",
          "name":"愤怒的小鸟",
          "key":"menu_2_2"
        },
        {
          "type":"click",
          "name":"多拉A梦",
          "key":"menu_2_3"
        },
        {
          "type":"click",
          "name":"铁臂阿童木",
          "key":"menu_2_4"
        },
        {
          "type":"click",
          "name":"HelloKitty",
          "key":"menu_2_5"
        }
      ]
    },
    {
      "type":"click",
      "name":"更多精彩",
      "key":"menu_3"
    }
  ]
};

//var access_token = '3TD6JRoqMRiDg2JVMxwkr0P_LYmMIy0vmPideRoHKGRS5L3yO_ZwhqM6POXlF22O22jEax4cF2dDk-SS42O6WA';
var access_token = 'Q3xwlvBB65ls3io2v4pTgWzY_2eyQCxrqctrKMBC6rAC_4Df_vCcvGKfTfGD9ZodukRQCIAZHKqsE77X0TzYsw';
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
    access_token = chunk.access_token;
//    upload();
  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

// write data to request body
console.log(JSON.stringify(userDefinedMenu));
req.write(JSON.stringify(userDefinedMenu));
req.end();


//exec('curl -F media=@/home/zliu9/work/smart_mug/media/laugh_test.jpg "http://file.api.weixin.qq.com/cgi-bin/media/upload?access_token=Q6J-NyqCs5uFI12mmbCyggyHs_fNRsE3dmlwAdyRRhLc3-jY_slN0FuNy6K_Si4uIn7RvUKLuKO_lVVxftnWRA&type=image"', function(err, stdout, stderr){console.log(stdout);});

/*var access_token = 'Q6J-NyqCs5uFI12mmbCyggyHs_fNRsE3dmlwAdyRRhLc3-jY_slN0FuNy6K_Si4uIn7RvUKLuKO_lVVxftnWRA';
var data = {
  image: { file: '/home/zliu9/work/smart_mug/media/laugh_test.jpg', content_type: 'image/jpg' }
}

needle.post('http://file.api.weixin.qq.com/cgi-bin/media/upload?access_token='+access_token+'&type=image', data, { multipart: true }, function(err, res, body) {
  // needle will read the file and include it in the form-data as binary
//  if (!err && res.statusCode == 200)
    console.log(res);
//  console.log('STATUS: ' + res.statusCode);
//    console.log('HEADERS: ' + JSON.stringify(res.headers));
//    res.setEncoding('utf8');
//    res.on('data', function (chunk) {
//      console.log('BODY: ' + chunk);
    });
*/

/*
function upload() {
if (access_token != null) {
//fs.readFile('/home/zliu9/work/smart_mug/media/laugh_test.jpg', function (err, data) {
  var data = 'media=/home/zliu9/work/smart_mug/media/laugh_test.jpg';
  var options = {
    hostname: 'file.api.weixin.qq.com',
    port: 80,
    path: '/cgi-bin/media/upload?access_token='+access_token+'&type=image',
    method: 'POST',
    headers: {
          //'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Type': 'multipart/form-data',
          'Content-Length': data.length
    }
  };

  var req = http.request(options, function(res) {
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
  req.write(data);
  req.end();
//});
}
}
upload();
*/

