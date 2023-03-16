
function wrapFunctionInTryCatch(fn){ return fn }


//vars to not obfuscate 

//events
var EDM = createDeobfuscatingMap({
    ____onTap: 1,
    ____onTapFunc: 1,
    ____drag: 1,
    ____onDragFunc: 1,
    ____contextMenu: 1,
    ____wheel: 1
})

    //shader params
    , matrixWorld = "matrixWorld"
    , projectionMatrix = "projectionMatrix";


var undefinedType = typeof undefined;

var _bowser = typeof bowser == undefinedType ? 0 : bowser;

var _localStorage = typeof localStorage != undefinedType ? localStorage : 0;


function ifdef(a, b) {
    return a === undefined ? b : a;
}

// Get key from local storage
function LocalGetKey(key, defValue) {
    try { return _localStorage ? _localStorage.getItem(key) : defValue; }
    catch (err) {
        //cheats
        consoleError('Local storage error', key, err);
        //endcheats
    }
    return defValue;
}

function LocalSetKeys(obj) {
    for (var i in obj)
        LocalSetKey(i, obj[i]);
}

// Set key to local storage
function LocalSetKey(key, value) {
    try { if (_localStorage) _localStorage.setItem(key, value); }
    catch (err) {
        //cheats
        consoleError('Failed to save local value', key, err);
        //endcheats
    }
}


// Set key to local storage
function LocalRemoveKey(key) {
    try { if (_localStorage) _localStorage.removeItem(key); }
    catch (err) {
        //cheats
        consoleError('Failed to remove local key', key, err);
        //endcheats
    }
}

var __sessionGlobal = 0, __sessionToday = 0;


function getAppVersionCode() {
    var pd = options.__projectData;
    if (pd && pd.vercode) return pd.vercode;
    return typeof BUILD_VERSION == typeof undefined ? "0" : ("" + BUILD_VERSION);
}

function getAppVersion() {

    var pd = options.__projectData;
    if (pd && pd.version)
        return pd.version;

    if (typeof __PROJECT_VERSION__ == typeof undefined) {
        if (typeof __PROJECT_VERSION___IOS == typeof undefined) {
            return 0;
        }
        return __PROJECT_VERSION___IOS;
    }
    return __PROJECT_VERSION__;
}


var consoleError = function () { }, consoleWarn = function () { }, consoleLog = function () { };
//cheats
consoleError = console.error.bind(console);
consoleWarn = console.warn.bind(console);
consoleLog = console.log.bind(console); //function(){ if ( isString( arguments[0] ) &&  arguments[0].startsWith('js_Ana') ) console.log.apply(console, arguments); } 

var __cachedReadableDumps = [];
var ddeepper = 0;
function readableStringify(d, nodeeper) {
    if (!nodeeper) ddeepper += 1;
    var r;
    try {

        if (d && d.__stringify) d = d.__stringify();

        var arr = isArray(d), obj, func;
        obj = !arr && isObject(d);
        func = !arr && !obj && isFunction(d);

        if (arr || obj || func) {
            var ind = __cachedReadableDumps.indexOf(d);
            if (func) return ind >= 0 ? '<function[' + ind + ']>' : '<function>';

            r = arr ? 'arr' : 'obj';

            var m;

            if (typeof Text != undefinedType && d instanceof Text) { r = 'Text' + (d.__text ? (' ' + readableStringify(d.__text, 1)) : '') } else
                if (typeof Node != undefinedType && d instanceof Node) { r = 'Node' + (d.name ? (' ' + readableStringify(d.name, 1)) : '') } else
                    if (typeof Object3D != undefinedType && d instanceof Object3D) { r = 'Object3D' + (d.name ? (' ' + readableStringify(d.name, 1)) : '') } else
                        if (typeof ActivityActionInstance != undefinedType && d instanceof ActivityActionInstance) { r = 'AAI ' + d.__currentActivity + '.' + d.__id } else
                            if (typeof ParticleEmitter != undefinedType && d instanceof ParticleEmitter) { r = 'Emmiter' } else
                                if (typeof ParticleEffect != undefinedType && d instanceof ParticleEffect) { r = 'Effect' } else
                                    if (typeof Shadow != undefinedType && d instanceof Shadow) { r = 'Shadow' } else
                                        if (typeof Vector2 != undefinedType && d instanceof Vector2) { r = 'Vector2(' + d.x + ',' + d.y + ')' } else
                                            if (typeof Vector3 != undefinedType && d instanceof Vector3) { r = 'Vector3(' + d.x + ',' + d.y + ',' + d.z + ')' } else
                                                if (typeof Vector4 != undefinedType && d instanceof Vector4) { r = 'Vector4(' + d.x + ',' + d.y + ',' + d.z + ',' + d.w + ')' } else
                                                    if (typeof Color != undefinedType && d instanceof Color) { r = 'Color(' + d.r + ',' + d.g + ',' + d.b + ')' } else
                                                        if (d.constructor !== Object && d.constructor !== Array) {
                                                            r = stringifyTypeOfObject(d) || "some object";
                                                        } else {
                                                            m = 1;
                                                        }

            if (ind >= 0) {
                r = '<' + r + '[' + ind + ']>';
            }
            else
                if (m) {
                    r = obj ? '{ ' : '[ ';
                    var zpt = '';
                    for (var i in d) {
                        r += zpt + (obj ? (readableStringify(i) + ':') : '') + readableStringify(d[i]);
                        zpt = ', ';
                    }
                    r += obj ? ' }' : ' ]';
                }
                else {
                    r = '<' + r + '>';
                }

            __cachedReadableDumps.push(d);

        } else
            if (isString(d)) {
                if (ddeepper > 1 && !nodeeper) {
                    r = '"' + d.replace('"', '\"') + '"';
                }
                else {
                    r = d;
                }
            } else
                if (isNumeric(d)) {
                    r = d;
                } else
                    if (typeof WebGLBuffer != undefinedType && d instanceof WebGLBuffer) { r = '<WebGLBuffer>'; } else
                        if (typeof WebGLUniformLocation != undefinedType && d instanceof WebGLUniformLocation) { r = '<WebGLUniformLocation>'; } else
                            if (typeof WebGLTexture != undefinedType && d instanceof WebGLTexture) { r = '<WebGLTexture>'; } else
                                if (typeof WebGLProgram != undefinedType && d instanceof WebGLProgram) { r = '<WebGLProgram>'; }

    } catch (e) {
        console.error(e);
        try { r = JSON.stringify(d); } catch (e) {
            console.error(e);
            r = d;
        }
    }
    if (!nodeeper) ddeepper -= 1;
    if (r === undefined)
        return null;
    return r;
}

function makeReadableLogging(f) {
    return function () {
        __cachedReadableDumps = [];
        var s = '';
        for (var i in arguments) {
            s += readableStringify(arguments[i]) + ' ';
        }

        if (typeof logToCheatConsole != undefinedType)
            logToCheatConsole(s);

        f.call(console, s);
        __cachedReadableDumps = [];
    }
}

if (_bowser.android || _bowser.mobile || _bowser.ios) {
    consoleError = makeReadableLogging(consoleError);
    consoleWarn = makeReadableLogging(consoleWarn);
    consoleLog = makeReadableLogging(consoleLog);
}

//endcheats

var M = Math, __document = document, __window = window,
    sign = M.sign || function (x) { return (x < 0) ? - 1 : (x > 0) ? 1 : + x; },
    acos = M.acos, mmax = M.max, mmin = M.min, floor = M.floor, abs = M.abs, ceil = M.ceil, trunc = M.trunc,
    LN2 = M.LN2, tan = M.tan, atan = M.atan, log = M.log, atan2 = M.atan2, asin = M.asin,
    random = M.random, sqrt = M.sqrt, pow = M.pow, sqrt = M.sqrt, sin = M.sin, cos = M.cos, PI = M.PI, PI2 = PI / 2,
    EPSILON = Number.EPSILON || pow(2, - 52), round = M.round,
    ONE_SECOND = 1000, ONE_MINUTE = ONE_SECOND * 60, ONE_HOUR = ONE_MINUTE * 60, ONE_DAY = ONE_HOUR * 24,
    DEG2RAD = PI / 180,
    RAD2DEG = 180 / PI,
    ONE_MINUTE_IN_SECONDS = 60,
    ONE_HOUR_IN_SECONDS = 60 * ONE_MINUTE_IN_SECONDS,
    ONE_DAY_IN_SECONDS = 24 * ONE_HOUR_IN_SECONDS,
    ONE_WEEK_IN_SECONDS = 7 * ONE_DAY_IN_SECONDS;

var ObjectDefineProperties = Object.defineProperties, ObjectDefineProperty = Object.defineProperty, ObjectCreate = Object.create;





function clamp(value, min, max) { return mmax(min, mmin(max, value)); }
function euclideanModulo(n, m) { return ((n % m) + m) % m; }
function mapLinear(x, a1, a2, b1, b2) { return b1 + (x - a1) * (b2 - b1) / (a2 - a1); }
function lerp(x, y, t) { return (1 - t) * x + t * y; }
function smoothstep(x, min, max) {
    if (x <= min) return 0;
    if (x >= max) return 1;
    x = (x - min) / (max - min);
    return x * x * (3 - 2 * x);
}

function smootherstep(x, min, max) {
    if (x <= min) return 0;
    if (x >= max) return 1;
    x = (x - min) / (max - min);
    return x * x * x * (x * (x * 6 - 15) + 10);
}


function degToRad(degrees) { return degrees * DEG2RAD; }
function radToDeg(radians) { return radians * RAD2DEG; }
function isPowerOfTwo(value) { return (value & (value - 1)) === 0 && value !== 0; }
function nearestPowerOfTwo(value) { return pow(2, round(log(value) / LN2)); }
function fract(d) {
    return d - trunc(d)
}
function nextPowerOfTwo(value) {
    value--;
    value |= value >> 1;
    value |= value >> 2;
    value |= value >> 4;
    value |= value >> 8;
    value |= value >> 16;
    value++;
    return value;
}





function parseJson(v, onerror, usePacking) {
    if (onerror) {
        try { return parseJson(v, 0, usePacking) } catch (e) { return onerror(e) }
    }

    if (v) {
        if (options.__prepareJsons) {
            v = v.replace(/,\s*([}\]])/gi, '$1');
        }
        var r = JSON.parse(v);
        if (usePacking) {
            r = r.packed ? repackJson(r.packed) : r.pkd ? unpackJson(r.pkd) : r;
        }
        return r;
    }
}

function shuffle(a) {
    var j, x, i = a.length - 1;
    while (i > 0) {
        j = randomInt(0, i);
        x = a[i];
        a[i] = a[j];
        a[j] = x;
        i--;
    }
    return a;
}

function randomFloat(low, high) { return low + random() * (high - low); }
function randomFloatSpread(range) { return range * (0.5 - random()); }
function randomSign() { return random() < 0.5 ? -1 : 1; }
function randomInt(_min, _max) { return floor(random() * (_max - _min + 1)) + _min; }
function randomBool() { return random() < 0.5; }

function roundByStep(d, _round) {
    return round(d / _round) * _round;
}
function floorByStep(d, _round) {
    return floor(d / _round) * _round;
}


function roundUp(d) {
    var f = floor(d);
    return f == d ? f : f + 1;
}

function randomize(_min, _max, _round) {
    if (_round) {
        return roundByStep(randomize(_min, _max), _round);
    }
    return random() * (_max - _min) + _min;
}

function isFunction(o) { return Object.prototype.toString.call(o) == '[object Function]'; }
function callFunction(f) { if (isFunction(f)) return f(); }

var isArray = Array.isArray;
function isArrayOrObject(a) { return typeof a == 'object' && (isArray(a) || isObject(a)); }
function isObject(a) { return Object.prototype.toString.call(a) == "[object Object]"; }
function isString(a) { return typeof a === 'string' || a instanceof String; }
function isNumber(a) { return (typeof a === 'number') && isFinite(a); }

function overrideNotEnumerableProperty(f) { return { enumerable: false, value: f } }

function override$(a, e$, f$, m$, F$, c$, r$, M$) {
    ObjectDefineProperties(a, {
        e$: overrideNotEnumerableProperty(e$),
        f$: overrideNotEnumerableProperty(f$),
        m$: overrideNotEnumerableProperty(m$),
        F$: overrideNotEnumerableProperty(F$),
        c$: overrideNotEnumerableProperty(c$),
        r$: overrideNotEnumerableProperty(r$),
        M$: overrideNotEnumerableProperty(M$)
    });
}
var ArrayPrototype = Array.prototype, ObjectPrototype = Object.prototype;

var __$countProto = function (f) {
    var r = 0, c;
    this.e$(function (ei, i) {
        c = f(ei, i);
        if (isNumeric(c)) r += c;
        else if (c) r++;
    });
    return r;
};

override$(ArrayPrototype,
    ArrayPrototype.forEach, // $each
    ArrayPrototype.filter,  // $filter
    ArrayPrototype.map, // $map
    ArrayPrototype.find, // $find
    __$countProto, // $count
    function (f) { for (var i = 0; i < this.length; i++) this[i] = f(this[i], i); return this; }, // $replace
    function (f, fl) { return this.map(f).filter(fl); } // $mapAndFilter
);

override$(ObjectPrototype,
    function (f) { for (var i in this) f(this[i], i); }, // $each
    function (f) { var a = [], i; for (i in this) if (f(this[i], i)) a.push(this[i]); return a; }, // $filter
    function (f) { var a = {}, i; for (i in this) a[i] = f(this[i], i); return a; }, // $map
    function (f) { for (var i in this) { var r = f(this[i], i); if (r) return this[i]; } }, // $find
    __$countProto, // $count
    function (f) { for (var i in this) this[i] = f(this[i], i); return this; }, // $replace
    function (f, fl) { var a = {}, i; for (i in this) { var r = f(this[i], i); if (fl(r)) a[i] = r; } return a; } // $mapAndFilter
);

function $each(a, f) { return a && isFunction(a.e$) ? a.e$(f) : [] }
function $filter(a, f) { return a && isFunction(a.f$) ? a.f$(f) : [] }
function $map(a, f) { return a && isFunction(a.m$) ? a.m$(f) : [] }
function $find(a, f) { return a && isFunction(a.F$) ? a.F$(f) : undefined }
function $count(a, f) { return a && isFunction(a.c$) ? a.c$(f) : 0 }
function $replace(a, f) { return a && isFunction(a.r$) ? a.r$(f) : [] }

function $findResult(a, f) { for (var i in a) { var r = f(a[i], i); if (r) return r } }
function $mapAndFilter(a, f, fl) { return a && isFunction(a.M$) ? a.M$(f, fl || function (a) { return a ? 1 : 0; }) : undefined; }

function $filterObject(a, f) { var b = {}; for (var i in a) if (f(a[i], i)) b[i] = a[i]; return b; }
function $mapArrayToObject(a, f) { var o = {}; if (a) { for (var i = 0; i < a.length; i++) o[f(a[i], i)] = a[i]; } return o; }
function $mapObjectToArray(o, f) { var a = []; if (o) { for (var i in o) a.push(f(o[i], i)); } return a; }

function __$call_args(a, args) {
    if (isFunction(a)) { a.apply(this, args); } else { $each(a, function (f) { __$call_args.call(a, f, args); }); }
}

function __$call(a) {
    if (isFunction(a)) { a.call(this); } else { $each(a, function (f) { __$call.call(a, f); }); }
}


// рекурсивно обходит массив/объект и вызывает функции в нем до которых дотянется.
// не совсем понятно зачем это сделано, лучше юзать $mcall и $fcall
//DEPRECATED
function $call(a, args) {
    if (args) {
        __$call_args(a, args);
    } else {
        __$call(a);
    }
}

//вызывает все функции из массива/объекта a
function $fcall(a, args) {
    if (args) {
        $each(a, function (f) { if (isFunction(f)) f.apply(a, args); });
    } else {
        $each(a, function (f) { if (isFunction(f)) f(); });
    }
}

//вызывает метод с именем m у всех объектов из массива/объекта объектов a
function $mcall(a, m, args) {
    if (args) {
        $each(a, function (o) { if (o && o[m] && isFunction(o[m])) o[m].apply(o, args); });
    } else {
        $each(a, function (o) { if (o && o[m] && isFunction(o[m])) o[m](); });
    }
}

//вызывает методы у объекта o из массива/объекта объектов a
function $mfcall(o, a, args) {
    if (args) {
        $each(a, function (v) { if (isFunction(v)) v.apply(o, args); });
    } else {
        $each(a, function (v) { if (isFunction(v)) v.call(o); });
    }
}


String.prototype.__format = String.prototype.format || function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != undefinedType ? args[number] : match;
    });
};


function deepclone(a) {
    if (isArrayOrObject(a)) {
        //debug
        if (a.constructor !== Object && a.constructor !== Array) {
            throw "can't copy non real objects by deepclone!"
            return a;
        }
        //undebug
        return $map(a, deepclone);
    }
    return a;
}



function deepCloneNotNull(data) {
    if (isObject(data)) {
        var temp = {};
        for (var key in data)
            if (data[key] != null)
                temp[key] = deepCloneNotNull(data[key]);
        return temp;
    }

    if (isArray(data)) {
        var temp = [];
        for (var i = 0; i < data.length; i++)
            if (data[key] != null)
                temp[key] = deepCloneNotNull(data[key]);
        return temp;
    }
    return data;
}

function objectHasKeys(obj) { for (var i in obj) { return 1 } }
function objectKeys(obj) { var data = []; for (var key in obj) data.push(key); return data; }
function mergeObj(data, merged) { for (var key in merged) data[key] = merged[key]; return data; }
function mergeObjExclude(data, merged) { for (var key in merged) if (!data.hasOwnProperty(key)) data[key] = merged[key]; return data; }

function mergeObjects(data, base) { base = base || {}; for (var i in data) mergeObj(base, data[i]); return base; }

function mergeObjectsBy(objects, mod) { for (var i in objects) mergeObj(objects[i], mod); }

function mergeObjectDeep(data, merged) {
    if (isObject(merged)) {
        if (isObject(data)) {
            for (var key in merged) {
                data[key] = mergeObjectDeep(data[key], merged[key]);
            }
        } else {
            return merged;
        }
    } else {
        return merged;
    }
    return data;
}


function setNonObfuscatedParams() {

    for (var i = 1; i < arguments.length; i += 2) {
        arguments[0][arguments[i]] = arguments[i + 1];
    }
    return arguments[0];
}

function d2h(d) {
    d = (d ^ 0).toString(16);
    return d.length == 1 ? "0" + d : d;
}

function d3h(d) {
    return d2h((d & 0xff0000) >> 16) + d2h((d & 0x00ff00) >> 8) + d2h(d & 0x0000ff);
}

function inArray(obj, arr) { return isArray(arr) && (arr.indexOf(obj) != -1); }
function removeFromArray(obj, arr) { var ax; while ((ax = arr.indexOf(obj)) !== -1) arr.splice(ax, 1); }
function objectSize(o) { var size = 0, key; for (key in o) if (o.hasOwnProperty(key)) size++; return size; }

function createDeobfuscatingMap(basemap) {
    for (var i in basemap) basemap[i] = i;
    return basemap;
}

var requestAnimFrame = (function () { return __window.requestAnimationFrame || __window.webkitRequestAnimationFrame || __window.mozRequestAnimationFrame || __window.oRequestAnimationFrame || __window.msRequestAnimationFrame })();

function isNumeric(n) { return !isNaN(parseFloat(n)) && isFinite(n) && !isArray(n); }

function numeric(n) {
    n = parseFloat(n);
    if (isFinite(n)) return n;
    return 0;
}

function addProp(props, obj, p) {

    if (isObject(props[p])) {
        obj[p] = props[p];
    } else
        obj[p] = {
            get: function () {
                return this.__p.hasOwnProperty(p) ? this.__p[p] : props[p];
            },
            set: function (v) {
                var t = this;
                if (t[p] != v) {
                    t.__p[p] = v;
                    t.__needUpdate = 1;
                }
            }
        }

}

function createSomePropertyWithGetterAndSetter(getter, setter) {
    var o = {};
    if (getter) o.get = getter;
    if (setter) o.set = setter;
    return o;
}



function addProps(props, obj, cb) {
    obj = obj || {};
    cb = cb || addProp;
    for (var p in props) cb(props, obj, p);
    return obj;
}

function stringifyTypeOfObject(o) {
    if (o) {
        var results = (o.constructor ? o.constructor : o).toString().match(/function (.{1,})\(/);
        return (results && results.length > 1) ? results[1] : "";
    }
}


function overloadMethod(method, f) {
    return function () {
        var r;
        if (method) r = method.apply(this, arguments);
        if (f) return f.apply(this, arguments);
        return r;
    }
}


function defaultMergeInit(v) { return mergeObj(this, v) }


var ALIGN_START = 0, ALIGN_CENTER = 1, ALIGN_END = 2,
    ALIGN_FROM_START_TO_END = 3, ALIGN_FROM_END_TO_START = 4;

function invertMap(obj, out) {
    out = out || obj;
    $each(obj, function (n, i) { out[n] = i; });
    return out;
}



var JsonPackMap = {
    name: 'n',
    ha: 'h',
    va: 'v',
    sha: 'H',
    sva: 'V',
    cropx: 'cx',
    cropy: 'cy',
    __size: 's',
    __scaleF: 'S',
    __scale: '_S',
    __scalex: 'sx',
    __scaley: 'sy',
    __anchor: '_a',
    __transformAnchor: '_A',
    __centerFill: 'fc',
    __onTap: 'T',
    __shadow: 'sh',
    __animation: 'd',
    __simpleAnimation: 'sa',
    __childs: '_',
    __effect: 'e',
    __ofs: 'o',
    __keyframes: 'k',
    __img: 'i',
    __color: 'c',
    __rotate: 'R',
    __corner: 'C',
    __visible: 'f',
    __padding: 'p',
    __margin: 'm',
    __spacing: 'SP',
    __blending: 'bl',
    __maxImageSize: 'M',
    __maxsize: 'Ms',
    __minsize: 'ms',
    __text: 't',
    __fontsize: 'F',
    __lineWidth: 'l',
    __lineColor: 'j',
    __lineAlpha: 'la',
    __lineSpacing: 'q',
    __addedLineSpacingMultiplier: 'lsm',
    __fontspacing: 'u',
    __charw: 'W',
    __autoscale: 'D',
    __shader: 'B',
    __align: 'A',
    __autowrap: 'J',
    __autoRecalcOnResize: 'I',
    __dontLocalize: 'K',
    __fontface: 'U',
    __onLoad: 'OL',
    __propertyBinding: 'PB',
    __behaviour: 'BR',
    __numericInputStep: 'NS',
    __width: 'WI',
    __height: 'HE',
    __fitImg: 'fi',
    __fitImgX: 'fx',
    __fitImgY: 'fy',
    __class: 'cl',
    __skew: 'SK',
    __skewX: 'SX',
    __skewY: 'SY',
    __uvsTransform: 'uv',
    __imgRepeatX: 'rx',
    __imgRepeatY: 'ry',
    __dragonBones: 'DB',

    emitters: 'E',

    __componentsList: 'ec',
    __componentType: 'cT',

    lifespan: 'L',
    rate: 'X',
    power: 'Y',

    "3d": 'N',
    loop: 'O',
    linked: 'P',

    //DEPRECATED
    render_mode: 'Q',

    sort_mode: 'sm',
    blending: 'bd',
    texture: 'tx',
    texture_animation: 'ta',
    duration: 'du',
    direction: 'di',
    velocity: 've',
    spin: 'sp',
    spin_factor: 'Sf',
    origin: 'or',
    force: 'fo',
    accel: 'ac',
    accel_factor: 'af',
    size: 'si',
    size_factor: 'sf',
    color: 'co',
    color_factor: 'cf',
    rad: 'ra',
    trans: 'tr',
    width: 'wi',
    height: 'he',

    __tooltip: 'tt',

    __userData: 'ud',

    __easing: 'ea',
    __classesObj: 'CO',
    __loopDisabled: 'ld',
    __selfImgSize: 'ss'

};

var disabledForPack = {
    __shader: 1,
    B: 1,
    __uniforms: 1
};

var JsonUnpackMap = invertMap(JsonPackMap, {});

var JsonRepackMap = mergeObj(mergeObj({}, JsonPackMap), JsonUnpackMap);

function packJson(o) { return repackJson(o, JsonPackMap); }
function unpackJson(o) { return repackJson(o, JsonUnpackMap); }

function repackJson(o, map
    //debug
    , depth
    //undebug
) {
    map = map || JsonRepackMap; // old version layouts uses repackJson
    //debug
    depth = depth || 0;
    if (depth > 250) {
        console.log(o);
        debugger;
        return;
    }
    if (isObject(o) && o.constructor !== Object) {
        debugger;
        return;
    }
    //undebug
    if (o && typeof o == 'object') {
        var packed = isArray(o) ? [] : {};
        for (var i in o) {
            if (disabledForPack[i]) {
                packed[map[i] || i] = o[i];
            } else {
                packed[map[i] || i] = repackJson(o[i], map
                    //debug
                    , depth + 1
                    //undebug
                );
            }
        }
        return packed;
    }
    return o;
}

function notNullFunc(f) {
    return f || function () { }
}


function concatArrays() {
    var r = [];
    for (var i = 0; i < arguments.length; i++) {
        if (isArray(arguments[i])) {
            r = r.concat(arguments[i]);
        }
    }
    return r;
}


function concatArraysWithUniqueItems(array1, array2) {
    return concatArrays(array1, array2).filter(function (item, pos, self) {
        return self.indexOf(item) == pos;
    });
}

function concatArraysWithUniqueIds(array1, array2) {
    return $filter($map(concatArrays(array1, array2), function (id) { return String(id) }), function (item, pos, self) {
        return self.indexOf(item) == pos;
    });
}

function concatArraysWithUniqueItemsIds(array1, array2, idGetter, idSetter) {
    idGetter = idGetter || function (p) { return p.id };
    idSetter = idSetter || function (p, id) { p.id = id; };
    var a = $filter(concatArrays(array1, array2), function (p) { return p && idGetter(p); });
    if (isFunction(idSetter)) {
        $each(a, function (p) {
            var id = idGetter(p);
            if (!isString(id)) idSetter(p, String(id));
        });
    }
    return $filter(a, function (item) {
        for (var i = 0; i < a.length; i++) {
            if ((a[i] != item) && (idGetter(a[i]) == idGetter(item)))
                return;
        }
        return 1;
    });
}

function findGetParameter(name, defValue) {
    var result = null;
    var tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === name) result = decodeURIComponent(tmp[1]);
    }
    if (result == null) result = defValue;
    return result;
}

function toFixedDeep(obj, d) {
    if (isNumeric(obj)) obj = Number(Number(obj).toFixed(d));
    else if (typeof obj == 'object') for (var i in obj) obj[i] = toFixedDeep(obj[i], d);
    return obj;
} 

function explodeString(str, delimeter) {
    if (!str) return [];
    str = str.split(delimeter || ',');
    for (var i in str) str[i] = str[i].trim();
    return str;
}



function isValuesEquals(a, b, skipFunctions) {

    if (a == b) return 1;

    if (isObject(a) && isObject(b)) {
        for (var i in a) if (!isValuesEquals(a[i], b[i], skipFunctions)) return 0;
        for (var i in b) if (!isValuesEquals(a[i], b[i], skipFunctions)) return 0;
        return 1;
    }

    if (isArray(a) && isArray(b)) {
        if (a.length == b.length) {
            for (var i in a) if (!isValuesEquals(a[i], b[i], skipFunctions)) return 0;
            return 1;
        }
    }

    if (skipFunctions && isFunction(a) && isFunction(b))
        return 1;

    return 0;

}

/*

var base85coder = (function(){

    'use strict';
    var al1 = "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstu".split('');
    var al2 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#".split('');
    function mapal(a){
        var o = {};
        for (var i=0; i<a.length; i++){
            o[a[i]] = i;
        }
        return o;
    }
    
    var alphabet = {
        ascii85: { enc : al1, dec: mapal(al1) },
        z85 : { enc : al2, dec: mapal(al2) }
        // ipv6 = { enc: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{  |}~", dec: .. };
    };
    
//     var Address6 = require('ip-address').Address6;
//     var bignum = require('bignum');

    var NUM_MAXVALUE = Math.pow(2, 32) - 1;
    var QUAD85 = 85 * 85 * 85 * 85;
    var TRIO85 = 85 * 85 * 85;
    var DUO85  = 85 * 85;
    var SING85 = 85;

    var DEFAULT_ENCODING = 0;

    // Characters to allow (and ignore) in an encoded buffer 
    var IGNORE_CHARS = [
        0x09, // horizontal tab 
        0x0a, // line feed, new line 
        0x0b, // vertical tab 
        0x0c, // form feed, new page 
        0x0d, // carriage return 
        0x20  // space 
    ];

    var ASCII85_ENC_START = '<~';
    var ASCII85_ENC_END   = '~>';

    // Function borrowed from noseglid/canumb (github) 
//     function pad(width, number)
//     {
//         return new Array(1 + width - number.length).join('0') + number;
//     }

//     function encodeBignumIPv6(num)
//     {
//         var enctable = alphabets.ipv6.enc;
// 
//         var enc = [];
//         for (var i = 1; i < 20; ++i) {
//             enc.push(enctable[num.mod(85).toNumber()]); /* Ranges between 0 - 84 
//             num = num.div(85);
//         }
//         enc.push(enctable[num.toNumber()]); /* What's left is also in range 0 - 84 
//         return enc.reverse().join('');
//     }

//     function encodeBufferIPv6(buffer)
//     {
//         if (16 !== buffer.length) {
//             /* An IPv6 address must be exactly 16 bytes, 128 bits long 
//             return false;
//         }
// 
//         return encodeBignumIPv6(bignum.fromBuffer(buffer));
//     }
// 
//     function encodeStringIPv6(string)
//     {
//         var addr = new Address6(string);
//         if (!addr.isValid()) {
//             return false;
//     }


//     var num = bignum(addr.parsedAddress.map(function(el) {
//             return pad(4, el);
//         }).join(''), 16);
// 
//         return encodeBignumIPv6(num);
//     }
// 
//     function decodeStringIPv6(string)
//     {
//         if (20 !== string.length) {
//             /* An encoded IPv6 is always (5/4) * 16 = 20 bytes 
//             return false;
//         }
// 
//         var dectable = alphabets.ipv6.dec;
//         var i = 0;
// 
//         /* bignum throws an exception if invalid data is passed 
//         try {
//             var binary = string.split('').reduceRight(function(memo, el) {
//             var num = bignum(dectable[el.charCodeAt(0)]);
//             var fact = bignum(85).pow(i++);
//             var contrib = num.mul(fact);
//             return memo.add(contrib);
//             }, bignum(0));
// 
//             return Address6.fromBigInteger(binary).correctForm();
//         } catch(e) {
//             return false;
//         }
//     }
// 
//     function decodeBufferIPv6(buffer)
//     {
//         return decodeStringIPv6(buffer.toString());
//     }

    function getAlphabet(encoding){
        return encoding ? alphabet.ascii85 : alphabet.z85
    }

    function encodeBuffer(buffer, encoding)
    {
               
        var enctable = getAlphabet(encoding).enc;
        var padding = (buffer.length % 4 === 0) ? 0 : 4 - buffer.length % 4;

        var result = '';
        for (var i = 0; i < buffer.length; i += 4) {

            /* 32 bit number of the current 4 bytes (padded with 0 as necessary) 
            var num = ((buffer[i] << 24) >>> 0) + // Shift right to force unsigned number
                (((i + 1 > buffer.length ? 0 : buffer[i + 1]) << 16) >>> 0) +
                (((i + 2 > buffer.length ? 0 : buffer[i + 2]) <<  8) >>> 0) +
                (((i + 3 > buffer.length ? 0 : buffer[i + 3]) <<  0) >>> 0);

            /* Create 5 characters from '!' to 'u' alphabet 
            var block = [];
            for (var j = 0; j < 5; ++j) {
                block.unshift(enctable[num % 85]);
                num = Math.floor(num / 85);
            }

            block = block.join('');
            if (block === '!!!!!' && encoding) {
                block = 'z';
            }
            /* And append them to the result 
            result += block;
        }

        return ( encoding ? ASCII85_ENC_START : '') +
                result.substring(0, result.length - padding) +
                ( encoding ? ASCII85_ENC_END : '');
    }


    function decodeBuffer(buffer, encoding)
    {
        var dectable = getAlphabet(encoding).dec;

        var dataLength = buffer.length;
        if (encoding) {
            dataLength -= (ASCII85_ENC_START.length + ASCII85_ENC_END.length);
        }
        
        if (!encoding && dataLength % 5 !== 0) {
            return;
        }

        var padding = (dataLength % 5 === 0) ? 0 : 5 - dataLength % 5;

        var bufferStart = encoding ? ASCII85_ENC_START.length : 0;
        var bufferEnd   = bufferStart + dataLength;

        var result = new Uint8Array(4 * Math.ceil((bufferEnd - bufferStart) / 5));

        var nextValidByte = function(index) {
            if (index < bufferEnd) {
            while (-1 !== IGNORE_CHARS.indexOf(buffer[index])) {
                padding = (padding + 1) % 5;
                index++; // skip newline character
            }
            }
            return index;
        };

        var writeIndex = 0;
        for (var i = bufferStart; i < bufferEnd;) {
            var num = 0;
            var starti = i;

            i = nextValidByte(i);
            num = (dectable[buffer[i]]) * QUAD85;

            i = nextValidByte(i + 1);
            num += (i >= bufferEnd ? 84 : dectable[buffer[i]]) * TRIO85;

            i = nextValidByte(i + 1);
            num += (i >= bufferEnd ? 84 : dectable[buffer[i]]) * DUO85;

            i = nextValidByte(i + 1);
            num += (i >= bufferEnd ? 84 : dectable[buffer[i]]) * SING85;

            i = nextValidByte(i + 1);
            num += (i >= bufferEnd ? 84 : dectable[buffer[i]]);

            i = nextValidByte(i + 1);
            
            if (!encoding && starti + 5 !== i) {
                return;
            }

            if (num > NUM_MAXVALUE || num < 0) {
            // Bogus data 
                return;
            }

            result.writeUInt32BE(num, writeIndex);
            writeIndex += 4;
        }

        return result.slice(0, writeIndex - padding);
    }
 

    function mkDec(chk, decOrEnc) {
        return function(data, encoding) {
            encoding = encoding || DEFAULT_ENCODING;
            if (isString(data)) {
                data = new TextEncoder("utf-8").encode( chk? chk(data, encoding) : data ); // utf8 at all times?
            }

            return  // ('ipv6' === encoding) ? encodeBufferIPv6(data) :
                decOrEnc(data, encoding);
            
        }
    }
        
    return {
        encode : mkDec( 0, encodeBuffer ),
        decode : mkDec(
            function(data, encoding){
                return encoding ? data.replace('z', '!!!!!') : data
            }, decodeBuffer )
    }
    
})();
*/

var base64coder = (function () {

    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
        a256 = '',
        r64 = [256],
        r256 = [256],
        i = 0,
        codingXorByte1 = 0,
        codingXorByte2 = 0;

    var UTF8 = {

        /**
         * Encode multi-byte Unicode string into utf-8 multiple single-byte characters
         * (BMP / basic multilingual plane only)
         *
         * Chars in range U+0080 - U+07FF are encoded in 2 chars, U+0800 - U+FFFF in 3 chars
         *
         * @param {String} strUni Unicode string to be encoded as UTF-8
         * @returns {String} encoded string
         */
        encode: function (strUni) {
            // use regular expressions & String.replace callback function for better efficiency
            // than procedural approaches
            var strUtf = strUni.replace(/[\u0080-\u07ff]/g, // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
                function (c) {
                    var cc = c.charCodeAt(0);
                    return String.fromCharCode(0xc0 | cc >> 6, 0x80 | cc & 0x3f);
                })
                .replace(/[\u0800-\uffff]/g, // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
                    function (c) {
                        var cc = c.charCodeAt(0);
                        return String.fromCharCode(0xe0 | cc >> 12, 0x80 | cc >> 6 & 0x3F, 0x80 | cc & 0x3f);
                    });
            return strUtf;
        },

        /**
         * Decode utf-8 encoded string back into multi-byte Unicode characters
         *
         * @param {String} strUtf UTF-8 string to be decoded back to Unicode
         * @returns {String} decoded string
         */
        decode: function (strUtf) {
            // note: decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char!
            var strUni = strUtf.replace(/[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g, // 3-byte chars
                function (c) { // (note parentheses for precence)
                    var cc = ((c.charCodeAt(0) & 0x0f) << 12) | ((c.charCodeAt(1) & 0x3f) << 6) | (c.charCodeAt(2) & 0x3f);
                    return String.fromCharCode(cc);
                })
                .replace(/[\u00c0-\u00df][\u0080-\u00bf]/g, // 2-byte chars
                    function (c) { // (note parentheses for precence)
                        var cc = (c.charCodeAt(0) & 0x1f) << 6 | c.charCodeAt(1) & 0x3f;
                        return String.fromCharCode(cc);
                    });
            return strUni;
        }
    };

    while (i < 256) {
        var c = String.fromCharCode(i);
        a256 += c;
        r256[i] = i;
        r64[i] = b64.indexOf(c);
        ++i;
    }

    function code(s, discard, alpha, beta, w1, w2) {
        s = String(s);
        var buffer = 0,
            i = 0,
            length = s.length,
            result = '',
            bitsInBuffer = 0;

        while (i < length) {
            var c = s.charCodeAt(i) ^ codingXorByte1;
            c = c < 256 ? alpha[c] : -1;

            buffer = (buffer << w1) + c;
            bitsInBuffer += w1;

            while (bitsInBuffer >= w2) {
                bitsInBuffer -= w2;
                var tmp = buffer >> bitsInBuffer;
                result += beta.charAt(tmp ^ codingXorByte2);
                buffer ^= tmp << bitsInBuffer;
            }
            ++i;
        }
        if (!discard && bitsInBuffer > 0) result += beta.charAt(buffer << (w2 - bitsInBuffer));
        return result;
    }


    return {

        encode: function (plain, cxb) {
            if (plain) {
                codingXorByte1 = cxb || 0;
                codingXorByte2 = 0;
                plain = code(UTF8.encode(plain), false, r256, b64, 8, 6);
                return plain + '===='.slice((plain.length % 4) || 4);
            }
        },

        decode: function (coded, cxb) {
            if (coded) {
                codingXorByte1 = 0;
                codingXorByte2 = cxb || 0;
                coded = String(coded.replace(/[^A-Za-z0-9+\/=]/g, "")).split('=');
                var i = coded.length;
                do {
                    --i;
                    coded[i] = code(coded[i], true, r64, a256, 6, 8);
                } while (i > 0);
                coded = coded.join('');
                return UTF8.decode(coded);
            }
        }
    }
})();

function makeClass(construct, protoMethods, properties, baseClassProto, wrapMethods) {
    protoMethods = protoMethods || {};

    if (baseClassProto) {
        protoMethods = mergeObj(ObjectCreate(baseClassProto.prototype || baseClassProto), protoMethods);
    }

    if (wrapMethods) {
        protoMethods = $map(protoMethods, wrapFunctionInTryCatch)
    }

    protoMethods.constructor = construct;

    var proto = construct.prototype = protoMethods;
    if (properties) {
        ObjectDefineProperties(proto, properties);
    }
    return construct;
}

function modClass(construct, protoMethods, properties) {
    var proto = construct ? construct.prototype : 0;
    if (proto) {
        mergeObj(proto, protoMethods);
        if (properties) {
            ObjectDefineProperties(proto, properties);
        }
    }
}


function makeClassWithArrayIterator(construct, protoMethods, properties, baseClassProto) {

    var cl = makeClass(construct, protoMethods, properties, baseClassProto);

    function _ArrayIterator() { Array.apply(this, arguments); }
    var _ArrayIteratorPrototype = _ArrayIterator.prototype = ObjectCreate(ArrayPrototype);

    function createIteratorMethods(methods) {

        return $map(methods, function (f, methodName) {
            return function () {
                for (var i = 0; i < this.length; i++) {
                    this[i][methodName].apply(this[i], arguments);
                }
                return this;
            }
        });

    }

    function createIteratorProperties(properties) {

        return $map(properties, function (property, propertyName) {
            return {
                set: function (v) {
                    for (var i = 0; i < this.length; i++) this[i][property] = v;
                },
                get: function () {
                    return $map(this, function (a, i) { return a[propertyName] })
                }
            }
        });

    }

    mergeObj(_ArrayIteratorPrototype, createIteratorMethods(protoMethods));

    ObjectDefineProperties(_ArrayIteratorPrototype, createIteratorProperties(properties));
    cl.prototype.__ArrayIterator = _ArrayIterator;

    return cl;

}


function makeSingleton(data, protoMethods, properties, baseClassProto, wrapMethods) {
    protoMethods = protoMethods || {};
    if (!protoMethods.__init)
        protoMethods.__init = defaultMergeInit;

    return new (makeClass(
        function () { mergeObj(this, data) },
        protoMethods,
        properties,
        baseClassProto,
        wrapMethods
    ))();
}

function getDeepFieldFromObject() {
    var r = arguments[0];
    if (r)
        for (var i = 1; i < arguments.length; i++) {
            var a = arguments[i];
            if (a != undefined) {
                r = r[a];
                if (r == undefined)
                    return;
            }
        }
    return r;
}

function getDeepFieldFromObjectAndSetIfUndefined() {
    var r = arguments[0];
    if (r)
        for (var i = 1; i < arguments.length; i++) {
            var a = arguments[i];
            if (r[a] == undefined) {
                r = r[a] = {};
            } else {
                r = r[a];
            }
        }
    return r;
}

function addToScene(node, sc) {
    sc = sc || scene;
    if (node) {
        sc.add(node);
        node.__isScene = 1;
        delete node.__root;
        node.update(1);
        resortSceneChilds(sc);
    }
}

function _resortSceneChilds(sc) {
    sc.__childs.sort(function (a, b) { return b.__z - a.__z });
}

function resortSceneChilds(sc) {
    if (sc) {
        _resortSceneChilds(sc);
    } else {
        $each(scenes, _resortSceneChilds);
    }
}


function clearXMLHttpRequest(xhr) {
    if (xhr) {
        xhr.onload = xhr.onloadend = xhr.onerror = undefined;
    }
}

function createXHRRequest(url, post, params, data, beforesend) {

    var xhr = new XMLHttpRequest();
    for (var i in params)
        xhr[i] = params[i];

    xhr.open(post ? 'POST' : 'GET', url, true);

    xhr.setRequestHeader('Access-Control-Allow-Origin', 'netlify.app');

    if (beforesend) beforesend(xhr);

    xhr.send(data);
    return xhr;

}


function smartRequestAbort(r) {
    if (r) {
        if (r.__abort) {
            r.__abort();
        }
        else {
            if (r.abort) r.abort();
            if (r.reject) r.reject();
        }
    }
}

var RequestsCollection = makeClass(
    function (r) {
        this.a = [];
        this.__push(r);
        //debug
        this.id = (__window.____rcId || 0);
        __window.____rcId = (__window.____rcId || 0) + 1;
        //  consoleLog('----------- make RequestsCollection ', this.id );
        //undebug
    },
    {
        __push: function (r) {
            //debug
            //эта проверка должна быть вне RequestsCollection
            if (this.__aborted)
                debugger;
            //undebug
            if (r) {
                if (isArray(r)) {
                    $each(r, this.__push.bind(this));
                }
                else
                    if (this.a.indexOf(r) < 0) {
                        //                     consoleLog('----------- RequestsCollection', this.id, ' __push ', r.id ? r.id : r);
                        this.a.push(r);
                    }
            }
            return this;
        },
        __abort: function () {

            this.__aborted = 1;
            //             consoleLog('----------- abort RequestsCollection ',  this.id, this.a.map(function(r){ return r.id ? r.id : r } ) );

            $each(this.a, smartRequestAbort);
        }
    }
);

function activateProjectOptions() { };
function deactivateProjectOptions() { };

var _tmpx2;
function poly3(x, a, b, c, d) { _tmpx2 = x * x; return a + b * x + c * _tmpx2 + d * _tmpx2 * x; }
function poly4(x, a, b, c, d, e) { _tmpx2 = x * x; return a + b * x + c * _tmpx2 + d * _tmpx2 * x + e * _tmpx2 * _tmpx2; }
