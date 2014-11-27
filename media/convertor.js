var fs = require('fs');
var path = require('path');

fs.readFile(path.join(process.argv[2]), function(err, text) {
  if (err) throw err;
  var imageData = JSON.parse(text);
  var data = {};
  data.number = imageData.numberOfImg;
  data.image = [];
  for (var i=0; i<imageData.numberOfImg; i++) {
    for (var j=0; j<imageData['img'+i].length; j++) {
      data.image.push(imageData['img'+i][j]);
    }
  }
  /*fs.writeFile('ledAnimation.JSON',
    JSON.stringify(data),
    function(err) {
      if(err)
        throw err;
      console.log('It\'s saved!');
    }
  );*/
  console.log(JSON.stringify(data));
});
