var express = require('express');
var fs = require('fs');
var path = require('path');
var Twit = require('twit');

var T = new Twit({
  consumer_key: 'aLHPekxznBtvwTI3mTq6MA',
  consumer_secret: 'u8wylyc4AfcEI3aPmcU43Y6NCa5dhWKLgv5xfqXc8',
  access_token: '1527324734-XgLKQlB9Tm8M0RY7L7RNTTI7sEbqfflPCfLwCGT',
  access_token_secret: 'XSS3Vz9fEDULbgoQ5xcxd4umt3IgMShyclyz66Bks'
});

/*var action = function(text, social, index) {
  var retv = social.textAnalyzer(text);
  if (retv) {
    for (var user in social.account) {
      if (social.account[user].twitter) {
        for (var idx=0; idx<social.account[user].twitter.length; idx++) {
          if (social.account[user].twitter[idx]==screenName[index].name) {
//            social.handler(user, appName,
//              function(){
//                social.movePredefineImg(retv, user, appName);
//              }
//            );
            social.handler(user, appName, social.movePredefineImg, retv, user, appName);
          }
        }
      }
    }
  } else {
    for (var user in social.account) {
      if (social.account[user].twitter) {
        for (var idx=0; idx<social.account[user].twitter.length; idx++) {
          if (social.account[user].twitter[idx]==screenName[index].name) {
//            social.handler(user, appName,
//              function(){
//                social.text2Img(text, null, null, user, appName);
//              }
//            );
            social.handler(user, appName, social.text2Img, text, null, null, user, appName);
          }
        }
      }
    }
  }
};*/

var twitterText2Img = function(text, social, references) {
  var ret = social.preProcessChinese(text);
  if (!ret) {
    setTimeout(function(){twitterText2Img(text, social, references);}, 200);
    return;
  }

  //console.log("references="+references);
  var user = references.pop();
  console.log("text2Img:"+text+"-->"+user);
  social.handler(user, appName, social.text2Img, text, null, null, user, appName);
  if (references.length!=0) {
    setTimeout(function(){twitterText2Img(text, social, references);}, 200);
  }
};

var action = function(text, social, index) {
  var retv = social.textAnalyzer(text);
  if (retv) {
    for (var i=0; i<screenName[index].references.length; i++) {
      var user = screenName[index].references[i];
      social.handler(user, appName, social.movePredefineImg, retv, user, appName);
    }
  } else {
    var reference = new Array();
    for (var i=0; i<screenName[index].references.length; i++) {
      reference.push(screenName[index].references[i]);
      var user = screenName[index].references[i];
    }
    //twitterText2Img(ser, appName, social.text2Img, text, null, null, user, appName);
    twitterText2Img(text, social, reference);
  }
};


var latestTwitter = null;
var getTwitter = function(idx, cb, social) {
  //console.log('idx='+idx);
  //T.get('statuses/user_timeline', { user_id:1527324734, count: 1, include_rts:1 }, function(err, data, response) {
  T.get('statuses/user_timeline', { screen_name:screenName[idx].name, count: 1, include_rts:1 }, function(err, data, response) {
    //console.log(data);
    if (typeof data != undefined && data!=undefined && data[0] && data[0].text) {
      var text = data[0].text;
      //console.log(text);
      if (screenName[idx].msg != text) {
        console.log("new msg coming:"+text);
        screenName[idx].msg = text;
        cb(text, social, idx);
      }
    }
  });

  if (!screenName[idx].intervalObj) {
    screenName[idx].intervalObj = setInterval(function(){getTwitter(idx, action, social);}, 5500);
  }
}

var screenName = []; //{'name':, 'references':, 'intervalObj':, 'msg':, }
var appName = 'twitter';
var Twitter = function(social) {
  var app = social.app;
  for (var user in social.account) {
    if (social.account[user].twitter) {
      for (var idx=0; idx<social.account[user].twitter.length; idx++) {
        // parse screenName array
        for (var j=0; j<screenName.length; j++) {
          // Twitter account has been add, only needs to add references
          if (screenName[j].name == social.account[user].twitter[idx]) {
            screenName[j].references = screenName[j].references || [];
            // Don't need to check if the user has been add to the twitter account
            screenName[j].references.push(user);
            break;
          }
        }
        if (j==screenName.length) {
          // Add a new twitter account
          screenName.push({'name':social.account[user].twitter[idx], 'references':[user]});
        }
      }
    }
  }

  //console.log('screenName.length='+JSON.stringify(screenName));
  for (var idx=0; idx<screenName.length; idx++) {
    getTwitter(idx, action, social);
  }

  app.use('/twitter', express.static(__dirname + '/twitter'));

  app.post('/twitterAccount', function(req, res) {
    var act = req.body.action;
    var twitterAccount = req.body.twitter;
    var mugID = req.body.mugID;

    try {
      var account = JSON.parse(fs.readFileSync(path.join(__dirname, 'account.json'), 'utf8'));
    } catch(ex) {
      //console.log(ex);
    }
    //console.log(act+';'+twitterAccount+';'+mugID);
    account[mugID] = account[mugID] || {};
    account[mugID].twitter = account[mugID].twitter || [];

    if (act=='bind') {
      // update file first
      for (var idx=0; idx<account[mugID].twitter.length; idx++) {
        if (account[mugID].twitter[idx]==twitterAccount) {
          break;
        }
      }
      if (idx==account[mugID].twitter.length) {
        account[mugID].twitter.push(twitterAccount);
        fs.writeFileSync(path.join(__dirname, 'account.json'), JSON.stringify(account));
      }

      // update screenName
      for (var idx=0; idx<screenName.length; idx++) {
        if (screenName[idx].name == twitterAccount) {
          break;
        }
      }
      if (idx==screenName.length) {
        // Add a new twitter account and bind it to mugID
        screenName.push({'name':twitterAccount, 'references':[mugID]});
        getTwitter(screenName.length-1, action, social);
      } else {
        // Bind an existing twitter account to mugID
        for (var i=0; i<screenName[idx].references.length; i++) {
          if (screenName[idx].references[i] == mugID) {
            break;
          }
        }
        if (i==screenName[idx].references.length) {
          screenName[idx].references.push(mugID);
        }
      }
      res.send('Bind Success!');
    } else if (act=='unbind') {
      // update file first
      for (var idx=0; idx<account[mugID].twitter.length; idx++) {
        if (account[mugID].twitter[idx]==twitterAccount) {
          break;
        }
      }
      if (idx!=account[mugID].twitter.length) {
        account[mugID].twitter.splice(idx, 1);
        fs.writeFileSync(path.join(__dirname, 'account.json'), JSON.stringify(account));
      }

      // update screenName
      for (var idx=0; idx<screenName.length; idx++) {
        if (screenName[idx].name == twitterAccount) {
          break;
        }
      }
      if (idx<screenName.length) {
        for (var i=0; i<screenName[idx].references.length; i++) {
          if (screenName[idx].references[i] == mugID) {
            screenName[idx].references.splice(i, 1);
            break;
          }
        }
        if (screenName[idx].references.length == 0) {
          //console.log('clear interval');
          clearInterval(screenName[idx].intervalObj);
          screenName[idx].intervalObj = null;
          //screenName.splice(idx, 1);
        }
      }

      res.send('Unbind Success!');
    }
  });
};

module.exports = Twitter;
