

// x is the fraction of animation progress, in the range 0..1
function bounceOut(x) { var n1 = 7.5625, d1 = 2.75; if (x < 1 / d1) return n1 * x * x; else if (x < 2 / d1) return n1 * (x -= (1.5 / d1)) * x + .75; else if (x < 2.5 / d1) return n1 * (x -= (2.25 / d1)) * x + .9375; else return n1 * (x -= (2.625 / d1)) * x + .984375; }
function createPowEasing(p) {
    return {
        i (x) { return pow(x, p) },
        o (x) { return 1 - pow(1 - x, p); },
        io (x) { return x < 0.5 ? pow(x * 2, p) / 2 : (1 - pow(-2 * x + 2, p) / 2); }
    }
}

var c1 = 1.70158, c2 = c1 * 1.525, c3 = c1 + 1, c4 = (2 * PI) / 3, c5 = (2 * PI) / 4.5;
function easeLinear(t) { return t }
var easeQuad = createPowEasing(2),
    easeQuadI = easeQuad.i, easeQuadO = easeQuad.o, easeQuadIO = easeQuad.io,
    easeCubic = createPowEasing(3),
    easeCubicI = easeCubic.i, easeCubicO = easeCubic.o, easeCubicIO = easeCubic.io,
    easeQuart = createPowEasing(4),
    easeQuartI = easeQuart.i, easeQuartO = easeQuart.o, easeQuartIO = easeQuart.io,
    easeQuint = createPowEasing(5),
    easeQuintI = easeQuint.i, easeQuintO = easeQuint.o, easeQuintIO = easeQuint.io,
    easeSine = { i (x) { return 1 - cos(x * PI2); }, o (x) { return sin(x * PI2); }, io (x) { return (1 - cos(PI * x)) / 2; } },
    easeSineI = easeSine.i, easeSineO = easeSine.o, easeSineIO = easeSine.io,
    easeExpo = { i (x) { return x === 0 ? 0 : pow(2, 10 * x - 10); }, o (x) { return x === 1 ? 1 : 1 - pow(2, -10 * x); }, io (x) { return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? pow(2, 20 * x - 10) / 2 : (2 - pow(2, -20 * x + 10)) / 2; } },
    easeExpoI = easeExpo.i, easeExpoO = easeExpo.o, easeExpoIO = easeExpo.io,
    easeCirc = { i (x) { return 1 - sqrt(1 - x * x); }, o (x) { return sqrt(1 - pow(x - 1, 2)); }, io (x) { return x < 0.5 ? (1 - sqrt(1 - 4 * x * x)) / 2 : (sqrt(1 - pow(2 - 2 * x, 2)) + 1) / 2; } },
    easeCircI = easeCirc.i, easeCircO = easeCirc.o, easeCircIO = easeCirc.io,
    easeElastic = { i (x) { return x === 0 ? 0 : x === 1 ? 1 : -pow(2, 10 * x - 10) * sin((x * 10 - 10.75) * c4); }, o (x) { return x === 0 ? 0 : x === 1 ? 1 : pow(2, -10 * x) * sin((x * 10 - 0.75) * c4) + 1; }, io (x) { return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? -(pow(2, 20 * x - 10) * sin((20 * x - 11.125) * c5)) / 2 : pow(2, -20 * x + 10) * sin((20 * x - 11.125) * c5) / 2 + 1; } },
    easeElasticI = easeElastic.i, easeElasticO = easeElastic.o, easeElasticIO = easeElastic.io,
    easeBack = { i (x) { return c3 * x * x * x - c1 * x * x; }, o (x) { return 1 + c3 * pow(x - 1, 3) + c1 * pow(x - 1, 2); }, io (x) { return x < 0.5 ? (pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2 : (pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2; } },
    easeBackI = easeBack.i, easeBackO = easeBack.o, easeBackIO = easeBack.io,
    easeBounce = { i (x) { return 1 - bounceOut(1 - x); }, o: bounceOut, io (x) { return x < 0.5 ? (1 - bounceOut(1 - 2 * x)) / 2 : (1 + bounceOut(2 * x - 1)) / 2; } },
    easeBounceI = easeBounce.i, easeBounceO = easeBounce.o, easeBounceIO = easeBounce.io;

var easeArrayForEasingConversionFromDigit = [
/*  0   */ easeLinear,
/*  1   */ easeSineIO,      /*  2   */ easeSineI,       /*  3   */ easeSineO,
/*  4   */ easeElasticIO,   /*  5   */ easeElasticI,    /*  6   */ easeElasticO,
/*  7   */ easeExpoIO,      /*  8   */ easeExpoI,       /*  9   */ easeExpoO,
/*  10  */ easeQuadIO,      /*  11  */ easeQuadI,       /*  12  */ easeQuadO,
/*  13  */ easeCubicIO,     /*  14  */ easeCubicI,      /*  15  */ easeCubicO,
/*  16  */ easeQuartIO,     /*  17  */ easeQuartI,      /*  18  */ easeQuartO,
/*  19  */ easeQuintIO,     /*  20  */ easeQuintI,      /*  21  */ easeQuintO,
/*  22  */ easeCircIO,      /*  23  */ easeCircI,       /*  24  */ easeCircO,
/*  25  */ easeBackIO,      /*  26  */ easeBackI,       /*  27  */ easeBackO,
/*  28  */ easeBounceIO,    /*  29  */ easeBounceI,     /*  30  */ easeBounceO
];




function Tween() {
    UpdatableProto.call(this);
}

makeClass(Tween, {

    __zeroUpdate() { },

    __update(t, dt) {
        $each(this.a, b => { b.__markedForRemove = b.__update(t, dt) });
        this.a = this.a.filter(function (b) { return !b.__markedForRemove });
    },

    __setOnComplete(c) {
        this.__onCompleted = c; return this;
    },

    __finishOf(obj, property) {
        var t = this;
        if (property) {
            $each(t.a, function (action) {
                if (action && (action == obj || (action.A && action.o == obj && action.A[property])) && action.__finish) {
                    action.__finish();
                }
                else {
                    if (action.__finishOf)
                        return action.__finishOf(obj, property);
                }
            });
        } else {
            $each(t.a, function (action) {
                if (action && (action == obj || action.o == obj) && action.__finish) {
                    action.__finish();
                }
                else {
                    if (action.__finishOf)
                        action.__finishOf(obj);
                }
            });

        }
        return t;
    },

    __killOf(obj, property) {
        if (!obj) return;

        var t = this;

        if (property) {

            t.a = t.a.filter(function (action) {

                // removing tween
                if (action == obj)
                    return 0;

                // removing TweenAction by object and property
                if (action.A && action.o && action.o == obj && action.A[property])
                    return 0;

                // removing TweenSequence by object and property
                if (action.__killOf)
                    return action.__killOf(obj, property);

                return 1;
            });

        } else {

            t.a = t.a.filter(function (action) {
                // removing tween
                if (action == obj)
                    return 0;

                // removing TweenAction by object
                if (action.o && action.o == obj)
                    return 0;

                // removing TweenSequence by object
                if (action.__killOf)
                    return action.__killOf(obj);

                return 1;
            });

        }

        return t.a.length;
    },

    __softkill(){
        this.__markedForRemove = this.__update = a => 1;
    }

}, {}, UpdatableProto);

var tween = new Tween();

function TweenSequence(arr) {
    this.i = 0;
    Tween.call(this);
    for (var i in arr) this.__push(tween._to(arr[i]));
}

makeClass(TweenSequence, {
    __update(time, dt) {
        var t = this
            , current = t.a[t.i];
        if (!current || current.__update(time, dt)) {
            t.i++;
            return t.i >= t.a.length ? 1 : t.__update(time, dt);
        }
        return 0;
    }
}, {}, Tween);


function TweenCallback(cb, o) { this.cb = cb; this.o = o; }

makeClass(TweenCallback, {
    __killOf: 0,
    __update(t, dt) { this.o = 0; return ifdef(this.cb(dt), 1) }
}, {}, Tween);

function getEasingFunc(e) {

    return isNumeric(e) ? easeArrayForEasingConversionFromDigit[e] : (e ? (e.io ? e.io : e) : easeSineIO);

}

function CustomTweenAction(object, params) { // ActionChanger3 js impl
    var t = this;
    t.o = object;
    t.d = 0; // default delay
    t.t = 0.5; // default time
    mergeObj(t, params);
}
makeClass(CustomTweenAction, {

    __shiftBy (time) {
        var t = this;
        time *= ONE_SECOND;
        if (t.s) t.s -= time;
        else t.d -= time;
    },

    __finish () {
        //TODO: check it. it's not real finish! it's update in feature!
        this.__update((t.s || 1) + t.d + t.t + 1, 1);
    },

    __speedup (mult) {
        var t = this, tt = t.t, dd = t.d;
        t.t /= mult;
        t.d /= mult;
        if (t.s) {
            t.s = (t.s + dd) / mult - t.d;
        }
    },

    __getElapsedTime () {
        return (__lastOnFrameTime - this.s - this.d) / ONE_SECOND;
    },

    __update (time, dt) {
        var t = this;

        //debug
        time = __forceAnimTime;
        dt = __forceAnimDt;
        //undebug

        if (!t.s) {
            t.s = time;
            if (t.__onStart) {
                t.__onStart();
            }
        }
        t.__elapsed = time - t.s - t.d;
        if (t.__elapsed >= 0) {
            var linearPart = t.__elapsed / t.t;
            if (t.__onUpdate && t.__onUpdate(linearPart)) {
                return 1;
            }
            if (linearPart >= 1) {  // completed
                return t.__onCompleted ? t.__onCompleted() : 1;
            }
        }
    },

    __killOf: 0
}, {}, Tween);


function TweenAction(parameters, a, b, c, d, e, agasp) { // ActionChanger3 js impl
    var t = this;
    if (a) // ( target, to, time, repeat, easing, delay, agasp )
    {
        t.o = parameters;
        t.t = (b || 0.5);
        t.r = c;
        t.e = getEasingFunc(d);
        t.d = e || 0;
        if (agasp) t.g = agasp;
        parameters = a;
    }
    else {

        t.o = parameters.o; delete parameters.o; // target object 
        if (parameters.p) {
            var animParams = parameters.p;

            t.e = getEasingFunc(animParams.e); // easing
            t.t = animParams.t || 0.5; // time of animation
            // p.r : repeat of animation ( -1 for infinite loop )
            t.r = animParams.r;
            t.d = animParams.d || 0;
            if (animParams.g) t.g = animParams.g;
            delete parameters.p;
        } else {
            t.e = easeSine.io; // easing
            t.t = 0.5;
            t.d = 0;
        }
    }

    t.t *= ONE_SECOND;
    t.d *= ONE_SECOND;
    t.i = t.r < -1 ? 1 : (abs(t.r) == 1 ? 0 : -1); // repeatIncrement
    t.p = parameters; // list of values. s = source, d = destination
    //   consoleLog(t);
}

makeClass(TweenAction, {

    __killOf: 0,

    __shiftBy (time) {
        var t = this;
        time *= ONE_SECOND;
        if (t.s) {
            t.s -= time;
        } else {
            t.d -= time;
        }
    },

    __speedup (mult) {
        var t = this, tt = t.t, dd = t.d;
        if (abs(t.r) != 1) {  //can't speedup infinity animation ??
            t.t /= mult;
            t.d /= mult;
            if (t.s) {
                t.s = (t.s + dd) / mult - t.d;
            }
        }
    },

    __finish () {
        // it's not real finish! it's update in feature!
        if (!t.r) { // TODO: how to finish such anims?
            this.__update((t.s || 1) + t.d + t.t + 1, 1);
        }
    },

    __getElapsedTime () {
        return (__lastOnFrameTime - this.s - this.d) / ONE_SECOND;
    },

    __initA () {
        var t = this;
        t.A = {};
        for (var i in t.p) {
            var propTargets = t.p[i]
                , baseValue = t.g ? t.o[i] : 0;

            if (isArray(propTargets)) {
                t.A[i] = { s: baseValue + propTargets[0], d: baseValue + propTargets[1] };
            } else if (isObject(propTargets)) {
                t.A[i] = propTargets;
            } else if (isFunction(propTargets)) {
                t.A[i] = { s: t.o[i] };
                ObjectDefineProperty(t.A[i], 'd', { get: propTargets })
            } else {
                t.A[i] = { s: t.o[i], d: baseValue + propTargets };
            }
        }
    },

    __zeroUpdate () {
        var t = this;
        if (!t.g && !t.d) {
            for (var i in t.p) {
                var propTargets = t.p[i];
                if (isArray(propTargets)) {
                    t.o[i] = propTargets[0];
                }
            }
        }
        return t;
    },
    __lerp(){
        var part = this.__part, part1 = this.__part1;
        for (var i in this.A) {
            var a = this.A[i];
            this.o[i] = a.s * part1 + a.d * part;
        }
    },
    __update (time, dt) {
        var t = this;
        if (!t.s) {
            t.s = time;
        }

        //debug
        //         var p = 0;
        //         var needFps = 10;
        //         for (var i = 0;i < 10 * 100000 / needFps;i++){
        //             p += sin(i);
        //         }
        //undebug

        t.__elapsed = time - t.s - t.d;
        if (t.__elapsed >= 0) {

            if (!t.A) {
                t.__initA();
            }

            t.__linearPart = clamp(t.__elapsed / t.t, 0, 1);
            t.__part = t.e(t.__linearPart),
            t.__part1 = 1 - t.__part;
            t.__lerp();

            if (t.__linearPart == 1) {  // completed

                if (!t.r) {
                    if (t.__onCompleted) t.__onCompleted();
                    return 1; // end of repeat loop or all animation :(
                }
                else {
                    // just swap started and destination for ping pong
                    t.r += t.i;

                    if (t.g) {
                        if (isFunction(t.g)) {
                            t.g(t);
                        }
                        else {
                            if (t.g == 2) { // agasp like plus and reset
                                t.s = 0;
                                t.A = 0;
                                t.d = 0;
                                if (t.r == 0) {
                                    if (t.__onCompleted) t.__onCompleted();
                                    return 1;
                                } else {
                                    t.__initA();
                                }
                            } else {
                                if (t.g != 3) { // like plus and repeat with saving delay
                                    t.d = 0;
                                }
                            }
                        }
                    } else {
                        t.d = 0;
                    }

                    t.s = time;
                    if (t.r < 0) {
                        for (var i in t.A) {
                            var a = t.A[i], tmp = a.s;
                            a.s = a.d; a.d = tmp;
                        }
                    }

                    if (t.r == 0) {
                        if (t.__onCompleted) t.__onCompleted();
                        return 1;
                    }
                }

            }
        }
    }
}, {}, Tween);

function KeyframesAnimation(o, p, frames, loopTime, easing, loopDisabled, lerpFactor, speed) {
    var t = this;
    t.o = o;
    t.p = p;
    t.r = 1;
    t.lp = lerpFactor;

    t.e = getEasingFunc(easing);

    t.l = loopTime == undefined ? 1000 : (loopTime * 10);

    t.L = !loopDisabled;

    t.__setFrames(frames);

    t.__speed = ifdef(speed, 1);
}

//debug
var __forceAnimTime = 0;
var __forceAnimDt = 0;
//undebug

makeClass(KeyframesAnimation, {

    __killOf: 0,

    __setFrames (frames) {
        var t = this;
        //debug
        t.frames = frames;
        //undebug
        t.f = frames;
        for (var i in frames) {
            var v = frames[i].va, st;
            if (v) {
                if (t.lp) {
                    st = t.__setters.lp;
                } else {
                    st = t.__setters.va;
                }
            } else {
                v = frames[i].v;
                st = t.__setters.v;
            }
            if (v) {
                if (isArray(v)) {
                    t.set = st.a; t.v = [];
                    t.tp = 0;
                }
                else
                    if (isObject(v)) {
                        t.set = st.a; t.v = {};
                        t.tp = 1;
                    }
                    else {
                        t.set = st.f;
                        t.tp = 2;
                    }
                break;
            }
        }
    },

    __setters: {
        v: {
            a (part) {
                var t = this, s = t.c.s.v, d = t.c.d.v, part1 = 1 - part;
                for (var i in d) t.v[i] = s[i] * part1 + d[i] * part;
                t.o[t.p] = t.v;
            },
            f (part) {
                var t = this;
                t.o[t.p] = t.c.s.v * (1 - part) + t.c.d.v * part;
            }
        },
        va: {
            a (part) {
                var t = this, s = t.c.s.va, d = t.c.d.va, part1 = 1 - part;
                for (var i in d) t.v[i] = s[i] * part1 + d[i] * part;
                t.o[t.p] = t.v;
            },
            f (part) {
                var t = this;
                t.o[t.p] = t.c.s.va * (1 - part) + t.c.d.va * part;
            }
        },

        lp: {
            a (part) {
                var t = this, tc = t.c, p0 = tc.s.va, p1 = tc.d1, p2 = tc.d2, p3 = tc.d.va, part1 = 1 - part, sqrp1 = part1 * part1 * part1, sqrp = part * part * part, sqpp1 = 3 * part1 * part;
                for (var i in p0) {
                    t.v[i] = p0[i] * sqrp1 + sqpp1 * (part1 * p1[i] + part * p2[i]) + sqrp * p3[i];
                }
                t.o[t.p] = t.v;
            },

            f (part) {
                var t = this, tc = t.c, p0 = tc.s.va, p1 = tc.d1, p2 = tc.d2, p3 = tc.d.va, part1 = 1 - part, sqrp1 = part1 * part1 * part1, sqrp = part * part * part, sqpp1 = 3 * part1 * part;
                t.o[t.p] = p0 * sqrp1 + sqpp1 * (part1 * p1 + part * p2) + sqrp * p3;
            }
        }

    },

    //debug
    editorSupportedUpdate (needReset) {
        if (needReset) {
            this.s = 0;
            this.__setFrames(this.frames);
        }
        if (this.set)
            this.__update(0);
    },
    //undebug

    __finish () {
        var t = this;
        if (!t.L && t.set) { // how to finish loops?

            // set values from last frame
            if (t.a) {
                t.c = t.a[t.a.length - 1];
            } else
                if (t.f) {
                    for (var i in t.f) {
                        t.m = mmax(t.m, Number(i));
                    }
                    t.c = { s: t.f[i], i: t.m * 10, d: t.f[i] };
                }

            if (t.c) {
                t.set(1);
            }
        }
    },

    __speedup (mult) {
        var t = this;
        this.__speed = mult;
        if (t.s) {
            t.s = t.s / mult;
        }
    },

    __update (time, dt) {
        var t = this;
        //debug
        if (!__forceAnimDt) return;
        //undebug
        time = time * t.__speed;

        if (t.r) {
            t.s = time;
            t.r = 0;
            t.m = 0;
            t.a = [];

            for (var i in t.f) {
                i = Number(i);
                t.m = mmax(t.m, i);
                t.a.push({ s: t.f[i], i: i * 10 });
            }

            t.a.sort(function (a, b) { return a.i - b.i });
            var l = t.a.length;
            for (var i = 0; i < l; i++) {
                var frame = t.a[i];
                frame.k = i;

                frame.$ = frame.s.$ ? getEasingFunc(frame.s.$) : t.e;

                var nextframe = t.a[1 + i];
                if (nextframe) {
                    frame.d = nextframe.s;
                    frame.t = nextframe.i;
                    frame.T = frame.t - frame.i;
                }
                else {
                    if (t.L) {
                        nextframe = t.a[0];
                        frame.d = nextframe.s;
                        frame.t = frame.i + t.l;
                        frame.T = t.l;
                        t.lt = frame.t;
                        /*
                        var lastDummyFrame = {
                            k : i + 1,
                            i : t.lt - loopTime,
                            t : t.lt,
                            T : loopTime,
                            d : t.a[0].s,
                            s : frame.d
                        };
                        lastDummyFrame.$ = frame.$;
                        t.a.push( lastDummyFrame );
                        */
                    } else {
                        frame.d = t.f[t.m];
                        frame.t = frame.i;
                        frame.T = 1;
                    }
                }
            }

            //             console.log(t.a);
            //             debugger;

            if (t.lp) {
                t.lp = clamp(t.lp / 2, 0, 0.5);
                var frame, nextframe, lastframe = t.L ? t.a[t.a.length - 1] : t.a[0];

                for (var i = 0; i < t.a.length; i++) {
                    frame = t.a[i];
                    nextframe = t.a[i + 1] || (t.L ? t.a[0] : frame);
                    var d1, d2, s, d, tmp;
                    switch (t.tp) {
                        case 1: d1 = {}; d2 = {}; break;
                        case 0: d1 = []; d2 = []; break;
                    }
                    if (t.tp == 2) { // float
                        // TODO: may be not works. not used now
                        d1 = lerp(frame.s.va, lastframe.s.va, -t.lp);
                        d2 = lerp(frame.d.va, nextframe.d.va, -t.lp);
                    } else { // object or array

                        if (lastframe.d2) {
                            if (nextframe.d1) {
                                for (var j in frame.d.va) {
                                    s = frame.s.va[j];
                                    d = frame.d.va[j];
                                    d2[j] = 2 * d - nextframe.d1[j];
                                    d1[j] = 2 * s - lastframe.d2[j];
                                }
                            } else {
                                for (var j in frame.d.va) {
                                    s = frame.s.va[j];
                                    d = frame.d.va[j];
                                    d1[j] = 2 * s - lastframe.d2[j];
                                    d2[j] = lerp(d, nextframe.d.va[j], -t.lp);
                                    d2[j] = lerp(d2[j], d1[j], t.lp);
                                }
                            }
                        } else {
                            for (var j in frame.d.va) {
                                s = frame.s.va[j];
                                d = frame.d.va[j];
                                d1[j] = lerp(s, lastframe.s.va[j], -t.lp);
                                d2[j] = lerp(d, nextframe.d.va[j], -t.lp);
                                tmp = d1;
                                d1[j] = lerp(d1[j], d2[j], t.lp / 2);
                                d2[j] = lerp(d2[j], tmp[j], t.lp / 2);
                            }
                        }
                        frame.d1 = frame.s.d1 || d1;
                        frame.d2 = frame.s.d2 || d2;
                    }

                    lastframe = frame;
                }

                if (t.tp != 2) { // normalization
                    lastframe = t.L ? t.a[t.a.length - 1] : t.a[0];
                    for (var i = 0; i < t.a.length; i++) {
                        frame = t.a[i];
                        nextframe = t.a[i + 1] || (t.L ? t.a[0] : frame);
                        for (var j in frame.d.va) {
                            if (!frame.s.d1) frame.d1[j] = lerp(frame.d1[j], frame.d2[j], t.lp);
                            if (!lastframe.s.d2) lastframe.d2[j] = 2 * frame.s.va[j] - frame.d1[j];
                        }
                        lastframe = frame;
                    }
                }

            }

            t.c = t.a[0];
            if (!t.L) {
                t.a.pop();
                t.lt = 1;
            }
            delete t.f;

        }

        //debug
        time = __forceAnimTime * t.__speed;
        //undebug

        var elapsed = time - t.s;

        //debug 
        //time can move back!
        if (t.L) {
            elapsed = fract(elapsed / (t.lt + 0.00001)) * t.lt;
        }

        if (t.c && !(elapsed >= t.c.i && elapsed < t.c.t)) {
            t.c = 0;
        }

        if (!t.c) {
            //find normal frame
            for (var i = 0, l = t.a.length; i < l; i++) {
                var frame = t.a[i];
                if (elapsed >= frame.i && elapsed < frame.t) {
                    t.c = frame;
                    break;
                }
            }

            // set first or last frame
            if (!t.L && !t.c) {
                if (t.a[0] && t.a[0].i >= elapsed) {
                    t.c = t.a[0];
                } else {
                    t.c = t.a[t.a.length - 1];
                }
            }
        }
        //undebug

        if (t.c) {

            var part = clamp((elapsed - t.c.i) / t.c.T, 0, 1);
            t.set(t.c.$(part));
            if (part == 1) {

                // hack for normal continue animation then delta time > 0.5 sec
                if (elapsed > t.c.t + 500) {
                    elapsed = t.c.t;
                    t.s = time - elapsed;
                }

                t.c = t.a[t.c.k + 1];
                if (!t.c) {
                    if (t.L) {
                        t.s += t.lt;
                        t.c = t.a[0];
                    } else {
                        return options.__autoRemoveKeyFrameAnimation;
                    }
                }
            }
            return 0;
        }

        return options.__autoRemoveKeyFrameAnimation;

    }
}, {}, Tween);

// __window.__debugMatricesUpdates = 1;

function rememberAnims() {
    var arr = [];
    if (!tween.____push) tween.____push = tween.__push;
    tween.__push = function (o) { arr.push(o); this.a.push(o); return o; }
    return arr;
}


function disableRememberAnims(animArray) {
    if (tween.____push) {
        tween.__push = tween.____push;
        delete tween.____push;
    }
}


tween._to = function (o) {
    var a = isArray(o);
    if (a && o.length > 2 && isNumeric(o[2])) // [ target, to, time, repeat, easing, delay, agasp ]
        return new TweenAction(o[0], o[1], o[2], o[3], o[4], o[5], o[6]);
    return a ? new TweenSequence(o) : isFunction(o) ? new TweenCallback(o) : new TweenAction(o);
};

tween.action = function (obj, params, time, repeat, easing, delay, agasp) {
    if (obj) return this.__push(new TweenAction(obj, params, time, repeat, easing, delay, agasp).__zeroUpdate());
}

tween.to = function (o, a, b, c, d, e, agasp) {
    return a ? o ? this.__push(new TweenAction(o, a, b, c, d, e, agasp).__zeroUpdate()) : null : this.__push(tween._to(o));
}

updatable.__push(tween);

var anim = tween.to.bind(tween), killAnim = function(a, b) { tween.__killOf(a, b) }, finishAnim = tween.__finishOf.bind(tween);
