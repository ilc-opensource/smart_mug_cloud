var fs = require('fs');
var path = require('path');

console.log('Read JSON file:'+process.argv[2]);
var mediaJSON = JSON.parse(fs.readFileSync(path.join(process.argv[2]), 'utf8'));
var mediaString = '';
for (var i in mediaJSON) {
  if (i.indexOf('img')!=-1) {
    var a = JSON.stringify(mediaJSON[i]);
    var b = a.replace(/^\[/, '');
    var c = b.replace(/\]$/, ',');
    //console.log(JSON.stringify(mediaJSON[i]));
    mediaString += c;
  }
}
console.log('Number of images:'+mediaJSON.numberOfImg);
console.log(mediaString);
