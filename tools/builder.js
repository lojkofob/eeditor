const { exit } = require('process');

var fs = require('fs')
    , path = require('path')
    , cp = require('child_process')
    , _ = require('./underscore')._
    , misc = require('./misc')()
    , winston = require('./winston')
    , beautifier = require('./beautify')
    , optimist = require('./optimist')
        .options('log', { alias: 'l', 'default': 'debug', describe: 'Log level (debug, info, notice, warning, error).' })
        .options('target', { alias: 't', 'default': '', describe: 'build target' })
        .options('help', { alias: 'h', describe: 'Show this help message.' })
        .options('colorize', { 'default': '', describe: 'set to 1 of need colors' })
    , argv = optimist.argv
    , glob = require('./glob')
    , unwind = require('./unwind.js').unwind
    , __env = {}
    , proxy = (data, basedata) => {
        var __copy = {};
        return new Proxy(data, {
            get: function (target, prop) {
                if (__copy.hasOwnProperty(prop)){
                    return __copy[prop];
                }
                var p = target[prop];
                // winston.debug('******** get prop ' + prop + ' = ', JSON.stringify(v));

                if (isString(p)) {

                    var v = unwind(p, __env, spawn, basedata);
                    // winston.debug('******** prop ' + prop + ' = ', JSON.stringify(v));
                    if (isString(v) && ((v.indexOf('$') >=0) || (v.indexOf('@/') >=0))){
                        winston.error('******* not unwinded "' + prop + '" : ' + JSON.stringify(v));
                    } else {
                        if (isObject(v) || isArray(v)) {
                            v = proxy(v, basedata);
                            __copy[prop] = v;
                        }
                        else {
                            __copy[prop] = v;
                        }
                        
                    }
                    return v;
                } else if (isObject(p) || isArray(p)) {
                    p = proxy(p, basedata);
                    // winston.debug('******** prop ' + prop + ' = ', JSON.stringify(p));
                    __copy[prop] = p;
                }
                return p;
            },
            set: function (target, prop, value) {
                target[prop] = value;            
                delete __copy[prop];
                return true;
            }
        });
    },
    env;

winston.setLevels(winston.config.syslog.levels);
winston.remove(winston.transports.Console);
var colorize = argv.colorize || (process.stdout && process.stdout.isTTY);
winston.add(winston.transports.Console, { colorize: colorize, level: argv.log, handleExceptions: false });

winston.debug('Parsed arguments', argv);

if (argv.help) {
    winston.info('Usage: builder --target=[target from project.json]')
    winston.info(optimist.help())
    process.exit(1);
}

var additionalArguments = {};
if (isArray(argv._)) {
    $each(argv._, function (s) {
        if (isString(s)) {
            s = s.split(' ');
            $each(s, function (ss) {
                ss = ss.trim();
                var i = ss.indexOf('=');
                if (i > 0) {
                    var k = ss.substring(0, i), v = ss.substring(i + 1);
                    additionalArguments[k] = v;
                    winston.debug(k + ' = ' + v);
                }
            });
        }
    });

}

//TODO: asyncing?
var spawnLog = 0;
var spawnCwd;

function activateLog(logfile) {
    spawnLog = logfile;
}

var echo = 0;
function spawn(a, opts) {
    // console.log(a[0]);

    opts = opts || {};

    if (spawnCwd && !opts.cwd) {
        opts.cwd = spawnCwd;
    }

    var cmd = $map(a, function (p) {
        if (isArray(p))
            return makePath(p)
        return p;
    }).join(' ');

    var execSync = echo ?
        (cmd, opts) => {
            winston.info(cmd);
            return cmd;
        } :
        (cmd, opts) => {
            var r = cp.execSync(cmd, opts);
            if (r) return r.toString();
        };

    winston.debug('execSync: ' + cmd);

    var result = '';
    if (opts.returnOutput) {
        result = execSync(cmd, opts);
    } else
        if (spawnLog) {
            result = execSync(cmd, opts);
            fs.appendFileSync(spawnLog, "\n# " + cmd + "\n" + result, 'utf8');
            winston.debug(result);
        }
        else {
            opts.stdio = [0, 1, 2];
            result = execSync(cmd, opts);
        }
    return result

}

function magick_convert() {
    // return "convert";
    return "magick";
}




var toolsDir = __dirname;

function tool(t, opts) {
    return ['node', makePath([toolsDir, t]), colorize ? '--colorize' : ''].concat(opts);
}

function spawntool(t, opts) {
    return spawn(tool(t, opts))
}

function quotesWrap(s) {
    return '"' + s + '"';
}

function collectSourcesStr(src, basedir, sep) {
    return collectSources(src, basedir).join(sep || ' ');
}

function collectSources(src, basedir) {
    var files = [];
    basedir = basedir || '';
    if (isObject(src)) {
        for (var i in src) {
            files = files.concat(collectSources(src[i], basedir + i));
        }
    } else if (isArray(src)) {
        for (var i in src) {
            files = files.concat(collectSources(src[i], basedir))
        }
    } else {
        if (src) {
            files = glob.sync(path.join(basedir, src));
        }
    }
    return files;
};

function downscalex2(src, dst) {
    if (!dst) {
        dst = path.resolve(src, '../..', path.basename(src));
    }
    return spawn([magick_convert(), src, "-transpose -filter cubic -define filter:b=0 -define filter:c=1.8 -define filter:blur=1.05 -resize 50% -transpose ", dst]);
}

function makePath(d) {
    if (isArray(d))
        d = path.join.apply(path, d);
    return (d || ''); // .replace(/\\/g, "/").replace("C:/", "/c/");
}


function mkdir(d) {
    d = makePath(d) + '_';
    var dir = path.dirname(d);
    if (dir != '.') {
        if (process.platform == "win32") {
            dir = dir.replace(/\//g, "\\");
        }
        if (!fs.existsSync(dir)) {
            try {
                spawn(['mkdir', dir]);
            } catch (ex) {
                spawn(['mkdir', '-p', dir]);
            }
        }
    }
    return dir + '/';
}

function removeFile(f) {
    try { fs.unlinkSync(f); } catch (e) { }
}

function renameFile(src, dst) {
    if (isString(src) && isString(dst) && src != dst && src && dst) {
        winston.debug('rename ' + src + ' -> ' + dst);
        try { fs.renameSync(src, dst); } catch (e) { }
    }
}

function rsync(src, dst, args) {
    console.log("rsync ", src, dst);
    mkdir(dst);
    spawn(["rsync -r " + (args || ""), src, dst]);
}


var subtargetsBuilders = {

    //setup some parameters
    setup(d){
        mergeObjectDeep(project_json, d.root);
    },

    // making sound files for howler
    sounds(d) {
        mkdir(d.dst);
        mkdir('./tmp/tmp')
        spawntool('soundsprite', ['-e mp3 -o sounds --array --samplerate ' + (d.samplerate || 44100) + ' -d', d.dst].concat(collectSources(d.src)))
    },

    //simple resizing images for icons, previews, thumbnails etc
    icons(d) {
        var src = collectSources(d.src);
        mkdir(d.dst);
        for (var i in d.sizes) {
            var sz = d.sizes[i];
            d.name = d.name || '';
            var outname = d.name.replace(/\[size\]/g, sz).replace(/\[filename\]/g, '%[filename:fname]');
            if (d.dst) outname = d.dst + (outname || '');
            /* http://www.imagemagick.org/Usage/basics/#mogrify
                To get the exact original filename the source image came from use "%i", "%d/%f" or "%d/%t.%e". Of course these all have the filename suffix, in the filename setting, whch IM does not use, but that should be okay as it is the same image file format.
            */
            for (var i in src) {
                spawn([magick_convert(), quotesWrap(src[i]), "-set filename:fname \"%t\"", '-resize ' + sz + 'x' + sz, outname]);
            }
        }
    },

    // making atlas from images
    atlas(d) {
        var src = collectSourcesStr(d.src, d.srcdir);
        mkdir(d.dst);
        // ${TEXTURE_PACKER_OPTIONS} ifeq ($(OS),Windows_NT) TEXTURE_PACKER_OPTIONS=--tmpDir C:/tmp/ endif

        var useProxyFile = 1; // d.useProxyFile || src.length > 50000; // coined magic number. may be wrong. see E2BIG

        if (useProxyFile) {
            fs.writeFileSync('.atlasProxy', src, 'utf8');
            src = '.atlasProxy';
        }

        spawn(["bash"
            , [toolsDir, 'TexturePacker', 'TexturePacker']
            , d.arrayFormat ? '-a' : ''
            , d.relativeNames ? '-r' : ''
            , d.verbose ? '-v' : ''
            , '-u', d.packerMethod == undefined ? 2 : d.packerMethod
            , '-b', d.border == undefined ? 1 : d.border
            , '-n', d.packerType || 0
            , '-d', d.dst || '.'
            , '-w', d.width
            , '-h', d.height
            , '-m', d.name + '-%d',
            , '-g', d.format || 'short'
            , useProxyFile ? '-L' : '-l', quotesWrap(src)
        ]);

        if (useProxyFile) {
            removeFile(src);
        }


        if (d.alpha) {
            var alphaQuality = d.alpha.quality || 95;
            var result = glob.sync(d.dst + d.name + '-?.png');
            for (var i in result) {
                var aname = result[i];
                spawn([magick_convert(), aname, "-set filename:fname \"%t\"", '-quality', alphaQuality, d.dst + '%[filename:fname].jpg']);
                spawn([magick_convert(), aname, "-set filename:fname \"%t\"", '-alpha extract -depth 5 -define png:compression-level=9', d.dst + '%[filename:fname]-alpha.png']);
            }
        }
    },

    // push all data in one js file
    // + shaders minifier
    datacache(d) {

        mkdir(d.dst);

        if (d.mode != "append")
            removeFile(d.dst);

        spawntool('node-data-cache', ['-o', d.dst, '-d', d.basedir || './', collectSourcesStr(d.src, d.srcdir)]);
    },

    //removing files
    clean(d) {
        var src = collectSources(d.src);
        for (var i in src) {
            if (src[i]) {
                spawn(["rm -rf", src[i]]);
            }
        }
    },

    ftp_upload(d) {
        var pass = d.password
            , user = d.user
            , server = d.server
            , url = d.url || `https://${server}/`
            , _path = d.path || ''
            , basedir = d.basedir
            , src = collectSources(d.src, basedir);

        if (!src) throw 'ftp_upload: need src'
        if (!server) throw 'ftp_upload: need server'

        if (src) {
            var num = src.length;
            if (user && pass) {
                server = `${user}:${pass}@${server}`;
            } else if (user) {
                server = `${user}@${server}`;
            }

            var uploadedFiles = []

            $each(src, s => {
                var filename = path.basename(s)
                    , filePath = _path;

                if (basedir) {
                    filePath += s.replace(basedir, '')
                } else {
                    filePath += `/${filename}`
                }

                uploadedFiles.push(filePath)

                spawn(['curl', '--ftp-create-dirs', '-T', s, `ftp://${server}/${filePath}`])
            });

            winston.info(`${num} files uploaded, check it at:`)

            $each(uploadedFiles, s => {
                winston.info(`${url}/${s}`)
            })
        }
    },

    zip(d) {
        var src = d.src;
        var zipname = d.dst;
        var compressionLevel = '-' + (d.compressionLevel || 9);

        if (isObject(src)) {
            $each(src, (filename, zipfilename) => {
                if (filename == zipfilename) {
                    spawn(['zip', '-r', compressionLevel, zipname, filename])
                } else {
                    var tmp_path = 'zip_tmp/'
                    mkdir(tmp_path);
                    fs.copyFileSync(
                        makePath([spawnCwd || '', zipfilename]),
                        makePath([spawnCwd || '', tmp_path, filename])
                    );

                    spawn(['zip', '-r', compressionLevel, '-m', '../' + zipname, filename], {
                        cwd: path.join(spawnCwd || '', tmp_path)
                    });

                    fs.rmdirSync(makePath([spawnCwd || '', tmp_path]));
                }
            })
        } else {
            src = $map(collectSources(src, spawnCwd), f => f.replace(spawnCwd, ''));
            $each(src, filename => {
                spawn(['zip', '-r', compressionLevel, zipname, filename])
            });
        }
    },

    minify(d) {

        var compressor = d.compressor || 'gcc';

        function minify(dst, args, advanced, src) {

            spawntool('node-minify', [
                args || '',
                '-t', compressor,
                d.es6 != false ? '--es6' : '',
                advanced ? '--ADVANCED_OPTIMIZATIONS' : '',
                d.myminify ? '--myminify' : '',
                d.pretty ? '--PRETTY' : '',
                d.rmdebug ? '--rmdebug ' + d.rmdebug : '',
                env.CHEATS ? '' : '--rmcheats',
                '-o', dst,
                src || collectSourcesStr(d.src, d.srcdir)
            ]);

        }

        if (d.wrap) {

            var dst = 'min_nowrapped.js';
            var wdst = 'min_wrapped.js';

            minify(dst, d.args);

            // advanced @suppress sample https://github.com/google/closure-compiler/wiki/Warnings

            var header = "";

            if (d.useStrict) {
                header += "'use strict';";
            }

            if (isObject(d.wrap)) {
                d.wrapFuncName = d.wrap.funcName || d.wrapFuncName;
                d.wrapFuncHeader = d.wrap.funcHeader || d.wrapFuncHeader;
            }

            if (isString(d.wrapFuncHeader)) {
                header += d.wrapFuncHeader;
            }

            var wrapfile = fs.readFileSync(dst, 'utf8');

            if (d.wrap.noJscomp) {
                wrapfile = wrapfile.substring(2113);
            }

            if (!d.wrap.noFunc) {
                wrapfile = "(function" + (d.wrapFuncName ? " " + d.wrapFuncName : "") + "(){" + header + wrapfile + "}).bind(this)()";
            }

            fs.writeFileSync(wdst, wrapfile);

            minify(d.dst, d.wrap.args, d.advanced, wdst);

        }
        else {

            minify(d.dst, d.args, d.advanced);

        }
    },

    target(d) {

        if (!isArray(d.src))
            d.src = [d.src];

        $each(d.src, function (s) {
            build(project_json, s);
        });

    },

    copy(d) {

        var src = collectSources(d.src);
        var dir = mkdir(d.dst);
        if (d.name) {
            dir = makePath([mkdir(d.dst), d.name]);
        }
        $each(src, function (s) {
            spawn(["cp -rfv", s, dir]);
        });

    },


    rsync(d) {

        var src = d.src;
        function mkargs(d) {
            return (d.deleteAfter ? '--delete-after' : '') +
                (d.verbose ? '-v' : '');
        }

        if (isObject(src)) {
            $each(src, (dst, s) => rsync(s, dst, mkargs(d)));
        } else
            if (d.dst) {
                rsync(src, d.dst, mkargs(d));
            }
    },


    rename(d) {

        if (isObject(d.dst) && isString(d.src)) {
            var files = collectSources(d.src);
            $each(files, file => {
                var r = file;
                $each(d.dst, (v, k) => {
                    r = r.replace(new RegExp(k, 'g'), v);
                    // console.log('file=', file, 'k=', k, 'v=', v, 'r=', r);
                });
                renameFile(file, r);
            });
        } else if (isString(d.dst) && isString(d.src)) {
            renameFile(d.src, d.dst);
        }

    },


    file(d) {
        var file = makePath([mkdir(d.dst), d.name]);
        var content = d.content;
        if (!isString(d.content)) {
            content = JSON.stringify(d.content);
        }
        if (d.minwrapper) {
            var wraps = fs.readFileSync(d.minwrapper, 'utf8');
            if (wraps) {
                wraps.replace(/(__[^\s]*) --\> (\$[^\s]*)/g, function (M, a, b) {

                    content = content.replace(new RegExp('([^\\w])(' + a + ')([^\\w])', 'g'), function (m, i, j, k) {
                        //                         console.log(M, a, b, '->>', m,i,j,k);
                        return i + b + k
                    });
                    return M;
                });
            }
        }
        fs.writeFileSync(file, content, d.encoding || 'utf8');
    },

    packintoonefile(d) {

        var dstFile = makePath([mkdir(d.dst), path.basename(d.dst)]);
        var content = fs.readFileSync(d.sourceFile, 'utf8');

        $each(d.src, function (file, rpl) {
            content = content.replace(rpl, function () {
                return fs.readFileSync(file, 'utf8')
            });
        });

        fs.writeFileSync(dstFile, content);

    },

    rmdebug(d) {
        var arr = d.args.split(',');
        $each(collectSources(d.src), file => {
            var data = fs.readFileSync(file, 'utf8');
            for (var j in arr) {
                var len = data.length;
                var s = arr[j].split('/');
                var defineBegin = s[0];
                var defineEnd = s[1];
                data = data.replace(new RegExp("//" + defineBegin + "[\\s\\S.]*?//" + defineEnd, "gm"), '');
                if (data.length != len)
                    console.log("//" + defineBegin + "[\\s\\S.]*?//" + defineEnd, 'replaced in ', file, '-', len - data.length, 'chars removed');
            }

            fs.writeFileSync(file, data);

        });
    },

    jsbundle(d) {

        var dstFile = makePath([mkdir(d.dst), path.basename(d.dst)]);
        var content = '';
        $each(collectSources(d.src), file => {
            content = content + '\n\n// ------- ' + file + ' --------' + '\n\n' + fs.readFileSync(file);
        });
        fs.writeFileSync(dstFile, content);

    },

    replaceinfile(d) {

        var dstFile = makePath([mkdir(d.dst), path.basename(d.dst)]);
        var content = fs.readFileSync(d.sourceFile, 'utf8');
        $each(d.src, (rpl, key) => {
            var mode = "regexp";
            if (isObject(rpl)) {
                mode = rpl.mode || mode;
                rpl = rpl.value;
            }
            switch (mode) {
                case "regexp":
                    content = content.replace(new RegExp(key, d.flags || 'gm'), rpl);
                    break;
                case "str":
                    var replaced = 1;
                    while (replaced) {
                        var rcontent = content.replace(key, rpl);
                        replaced = content != rcontent;
                        content = rcontent;
                    }
                    break;
            }
        });

        fs.writeFileSync(dstFile, content);

    },

    beautify(d) {
        var src = collectSources(d.src);
        $each(src, s => {
            fs.writeFileSync(s, beautifier.js_beautify(fs.readFileSync(s, 'utf8')));
        });
    },

    jsonprocess(d) {
        var src = collectSources(d.src);
        if (!src.length) {
            winston.error("jsonprocess sources is emtpy");
        }
        if (isFunction(d.process)) {
            $each(src, s => {
                var content = d.process(s, JSON.parse(fs.readFileSync(s, 'utf8') || "{}"));
                if (d.replaceFile) {
                    fs.writeFileSync(s, JSON.stringify(content, null, d.pretty ? 4 : 0))
                }
            });
        } else {
            throw "jsonProcess error: process must be a function"
        }
    },

    command(d) {
        if (isArray(d.command)) {
            $each(d.command, command => {
                spawn([command])
            });
        }
        else {
            spawn([d.command]);
        }
    },

    downscalex2(d) {
        if (isObject(d.src)) {
            $each(d.src, (k, v) => {
                downscalex2(k, v);
            });
        } else if (d.src && d.dst) {
            downscalex2(d.src, d.dst);
        } else if (d.src) {
            var src = collectSources(d.src);
            $each(src, s => {
                downscalex2(s);
            });
        }
    },

    each(d) {
        var target = d.target;
        if (!target) return;
        if (!isArray(target)) {
            target = [target];
        }

        $each(d.src, v => {
            mergeObj(project_json.buildFlags, v);
            winston.debug('ENV += ' + JSON.stringify(v));
            $each(target, t =>
                build(project_json, t)
            );
        });
    },

    tool(d) {
        spawntool(d.tool, d.args);
    }
}

function buildTarget(target) {

    try {

        if (!isArray(target)) throw 'Target content must be array'
        for (var i in target) {
            var subtarget = target[i];
            if (isFunction(subtarget)) {
                activateLog(subtarget.log);

                echo = subtarget.echo;
                winston.debug('Build subtarget ' + i + ' type: function');
                subtarget();

            }
            else if (isObject(subtarget)) {
                
                if (subtarget.buildFlags) {
                    merge_env(env, subtarget.buildFlags);
                }

                subtarget = proxy(subtarget, proxy(project_json, project_json));
                
                activateLog(subtarget.log);

                spawnCwd = subtarget.cwd;

                echo = subtarget.echo;

                var stype = String(subtarget.type).toLowerCase();
                winston.debug('Build subtarget ' + i + ' type: ' + stype + ' content: ' + JSON.stringify(subtarget));

                if (subtarget.description) {
                    winston.info(subtarget.description);
                }

                if (subtargetsBuilders[stype]) {
                    subtargetsBuilders[stype](subtarget);
                } else {
                    winston.error('No builder for subtarget type ' + stype);
                }
            } else {
                winston.debug(i + ' : ' + JSON.stringify(target));
                throw 'Target content ' + i + ' must be object';
            }
        }

    } catch (e) {

        winston.error('Error while building target content');
        winston.error(e.stack || e);


    }
}


var projectFile = argv.target ? './project.json' : '<input data>';


function run_target(dat, target_name) {
    if (target_name) winston.info('Target:', target_name);
    winston.debug('Target content:', JSON.stringify(dat));
    buildTarget(dat);
}

var project_json;

function merge_env(env, data) {
    env = mergeObj(env, data);
    if (isString(env.VERSION)) { // "1.2.3.4"
        const versionParts = env.VERSION.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\.(\d+))?$/);
        if (versionParts) {
            const [_, major, minor, patch, build] = versionParts;
            env.VERSION_UNDERSCORE = env.VERSION.replace(/\./g, '_');
            env.VERSION_MAJOR = parseInt(major, 10);
            env.VERSION_MINOR = parseInt(minor, 10);
            env.VERSION_PATCH = parseInt(patch, 10);
            env.VERSION_BUILD = parseInt(build, 10) || 0;
        }
    }
    return env;
}

function build(data, target_name) {

    var data = deepclone(data);
    // console.log("--------------------------------------------------------- buildFlags = ");
    // console.log(data.buildFlags);
 
    env = proxy(__env, data);

    /*

js

есть функция unwind(data, env)
которая заменяет в json нужные переменные среды
например 
data = {
    "$KEY": "$VALUE",
    "user": {
       "id": "$USER_ID"
    }
}
env = {
   "KEY": "my_key",
   "VALUE": "my_value",
   "USER_ID": "player1"
}

unwind вернет {
    "my_key": "my_value",
    "user": {
       "id": "player1"
    }
}


далее есть некая функция 
function build(data) {
    data = unwind(data, env);
    ....

при этом unwind проходит по всему json-у, что не очень бывает хорошо

хотелось бы, чтобы unwind работало только тогда, когда это нужно, т.е. при обращении к значениям ключей в data

можешь обернуть data в такой прокси-объект?


    */

    env = merge_env(env, data.buildFlags);
    env = merge_env(env, additionalArguments);

    // console.log("--------------------------------------------------------- env = ");
    // console.log(env);

    data = unwind(data, env, spawn, data);

    // env = merge_env(env, data.buildFlags);

    var build_targets = data.build_targets

    if (!isObject(build_targets)) {
        throw ('No build_targets in ' + projectFile);
    }
    else if (!build_targets[target_name]) {
        throw ('No target ' + target_name + ' in ' + projectFile);
    }
    else {
        run_target(build_targets[target_name], target_name);
    }

}

if (argv.target) {
    fs.readFile(projectFile, 'utf8', function (err, data) {
        if (err) {
            winston.debug('Execution path', process.cwd());
            winston.error(err);
        }
        else {
            try {
                project_json = JSON.parse(data)
            } catch (e) {
                winston.error('Error opening ' + projectFile);
                winston.error(e);
            }

            if (project_json) {
                build(project_json, argv.target);
            }
        }
    });
}

mergeObj(exports, {

    activateLog: activateLog,
    spawn: spawn,

    tool: tool,
    spawntool: spawntool,
    quotesWrap: quotesWrap,
    collectSourcesStr: collectSourcesStr,
    collectSources: collectSources,
    makePath: makePath,
    mkdir: mkdir,
    removeFile: removeFile,
    renameFile: renameFile,
    rsync: rsync,
    buildTarget: buildTarget,
    unwind: unwind,
    build: build,

    fs: fs,
    path: path,
    cp: cp,
    _: _,
    misc: misc,
    winston: optimist,
    beautifier: optimist,
    optimist: optimist,
    argv: optimist.argv,
    glob: glob
});
