const { exit } = require('process');

var fs = require('fs')
    , path = require('path')
    , cp = require('child_process')
    , _ = require('./underscore')._
    , misc = require('./misc')()
    , winston = require('./winston')
    , beautifier = require('./beautify')
    , optimist = require('./optimist')
        .options('log', { alias: 'l', 'default': 'info', describe: 'Log level (debug, info, notice, warning, error).' })
        .options('target', { alias: 't', 'default': '', describe: 'build target' })
        .options('help', { alias: 'h', describe: 'Show this help message.' })

    , argv = optimist.argv
    , glob = require('./glob');

winston.setLevels(winston.config.syslog.levels);
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, { colorize: process.stdout && process.stdout.isTTY, level: argv.log, handleExceptions: false });

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
function activateLog(logfile) {
    spawnLog = logfile;
}

var echo = 0;
function spawn(a, returnOutput) {
    // console.log(a[0]);

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
    if (returnOutput) {
        result = execSync(cmd);
    } else
        if (spawnLog) {
            result = execSync(cmd);
            fs.appendFileSync(spawnLog, "\n# " + cmd + "\n" + result, 'utf8');
            winston.debug(result);
        }
        else {
            result = execSync(cmd, { stdio: [0, 1, 2] });
        }
    return result

}

function magick_convert() {
    // return "convert";
    return "magick";
}


function getDeepFieldFromObject() {
    var r = arguments[0];
    var a = [];
    for (var i = 1; i < arguments.length; i++) {
        if (isString(arguments[i]) || isNumber(arguments[i])) {
            a.push(arguments[i]);
        } else
            if (isArray(arguments[i])) {
                a = a.concat(arguments[i]);
            }
    }

    for (var i = 0; i < a.length; i++) {
        r = r[a[i]];
        if (r === undefined) return;
    }
    return r;
}


var toolsDir = __dirname;

function tool(t, opts) {
    return ['node', makePath([toolsDir, t])].concat(opts);
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
    basedir = basedir || "";
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
            files = glob.sync(basedir + src);
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

    // making sound files for howler
    sounds(d) {
        mkdir(d.dst);
        spawntool('soundsprite', ['-e mp3 -o sounds -d', d.dst, d.src])
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
        var dir = mkdir(d.dst);
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

            spawntool('builder', ['--target', s]);

        });

    },

    copy(d) {

        var src = collectSources(d.src);
        var dir = mkdir(d.dst);
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

        $each(d.src, (rpl, rgxp) => {
            content = content.replace(new RegExp(rgxp, d.flags || 'gm'), rpl);
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
            $each(d.src, function (k, v) {
                downscalex2(k, v);
            });
        } else if (d.src && d.dst) {
            downscalex2(d.src, d.dst);
        } else if (d.src) {
            var src = collectSources(d.src);
            $each(src, function (s) {
                downscalex2(s);
            });
        }
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
                activateLog(subtarget.log);

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
                throw 'Target content ' + i + ' must be object';
            }
        }

    } catch (e) {

        winston.error('Error while building target content');
        winston.error(e.stack || e);


    }
}

function unwindMagicVariables(data, src, dst) {

    //     console.log('unwindMagicVariables', data, src, dst);
    if (data) {

        if (!src) {

            if (data.version && (!data.buildFlags || !data.buildFlags.version)) {
                throw ('version in global data is deprecated. use "buildFlags": { "version": "@/version" }')
            }

            $each(additionalArguments, function (v, i) {
                data = unwindMagicVariables(data, i, v);
            });

            $each(data.buildFlags, function (v, i) {
                data = unwindMagicVariables(data, i, v);
            });



        }
        else
            if (isObject(data) || isArray(data)) {
                $each(data, function (d, i) {
                    data[i] = unwindMagicVariables(d, src, dst);
                });
            } else
                if (isString(data)) {

                    data = data.replace(new RegExp('\\$' + src + "\\?([^:]*):([^;]*);", 'g'), function (g, a, b) {
                        return (isNumeric(dst) ? Number(dst) : dst) ? a : b;
                    });

                    data = data.replace(new RegExp('\\$' + src, 'g'), dst)

                }

    }
    //     console.log('result', data );
    return data;

}

function _unwindObject(o) {
    if (isObject(o)) {
        //TODO ?

    } else
        if (isArray(o)) {
            o = $map(o, _unwindObject);
        }

    return o;

}

function unwindCommands(data) {

    if (isObject(data) || isArray(data)) {
        return $map(data, unwindCommands);
    } else {
        if (isString(data)) {
            var dd = data.indexOf('`');
            if (dd >= 0) {
                if (data[dd - 1] == '\\') {
                    return data.replace(/\\`/g, '`');
                } else {
                    return data.replace(/`([^`]*)`/g, function (d, command) {
                        var d = spawn([command], 1)
                        return d;
                    });
                }
            }
        }
    }
    return data;

}


function unwindLinks(data, basedata) {
    basedata = basedata || data;
    var changed;
    if (data) {

        if (isObject(data) || isArray(data)) {

            var subchanged = 0;

            //TODO: may be infinite loop!

            do {
                subchanged = 0;
                $each(data, function (d, i) {
                    var ud = unwindLinks(d, basedata);
                    if (ud.changed) {
                        subchanged = 1;
                        data[i] = ud.data;
                    }

                    ud = unwindLinks(i, basedata);
                    if (ud.changed) {
                        subchanged = 1;
                        data[ud.data] = data[i];
                        delete data[i];
                    }

                });
                if (subchanged) {
                    changed = 1;
                }
            } while (subchanged);

        } else {

            //now only from root
            if (isString(data)) {

                var di = data.indexOf('@');
                if (di >= 0) {

                    var founded = 0;
                    var foundedObject = 0;
                    var newdata = data.replace(/@\/([\w\d\/]+)(\\@)?/g, function (d, key) {
                        //                         console.log(key);
                        var r = getDeepFieldFromObject(basedata, explodeString(key, '/'));
                        if (r === undefined) {
                            throw 'cannot unwind link ' + data;
                        }

                        //                         r = _unwindObject(r);
                        founded++;

                        if (isObject(r) || isArray(r)) {
                            foundedObject = r;
                        }

                        // Arrays transforms into String ( [1,2].toString() == "1,2"  )
                        return r;
                    });


                    //only one object founded!
                    if (founded == 1 && isObject(foundedObject) || isArray(foundedObject)) {
                        data = foundedObject;
                        changed = 1;
                    }
                    else
                        if (newdata != data) {
                            data = newdata;
                            changed = 1;
                        }

                }

            }

        }
    }

    return {
        changed: changed,
        data: data
    }

}

var projectFile = argv.target ? './project.json' : '<input data>';

function build(data, target) {

    data = unwindLinks(isString(data) ? JSON.parse(data) : data).data;

    data = unwindCommands(data);
    if (target) {
        if (!data || !data.build_targets) {
            throw ('No build_targets in ' + projectFile);
        }
        else if (!data.build_targets[target]) {
            throw ('No target ' + target + ' in ' + projectFile);
        }
        else {
            data = unwindMagicVariables(data);
            var targetContent = data.build_targets[target]
            winston.info('Target ' + target);
            winston.debug('Target content: ', JSON.stringify(targetContent));
            buildTarget(targetContent);
        }
    } else {
        winston.debug('Target content: ', JSON.stringify(data));
        buildTarget(data);
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
                build(data, argv.target);
            } catch (e) {
                winston.error('Error opening ' + projectFile);
                winston.error(e);
            }
        }
    });
}

mergeObj(exports, {
    additionalArguments: additionalArguments,
    activateLog: activateLog,
    spawn: spawn,
    getDeepFieldFromObject: getDeepFieldFromObject,
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
    unwindMagicVariables: unwindMagicVariables,
    unwindCommands: unwindCommands,
    unwindLinks: unwindLinks,
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
