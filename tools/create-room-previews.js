var fs = require('fs')
var path = require('path')
var async = require('./async')
var cp = require('child_process')


function crop(img, out, coords, needSize){
  
      var size = (coords[2] - coords[0]) + "x" + (coords[3] - coords[1]);
      var offset = coords[0] + "+" + coords[1];
      needSize = needSize[0] + "x" + needSize[1];
      cp.exec("convert " + img + " -quality 90 -crop " + size + "+" + offset + " -resize " + needSize + "\\! "+out);
}

fs.readFile('./project/room_preview.json', 'utf8', function (err, data) {
  if (!err) outFileData = data;
  
  var t = JSON.parse(data).__table;

  for (var room in t){
    var coords = t[room];
    crop(
      './project/rooms/'+room+'/back.jpg',
      './project/rooms/'+room+'/back.b.jpg',
      [ coords[0], coords[1], coords[2], coords[3] ],
      [565 , 113]
    );
    
    crop(
      './project/rooms/'+room+'/back.jpg',
      './project/img/rooms/'+room+'_back.b-lod.jpg',
      [ coords[0], coords[1], coords[2], coords[3] ],
      [565 / 4, 113 / 4]
    );
    
    crop(
      './project/rooms/'+room+'/back.jpg',
      './project/rooms/'+room+'/back.s.jpg',
      [ coords[4], coords[5], coords[6], coords[7] ],
      [123, 113]
    );
    
    crop(
      './project/rooms/'+room+'/back.jpg',
      './project/img/rooms/'+room+'_back.s-lod.jpg',
      [ coords[4], coords[5], coords[6], coords[7] ],
      [123 / 4, 113 / 4]
    );
    
  }
  
});
