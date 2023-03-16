var fs = require('fs')
var path = require('path')
var async = require('../async')
var _ = require('../underscore')._
var winston = require('../winston')
var cp = require('child_process')

var optimist = require('../optimist')
  .options('log', {
    alias: 'l'
  , 'default': 'info'
  , describe: 'Log level (debug, info, notice, warning, error).'
  })
  .options('output', {
    alias: 'o'
  , 'default':''
  , describe: 'Name for the output dir.'
  })
  .options('help', {
    alias: 'h'
  , describe: 'Show this help message.'
  })

var argv = optimist.argv

winston.setLevels(winston.config.syslog.levels)
winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, {
  colorize: true
, level: argv.log
, handleExceptions: false
})
winston.debug('Parsed arguments', argv)

function spawn(name, opt) {
  winston.debug('Spawn', { cmd: [name].concat(opt).join(' ') })
  return cp.spawn(name, opt)
}

var files = _.uniq(argv._)

var error = false;
var json_file = "";
var img_file = "";
if (files.length == 1){
  json_file = files[0];
}
else
if (files.length == 2){
  json_file = files[0];
  img_file = files[1];
} else {
  error = 'no input files specified. arguments = ' + JSON.stringify( argv );
}

if (argv.help || error) {
  if (error) {
    winston.error(error);
  }
  winston.info('Usage: atlas_unpacker [options] file1.json [file2.png]')
  winston.info(optimist.help())
  process.exit(1)
}

var json_file_dir = path.dirname(json_file);

var json_file_name = path.basename(json_file,'.json');

var outputDir = argv.output;
if (outputDir.length == 0) {
  outputDir = path.join(json_file_dir, json_file_name);
}

if (img_file.length == 0) {
  img_file = path.join(json_file_dir, json_file_name + '.png');
}

winston.debug('output dir:', outputDir);

if (!fs.existsSync(outputDir))
  fs.mkdirSync(outputDir);
if (json_file.indexOf('.json')<0)
    json_file = json_file + '.json';

winston.debug( 'converting', json_file, img_file );
fs.readFile(json_file, 'utf8', function (err, data) {
  if (err) throw err;
  var atlas = JSON.parse(data);
  for (var i in atlas.frames){
    var frame = atlas.frames[i];
    var out_frame_file = path.join(outputDir, (path.extname(i) != '.png' ? i + '.png' : i));
    var r = frame.rc || frame.r;
    if (r) {
        var d = { x:r[0], y:r[1], w:r[2], h:r[3] };
        winston.debug( 'convert', img_file, '-crop', d.w + 'x' + d.h + '+' + d.x + '+' + d.y, out_frame_file);
        spawn('convert',[img_file, '-crop', d.w + 'x' + d.h + '+' + d.x + '+' + d.y, out_frame_file]).on('exit', function(code) {
            if (code) process.exit(1)
        }.bind(out_frame_file));
    }
  }
});

