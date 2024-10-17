var PlayerState = null;

var __defaultTextProperties = {
    __color: 0xffffff,
    __fontsize: 24,
    __lineWidth: 0,
    __lineColor: 0,
    __lineSpacing: 0,
    __addedLineSpacing: 0,
    __addedLineSpacingMultiplier: 1,
    __fontspacing: 0,
    __charw: 0,
    __text: '',
    __autoscale: false,
    __shader: null,
    __align: ALIGN_CENTER,
    __autowrap: false,
    __autoRecalcOnResize: false,
    __dontLocalize: 0,
    __fontface: '',
    __safeFontFace: 'Arial, Helvetica, sans-serif',
    __lineAlpha: 1,
    __italic: false,
    __smallCaps: false,
    __fontWeight: 0,
    __gradient: 0
};

function invertedDefTextColor() {
    var c = new Color(__defaultTextProperties.__color);
    c.r = 1 - c.r; c.g = 1 - c.g; c.b = 1 - c.b;
    return c;
}

var options = {

    __default: {
        __timeMultiplier: 1,

        __minimalTapArea: 35,
        __baseFontsFolder: '',
        __baseSoundsFolder: '',
        __baseImgFolder: 'img/',
        __baseConfigsFolder: 'conf/',
        __baseLayoutsFolder: 'layouts/',
        __baseShadersFolder: 'shaders/',
        __baseParticlesFolder: 'particles/',
        __baseDragonBonesFolder: 'db/',
        __baseSpineFolder: 'spine/',
        __baseLive2dFolder: 'live2d/',
        __baseCssFolder: 'css/',
        __baseHtmlFolder: 'html/',
        __goodResolution: { x: 640, y: 960 },
        __disableCache: 0,
        __disableCacheByVer: 1,
        //debug
        __soundDisabled: 1,
        //undebug
        __scaleFactor: 0,
        __prepareJsons: 0,
        __fpsLimit: 100,
        __projectServerPath: '',
        __allServerPath: '',
        __particlesCurveValuesCacheSize: 100,
        __preventDefaultEvents: 1,
        __localesDir: 'lang/',
        __atlasFramesPrefix: '',
        __autoRemoveKeyFrameAnimation: 1,
        __doubleTapTimeout: 0.3,

        __defaultTextProperties: __defaultTextProperties,

        __storeChildsAsObject: 0,
        __disablePacking: 0,

        __loadingPolicies: {
            __retryIfErrorTimeout: 0,
            __retryIfErrorTimeoutMultiplier: 2,
            __retryIfErrorTries: 0,
            __callErrorEveryTime: 0
        },

        __supportedLangs: ['en']

    },

    __reset: function () {
        mergeObjectDeep(this, this.__default);
    }


};

var defaultUVSBuffer;
var defaultIndecesBuffer1;
var defaultIndecesBuffer2;

options.__reset();


var scaleFactor = 1;

var layoutsResolutionMult = 1
    , predefinedLayoutsResolutionMult
    , TIME_NOW = Date.now() / ONE_SECOND;

function getTime() { return TIME_NOW; }

var renderer,
    camera,
    scene,
    scenes = [],
    globalTimeSpeedMultiplier = 1;



function UpdatableProto() { this.a = []; }

var UpdatableProtoProto = UpdatableProto.prototype = {
    constructor: UpdatableProto,
    __push: function (o) { this.__pop(o); this.a.push(o); return o; },
    __pop: function (o) { removeFromArray(o, this.a); return o; },
    __update: function (arg1, arg2, arg3) {
        // TODO: use filter
        // now has Bug #92295

        // var ar = arguments;
        // this.a = this.a.filter( function(a){ return !a.__update.apply(a, ar); });
        // return this.a.length == 0;

        for (var i = 0; i < this.a.length;) {
            if (this.a[i].__update(arg1, arg2, arg3)) {
                this.a.splice(i, 1);
            }
            else {
                i++;
            }
        }
        return this.a.length == 0;
    }
}

// back compatibility
UpdatableProtoProto.init = UpdatableProtoProto.__init;
UpdatableProtoProto.push = UpdatableProtoProto.__push;
UpdatableProtoProto.pop = UpdatableProtoProto.__pop;

var updatable = new UpdatableProto()
    , __timeoutsArray__ = {}
    , __timeoutsIndex__ = 0
    , __inLooperUpdate__ = 0
    , __looperQueue__ = []
    , __looperNextQueue__ = []
    , __looperPerFramesQueueObject__ = {};

function looperUpdate() {
    __inLooperUpdate__ = 1;
    __looperNextQueue__ = [];
    for (var i = 0; i < __looperQueue__.length; i++) {
        __looperQueue__[i]();
    }
    __inLooperUpdate__ = 0;
    __looperQueue__ = __looperNextQueue__;
    for (var i in __looperPerFramesQueueObject__) {
        if (i <= __currentFrame) {
            __looperPerFramesQueueObject__[i]();
            delete __looperPerFramesQueueObject__[i];
            return;
        }
    }
}

function looperPost(cb, intoCurrentQueue) {
    if (cb) {
        if (__currentFrame == 0) {
            cb();
        } else {
            (__inLooperUpdate__ && !intoCurrentQueue ? __looperNextQueue__ : __looperQueue__).push(cb)
        }
    }
}

function looperPostQueue(q, perframes) {
    if (__currentFrame == 0) {
        $fcall(q);
    } else
        if (isArray(q) && q.length) {

            perframes = perframes || 1;
            var cf = __currentFrame + (__inLooperUpdate__ ? 1 : 0);

            for (var i = 0; i < q.length; i++) {
                if (q[i]) {
                    while (__looperPerFramesQueueObject__[cf]) {
                        cf += perframes;
                    }
                    __looperPerFramesQueueObject__[cf] = q[i];
                }
            }
        }
}

function _fireTimeoutInstantly(i) {
    if (__timeoutsArray__[i]) {
        __timeoutsArray__[i].f();
        delete __timeoutsArray__[i];
    }
}

function _setTimeout(f, time) {
    __timeoutsIndex__++;
    __timeoutsArray__[__timeoutsIndex__] = {
        i: __timeoutsIndex__,
        f: f,
        __update: function (t) {
            if (!this.s) this.s = t + time;
            if (this.s <= t) { f(); delete __timeoutsArray__[this.i] }
        }
    };
    return __timeoutsIndex__;
};

function _setInterval(f, time) {
    __timeoutsIndex__++;
    __timeoutsArray__[__timeoutsIndex__] = {
        f: f,
        __update: function (t) {
            if (!this.s) this.s = t + time;
            if (this.s <= t) { f(); this.s = t + time; }
        }
    };
    return __timeoutsIndex__;
};

var _clearTimeout = function (i) { delete __timeoutsArray__[i] };
var _clearInterval = _clearTimeout;

var
    __realScreenSize = new Vector2(),
    __screenSize = new Vector2(),
    __screenCenter = new Vector2(),
    __realScreenCenter = new Vector2();

var _projScreenMatrix = new Matrix4();

function updateCamera(w, h, cam, x, y) {
    var cp = 0.5;
    x = x || 0; y = y || 0;
    if (w && h) {
        cam.__init({
            __left: - w * cp + x,
            __right: w * cp + x,
            __top: h * cp + y,
            __bottom: - h * cp + y
        });
    }

    cam.__updateProjectionMatrix();
}

var _cszw, _cszh;


function onWindowResize(force) {

    var de = __document.documentElement || 0,
        w = ((__window.innerWidth && de.clientWidth) ? mmin(__window.innerWidth, de.clientWidth) : (__window.innerWidth || de.clientWidth)) || screen.width,
        h = ((__window.innerHeight && de.clientHeight) ? mmin(__window.innerHeight, de.clientHeight) : (__window.innerHeight || de.clientHeight)) || screen.height;

    if (!force && (w == _cszw && h == _cszh))
        return;

    _cszw = w;
    _cszh = h;

    if (predefinedLayoutsResolutionMult) {
        layoutsResolutionMult = predefinedLayoutsResolutionMult;
    } else if (options.__upscaleResolution) {
        layoutsResolutionMult = mmin(w / options.__upscaleResolution.x, h / options.__upscaleResolution.y);
    } else if (options.__goodResolution) {
        layoutsResolutionMult = mmin(mmin(1.0, w / options.__goodResolution.x), mmin(1.0, h / options.__goodResolution.y));
    }

    var scaleFactorMult = 1;
    if (options.__isDeviceQualityLow) {
        scaleFactorMult = 0.5;
    }

    scaleFactor = options.__scaleFactor ? scaleFactorMult * options.__scaleFactor : clamp(scaleFactorMult * (__window.devicePixelRatio || 1), 1, 2);

    //cheats
    if (_bowser.android || _bowser.mobile || _bowser.ios) {
        consoleLog("resize", w, h, scaleFactor.toFixed(5));
    }
    //endcheats

    renderer.__setPixelRatio(scaleFactor);

    renderer.__setSize(w, h, 1);

    __realScreenSize.set(w, h);
    __realScreenCenter.set(w / 2, h / 2);

    w /= layoutsResolutionMult;
    h /= layoutsResolutionMult;

    updateCamera(w, h, camera, camera.__x, camera.__y);

    __screenSize.set(w, h);

    __screenCenter.set(w / 2, h / 2);

    $each(scenes, function (s) {
        s.update(1);
    });

    BUS.__post(__ON_RESIZE);

}

var __gameTime = 0.001, __lastOnFrameTime = __gameTime, __realLastOnFrameTime = 0, __currentFrameDeltaTime = 0, __currentFrame = 0;

//cheats

var cheatsAdjustedTimeAdd = 0, cheatsLastTimeNow = 0;

function cheatsAdjustSystemTime() {

    if (typeof PLAYER == undefinedType) return;

    cheatsAdjustSystemTime = function () {

        if (PlayerState) {

            cheatsAdjustedTimeAdd = PlayerState.cheatsAdjustedTimeAdd || 0;

            cheatsAdjustSystemTime = function () {

                TIME_NOW += cheatsAdjustedTimeAdd;

                if (!cheatsLastTimeNow) cheatsLastTimeNow = TIME_NOW;

                var realDt = TIME_NOW - cheatsLastTimeNow;

                TIME_NOW = cheatsLastTimeNow + realDt * options.__timeMultiplier;

            }

            cheatsAdjustSystemTime();

        }

    }

};

//endcheats

var averageFPS = mmin(options.__fpsLimit || 100, 30), currentFPS = averageFPS;
var __lastUpdatedTime__ = 0, server_delta_time = 0;

function updateTimeNow() {

    var timeNow = Date.now();
    if (__lastUpdatedTime__ != timeNow) {
        __lastUpdatedTime__ = timeNow;

        TIME_NOW = timeNow / ONE_SECOND + server_delta_time;
        //cheats
        cheatsAdjustSystemTime();
        //endcheats
    }

}


var PerformanceProfiler = (function () {

    var __lastCurrentFrame = 0, __active = 0, t = {
        __on: function (t, visible) {
            if (!visible) __active = 0;
        },
        __interval: setInterval(function () {

            if (__active > 2 && (__currentFrame > __lastCurrentFrame + 1)) {
                currentFPS = __currentFrame - __lastCurrentFrame;
                // первые 1000 кадров идет более быстрая подстройка, т.к. данных до этого у нас нет
                // потом averageFPS показывает среднее фпс за 50 сек
                averageFPS = lerp(averageFPS, currentFPS, __currentFrame < 1000 ? 1 / lerp(1, 50, pow(__currentFrame / 1000, 3)) : 0.1);
            }

            if (__currentFrame > __lastCurrentFrame + 1) {
                __active = mmin(3, __active + 1);
            } else {
                __active = 0;
            }
            __lastCurrentFrame = __currentFrame;

        }, 1000)

    };

    BUS.__addEventListener(__ON_VISIBILITY_CHANGED, t);

    return makeSingleton(
        t
    );

})();


function updateFramesRoutine(t) {

    updateTimeNow();

    if (!__realLastOnFrameTime) {
        __realLastOnFrameTime = t;
    }

    __currentFrameDeltaTime = clamp(t - __realLastOnFrameTime, 0, 200);
    //cheats
    __currentFrameDeltaTime = (t - __realLastOnFrameTime) * options.__timeMultiplier;
    //endcheats

    if (__currentFrameDeltaTime > 1000 / options.__fpsLimit) {

        __gameTime += __currentFrameDeltaTime;

        //debug
        if (!options.__disableAnimation) {
            __forceAnimTime = __gameTime;
            __forceAnimDt = __currentFrameDeltaTime;
        }
        //undebug
        updatable.__update(__gameTime, __currentFrameDeltaTime);
        looperUpdate();

        for (var i in __timeoutsArray__) {
            __timeoutsArray__[i].__update(__gameTime / ONE_SECOND);
        }

        __realLastOnFrameTime = t;
        __lastOnFrameTime = __gameTime;
        __currentFrame++;
        return 1;
    }
}

var setDefaultRenderLoop = function () {
    renderer.__renderLoop = function () {
        var c;
        $each(scenes, function (s) {
            if (s.__childs.length) {
                renderer.__setRenderTarget(0);
                if (!c) {
                    renderer.__clear();
                    c = 1;
                }
                for (var i = 0; i < s.__childs.length; i++) {
                    renderer.__render(s.__childs[i], camera);
                }
            }
        });
        if (c) {
            renderer.__finishRender();
        }
    }
};


function createGame(parameters) {

    //debug
    if (renderer && scene) {
        consoleError('second call to createGame. Game already created!');
        if (parameters.__renderLoop)
            renderer.__renderLoop = parameters.__renderLoop;
        parameters.onCreate(scene);
        return;
    }
    //undebug

    renderer = new WebGLRenderer(); //WebGLRenderer(1); to enable GlDebug

    camera = new CameraOrtho();

    var __domElement = renderer.__domElement;

    parameters.element.appendChild(__domElement);

    var originalToDataUrl = __domElement.toDataURL;
    __domElement.toDataURL = function (a, b) {
        renderer.__renderLoop();
        return originalToDataUrl.call(__domElement, a, b);
    };

    scene = new Node({
        __hitTest: function () { }, __size: { x: 1, y: 1, px: 1, py: 1 }, ha: 1, va: 1, __isScene: 1
    });

    scenes.push(scene);

    defaultIndecesBuffer1 = new MyBufferAttribute('', Uint16Array, 1, GL_ELEMENT_ARRAY_BUFFER, [0, 2, 1, 2, 3, 1], 1);
    defaultIndecesBuffer2 = new MyBufferAttribute('', Uint16Array, 1, GL_ELEMENT_ARRAY_BUFFER, [0, 4, 1, 4, 5, 1, 1, 5, 2, 5, 6, 2, 2, 6, 3, 6, 7, 3, 4, 8, 5, 8, 9, 5, 5, 9, 6, 9, 10, 6, 6, 10, 7, 10, 11, 7, 8, 12, 9, 12, 13, 9, 9, 13, 10, 13, 14, 10, 10, 14, 11, 14, 15, 11], 1);

    defaultUVSBuffer = new MyBufferAttribute('uv', Float32Array, 2, GL_ARRAY_BUFFER, [0, 1, 1, 1, 0, 0, 1, 0], 1);
    // start rendering

    if (parameters.__renderLoop) {
        renderer.__renderLoop = parameters.__renderLoop;
    }
    else {
        setDefaultRenderLoop();
    }

    var __onFrame =
        wrapFunctionInTryCatch(
            parameters.__onFrame || function (t) {
                if (updateFramesRoutine(t)) {
                    //cheats
                    renderInfo.frames++;
                    //endcheats
                    if (gl) {
                        renderer.__renderLoop();
                    }
                }
                requestAnimFrame(__onFrame);
            }, 1, 1);


    addEventListeners(__domElement);

    onWindowResize();

    __onFrame(0);

    //bad?
    _setInterval(onWindowResize, PI / 10);

    addEventListenersToElement(__window, set({},
        'resize', onWindowResize,
        'deviceorientation', function (event) {
            // TODO: fix fluctuations 
            var tmp = __deviceOrientation.__clone();
            __deviceOrientation.set(event.alpha || 0, event.beta || 0, event.gamma || 0);
            __deviceOrientationSpeed.__multiplyScalar(0.8).add(tmp.sub(__deviceOrientation).__multiplyScalar(0.08));
        }
    ));

    parameters.onCreate(scene);

}



var globalConfigsData = {

    __frames: {},

    'shaders/__computeAtlas.f': "uniform sampler2D map; uniform sampler2D b; varying vec2 vUv; vec4 t; vec4 A;void main(void){vec4 B = texture2D(b, vUv);A = texture2D(map, vUv); gl_FragColor=vec4(A.rgb* B.r,B.r) ; }",

    __shaders: {},
    __images: {},
    __classes: {}

};

var globalLayoutsExtracts = {};


function getVertexShaderData(v) { return globalConfigsData[options.__baseShadersFolder + v + '.v']; }
function getFragmentShaderData(v) { return globalConfigsData[options.__baseShadersFolder + v + '.f']; }

function getUIClass(v) {
    var c = globalConfigsData.__classes[v];
    return deepclone(c);
}


function registerClasses(j) {
    if (!j) return;
    if (j.packed) registerClasses(repackJson(j.packed));
    else if (j.pkd) registerClasses(unpackJson(j.pkd));
    else if (isArray(j)) for (var i in j) registerClasses(j[i]);
    else if (isObject(j)) {
        if (j.name) {
            if (j.name == 'classes') {
                for (var i in j.__childs) registerClasses(j.__childs[i]);
            } else {
                if (j.__childs && j.__childs.length) {
                    globalConfigsData.__classes[j.name] = j.__childs[0];
                } else {
                    globalConfigsData.__classes[j.name] = j;
                }
            }
        }
        else {
            mergeObj(globalConfigsData.__classes, j);
        }
    }
}

function __pushExtract(j, rname) {
    if (!globalLayoutsExtracts[rname]) {
        globalLayoutsExtracts[rname] = {};
    }
    globalLayoutsExtracts[rname][j.name] = j;
}

function __extractL(j, rname) {
    if (isArray(j)) {

        for (var i = 0; i < j.length;) {
            if (__extractL(j[i], rname)) {
                j.splice(i, 1);
            } else {
                i++;
            }
        }
    }
    else if (j) {

        __extractL(j.__childs, rname);

        if (j.__extract && j.name) {
            __pushExtract(j, rname);
            return 1;
        }
    }

}


function registerLayout(name, j) {
    if (j && name) {
        __extractL(j, name.replace(options.__baseLayoutsFolder, '').replace('.json', ''));
    }
}


function registerSpriteSheetAnimation(animname, opts) {
    if (!globalConfigsData.__spriteSheetAnimations)
        globalConfigsData.__spriteSheetAnimations = {};
    globalConfigsData.__spriteSheetAnimations[animname] = opts;
}

function registerSpriteSheetAnimations(anims) {
    if (!globalConfigsData.__spriteSheetAnimations)
        globalConfigsData.__spriteSheetAnimations = {};

    mergeObj(globalConfigsData.__spriteSheetAnimations, anims);
}


function addParameterToPath(path, p, val) {
    var q = path.indexOf('?');
    if (q == path.length - 1) q = '';
    else q = q >= 0 ? '&' : '?';
    path += q + p + (val == undefined ? '' : '=' + val);
    return path;
}


function basename(path) { return path.replace(/.*\//, "") || ''; }
function dirname(path) { return (path.match(/.*\//) || [''])[0]; }
function fileext(path) { var i = path.lastIndexOf('.') + 1; return i ? path.substring(i) : ''; }

function modUrl(path, defdir) {

    if (!isString(path)) {
        //debug
        throw "wtf?"
        //undebug
        return "";
    }

    if (path.indexOf('/') == 0) {
        path = path.substring(1);
    }

    defdir = defdir || '';

    var hasFullUrl = path.indexOf('http') == 0
        , hasQuestion = path.indexOf('?') > 0;

    if (hasFullUrl) {
        return path;
    }
    if (path.indexOf('blob:') == 0) {
        return path;
    }

    if (!hasQuestion) {
        path = options.__projectServerPath + defdir + path;
    }

    return options.__allServerPath + modUrlCache(path);
}

function modUrlCache(path) {

    if (options.__disableCache) {
        path = addParameterToPath(path, 't', (new Date()).getTime());
    }

    if (options.__disableCacheByVer) {
        path = addParameterToPath(path, 'v', getAppVersion().toString().replace(/\./g, '_'));
    }

    return path;
}

function loadData(path, onLoad, onError, onProgress, params, beforesend, urlGotModUrl) {

    var errorCalled;
    path = urlGotModUrl ? path : modUrl(path);

    function callError(e) {
        if (!errorCalled) {
            errorCalled = 1;
            if (onError) onError(e, path);
        }
    }

    var xhr = createXHRRequest(path, 0, mergeObj({

        onprogress: onProgress,
        onerror: callError,
        onabort: callError,
        onloadend: function () {
            if (!xhr) callError(); else if (xhr.status > 299) callError(xhr.status);
            clearXMLHttpRequest(xhr);
        },
        onload: function () {
            if (!xhr) callError(); else if (xhr.status > 299) callError(xhr.status);
            else {
                var res;
                switch (xhr.responseType) {
                    case "arraybuffer": res = new Uint8Array(xhr.response); break;
                    case "blob": res = xhr.response; break;
                    default: res = xhr.responseText; break;
                }
                onLoad(res);
            }
            clearXMLHttpRequest(xhr);
        }
    }, params), 0, beforesend);
    return xhr;
}

function _loadDataRaw(path, onload, onerror, cachename, onprogress, responseType) {
    return loadData(path, function (j) {
        if (cachename) {
            if (isString(cachename)) {
                globalConfigsData[cachename] = j;
            }
        } else {
            globalConfigsData[path] = j;
        }
        if (onload) onload(j);
    }, onerror, onprogress, {
        responseType: responseType
    });
}
function loadDataBuffer(path, onload, onerror, cachename, onprogress) {
    return _loadDataRaw(path, onload, onerror, cachename, onprogress, "arraybuffer");
}

function loadDataTxt(path, onload, onerror, cachename, onprogress) {
    return _loadDataRaw(path, onload, onerror, cachename, onprogress, "text");
}

function loadDataJson(path, onload, onerror, onprogress, usePacking) {
    var params = {};

    //debug
    var codedJson = path.indexOf('.json.code') > 0;
    if (codedJson) {
        params.responseType = "arraybuffer";
    }
    //undebug

    return loadData(path, function (j) {
        //debug
        if (codedJson && (typeof JsonDecoder != undefinedType)) {
            j = JsonDecoder.decode(j);
        }
        //undebug
        j = parseJson(j, onerror, usePacking);
        setCachedData(path, j);
        if (onload) onload(j);
    }, onerror, onprogress, params);
}

function _getRawData(filename, onload, cachename, onprogress, onerror, needBuffer) {
    cachename = cachename || filename;
    if (globalConfigsData.hasOwnProperty(cachename)) {
        onload(globalConfigsData[cachename]);
    }
    else {
        return (needBuffer ? loadDataBuffer : loadDataTxt)(filename, onload, onerror, cachename, onprogress);
    }
}


function getRawTxt(filename, onload, cachename, onprogress, onerror) {
    return _getRawData(filename, onload, cachename, onprogress, onerror);
}

function getRawBuffer(filename, onload, cachename, onprogress, onerror) {
    return _getRawData(filename, onload, cachename, onprogress, onerror, 1);
}


function extractLayoutFromLayout(sublayoutName, l1, lname) {
    var lname;


    //debug
    if (!__window.wExCh) __window.wExCh = {};
    if (!__window.wExCh[sublayoutName]) {
        consoleWarn("extractLayoutFromLayout is deprecated! ", sublayoutName + ' ' + (isString(l1) ? l1 : ''));
        __window.wExCh[sublayoutName] = 1;
    }
    //undebug

    if (isString(l1)) {
        lname = l1;
        l1 = globalConfigsData[options.__baseLayoutsFolder + l1 + '.json'];
    }

    if (l1) {
        if (isArray(l1)) {
            for (var i in l1) {
                var j = extractLayoutFromLayout(sublayoutName, l1[i], lname);
                if (j) return deepclone(j);
            }
        } else {

            if (!lname) {
                lname = l1.name;
            }

            for (var i in l1.__childs) {
                if (l1.__childs[i].name == sublayoutName) {
                    var j = l1.__childs[i];
                    delete l1.__childs[i];
                    if (lname) {
                        if (!globalLayoutsExtracts[lname])
                            globalLayoutsExtracts[lname] = {};
                        globalLayoutsExtracts[lname][sublayoutName] = j;
                    }
                    return deepclone(j);
                }
            }
            for (var i in l1.__childs) {
                var j = extractLayoutFromLayout(sublayoutName, l1.__childs[i], lname);
                if (j) return deepclone(j);
            }
        }
    }
}

function getLayoutByName(cl, withoutClone, withoutEmpty) {
    var n = options.__baseLayoutsFolder + cl + '.json', l = globalConfigsData[n];

    if (!l) {
        if (cl.indexOf('.') > 0) {
            cl = cl.split('.');
            l = (globalLayoutsExtracts[cl[0]] || 0)[cl[1]];
        }
    }
    if (!l && !withoutEmpty) { l = {}; };

    if (l && l.pkd) {
        l = globalConfigsData[n] = unpackJson(l.pkd);
    }
    if (withoutClone) { return l; }
    return deepclone(l);
}

function getEffectByName(cl) {
    return (globalConfigsData[options.__baseParticlesFolder + cl + '.effect.json'] || {});
}




function renderOverTexture(width, height, params) {
    params = params || {};
    if (width && height)
        params.__size = { x: width, y: height };

    var nod = new Node(params),
        tex = renderNodeToTexture(nod, params);

    nod.__destruct();
    return tex;
}


function renderNodeToTexture(node, params) {

    if (!node)
        return;

    params = params || 0;
    if (!params.__withoutUpdate) {
        node.update(1);
    }
    var cam = params.__camera || camera
        , sz = params.__size || node.__sizeWithChildrens
        , w = floor(sz.x)
        , h = floor(sz.y)
        , bufferTexture = params.__target || new WebGLRenderTarget(w, h, params)
        , ss = __screenSize.__clone()
        , cc = __screenCenter.__clone()
        , rss = __realScreenSize.__clone()
        , rcc = __realScreenCenter.__clone()
        , tmpscale = scaleFactor
        , tmpmult = layoutsResolutionMult;

    updateCamera(w, h, cam, cam.__x, cam.__y);

    scaleFactor = 1;

    if (!params.__fullScreen) {
        layoutsResolutionMult = 1;
    }

    __screenSize.set(w, h);
    __screenCenter.set(w / 2, h / 2);

    __realScreenSize.set(w, h);
    __realScreenCenter.set(w / 2, h / 2);

    //     renderer.__enableGLDebug();
    renderer.__setRenderTarget(bufferTexture);
    if (!params.__target || params.__clear) {
        renderer.__clear();
    }
    renderer.__render(node, cam, bufferTexture);

    layoutsResolutionMult = tmpmult;
    scaleFactor = tmpscale;

    __screenSize.__copy(ss);
    __screenCenter.__copy(cc);

    __realScreenSize.__copy(rss);
    __realScreenCenter.__copy(rcc);

    updateCamera(ss.x, ss.y, cam, cam.__x, cam.__y);

    return bufferTexture;

}

function base64ImageFromNormalTexture(texture, outputFormat) {
    return base64ImageFromImage(texture.__image, outputFormat);
}

function base64ImageFromImage(img, outputFormat  /* 'image/png', 'image/jpeg', 'image/webp' */) {
    var canvas = __document.createElement('canvas'),
        ctx = canvas.getContext('2d');
    canvas.height = img.height;
    canvas.width = img.width;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL(outputFormat || 'image/png');
}

function createCanvasFromRenderTarget(bufferTexture) {

    var canvas = __document.createElement('canvas')
        , ctx = canvas.getContext('2d')
        , w = floor(bufferTexture.width || bufferTexture.__image.width)
        , h = floor(bufferTexture.height || bufferTexture.__image.height)
        , imageData = ctx.createImageData(w, h)
        , data = imageData.data
        , pixelBuffer = renderer.__readRenderTargetPixels(bufferTexture);

    var i = 0, j = 0;
    // обрезаем крайние пиксели (с ними косяк какой-то) и переворачиваем
    for (var x = 1; x < w - 1; x++) {
        for (var y = 1; y < h - 1; y++) {
            i = (y * w + x) * 4;
            j = ((h - y - 1) * w + x) * 4;
            data[i] = pixelBuffer[j];
            data[i + 1] = pixelBuffer[j + 1];
            data[i + 2] = pixelBuffer[j + 2];
            data[i + 3] = pixelBuffer[j + 3];
        }
    }

    canvas.height = h;
    canvas.width = w;
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

function base64ImageFromTexture(bufferTexture, outputFormat /* 'image/png', 'image/jpeg', 'image/webp' */) {

    if (bufferTexture instanceof Texture)
        return base64ImageFromNormalTexture(bufferTexture, outputFormat);

    return createCanvasFromRenderTarget(bufferTexture).toDataURL(outputFormat);
}

var __urlImgsCache__ = {};
function base64ImageFromUrl(url, callback, outputFormat /* 'image/png', 'image/jpeg', 'image/webp' */) {
    if (__urlImgsCache__[url])
        return callback(__urlImgsCache__[url]);

    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = wrapFunctionInTryCatch(function () {
        __urlImgsCache__[url] = base64ImageFromImage(this);
        callback(__urlImgsCache__[url]);
    });

    img.src = url;
    if (img.complete || img.complete === undefined) {
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
        img.src = url;
    }

}

var needRecacheImages = 0;


function getVCache() {
    try { return JSON.parse(LocalGetKey('vcache')) || []; } catch (e) { }
    return [];
}

function cacheImageInLocalStorage(imgName) {
    if (!needRecacheImages) return;
    var vcache = getVCache();
    vcache.push(imgName);
    LocalSetKey('vcache', JSON.stringify(vcache));
    LocalSetKey(imgName, base64ImageFromNormalTexture(globalConfigsData.__frames[imgName].tex));
}

function onVersionUpdate(last, current) {
    // clear version cache from localStorage
    var vcache = getVCache();
    needRecacheImages = 1;
    for (var i in vcache)
        LocalRemoveKey(vcache[i]);
}


function getFrameUv(x1, x2, y1, y2, rotated, uvsTransform) {

    if (rotated) {
        switch (uvsTransform) {
            case 0:
            default: return [x2, y1, x2, y2, x1, y1, x1, y2];
            case 1: return [x2, y2, x2, y1, x1, y2, x1, y1]; // mirrored x
            case 2: return [x1, y1, x1, y2, x2, y1, x2, y2]; // mirrored y
            case 3: return [x1, y2, x1, y1, x2, y2, x2, y1]; // mirrored x and y
            case 4: return [x2, y1, x1, y1, x2, y2, x1, y2]; // rotated 90 1
            case 5: return [x1, y1, x2, y1, x1, y2, x2, y2]; // rotated 90 2
            case 6: return [x2, y2, x1, y2, x2, y1, x1, y1]; // rotated 90 1 mirrored
            case 7: return [x1, y2, x2, y2, x1, y1, x2, y1]; // rotated 90 2 mirrored

        }
    } else {
        switch (uvsTransform) {
            case 0:
            default: return [x1, y1, x2, y1, x1, y2, x2, y2];
            case 1: return [x2, y1, x1, y1, x2, y2, x1, y2]; // mirrored x
            case 2: return [x1, y2, x2, y2, x1, y1, x2, y1]; // mirrored y
            case 3: return [x2, y2, x1, y2, x2, y1, x1, y1]; // mirrored x and y
            case 4: return [x1, y1, x1, y2, x2, y1, x2, y2]; // rotated 90 1
            case 5: return [x1, y2, x1, y1, x2, y2, x2, y1]; // rotated 90 2
            case 6: return [x2, y1, x2, y2, x1, y1, x1, y2]; // rotated 90 1 mirrored
            case 7: return [x2, y2, x2, y1, x1, y2, x1, y1]; // rotated 90 2 mirrored
        }
    }

}

function getFrameUVS(frame, uvsTransform) {
    if (frame && frame.v)
        return getFrameUv(frame.v[0], frame.v[1], frame.v[2], frame.v[3], frame.R, uvsTransform);
}


function setFrameUV(frame, uvscale, rotated, sizeScale) {

    uvscale = uvscale || 1;
    var img = (frame.tex || 0).__image;
    if (!img)
        return;

    var r = frame.r
        , ox = img.width
        , oy = img.height
        , x1 = uvscale * r[0] / ox
        , y1 = 1 - uvscale * r[1] / oy
        , w = r[rotated ? 3 : 2]
        , h = r[rotated ? 2 : 3]
        , x2 = x1 + uvscale * w / ox
        , y2 = y1 - uvscale * h / oy;

    frame.v = [x1, x2, y1, y2];

    if (rotated) { frame.R = 1; }

    frame.c = new Vector2((x1 + x2) / 2, (y1 + y2) / 2);

    frame.s = rotated ? new Vector2(h, w) : new Vector2(w, h);
    if (sizeScale) {
        frame.s.__multiplyScalar(sizeScale); //or divide?
    }
}

function computeAtlasTexture(atlas) {

    if (!atlas) {
        //debug
        throw "no atlas";
        //undebug
        return;
    }

    var frame = globalConfigsData.__frames[atlas.__atlasImageFile]
        , texture = frame.tex
        , img = texture.__image
        , bufferTexture;


    if (img) {

        if (atlas.__flipY != undefined)
            texture.__flipY = atlas.__flipY;

        if (atlas.__atlasAlphaImageFile) {

            var alphaTexture = globalConfigsData.__frames[atlas.__atlasAlphaImageFile].tex;

            if (atlas.__tryToUseLSCache) {
                cacheImageInLocalStorage(atlas.__atlasImageFile);
                cacheImageInLocalStorage(atlas.__atlasAlphaImageFile);
            }

            bufferTexture = renderOverTexture(img.width, img.height,
                set({
                    __shader: '__computeAtlas',
                    map: texture
                    //                     __generateMipmaps: 1
                }, 'b', alphaTexture)
            );

            destroyImage(atlas.__atlasAlphaImageFile);

        }

        if (bufferTexture) {
            destroyImage(atlas.__atlasImageFile);

            texture = frame.tex = bufferTexture.__texture;
            texture.__image.__scaled = img.__scaled;
            texture.__bufferTexture = bufferTexture;
            globalConfigsData.__frames[atlas.__atlasImageFile] = frame;

        }

        //memory?
        // TODO: b-1127
        // bufferTexture.__createImage();

    }

    var data = getCachedData(atlas.__atlasDataFile);
    //debug
    if (!data) {
        consoleError('no atlas loaded!', atlas.__atlasDataFile);
        return;
    }
    //     data.atlas = atlas;
    //undebug

    if (atlas.__atlasDataConverter) {
        data = atlas.__atlasDataConverter(atlas, data);
    }

    var frames = data.frames || data;
    if (frames) {

        if (isArray(frames) && isArray(frames[0])) {
            var decframes = {};
            $each(frames, function (r) { decframes[r[0]] = r.slice(1, r.length); });
            frames = decframes;
        }

        for (var n in frames) {
            var r = frames[n];

            var frame = {
                r: r.rc || r,
                __uvsBuffers: [],
                tex: texture
            };

            //debug
            frame.atlas = atlas;
            frame.__atlas = atlas;
            //undebug

            frame.__realFilename = n.split('?')[0];
            if (isNumeric(frame.__realFilename))
                frame.__realFilename = frame.__realFilename + '.png';

            if (atlas.__atlasFramePrefix)
                n = atlas.__atlasFramePrefix + n;

            setFrameUV(frame, 0, r.r || r[4]);

            if (r.length > 8) {
                frame.of = r.slice(5, 7);
                frame.or = r.slice(7, 9);
            } else {
                if (r.of) frame.of = r.of;
                if (r.or) frame.or = r.or;
            }

            //debug 

            if (globalConfigsData.__frames[n]) {
                consoleError("doublicate frame name ", n);
                if (typeof EditorWithKitten == undefinedType) {
                    debugger;
                }
            }

            //undebug

            globalConfigsData.__frames[n] = frame;
        }
    }

    if (data.SubTexture) {
        var scale = data.scale || 1;
        for (var i in data.SubTexture) {
            var frameData = data.SubTexture[i];

            var frame = {
                __uvsBuffers: [],
                r: [frameData.x, frameData.y, frameData.width, frameData.height],
                tex: texture
            };
            setFrameUV(frame, scale);
            globalConfigsData.__frames[atlas.__atlasFramePrefix + frameData.name] = frame;
        }
    }
}


function destroyImage(img) {
    var frame = globalConfigsData.__frames[img];
    if (frame) {
        var tex = frame.tex;
        if (tex) {
            //debug
            consoleLog('destroyImage', img);
            //undebug

            //TODO: clear __uvsBuffers!!!

            tex.__destruct();

            if (tex.__bufferTexture) {
                tex.__bufferTexture.__destruct();
                tex.__bufferTexture = 0;
            }

        }

        if (frame.__isSimpleImage) {
            var toDelete = $filterObject(globalConfigsData.__frames, function (f) {
                return (f || 0).tex == tex
            });
            $each(toDelete, function (v, f) {
                delete globalConfigsData.__frames[f];
            })
        }
    }
}


function enterFullScreen(elem, opts) {
    opts = opts || { navigationUI: 'hide' };
    elem = elem || renderer.__domElement;
    $find(['requestFullscreen', 'msRequestFullscreen', 'mozRequestFullScreen', 'webkitRequestFullscreen'],
        v => elem[v] ? elem[v](opts) || 1 : 0);

}

//debug

function debugObjectProperties(obj, props) {

    $each(props, function (p) {
        obj['_debug_' + p] = obj[p];
        ObjectDefineProperty(obj, p, {
            set: function (v) {
                this['_debug_' + p] = v;
                debugger;
            },
            get: function () {
                debugger;
                return this['_debug_' + p];
            }
        })
    });
}


function debugObjectByProxy(obj, props) {
    return new Proxy(obj, {
        get: function (target, prop) {
            var p = target[prop];
            if (!props || (props.indexOf(prop) >= 0)) {
                consoleLog('get', prop, p);
                debugger;
            }
            return p;
        },
        set: function (target, prop, value) {
            if (!props || (props.indexOf(prop) >= 0)) {
                consoleLog('set', prop, value);
                debugger;
            }
            target[prop] = value;
            return true;
        }
    });
}
//undebug
