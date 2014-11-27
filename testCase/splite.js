//console.log(string.split(/[\u4E00-\u9FA5]+/));
//console.log(string.match(/[\u4E00-\u9FA5]+/));
//console.log(string.length);
var string = '\u4E00\u9FA5aaa\u4E00\u9FA5bbb\u4E00ddd\u4E00ggg\u4E00';
//var string = 'aaa\u4E00\u9FA5bbb\u4E00ddd\u4E00ggg';

function splitChEn(string) {
  var ch = [];
  var copy = string;
  while(true) {
    var m = copy.match(/[\u4E00-\u9FA5]+/);
    //console.log(m);
    if (!m) break;
    copy = copy.slice(m.index+m[0].length);
    ch.push(m[0]);
  }
  //console.log(ch);
  var en = string.split(/[\u4E00-\u9FA5]+/);

  console.log('CH='+ch);
  console.log('EN='+en);
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

console.log(string);
console.log(splitChEn(string));
