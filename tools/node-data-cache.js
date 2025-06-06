var fs = require('fs')
var path = require('path')
var async = require('./async')
var _ = require('./underscore')._
var winston = require('./winston')
var cp = require('child_process')
var glob = require('./glob');

var optimist = require('./optimist')
    .options('directory', {
        alias: 'd'
        , 'default': './'
        , describe: 'root directory name'
    })
    .options('output', {
        alias: 'o'
        , 'default': 'data.js'
        , describe: 'output file name'
    })
    .options('help', {
        alias: 'h'
        , describe: 'Show this help message.'
    })

var argv = optimist.argv;

var f = _.uniq(argv._);
var files = [];

for (var i in f) {
    var k = glob.sync(f[i]);
    for (var j in k) files.push(k[j]);
}



var error = false;

if (files.length == 0) {
    error = 'no input files specified';
}

if (argv.help || error) {
    if (error) {
        winston.error(error);
    }
    winston.info('Usage: node-data-cache [options] file1.json [file2.json, etc]')
    winston.info(optimist.help())
    process.exit(1)
}

var outFileData = '';
var outFile = argv.output;



// function to encode file data to base64 encoded string
function base64_encode(file) {
    // convert binary data to base64 encoded string
    return new Buffer(fs.readFileSync(file)).toString('base64');
}

// function to create file from base64 encoded string
function base64_decode(base64str, file) {
    // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
    // write buffer to file
    fs.writeFileSync(file, new Buffer(base64str, 'base64'));
}

// console.log("read ", outFile)

fs.readFile(outFile, 'utf8', function (err, data) {
    
    if (typeof data === 'string' || data instanceof String) {
        outFileData = data;
    }

    var oext = path.extname(outFile).replace('.', '');

    if (oext != 'json') {
        outFileData += '\n\n mergeObj ( globalConfigsData, { \n';
    } else {
        outFileData += '{\n';
    }

    var outFileDataImgs;
    var zpt1 = '';
    var zpt2 = '';
    for (var i in files) {
        var file = files[i];

        console.log('cache file', file);
        var ext = path.extname(file).replace('.', '');
        switch (ext) {

            case 'png':
            case 'jpg':

                var data = "data:image/" + ext + ";base64," + base64_encode(file);

                if (data) {
                    if (!outFileDataImgs) {
                        outFileDataImgs = '\n\n mergeObj ( globalConfigsData.__images, { \n';
                    }
                    
                    if (argv.directory && file.startsWith(argv.directory)) {
                        file = file.replace(argv.directory, '');
                    }
                    
                    outFileDataImgs += zpt1 + '\n"' + file + '":' + '"' + data + '"';
                    zpt1 = '\n\n,';
                }
                break;

            default:

                var data
                , b64mimes = {
                    fbx: 'model/fbx',
                    skel: 'model/skel',
                    ttf: 'font/truetype',
                    otf: 'font/otf',
                    mp3: 'audio/mp3'
                },


                mime = b64mimes[ext];
                
                if (mime) {
                    data = "data:"+ b64mimes[ext] + ";base64," + base64_encode(file);
                } else {
                    data = fs.readFileSync(file, { encoding: 'utf8' });
                }

                if (argv.directory && file.startsWith(argv.directory)) {
                    file = file.replace(argv.directory, '');
                }

                outFileData += zpt2 + '\n"' + file + '":';

                switch (ext) {

                    case 'html':
                    case 'css':
                        outFileData += '"' + data.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
                        break;

                    case 'atlas':
                        outFileData += '"' + data.replace(/\n/g, '\\n') + '"';
                        break;
 
                    default:
                        outFileData += '"' + data + '"';
                        break;

                    case 'json':
                        var tryparse = JSON.parse(data);
                        outFileData += data;
                        break;

                    case 'f':
                    case 'v':

                        // shaders minify
                        data = data.replace(/(#.*)/gi, '$1<<define here>>');
                        data = data.replace(/\/\/.*/gi, '');
                        data = data.replace(/\/\*.*\*\//gi, '');
                        data = data.replace(/[\n\r]/gi, ' ');
                        data = data.replace(/\s+/gi, ' ');
                        data = data.replace(/([^\w\d]) ([\w\d])/gi, '$1$2');
                        data = data.replace(/([\w\d]) ([^\w\d])/gi, '$1$2');
                        data = data.replace(/([^\w\d]) ([^\w\d])/gi, '$1$2');
                        data = data.replace(/^\s/gi, '');
                        data = data.replace(/\s$/gi, '');
                        data = data.replace(/<<define here>>/gi, '\\n');
                        outFileData += '"' + data + '"';
                        break;
                }

                zpt2 = '\n,';
                break;
        }
    }

    outFileData += ' \n}';


    if (oext != 'json') {
        outFileData += ');\n';
    }

    if (outFileDataImgs) {
        outFileData += outFileDataImgs + '\n});\n';
    }

    // console.log("write ", outFile)

    fs.writeFile(outFile, outFileData, function (err, data) {
        if (err) throw err;
    });

});


