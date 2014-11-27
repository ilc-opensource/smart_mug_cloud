var path = require('path');
var https = require('https');
var http = require('http');

var Weather = function(social) {
  var self = this;
  var app = social.app;
//  setInterval(function(){self.queryWeather(social, '116.305145,39.982368')}, 10000);
};
Weather.prototype.appName = 'weather';
Weather.prototype.latestWeather = {};

Weather.prototype.queryWeather = function(social, city) {
  var self = this;
  var options = {
    hostname: 'api.map.baidu.com',
    port: 80,
    path: '/telematics/v3/weather?location='+city+'&output=json&ak=xBGKd1kR8nS5FTtojNjsS2Uu',
    method: 'GET'
  };
  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function () {
      //console.log('weather='+body);
      if (body=='') return;
      var msg = JSON.parse(body);
      if (typeof msg.results == 'undefined') return;
      if (typeof msg.results[0] == 'undefined') return;
      if (typeof msg.results[0].weather_data == 'undefined') return;
      if (typeof msg.results[0].weather_data[0] == 'undefined') return;
      var weather = msg.results[0].weather_data[0].weather;
      //console.log('weather='+weather);
      if (self.latestWeather[city] != weather) {
        self.latestWeather[city] = weather;
        var weatherKey = null;
        if (weather.indexOf('云') != -1) {
          weatherKey = 'Cloudy';
        } else if(weather.indexOf('雨') != -1) {
          weatherKey = 'Rainy';
        } else if(weather.indexOf('风') != -1) {
          weatherKey = 'Windy';
        } else if(weather.indexOf('雷') != -1 || weather.indexOf('电') != -1) {
          weatherKey = 'Thundery';
        } else if(weather.indexOf('晴') != -1) {
          weatherKey = 'Sunny';
        } else if(weather.indexOf('雪') != -1) {
          weatherKey = 'Snowy';
        }
        //console.log('weatherKey='+weatherKey);
        if (weatherKey != null) {
          for (var user in social.account) {
            if (social.account[user].weather) {
              social.handler(user, self.appName,
                function(){
                  social.movePredefineImg(weatherKey, user, self.appName);
                }
              );
            }
          }
        }
      }
    });
  });
  req.on('error', function(e) {
    //console.log('problem with request: ' + e.message);
  });
  req.end();
}

module.exports = Weather;
