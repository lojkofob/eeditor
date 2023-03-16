var compressor = require('./lib/node-minify');

var os = require('os');
var _ = require('../underscore')._;
var fs = require('fs');
var glob = require('glob');

var optimist = require('../optimist')
  .options('tmpDir', {
      describe: 'temp directory',
      'default': os.tmpdir() + '/'
  })
  .options('type', {
    alias: 't'
  , 'default': 'gcc'
  , describe: 'Compressor type: gcc, no-compress, yui-css, yui-js, sqwish, clean-css, csso'
  })
  .options('es6', {
    describe: 'enable ecmascript 6'
  })
  .options('output', {
    alias: 'o'
  , 'default': 'out.js'
  , describe: 'Name for the output file.'
  })
  .options('help', {
    alias: 'h'
  , describe: 'Show this help message.'
  })
  .options('myminify', {
    describe: 'more project compressing'
  })
  .options('ADVANCED_OPTIMIZATIONS', {
    describe: 'gcc compilation_level'
  })
  .options('WHITESPACE_ONLY', {
    describe: 'gcc compilation_level'
  })
  .options('PRETTY', {
    describe: ''
  })
  .options('rmdebug', {
    describe: ' '
  })

var argv = optimist.argv

var f = _.uniq(argv._);
var files = [];

for (var i in f){
    var k = glob.sync( f[i] );
    for (var j in k) files.push(k[j]);
}


var error;

if (!argv.help)
if (files.length == 0){
  error = 'no input files specified';
}

if (argv.help || error) {
  if (error) {
    console.error('Error:', error);
  }
  console.log('Usage: node-minify [options] file1.js [file2.js, ...]')
  console.log(optimist.help())
  process.exit(1)
}


try {
    if (argv.rmdebug){
        
        var arr = argv.rmdebug.split(',');
        
        for (var i in files){
            var file = files[i]; 
            var data = fs.readFileSync(file, 'utf8');
                    
            for (var j in arr){
                var len = data.length;
                var s = arr[j].split('/');
                var defineBegin = s[0];
                var defineEnd = s[1];
                data = data.replace( new RegExp("//" + defineBegin + "[\\s\\S.]*?//" + defineEnd, "gm"), '');
                if (data.length!=len)
                    console.log( "//" + defineBegin + "[\\s\\S.]*?//" + defineEnd, 'replaced in ', file, '-', len - data.length, 'chars removed' );
            }
    
            var filename = file.split('/');
            filename = filename[filename.length-1];
    
            fs.writeFileSync( 'min_' + filename, data );
            
            files[i] = 'min_' + filename;
            
        }
    }
} catch(e){
  console.log(e);
  return;
} 

var opts = {
  type: argv.type,
  compilation_level: argv.ADVANCED_OPTIMIZATIONS ? 'ADVANCED_OPTIMIZATIONS' : argv.WHITESPACE_ONLY ? 'WHITESPACE_ONLY' : 0,
  fileIn: files,
  fileOut: argv.output,
  tempPath: argv.tmpDir,
  sync: 1,
  pretty: argv.PRETTY,
  callback: function(err, data){
        
    if (argv.myminify){

        if (!data)
            throw "cant minify something";
            
        var file = argv.output; 
        
        var alph1 = '$ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        var alph2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$_1234567890'.split('');
        
        var totalArr = [];
        
        var ind = 0;
        
        for (var j in alph2) totalArr.push('$' + alph2[j]);
        for (var j in alph2) for (var k in alph2)  totalArr.push('$' + alph2[j] + alph2[k]);
        for (var i in alph2) for (var j in alph2) for (var k in alph2)  totalArr.push('$' + alph2[i] + alph2[j] + alph2[k]);
        
        var generateShortName = function (varname){
            var n = totalArr[ind];
            if (!n)
                console.error('possible names ended :(');
            ind++;
            console.log(varname, '-->', n);
            return n;
        }

        var shortnames = {};
        
        data = data.replace(/(__[\w]+)/g, function (str, varname){
            if (str == '__proto__')
            {
                return str;
            }
            var n = shortnames[varname];
            if (!n) n = shortnames[varname] = generateShortName(varname);
            return n;
        });
        
        fs.writeFileSync( file, data );

    }

  }
}

if (opts.type.indexOf('css')<0){
    opts.language = 'ES' + (argv.es6 ? 6 : 5);
    opts.options = [ 
      '--language_out=ECMASCRIPT_2015'
      , '--jscomp_off=checkVars'      
    ];
}

new compressor.minify(opts);
