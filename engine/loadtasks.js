//configs tables
var tablesCache = {},
    _b64i = 0,
    __loadTasksId = 0,
    dbResourceId = 0,
    spResourceId = 0,
    l2dResourceId = 0,
    TASKS_IMAGE = 'image',
    TASKS_CONFIG = 'config',
    TASKS_LOCALIZATION = 'locale',
    TASKS_FONT = 'font',
    TASKS_ATLAS = 'atlas',
    TASKS_SOUND = 'sound',
    TASKS_LAYOUT = 'layout',
    TASKS_RAWDATA = 'raw',
    TASKS_SHADERS = 'shaders',
    TASKS_CSS = 'css',
    TASKS_HTML = 'html',
    TASKS_CLASS = 'class',
    TASKS_EFFECT = 'effect',
    TASKS_SCRIPT = 'script',
    TASKS_DRAGON_BONES = 'dragonBones',
    TASKS_SPINE = 'spine',
    TASKS_3D = '3d',
    TASKS_RAWBUFFER = 'buffer',
    TASKS_LIVE2D = 'live2d';


function getItemFromTableById(t, id) {
    var conf = globalConfigsData[t];
    return (conf && tablesCache[t]) ? conf[tablesCache[t][id]] : null;
}

function getDataTableSources(t) {
    return globalConfigsData[t] || globalConfigsData[options.__baseConfigsFolder + t + '.json'];
}

function writeDataTableArray(t, tbl, format, byObject, ignoreNullFields, clearMod, subformats) {
    var arr = byObject ? {} : [];
    t = tablesCache[t] || t;
    $each(tbl, function (o, i) {
        var index = byObject ? i : arr.length;
        var mod = clearMod == 1 ? { i: index } : { id: i, i: index };

        t[i] = index;

        for (var k in o) {
            if (!ignoreNullFields || o[k] || (ignoreNullFields == 2 && o[k] === null)) {
                if (subformats && subformats[format[k]]) {
                    mod[format[k]] = writeDataTableArray(0, o[k], subformats[format[k]], 0, ignoreNullFields, 1); //массив объектов
                }
                else {
                    mod[format[k]] = o[k];
                }
            }
        }

        arr[index] = mod;
    });

    return arr;
}

function getCachedData(name, obj) {

    var obj = obj || globalConfigsData;
    if (isString(name)) {
        var j = obj[name];
        if (!j) {
            if (name.indexOf('?') >= 0) {
                name = name.split('?')[0]; j = obj[name];
            }
            if (!j && options.__allServerPath && name.startsWith(options.__allServerPath)) {
                name = name.slice(options.__allServerPath.length); j = obj[name];
            }
            if (!j && options.__projectServerPath && name.startsWith(options.__projectServerPath)) {
                name = name.slice(options.__projectServerPath.length); j = obj[name];
            }
        }

        return j;
    }
    //debug
    console.assert('wtf?');
    //undebug
    return obj[name];
}

function setCachedData(name, j, obj) {
    var obj = obj || globalConfigsData;
    if (isString(name)) {
        if (name.indexOf('?')) name = name.split('?')[0];
        obj[name] = j;
        return j;
    }
    //debug
    console.assert('wtf?');
    //undebug
    obj[name] = j;
    return j;
}


function getJson(filename, onload, onprogress, usePacking, onerror) {
    var alias = isObject(filename) ? filename.alias : 0
        , cachedData;
    if (alias) {
        cachedData = getCachedData(filename.path);
        if (cachedData) {
            setCachedData(alias, cachedData);
        } else {
            cachedData = getCachedData(alias);
        }
    } else {
        cachedData = getCachedData(filename);
    }
    if (cachedData) {
        onload(cachedData);
    }
    else {
        return loadDataJson(filename, onload, onerror, onprogress, usePacking);
    }
}


function getDataTable(t, byObject, ignoreNullFields, storeSrc) {
    tablesCache[t] = {};
    var table = getDataTableSources(t);
    var format = table.__format;
    var subformats = table.__subformats;
    if (format) {

        var arr;

        invertMap(format, format);
        $each(subformats, function (sf) { invertMap(sf, sf); });

        if (table.__multiplySheets) {
            arr = byObject ? {} : [];
            for (var i in table.__table) {
                arr[i] = writeDataTableArray(t, table.__table[i], format, byObject, ignoreNullFields, 0, subformats);
            }
        } else {
            arr = writeDataTableArray(t, table.__table, format, byObject, ignoreNullFields, 0, subformats);
        }

        setCachedData(t, arr);
        return arr;
    }

    return table.__table || table;
}


function onTextureLoaded(tex) {
    $each(tex.__nodesWaitingsForThis, function (n) {
        n.__onTextureLoaded(tex);
    });
    tex.__nodesWaitingsForThis = 0;
};

function loadVideoTexture(url, onload, onProgress, onError, urlGotModUrl, opts) {

    var video = document.createElement('video');
    opts = opts || 0;

    video.playsInline = true;
    video.crossorigin = 'anonymous';
    video.autoplay = ifdef(opts.__autoplay, true);
    video.muted = ifdef(opts.__muted, true);
    video.loop = ifdef(opts.__loop, true);
    var texture = new Texture(video);

    video.addEventListener('loadeddata', wrapFunctionInTryCatch(function () {

        video.currentTime = 0;
        texture.v = 1;

        ObjectDefineProperties(texture, {
            __version: { get() { this.__image.currentTime + 1 }, set() { } }
        });

        video.width = video.videoWidth;
        video.height = video.videoHeight;

        if (onload) {
            onload(texture);
        }

        if (video.autoplay) {
            // ios autoplay bug hack
            _setTimeout(a => {
                if (!video.currentTime) {
                    texture.__update = function (t, dt) {
                        video.currentTime += dt / 1000;
                    };
                    updatable.push(texture)
                }
            }, 0.1);
        }

    }), true);

    var cached = getCachedData(url, globalConfigsData.__images);
    if (cached) {
        video.src = cached;
    } else {
        video.src = url;
    }

    video.load();
    if (video.autoplay) {
        video.play();
    }


    texture.__isVideo = 1;
    texture.__abort = texture.abort = function () {
        //TODO: abort loading
    };

    return texture;

}

function loadTexture(url, onload, onProgress, onError, urlGotModUrl) {

    var texture = new Texture(new Image());

    texture.__image.crossOrigin = 'anonymous';

    texture.__abort = texture.abort = function () {
        if (this.__requests) {
            this.__requests.__abort();
            this.__requests = 0;
        }
        if (this.__image) {
            this.__image.onload = undefined;
            this.__image = 0;
        }
    };

    texture.__image.onload = wrapFunctionInTryCatch(function () {
        var img = texture.__image;
        if (img) {
            URL.revokeObjectURL(img.src);

            // JPEGs can't have an alpha channel, so memory can be saved by storing them as RGB.
            var isJPEG = url.search(/\.(jpg|jpeg)$/) > 0 || url.startsWith("data:image/jpeg");

            texture.__init({ format: isJPEG ? GL_RGB : GL_RGBA, __image: img, __needsUpdate: 1 });

            texture.__requests = 0;

            if (onload) {
                onload(texture);
            }

            img.onload = undefined;
        }
    });

    //     if ( url.indexOf && url.indexOf( 'data:' ) === 0 /*|| url.indexOf('http') === 0 -- some CORS problems here */) {
    // 
    //         image.src = url;
    // 
    //     } else {

    var cached = getCachedData(url, globalConfigsData.__images)
        , onLoad = function (blob) {
            if (texture.__image) {
                texture.__image.src = URL.createObjectURL(blob);
            }
        }

    if (isString(cached)) { // like blob:
        texture.__image.src = cached;
    } else {

        if (options.__onLoadImageError) {
            onError = onError ? overloadMethod(onError, options.__onLoadImageError) : options.__onLoadImageError;
        }

        texture.__requests = new RequestsCollection(
            loadData(url, onLoad, onError, onProgress, { responseType: 'blob' }, 0, urlGotModUrl)
        );
    }

    //     }

    return texture;

}




function loadImage(filename, onload, nodeWaitingsForThis, onProgress, onError) {
    if (!filename) {
        onError();
        return;
    }

    var url, tryToUseLSCache;
    if (isObject(filename)) {
        tryToUseLSCache = filename.c;
        url = filename.u;
        filename = filename.n;
    }

    if (!url && filename.indexOf && filename.indexOf("data:image/") == 0) {
        url = filename;
    }

    if (url) {
        var isBlob = url.indexOf("blob:") == 0,
            isBase64 = url.indexOf("data:image/") == 0;

        if (isBase64 || isBlob) {
            var tex = new Texture(new Image());
            tex.__image.src = url;
            // JPEGs can't have an alpha channel, so memory can be saved by storing them as RGB.
            var isJPEG = url.indexOf("data:image/jpeg") === 0;
            tex.__init({ format: isJPEG ? GL_RGB : GL_RGBA, __needsUpdate: 1 });

            if (nodeWaitingsForThis) {
                tex.__nodesWaitingsForThis = [nodeWaitingsForThis];
            }
            tex.__src = "_b64i_" + _b64i;
            _b64i++;
            var w = tex.__image.width, h = tex.__image.height;
            globalConfigsData.__frames[tex.__src] = {
                __isSimpleImage: true,
                tex: tex,
                __uvsBuffers: [],
                v: [0, 1, 1, 0],
                s: new Vector2(w, h),
                r: [0, 0, w, h],
                c: defaultHalfVector2
            };

            if (onload) onload(tex);
            onTextureLoaded(tex);
            return tex;
        }
    }

    var urlGotModUrl = 0;
    if (!url) {
        url = modUrl(filename, options.__baseImgFolder);
        urlGotModUrl = 1;
    }

    var srcurl = url;

    if (tryToUseLSCache) {
        srcurl = LocalGetKey(filename);
    }

    srcurl = srcurl || url;
    var opts = nodeWaitingsForThis ? nodeWaitingsForThis.__loadImageOptions || 0 : 0;

    var cache = getCachedData(srcurl, globalConfigsData.__images);
    if (cache && cache.tex) {
        if (cache.__isLoading) {
            cache.__onload.push(onload);
        } else {
            onload(cache.tex);
        }
        return cache.tex;
    }

    var tex = (
        url.indexOf('.mp4') > 0 || url.indexOf('.webm') > 0 ?
            loadVideoTexture : loadTexture)(srcurl, tex => {
                var frame = globalConfigsData.__frames[tex.__src];

                if (frame) {
                    var w = tex.__image.width, h = tex.__image.height;
                    frame.v = [0, 1, 1, 0];
                    frame.s = new Vector2(w, h);
                    frame.r = [0, 0, w, h];
                    frame.c = defaultHalfVector2;
                    delete frame.__loading;
                }

                var cache = getCachedData(srcurl, globalConfigsData.__images);
                if (cache && cache.__isLoading) {
                    cache.__isLoading = 0;
                    $each(cache.__onload, a => a(tex));
                    cache.__onload = 0;
                };
                onTextureLoaded(tex);
            }, onProgress, onError, urlGotModUrl, opts);

    setCachedData(srcurl, { tex: tex, __isLoading: 1, __onload: [onload] }, globalConfigsData.__images);

    tex.__src = filename;

    if (nodeWaitingsForThis) {
        tex.__nodesWaitingsForThis = [nodeWaitingsForThis];
    }

    globalConfigsData.__frames[filename] = {
        __isSimpleImage: true,
        tex: tex,
        __uvsBuffers: [],
        __loading: 1,
        __realFilename: url.split ? url.split('?')[0] : url
    };

    return tex;

}

var LoadTaskOne = makeClass(function (type, data, baseTask, onLoad, onError) {
    var t = this;
    t.____progress = 0;
    t.__data = data;
    t.__type = type;
    t.__baseTask = baseTask;
    t.____onLoad = onLoad;
    t.____onError = onError;
    t.__id = __loadTasksId++;

    mergeObj(t, options.__loadingPolicies);
    //debug
    //     consoleLog( 'created task', t );
    //undebug
}, {

    __progress() { return this.____progress; },

    //debug
    __stringify() {
        return '<LoadTaskOne' + this.__id + '>';
    },
    //undebug

    __onLoad: wrapFunctionInTryCatch(function (j) {
        var t = this;
        if (t.____onLoad) {
            t.____onLoad(j, t.__data);
        }


        t.____progress = 1;

        //debug
        //    consoleLog( 'loaded', t );
        //undebug

        if (t.__baseTask) {
            t.__baseTask.__onLoadProgress();
        }
        t.__baseTask = 0;
        t.__requests = 0;
    }),

    __onLoadingError() {
        var t = this;
        return wrapFunctionInTryCatch(function (e) {
            //debug
            consoleLog("__onLoadingError", t, e);
            //undebug

            if (!t.__aborted && t.__retryIfErrorTimeout && t.__retryIfErrorTries != 0) {
                //cheats
                consoleError('loading error', t.__type, t.__data);
                //endcheats
                if (!t.__errorTimeout) {

                    if (t.__retryIfErrorTries > 0) {
                        t.__retryIfErrorTries--;
                    }

                    t.__errorTimeout = setTimeout(t.__run.bind(t), t.__retryIfErrorTimeout * ONE_SECOND);

                    t.__retryIfErrorTimeout *= Number(t.__retryIfErrorTimeoutMultiplier);

                    if (t.__callErrorEveryTime && t.____onError) t.____onError(e);

                }

            } else {

                if (t.____onError)
                    t.____onError(e);

            }
        });
    },

    __abort() {
        var t = this;
        //debug
        //         consoleLog('abort task ', t);
        //undebug
        if (t.____progress < 1 && t.__requests) {
            t.__aborted = 1;
            t.__requests.__abort();
            t.__requests = 0;
        }
    },

    __run(dataFromPreviousTask) {
        //debug
        //         consoleLog( 'runned task', this );
        //undebug

        this.__errorTimeout = 0;

        var t = this, data = t.__data || dataFromPreviousTask, type = t.__type,
            onSubProgress = function (a) {
                t.____progress = mmin(0.999999, a.total ? a.loaded / a.total : 0);
                t.__baseTask.__onLoadProgress();
            },
            onLoad = t.__onLoad.bind(t),
            onError = t.__onLoadingError();

        if (isFunction(type)) {
            type(t, data, dataFromPreviousTask);
        } else
            switch (type) {
                case TASKS_IMAGE:
                    //                 __window.__loadImageStack = 't';
                    t.__requests = new RequestsCollection(
                        loadImage(data, onLoad, null, onSubProgress, onError)
                    );
                    break;

                case TASKS_LOCALIZATION:
                case TASKS_CLASS:
                case TASKS_LAYOUT:
                case TASKS_EFFECT:
                case TASKS_CONFIG:
                    t.__requests = new RequestsCollection(
                        getJson(data, onLoad, onSubProgress, 1, onError)
                    );
                    break;

                case TASKS_SCRIPT:
                    var script = document.createElement("script");
                    script.src = modUrl(data);
                    script.onload = onLoad;
                    script.onerror = onError;

                    (document.getElementsByTagName("head")[0] || document.body).appendChild(script);

                    break;

                case TASKS_RAWDATA:
                    t.__requests = new RequestsCollection(
                        getRawTxt(data, onLoad, null, onSubProgress, onError)
                    );
                    break;

                case TASKS_RAWBUFFER:
                    t.__requests = new RequestsCollection(
                        getRawBuffer(data, onLoad, null, onSubProgress, onError)
                    );
                    break;

                case TASKS_FONT:
                    var waitsForRealLoad;
                    if (isArray(data)) {
                        data = data[0];
                        waitsForRealLoad = data[1];
                    }

                    if (getCachedData(data) == data) {
                        onLoad();
                    } else {
                        setCachedData(data, 1);

                        loadFont(data, (family, shouldUseNativeLoader, timeout) => {
                            var tmd = (shouldUseNativeLoader && timeout == 0) ? 100 : 1;
                            _setTimeout(a => {
                                setCachedData(family, family);
                                updateAllTextsThenFontLoaded(family);

                                if (_bowser.ios) {
                                    looperPost(a => {
                                        _setTimeout(a => {
                                            looperPost(a => {
                                                updateAllTextsThenFontLoaded(family);
                                                if (waitsForRealLoad) {
                                                    onLoad();
                                                }
                                            });
                                        }, 0.1 / tmd);
                                    });
                                } else if (waitsForRealLoad) {
                                    onLoad();
                                }

                            }, (_bowser.ios ? 1 : 0.1) / tmd);

                            if (!waitsForRealLoad) {
                                onLoad();
                            }

                        });

                    }

                    break;

            }
        return t;
    }
});

var LoadTask__loaders = {};

var LoadTask = makeClass(function (onLoad, onError, consist, onProgress) {
    var t = this;
    mergeObj(t, {
        __completed: [],
        __onLoadCompleted: onLoad,
        __id: __loadTasksId++,
        __onError: onError,
        __consist: consist,
        __onProgress: onProgress
    });

}, {

    constructor: LoadTask,

    //debug
    __stringify() {
        return '<LoadTask' + this.__id + '>';
    },
    //undebug

    __addOnCompleted(f, toBegin) {
        if (toBegin) {
            this.__completed.splice(0, 0, f);
        } else {
            this.__completed.push(f);
        }
    },

    __loadTaskOne(type, data, onLoad, onError) {
        if (data || isFunction(type)) {
            onError = onError || this.__onSubTaskError();
            this.__subTasks.push(new LoadTaskOne(type, data, this, onLoad, onError));
        }
    },

    __onSubTaskError() {
        var t = this;
        return function (e) {
            var subtask = this;
            if (t.__errors) {
                t.__errors.push(e);
            }
            else {
                t.__errors = [e];
            }

            removeFromArray(subtask, t.__subTasks);
            t.__onLoadProgress();
        }
    },

    __abort() {
        $each(this.__subTasks.slice(), function (st) {
            if (st && st.__abort) {
                st.__abort();
            }
        });
    },

    __loadSome(l, namefunc, type, cb, ext, ignoreIfFromCache) {
        var t = this;
        if (!type)
            type = t.__currentProcessedType;

        if (isString(namefunc)) {
            var s = namefunc;
            namefunc = function (k) {
                return s + k
            };
        }

        namefunc = namefunc || function (k) { return k };

        for (var k = 1; k < l.length; k++) {
            var dd = l[k], is_obj = isObject(dd), path = is_obj && isString(dd.path) ? dd.path : dd;

            if (isString(path)) {
                path = path.indexOf('/') == 0 ? path.substring(1) : namefunc(path);
                if (ext) {
                    path = path + '.' + ext;
                }
                var alias = is_obj && isString(dd.alias) ? dd.alias : path;

                var j = getCachedData(alias);
                if (j) {
                    if (ignoreIfFromCache) {
                        if (j === 1) {
                            return
                        } else {
                            setCachedData(alias, 1);
                        }
                    }
                    if (cb) {
                        cb(j, alias);
                    }
                } else {
                    if (is_obj) {
                        dd.path = path;
                    } else {
                        dd = path;
                    }
                    t.__loadTaskOne(type || TASKS_CONFIG, dd, cb);
                }
            } else {
                t.__loadTaskOne(type || TASKS_CONFIG, dd, cb);
            }
        }
    },

    __run(list) {

        var t = this;
        t.__subTasks = [];

        function prepareForLoad(l) {

            var type = l[0];

            t.__currentProcessedType = type;

            switch (type) {

                case TASKS_DRAGON_BONES:

                    var resourceName = l[1], isHd = l[2] || options.__dbHD, oldFormat = l[3];
                    var path;

                    if (resourceName.indexOf('/') >= 0) { // fullpath
                        path = resourceName + '/';
                        resourceName = basename(resourceName);
                    } else {
                        path = options.__baseDragonBonesFolder + resourceName + '/';
                    }

                    var atlasImgName = oldFormat ? path + (isHd ? 'hd/' : '') + 'texture.png' : path + (isHd ? 'hd/' : '') + resourceName + '_tex.png';


                    var jsonDataName = oldFormat ? path + 'skeleton.json' : path + resourceName + '_ske.json';

                    var dbResourceDataAtlasId;

                    if (!globalConfigsData.__frames[atlasImgName]) {

                        dbResourceId++;
                        dbResourceDataAtlasId = 'D' + dbResourceId + '_';

                        var atlas = {
                            __atlasImageFile: atlasImgName,
                            __atlasDataFile: oldFormat ? path + 'texture.json' : path + resourceName + '_tex.json',
                            __atlasFramePrefix: dbResourceDataAtlasId,
                            __hd: isHd
                        };

                        t.__loadTaskOne(TASKS_IMAGE, { n: atlasImgName, c: atlas.__tryToUseLSCache, u: atlasImgName });
                        t.__loadTaskOne(TASKS_CONFIG, atlas.__atlasDataFile);

                        if (atlas.__atlasAlphaImageFile) {
                            t.__loadTaskOne(TASKS_IMAGE, { n: atlas.__atlasAlphaImageFile, c: atlas.__tryToUseLSCache, u: atlas.__atlasAlphaImageFile });
                        }

                        t.__addOnCompleted(function () {
                            if (globalConfigsData.__frames[atlasImgName]) {
                                globalConfigsData.__frames[atlasImgName].__atlasFramePrefix = dbResourceDataAtlasId;
                                globalConfigsData.__frames[atlasImgName].__atlas = atlas;
                            }
                            computeAtlasTexture(atlas);
                        }, 1);


                    } else {
                        dbResourceDataAtlasId = globalConfigsData.__frames[atlasImgName].__atlasFramePrefix;
                    }

                    t.__loadTaskOne(TASKS_CONFIG, jsonDataName);

                    t.__addOnCompleted(function () {
                        dragonbonesFactory.__dbDataLoaded(resourceName, jsonDataName, dbResourceDataAtlasId, oldFormat, isHd)
                    }, 1);

                    break;

                case TASKS_LIVE2D:

                    var resourceName = l[1],
                        loadResourceName,
                        path;

                    if (isObject(resourceName)) {
                        path = resourceName.path;
                        loadResourceName = resourceName.name;
                        resourceName = basename(resourceName.path);
                    }
                    else if (resourceName.endsWith('?')) { // full full path
                        path = resourceName.substring(0, resourceName.length - 1);
                        loadResourceName = basename(path);
                        resourceName = loadResourceName;
                        path += '/';
                    } else if (resourceName.indexOf('/') >= 0) { // fullpath
                        path = resourceName + '/';
                        loadResourceName = basename(resourceName);
                        resourceName = loadResourceName;
                    } else {
                        path = options.__baseLive2dFolder + resourceName + '/';
                        loadResourceName = resourceName;
                        resourceName = loadResourceName;
                    }

                    var mppath = path + loadResourceName + '.model3.json';

                    t.__loadTaskOne(TASKS_CONFIG, mppath);
                    t.__addOnCompleted(() => {
                        cubismFactory.__onDataLoaded(resourceName, mppath, path);
                    });
                    break;

                case TASKS_3D:
                    var resourceName = l[1].__path
                        , ext = fileext(resourceName);

                    LoadTask__loaders[ext](t, l);
                    break;


                case TASKS_SPINE:


                    var resourceName = l[1]
                        , loadResourceName
                        , isBinary = l[2]
                        , isHd = options.__spineHD || l[3]
                        , path, atlasDataFile, atlasImgName, skelDataName;

                    if (isObject(resourceName)) {
                        path = resourceName.path + '/skeleton/';
                        loadResourceName = resourceName.skeleton || 'skeleton';
                        resourceName = basename(resourceName.path);
                    }
                    else if (resourceName.endsWith('?')) { // full full path
                        path = resourceName.substring(0, resourceName.length - 1);
                        loadResourceName = basename(path);
                        resourceName = loadResourceName;
                        path += '/';
                    } else if (resourceName.indexOf('/') >= 0) { // fullpath
                        path = resourceName + '/';
                        loadResourceName = basename(resourceName);
                        resourceName = loadResourceName;
                    } else {
                        path = options.__baseSpineFolder + resourceName + '/';
                        loadResourceName = resourceName;
                        resourceName = loadResourceName;
                    }

                    atlasImgName = path + (isHd ? "hd/" : "") + loadResourceName + '.png';
                    skelDataName = path + loadResourceName + (isBinary ? '.skel' : '.json');
                    atlasDataFile = path + loadResourceName + '.atlas';

                    var spResourceDataAtlasId;
                    var atlas;

                    if (!globalConfigsData.__frames[atlasImgName]) {

                        spResourceId++;
                        spResourceDataAtlasId = 'S' + spResourceId + '_';

                        atlas = {
                            __flipY: false,
                            __atlasImageFile: atlasImgName,
                            __atlasDataFile: atlasDataFile,
                            __atlasFramePrefix: spResourceDataAtlasId,
                            __atlasDataConverter: spineFactory.__atlasDataConverter
                        };

                        t.__loadTaskOne(TASKS_IMAGE, { n: atlasImgName, c: atlas.__tryToUseLSCache, u: atlasImgName });
                        t.__loadTaskOne(TASKS_RAWDATA, atlas.__atlasDataFile);

                        if (atlas.__atlasAlphaImageFile) {
                            t.__loadTaskOne(TASKS_IMAGE, { n: atlas.__atlasAlphaImageFile, c: atlas.__tryToUseLSCache, u: atlas.__atlasAlphaImageFile });
                        }

                        t.__addOnCompleted(a => {
                            if (globalConfigsData.__frames[atlasImgName]) {
                                globalConfigsData.__frames[atlasImgName].__atlasFramePrefix = spResourceDataAtlasId;
                                globalConfigsData.__frames[atlasImgName].__atlas = atlas;
                            }
                            computeAtlasTexture(atlas);
                        }, 1);


                    } else {
                        spResourceDataAtlasId = globalConfigsData.__frames[atlasImgName].__atlasFramePrefix;
                        atlas = globalConfigsData.__frames[atlasImgName].__atlas;
                    }

                    t.__loadTaskOne(isBinary ? TASKS_RAWBUFFER : TASKS_CONFIG, skelDataName);

                    t.__addOnCompleted(a => {
                        spineFactory.__onDataLoaded(resourceName, skelDataName, atlas, isBinary)
                    });


                    break;

                case TASKS_ATLAS:

                    var atlas = {
                        __atlasImageFile: l[1],
                        __atlasDataFile: l[2],
                        __atlasAlphaImageFile: l[3],
                        __atlasFramePrefix: l[4],
                        __tryToUseLSCache: l[5]
                    };

                    if (!globalConfigsData.__frames[atlas.__atlasImageFile]) {

                        t.__loadTaskOne(TASKS_IMAGE, { n: atlas.__atlasImageFile, c: atlas.__tryToUseLSCache, u: atlas.__atlasImageFile });
                        t.__loadTaskOne(TASKS_CONFIG, atlas.__atlasDataFile);
                        if (atlas.__atlasAlphaImageFile)
                            t.__loadTaskOne(TASKS_IMAGE, { n: atlas.__atlasAlphaImageFile, c: atlas.__tryToUseLSCache, u: atlas.__atlasAlphaImageFile });

                        t.__addOnCompleted(function () {
                            computeAtlasTexture(atlas);
                        }, 1);
                    }

                    break;

                case TASKS_CONFIG: t.__loadSome(l, options.__baseConfigsFolder); break;

                case TASKS_CLASS: t.__loadSome(l, options.__baseLayoutsFolder, 0, registerClasses); break;

                case TASKS_LAYOUT: t.__loadSome(l, options.__baseLayoutsFolder, 0, registerLayouts); break;

                case TASKS_EFFECT: t.__loadSome(l, options.__baseParticlesFolder); break;

                case TASKS_SHADERS: t.__loadSome(l, options.__baseShadersFolder, TASKS_RAWDATA); break;

                case TASKS_CSS: t.__loadSome(l, options.__baseCssFolder, TASKS_RAWDATA, function (data) {
                    html.__addCSSStyle(data);
                }, 'css', 1);

                    break;

                case TASKS_HTML: t.__loadSome(l, options.__baseHtmlFolder, TASKS_RAWDATA, 0, 'html'); break;

                case TASKS_LOCALIZATION:

                    if (!l[1]) {
                        l[1] = getUserLanguage();
                    }

                    var lang = l[1];

                    if (options.__supportedLangs.indexOf(lang) < 0) {
                        lang = options.__defaultLang || 'en';
                    }

                    var lname = options.__localesDir + lang + '.json';
                    var cb = function () {

                        var dict = getCachedData(lname);
                        setCachedData(lname, prepareLocalizationDict(dict));
                        setLocalization(lang);

                    };

                    t.__loadSome(l, function () { return lname }, 0, cb);

                    break;

                case TASKS_SOUND:
                    if (__window.Howl) {
                        if (globalConfigsData['^' + l[1]]) {
                            return;
                        }
                        globalConfigsData['^' + l[1]] = 1;

                        var opts = {
                            __name: options.__baseSoundsFolder + l[1],
                            __onLoad: l[2],
                            __dir: dirname( /* options.__projectServerPath + */ options.__baseSoundsFolder + l[1])
                        };

                        getJson(opts.__name, function (json) {

                            var t = this;

                            activateProjectOptions();
                            json.src = $map(json.src, function (a) {
                                var url = modUrl(t.__dir + a);
                                return getCachedData(url) || url;
                            });
                            deactivateProjectOptions();

                            json.onload = t.__onLoad;
                            json.onend = __onSoundEnd;

                            $each(json.arr, s => json.sprite[s[0]] = s.slice(1));

                            var howl = new __window.Howl(json);
                            for (var i in json.sprite) {
                                sounds[i] = { howl: howl, __name: i };
                            }

                        }.bind(opts));
                    }
                    break;

                case TASKS_FONT:
                    // converting old format
                    if (l.length == 2 && isArray(l[1])) {
                        l = [type].concat(l[1]);
                    }

                default:
                    t.__loadSome(l);
                    break;

            }

        }

        $each(list, prepareForLoad);

        if (t.__subTasks.length) {

            t.__disableProgress = 1;

            if (t.__consist) {

                $each(t.__subTasks, function (subtask) {
                    subtask.__originalOnLoad = subtask.__onLoad;
                    subtask.__onLoad = function (data) {
                        subtask.__originalOnLoad(data);
                        t.__nextSubTask(data);
                    };
                });

                t.__currentSubTask = 1;
                t.__subTasks[0].__run();

            }
            else {
                $each(t.__subTasks, function (subtask) {
                    subtask.__run();
                });
            }


            delete t.__disableProgress;

            t.__onLoadProgress();

        } else {

            looperPost(function () { t.__onLoadProgress(1); });
            return 0;

        }
        return t;
    },

    __nextSubTask(dataFromPreviousTask) {
        var t = this, nextTask = t.__subTasks[t.__currentSubTask++];
        if (nextTask) {
            nextTask.__run(dataFromPreviousTask);
        } else {
            looperPost(function () { t.__onLoadProgress(1); });
        }

    },

    __progress(a) {
        var t = this;
        if (t.__subTasks) {

            if (!t.__subTasks.length) {
                t.____progress = 1;
            } else {
                t.____progress = $count(t.__subTasks, function (subtask) {
                    return subtask.__progress();
                }) / t.__subTasks.length;
            }

        }

        return t.____progress;
    },

    __onLoadProgress(a) {

        var t = this;

        if (t.__disableProgress) return;

        var progress = a || t.__progress();
        if (progress != t.__lastProgress) {
            t.__lastProgress = progress;

            if (t.__onProgress)
                t.__onProgress(progress);

            if (progress == 1) {

                if (t.__errors && t.__onError) {

                    t.__onError(t.__errors);

                }
                else {
                    t.__completed.push(t.__onLoadCompleted);
                    looperPostQueue(t.__completed, 2);
                }

                t.__subTasks = [];
                t.__completed = [];

            }


        }
    }
});


function TASKS_RUN(list, onLoad, onError, consist, onProgress) {
    if (list && list.length) {
        return (new LoadTask(onLoad, onError, consist, onProgress)).__run(list);
    } else {
        onLoad();
    }
};


var ParallelTasks = makeClass(function ParallelTasks(params) {
    var t = this;
    mergeObj(t,
        mergeObj({
            __data: {},
            a: [],
            __count: 0,
            __needCount: 0,
            __incFunction: t.__inc.bind(t)
        }, params));
}, {

    __push(task) {
        this.__needCount++;
        if (isFunction(task)) {
            this.a.push(task);
        }
        return this;
    },

    __then(callback) {
        this.__callback = callback;
        return this;
    },

    __run() {
        var t = this;
        looperPost(function () {
            $fcall(t.a);
        });
        return this;
    },

    __pushArray(a) {
        this.__needCount += a.length;
        return this;
    },

    __storyOneCallbackData(dataid) {
        var t = this;
        return function (data) {
            t.__data[dataid] = data;
            t.__inc()
        }
    },

    __storyAllCallbackData(dataid) {
        var t = this;
        return function () {
            t.__data[dataid] = arguments;
            t.__inc()
        }
    },

    __inc() {
        var t = this;
        looperPost(function () {
            t.__count++;
            if (t.__count >= t.__needCount) {
                if (t.__callback) t.__callback(t.__data);
                delete t.__callback;
            }
        });
        return t;
    }

});


