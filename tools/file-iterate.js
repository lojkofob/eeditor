var fs = require('fs')
, path = require('path')
, cp = require('child_process')
, _ = require('./underscore')._
, winston = require('./winston')
, optimist = require('./optimist')
  .options('log', { alias: 'l', 'default': 'info', describe: 'Log level (debug, info, notice, warning, error).' })
  .options('command', { alias: 't', 'default': '' , describe: 'command for exec per file' })
  .options('help', { alias: 'h' , describe: 'Show this help message.' })
, misc = require('./misc')()
, argv = optimist.argv
, glob = require('./glob');

winston.setLevels(winston.config.syslog.levels);
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, { colorize: process.stdout && process.stdout.isTTY, level: argv.log, handleExceptions: false });


if (argv.help || !argv.command) {
    winston.info('Usage: file-iterate --command=[command]')
    winston.info(optimist.help())
    process.exit(1);
}


function spawn(a) {

    var cmd = $map(a, function(p){
        if (isArray(p))
            return makePath(p)
        return p;
    }).join(' ');
    
    winston.debug('execSync: ' + cmd);

    cp.execSync( cmd, {
        stdio:[0,1,2]
    });
       
}
 
 

var toolsDir = __dirname;

function tool(t, opts){
    return ['node', makePath([ toolsDir, t ]) ].concat(opts);
}
function spawntool(t,opts){
    return spawn( tool(t,opts) )
}

function quotesWrap(s){
    return '"' + s + '"';
}

function collectSourcesStr(src, basedir, sep){
    return collectSources(src, basedir).join(sep||' ');
}
    
function collectSources(src, basedir){
    var files = [];
    basedir = basedir || "";
    if (isObject(src)){
        for (var i in src){
            files = files.concat( collectSources(src[i], basedir + i) );
        }
    } else if (isArray(src)) {
        for (var i in src){
            files = files.concat( collectSources(src[i], basedir) )
        }
    } else {
        files = glob.sync(basedir + src);
    }
    
    
    return files;
};

function makePath(d){
    if (isArray(d))
        d = path.join.apply(path, d);
    return d||'';
}


function mkdir(d){
    d = makePath( d ) +'_';
    var dir = path.dirname(d);
    spawn(['mkdir -p', dir]);
    return dir + '/';
}

function removeFile(f) {
    try { fs.unlinkSync(f); } catch(e) {}
}

var files = collectSources(argv._);

var command = argv.command;
winston.debug("files:");
winston.debug(files);
$each(files, function(name, i){
    if (name == '.' || name == '..')
        return;
    
    var cmd = command
        .replace(/\{file\}/g,  '"' + name + '"')
        .replace(/\{basename\}/g, '"' + path.basename(name) + '"')
        .replace(/\{name\}/g, '"' + path.basename(name, path.extname(name) ) + '"')
        .replace(/\{ext\}/g, path.extname(name))
        .replace(/\{index\}/g, i );
        
    spawn([cmd]);
    
});
