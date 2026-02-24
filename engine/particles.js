
// TODO: force to component


var PDM = createDeobfuscatingMap({
    x: 1, y: 1, z: 1, rad: 1, trans: 1,
    r: 1, g: 1, b: 1, a: 1,
    width: 1, height: 1,
    __live: 1,
    __defaultComponent: 1,
    __radTransEmitterComponent: 1,
    __colorEmitterComponent: 1,
    origin: 1

})

, _xy_hz_ = [PDM.x, PDM.y]
, _rt_hz_ = [PDM.rad, PDM.trans]
, _xyz_hz_ = [PDM.x, PDM.y, PDM.z]
, _rgba_hz_ = [PDM.r, PDM.g, PDM.b, PDM.a]
, _wh_hz_ = [PDM.width, PDM.height];
 

function defaultZeroFunction() { return 0 }
function defaultOneFunction() { return 1 }

var _prtM4_ = new Matrix4(), _prtM4_e = _prtM4_.e;

function addComponentProp(props, obj, p) {
    if (props) {
        if (isObject(props[p])) {
            obj[p] = props[p];
        } else {
            obj[p] = {
                get() { return this.p[p]; },
                set(v) { this.p[p] = v; }
            }
        }
    }
}



function componentPropertyWithReinit(k1, k2) {
    k2 = k2 || k1;
    return createSomePropertyWithGetterAndSetter(
        function () { return this.p[k2]; },
        function (v) { this.p[k2] = v; this.__needReinit = 1; }
    );
}

function __propertiesWithReinit(o, bo) {
    o = $map(o, componentPropertyWithReinit);
    return bo ? mergeObj(bo, o) : o;
}


function getCurvePoint(arr, part, i) {
    return [part, arr[i][1], arr[i][2] || 0];
}

function makeCurveValues(arr) {
    // consoleLog( 'makeCurveValues', arr );
    // normalize
    arr = $filter(arr, function (o) { return o != undefined });
    if (arr.length == 0) arr.push([0, 0]);
    if (arr.length == 1) arr.push([1, arr[0][1]]);
    arr.sort(function (a, b) { return a[0] - b[0] });

    var minKey = arr[0][0];
    var maxKey = arr[arr.length - 1][0];

    //     consoleLog( 'makeCurveValues', JSON.stringify( arr ), minKey, maxKey);

    if (minKey < 0 || maxKey > 1) {
        for (var i = 0; i < arr.length; i++) arr[i][0] = (arr[i][0] - minKey) / (maxKey - minKey);
    } else {
        if (minKey > 0) {
            arr.unshift(getCurvePoint(arr, 0, 0));
        }
        if (maxKey < 1) {
            arr.push(getCurvePoint(arr, 1, arr.length - 1));
            //             consoleLog(JSON.stringify( arr ));
        }
    }

    // interpolate
    var result = [];
    var curarrindex = 0;
    var maxind = arr.length - 1;
    var maxXDiff = 1 / options.__particlesCurveValuesCacheSize;
    for (var i = 0; i < options.__particlesCurveValuesCacheSize + 1; i++) {
        var part = i / options.__particlesCurveValuesCacheSize;
        if (curarrindex == maxind + 1) {
            result.push(arr[maxind][1]);
        }
        else {
            if (arr[curarrindex][0] < part) {
                curarrindex++;
            }

            if (curarrindex == 0) {
                result.push(arr[0][1]);
            } else {
                var ub = arr[curarrindex];
                if (ub[0] == part) {
                    result.push(arr[curarrindex][1]);
                } else {
                    var lb = getCurvePoint(arr, arr[curarrindex - 1][0], curarrindex - 1);
                    result.push(lb[1] + (ub[1] - lb[1]) * (easeArrayForEasingConversionFromDigit[lb[2]] || easeLinear)((part - lb[0]) / (mmax(maxXDiff, ub[0] - lb[0]))));
                }
            }
        }
    }

    return result;

}

function hzValueGenerator(v, defaultValue, objargs) {
    var arr;

    if (isFunction(v)) return v;

    if (v == undefined) v = defaultValue || 0;

    if (objargs) { // Vector values generator
        var argscount = objargs.length;
        var construct;

        if (isObject(v)) {
            var used_random = 0;
            var garr = [];

            for (var i = 0; i < argscount; i++) {

                var oai = objargs[i];
                var val = v.hasOwnProperty(oai) ? v[oai] : defaultValue;

                var getter = hzValueGenerator(val);
                if (getter.__used_random) {
                    used_random = 1;
                }
                garr[i] = getter;

            }

            // TODO: if (getter.__simpleNumeric) { ..
            if (!used_random)
                for (var i = 0; i < argscount; i++) {
                    getter = garr[i];
                    var getterarr = [];
                    for (var j = 0; j < options.__particlesCurveValuesCacheSize + 1; j++) {
                        getterarr.push(getter(j));
                    }
                    garr[i] = getterarr;
                }

            arr = [];

            if (used_random) {
                //                 var garr2 = [];
                //                 for (var i in garr){
                //                     if ( isFunction(garr[i]) ) garr2.push(garr[i]);
                //                     else garr2.push( function(p){ return garr[i][p]; } );
                //                 }

                switch (argscount) {
                    case 2: construct = function (i) { return new Vector2(garr[0](i), garr[1](i)) }; break;
                    case 3: construct = function (i) { return new Vector3(garr[0](i), garr[1](i), garr[2](i)) }; break;
                    case 4: construct = function (i) { return new Vector4(garr[0](i), garr[1](i), garr[2](i), garr[3](i)) }; break;
                }

                return construct;

            } else {

                switch (argscount) {
                    case 2: construct = function (i) { arr[i] = new Vector2(garr[0][i], garr[1][i]) }; break;
                    case 3: construct = function (i) { arr[i] = new Vector3(garr[0][i], garr[1][i], garr[2][i]) }; break;
                    case 4: construct = function (i) { arr[i] = new Vector4(garr[0][i], garr[1][i], garr[2][i], garr[3][i]) }; break;
                }

                for (var j = 0; j < options.__particlesCurveValuesCacheSize + 1; j++) {
                    construct(j);
                }
            }

            return function (p) { return arr[p]; }
        }

        var simpleHz = hzValueGenerator(v);
        if (simpleHz) {

            if (simpleHz.__simpleNumeric != undefined) {
                var v = simpleHz.__simpleNumeric;
                switch (argscount) {
                    case 2: construct = function (part) { return new Vector2(v, v); }; break;
                    case 3: construct = function (part) { return new Vector3(v, v, v); }; break;
                    case 4: construct = function (part) { return new Vector4(v, v, v, v); }; break;
                }
            }
            else {
                switch (argscount) {
                    case 2: return function (part) { var v = simpleHz(part); return new Vector2(v, v); }; break;
                    case 3: return function (part) { var v = simpleHz(part); return new Vector3(v, v, v); }; break;
                    case 4: return function (part) { var v = simpleHz(part); return new Vector4(v, v, v, v); }; break;
                }
            }
        }

        if (construct) {
            arr = [];
            for (var i = 0; i < options.__particlesCurveValuesCacheSize + 1; i++)
                arr[i] = construct(i);
        }

        if (arr) return function (p) { return arr[p]; }
    }
    else {

        if (isNumeric(v)) {  // like 0
            var res = function () { return v; };
            res.__simpleNumeric = v;
            return res;
        }

        if (isArray(v)) {
            var v0 = v[0];
            var v1 = v[1];
            var v2 = v[2];

            arr = []; var part = 0;
            if (isNumeric(v0) && v1 === undefined) {
                var res = function () { return v0; };
                res.__simpleNumeric = v0;
                return res;
            } else
                if (isNumeric(v0) && isNumeric(v1)) {

                    if (v1 == 0) {
                        var res = function () { return v0; };
                        res.__simpleNumeric = v0;
                        return res;
                    } else
                        if (v2 == undefined) { // like [1,20] = 1 ± 20
                            var res = function (p, v) { return v0 - v1 * (v ? v : (random() * 2 - 1)); };
                            res.__used_random = 1;
                            return res;
                        } else if (isNumeric(v2)) {  // TODO: variant 5

                        }
                }
                else {
                    if (isArray(v0) && isArray(v1)) { // two curves like [ [ [ 0, 10 ], [1, 50]  ], [ [ 0, 15 ], [1, 100]  ]  ]
                        var a1 = makeCurveValues(v0);
                        var a2 = makeCurveValues(v1);
                        for (var i = 0; i < options.__particlesCurveValuesCacheSize + 1; i++) a2[i] = a2[i] - a1[i];
                        var res = function (p) { return a1[p] + a2[p] * random() };
                        res.__used_random = 1;
                        return res;
                    }
                    else { // one curve like [ [ 0, 10 ], [ 1, 50 ] ]
                        arr = makeCurveValues(isArray(v0) ? v0 : v);
                    }
                }
        }
    }

    if (arr) return function (p) { return arr[p]; }

    console.error('unknown hzValueGenerator', v);
    return function () { return 0; };
}

function makeComponentProps(simple, hz, baseobj) {
    return addProps(hz, addProps(simple, baseobj, addComponentProp), addHZComponentProp)
}


function addHZComponentProp(props, obj, p) {
    var pval = props[p]
        , objargs = isArray(pval) ? pval[0] : 0
        , defaultValue = objargs ? pval[1] : pval;

    obj[p] = createSomePropertyWithGetterAndSetter(
        function () { return this.p[p]; },
        function (v) {
            if (v == undefined) v = defaultValue || 0;
            this.p[p] = isNumeric(v) ? [v] : v;
            this.g[p] = hzValueGenerator(v, defaultValue, objargs);
        }
    );
    return defaultValue;
}


function addEmitterHZProp(props, obj, p) {

    var pval = props[p]
        , objargs = isArray(pval) ? pval[0] : 0
        , defaultValue = objargs ? pval[1] : pval;

    obj[p] = createSomePropertyWithGetterAndSetter(
        function () { return this.p[p]; },
        function (v) {
            if (v == undefined) v = defaultValue || 0;
            this.p[p] = isNumeric(v) ? [v] : v;
            this.g[p] = hzValueGenerator(v, defaultValue, objargs);
            this.__callChange(p);
        }
    );
    options.__defaultParticleEmitterPropertiesValues[p] = defaultValue;
    return defaultValue;

}


function addEmitterProp(props, obj, p) {
    if (isObject(props[p])) {
        obj[p] = props[p];
    } else {
        var defValue = options.__defaultParticleEmitterPropertiesValues[p] = props[p];
        obj[p] = {
            get() { return this.p[p]; },
            set(v) {
                this.p[p] = (v == undefined) ? defValue || 0 : v;
            }
        }
    }
}

































///////////////////////////////////////////////////////////////////////////////////////
//           Components
///////////////////////////////////////////////////////////////////////////////////////

var ComponentDefaultsProtoMethods = {
    __updateParticle(particle, dt) { },
    __destruct(emitter) { },
    __initEmitter(emitter) { },
    __initParticle(particle) { },
    __update(emitter, dt) { },
    __setNeedUpdate() { this.__needReinit = 1 }
};

var EffectComponentsFactory = makeSingleton({

    __registeredComponents: {}
}, {

    __createByType(type, args) {
        if (this.__registeredComponents[type]) return new this.__registeredComponents[type](args)
    },

    __createComponentFromJson(j) {
        if (j.t || j.__componentType)
            return mergeObj(this.__createByType(j.t || j.__componentType), j);

    },

    __componentToJson(c) {
        var o = mergeObj({ __componentType: c.t }, c.p)

        for (var i in emmpropopts) {
            for (var j in emmpropopts[i]) {
                if (o.hasOwnProperty(i) && isValuesEquals(emmpropopts[i][j], o[i])) {
                    delete o[i]
                }
            }
        }
        return o;
    },

    __componentsToJson(c) {
        var p = [];
        for (var i in c) p[i] = this.__componentToJson(c[i]);
        return p;
    },

    __registerComponent(shorttype, c, proto, properties) {

        ObjectDefineProperties(
            mergeObjects([{ t: shorttype, constructor: c }, ComponentDefaultsProtoMethods, proto], c.prototype),
            properties || {}
        );
        this.__registeredComponents[shorttype] = c;

    }

});


/* Component Template

function [...]EmitterComponent()

EffectComponentsFactory.__registerComponent('t',
    function(){  // constructor
        var t = this;
        t.p = { vectorHZ:0, float:0 };
        t.g = {
            vectorHZ : function(){ return defaultZeroVector3 },
            float : function(){ return 0 }
        }
    }, 
    {       // reloaded methods
        __updateParticle: function(particle, dt) { },
        __destruct: function(emitter){ },
        __initEmitter:function(emitter){ },
        __initParticle: function(particle){ },
        __update: function(emitter, dt) { }
    } , 
    makeComponentProps( {  // simple properties
        float: 0
    },      // hz properties
    {
        vectorHZ:[ _xyz_hz_, 0 ]
    })
);

*/


var globalIndecesBuffer = new MyBufferAttribute('', Uint16Array, 1, GL_ELEMENT_ARRAY_BUFFER);
var globalIndecesTailBuffer = new MyBufferAttribute('', Uint16Array, 1, GL_ELEMENT_ARRAY_BUFFER);


function updateIndecesBuffer(buffer, sz, kmod) {
    var indeces = buffer.__getArrayOfSize(sz * 6, 0, 1);
    if (sz > (buffer.__lastFilled || 0)) {
        for (var i = buffer.__lastFilled || 0; i < sz; i++) {
            var k = i * kmod, indofs = i * 6;
            indeces[indofs + 0] = k + 0;
            indeces[indofs + 1] = k + 2;
            indeces[indofs + 2] = k + 1;
            indeces[indofs + 3] = k + 2;
            indeces[indofs + 4] = k + 3;
            indeces[indofs + 5] = k + 1;
        }
        buffer.__lastFilled = sz;
    }
}

function updateColorsBuffer1(emitter, sz) {

    if (emitter.__colorsBuffer) {

        var colors = emitter.__colorsBuffer.__getArrayOfSize(sz * 16);

        for (var i = 0; i < sz; i++) {

            var p = emitter.__particles[i]
                , color_factor = emitter.__colorEmitterComponent.g.color_factor(p.__part)
                , cofs = i * 16
                , color = p.__start_color
                , current_color = p.__current_color

            colors[cofs] = colors[cofs + 4] = colors[cofs + 8] = colors[cofs + 12] = current_color.x = color.x * color_factor.x;
            colors[cofs + 1] = colors[cofs + 5] = colors[cofs + 9] = colors[cofs + 13] = current_color.y = color.y * color_factor.y;
            colors[cofs + 2] = colors[cofs + 6] = colors[cofs + 10] = colors[cofs + 14] = current_color.z = color.z * color_factor.z;
            colors[cofs + 3] = colors[cofs + 7] = colors[cofs + 11] = colors[cofs + 15] = current_color.w = color.w * color_factor.w;

        }
    }

}

function updateColorsBuffer2(emitter, sz) {

    if (emitter.__colorsBuffer) {

        var colors = emitter.__colorsBuffer.__getArrayOfSize(sz * 8);

        for (var i = 0; i < sz; i++) {

            var p = emitter.__particles[sz - i - 1]
                , color_factor = emitter.__colorEmitterComponent.g.color_factor(p.__part)
                , cofs = i * 8
                , color = p.__start_color 
                , current_color = p.__current_color

            colors[cofs] = colors[cofs + 4] = current_color.x = color.x * color_factor.x;
            colors[cofs + 1] = colors[cofs + 5] = current_color.y = color.y * color_factor.y;
            colors[cofs + 2] = colors[cofs + 6] = current_color.z = color.z * color_factor.z;
            colors[cofs + 3] = colors[cofs + 7] = current_color.w = color.w * color_factor.w;

        }

    }
}


var NormalUVSBuilder = {

    __updateUVSBuffer(emitter, sz) {

        var buffer = emitter.__uvsBuffer
            , uvses = emitter.__uvs
            , uvmaxsz = sz * 8
            , uvs = buffer.__getArrayOfSize(uvmaxsz, 0, 1)

        if (uvmaxsz > (buffer.__lastFilled || 0)) {
            for (var i = buffer.__lastFilled || 0; i < uvmaxsz; i++) {
                uvs[i] = uvses[i % 8];
            }
            buffer.__lastFilled = uvmaxsz;
        }
    },

    __generateUVS(emitter) {

        var frame = globalConfigsData.__frames[emitter.p.texture];
        if (!frame || frame.__loading) return;
        var map = frame.tex;
        emitter.map = map;

        if (!emitter.__shader)
            emitter.__shader = 'partnc';

        emitter.__uvs = new Float32Array(getFrameUVS(frame));

        if (emitter.__uvsBuffer) {
            emitter.__uvsBuffer = emitter.__addAttributeBuffer('uv', 2);            
        }

    }
}



function NormalGeometryBuilder(emitter) {

    var sz = emitter.__particles.length;

    if (!sz || !emitter.__uvs) return 1;
    
    var vertices = emitter.__verticesBuffer.__getArrayOfSize(sz * 8)
        , vertofs = 0;

    emitter.__renderVertexCount = sz * 6;

    for (var i = 0; i < sz; i++) {

        var p = emitter.__particles[i]
            , pos = p.__current_position
            , size = p.__current_size
            , xx = pos.x
            , yy = pos.y
            , x = size.x / 2
            , y = size.y / 2
            , a = p.__current_angle
            , s = sin(a)
            , c = cos(a)
            , xs = x * s
            , ys = y * s
            , xc = x * c
            , yc = y * c;

        vertices[vertofs++] = xx - xc - ys;
        vertices[vertofs++] = yy + yc - xs;

        vertices[vertofs++] = xx + xc - ys;
        vertices[vertofs++] = yy + yc + xs;

        vertices[vertofs++] = xx - xc + ys;
        vertices[vertofs++] = yy - yc - xs;

        vertices[vertofs++] = xx + xc + ys;
        vertices[vertofs++] = yy - yc + xs;

    }

    emitter.__uvsBuilder.__updateUVSBuffer(emitter, sz);

    updateIndecesBuffer(globalIndecesBuffer, sz, 4);

    updateColorsBuffer1(emitter, sz);

    this.__indecesBuffer = globalIndecesBuffer;

}




function TailGeometryBuilder(emitter) {

    var sz = emitter.__particles.length;

    if (sz < 2 || !emitter.__uvs) return 1;

    var vertices = emitter.__verticesBuffer.__getArrayOfSize(sz * 8)
        , vertofs = 0;

    var last = emitter.__particles[sz - 1];
    if (last.__even == undefined) {
        last.__even = (!(emitter.__particles[sz - 2] || {}).__even) ? 1 : 0;
    }

    var needFirstDummyVerts = last.__even;

    emitter.__renderVertexCount = (sz - 2 + needFirstDummyVerts) * 6;

    for (var i = sz - 1; i >= 0; i--) {

        var p = emitter.__particles[i]
            , pos = p.__current_position
            , size = p.__current_size
            , xx = pos.x
            , yy = pos.y
            , x = size.x / 2
            , y = size.y / 2
            , a = p.__current_angle
            , s = sin(a)
            , c = cos(a)
            , xs = x * s
            , ys = y * s
            , xc = x * c
            , yc = y * c;

        if (needFirstDummyVerts) {
            needFirstDummyVerts = 0;
            vertices[vertofs++] = xx - xc - ys;
            vertices[vertofs++] = yy + yc - xs;

            vertices[vertofs++] = xx + xc - ys;
            vertices[vertofs++] = yy + yc + xs;
        }

        vertices[vertofs++] = xx - xc - ys;
        vertices[vertofs++] = yy + yc - xs;

        vertices[vertofs++] = xx + xc - ys;
        vertices[vertofs++] = yy + yc + xs;

    }

    emitter.__uvsBuilder.__updateUVSBuffer(emitter, sz);

    updateIndecesBuffer(globalIndecesTailBuffer, sz, 2);

    updateColorsBuffer2(emitter, sz);

    this.__indecesBuffer = globalIndecesTailBuffer;

}



function AnimatedTailGeometryBuilder(emitter) {

    var sz = emitter.__particles.length;

    if (!sz || !emitter.__uvs) return 1;

    var vertices = emitter.__verticesBuffer.__getArrayOfSize(sz * 8)
        , vertofs = 0;

    emitter.__renderVertexCount = sz * 6;
    var lastx1, lastx2, lasty1, lasty2;

    var p = emitter.__particles[0]
        , pos = p.__current_position
        , size = p.__current_size
        , xx = pos.x
        , yy = pos.y
        , x = size.x / 2
        , y = size.y / 2
        , a = p.__current_angle
        , s = sin(a)
        , c = cos(a)
        , xs = x * s
        , ys = y * s
        , xc = x * c
        , yc = y * c;

    lastx1 = vertices[0] = vertices[4] = xx - xc + ys;
    lasty1 = vertices[1] = vertices[5] = yy - yc - xs;

    lastx2 = vertices[2] = vertices[6] = xx + xc + ys;
    lasty2 = vertices[3] = vertices[7] = yy - yc + xs;
    vertofs = 8;
    for (var i = 1; i < sz; i++) {

        var p = emitter.__particles[i]
            , pos = p.__current_position
            , size = p.__current_size
            , xx = pos.x
            , yy = pos.y
            , x = size.x / 2
            , y = size.y / 2
            , a = p.__current_angle
            , s = sin(a)
            , c = cos(a)
            , xs = x * s
            , ys = y * s
            , xc = x * c
            , yc = y * c;

        vertices[vertofs++] = lastx1;
        vertices[vertofs++] = lasty1;

        vertices[vertofs++] = lastx2;
        vertices[vertofs++] = lasty2;

        lastx1 = vertices[vertofs++] = xx - xc + ys;
        lasty1 = vertices[vertofs++] = yy - yc - xs;

        lastx2 = vertices[vertofs++] = xx + xc + ys;
        lasty2 = vertices[vertofs++] = yy - yc + xs;

    }

    emitter.__uvsBuilder.__updateUVSBuffer(emitter, sz);

    updateIndecesBuffer(globalIndecesBuffer, sz, 4);

    updateColorsBuffer1(emitter, sz);

    this.__indecesBuffer = globalIndecesBuffer;

}



// TODO:
// create origin component ?

EffectComponentsFactory.__registerComponent('d',
    function () {
        this.p = {

        };

        this.g = {
            direction: defaultZeroFunction,
            velocity: defaultZeroFunction,
            spin_factor: defaultOneFunction,
            spin: defaultZeroFunction,

            // vector hzValue
            force() { return defaultZeroVector2 },
            velocity_factor() { return defaultOneVector2 },

            size() { return default10Vector2 },
            size_factor() { return defaultOneVector2 }

        }
    },
    {
        __destruct(emitter) {
            emitter.__verticesBuffer.__destruct();
            emitter.__uvsBuffer.__destruct();
        },

        __initEmitter(emitter) {

            if (!emitter.__verticesBuffer){
                emitter.__verticesBuffer = emitter.__addAttributeBuffer('position', 2);
            }

            if (!emitter.__indecesBuffer) {
                emitter.__indecesBuffer = globalIndecesBuffer;
            }

            if (!emitter.__uvsBuffer) {
                emitter.__uvsBuffer = emitter.__addAttributeBuffer('uv', 2);
            }

        },

        __initParticle(particle) {

            var emitter = particle.__emitter
                , part = emitter.__part
                , t = this
                , sz = t.g.size(part);

            particle.__start_size = sz;

            particle.__spin = t.g.spin(part) * t.g.spin_factor(0);

            // TODO: рандом начального поворота
            particle.__current_angle = t.g.spin(part) * t.g.spin_factor(0);

            particle.__current_size = new Vector2(sz.x, sz.y);

            particle.__current_velocity.__rotateAroundZ0((DEG2RAD * (t.g.direction(part) + emitter.__parent.__rotate))).__multiplyScalar(t.g.velocity(part));

        },

        // TODO: force component!!!
        __update(emitter, dt) {
            this.__force = this.g.force(emitter.__part);
        },

        __updateParticle(particle, dt) {

            var t = this
                , emitter = particle.__emitter
                , part = particle.__part
                , vel = particle.__current_velocity
                , pos = particle.__current_position
                , velfactor = t.g.velocity_factor(part)
                , sz = particle.__current_size
                , startsz = particle.__start_size
                , szfactor = t.g.size_factor(part)

            vel.x += t.__force.x * dt;
            vel.y += t.__force.y * dt;

            pos.x += vel.x * velfactor.x * dt;
            pos.y += vel.y * velfactor.y * dt;

            sz.x = startsz.x * szfactor.x;
            sz.y = startsz.y * szfactor.y;

            var lp = particle.__lastPosition;
            if (lp) { // oriented by position

                lp.sub(pos);
                particle.__current_angle = atan2(lp.x, -lp.y);
                particle.__lastPosition.__copy(pos);

            } else
                if (emitter.____angleMod == 3) { // oriented by velocity
                    particle.__current_angle = atan2(vel.y, vel.x);
                }
                else {
                    particle.__current_angle += DEG2RAD * particle.__spin * t.g.spin_factor(part) * dt;
                }

        }
    },

    makeComponentProps(0, {
        direction: 0,
        velocity: 0,
        spin_factor: 1,
        spin: 0,

        // vector hzValue
        force: [_xy_hz_, 0],

        velocity_factor: [_xy_hz_, 1],

        size: [_wh_hz_, 10],
        size_factor: [_wh_hz_, 1]
    })
);





















EffectComponentsFactory.__registerComponent('c',
    function () {

        var t = this;
        t.p = { color: 255, color_factor: 1 };
        t.g = {
            color() { return default255Vector4 },
            color_factor() { return defaultOneVector4 }
        }

    },

    {
        __initEmitter(emitter) {
            emitter.__shader = 'part';
            emitter.__colorsBuffer = emitter.__addAttributeBuffer('c', 4);
            emitter.__colorEmitterComponent = this;
        },

        __destruct(emitter) {
            if (emitter.__colorEmitterComponent == this) {
                emitter.__shader = 'partnc';
                emitter.__colorsBuffer.__destruct();
                delete emitter.__colorEmitterComponent;
                delete emitter.__colorsBuffer;
            }
        },

        __initParticle(particle) {
            particle.__start_color = this.g.color(particle.__emitter.__part).__clone().__divideScalar(255);
        }

    },

    makeComponentProps(0, {
        color: [_rgba_hz_, 255],
        color_factor: [_rgba_hz_, 1],
    })

);



EffectComponentsFactory.__registerComponent('pc',
    function () {

        var t = this;
        t.p = { color_factor: 1 };
        t.g = { color_factor() { return defaultOneVector4 } }

    },

    {
        __initEmitter(emitter) {
            emitter.__shader = 'part';
            emitter.__colorsBuffer = emitter.__addAttributeBuffer('c', 4);
            emitter.__colorEmitterComponent = this;

            var parent = emitter.__parent;
            if (parent.__current_color) {
                this.__colorf = a => parent.__current_color
            } else {
                var this_color = new Vector4();
                this.__update = function (emitter, dt) {
                    var cc = parent.__color;
                    this_color.set(cc.r, cc.g, cc.b, cc.a || parent.__alpha);
                }
                this.__colorf = a => this_color
            }
        },

        __destruct(emitter) {
            if (emitter.__colorEmitterComponent == this) {
                emitter.__shader = 'partnc';
                emitter.__colorsBuffer.__destruct();
                delete emitter.__colorEmitterComponent;
                delete emitter.__colorsBuffer;
            }
        },

        __updateParticle(particle) {
            particle.__start_color = this.__colorf();
        }

    },

    makeComponentProps(0, {
        color_factor: [_rgba_hz_, 1]
    })

);























EffectComponentsFactory.__registerComponent('rta',

    function () {
        var t = this;
        t.p = { accel: 0, accel_factor: 1 };
        t.g = {
            accel() { return defaultZeroVector2 },
            accel_factor() { return defaultOneVector2 }
        }
    },
    {
        __updateParticle(particle, dt) {
            var t = this
                , emitter = particle.__emitter
                , accel = particle.__start_accel;

            if (accel.x != 0 || accel.y != 0) {
                var af = t.g.accel_factor(particle.__part)
                    , x = accel.x * af.x * dt
                    , y = accel.y * af.y * dt
                    , pos = particle.__current_position
                    , vrad = new Vector2(pos.x, pos.y)
                    , vel = particle.__current_velocity;

                if (!emitter.linked) {
                    var wp = emitter.__nodePosition || emitter.__parent.__worldPosition
                        , p = emitter.__nodeScrollPosition;

                    vrad.x -= wp.x + p.x;
                    vrad.y += wp.y + p.y;

                }

                vrad.__normalize();

                vel.x += vrad.x * x + vrad.y * y;
                vel.y += vrad.y * x - vrad.x * y;

            }
        },

        __initParticle(particle) {

            particle.__start_accel = this.g.accel(particle.__emitter.__part);

        }
    },

    makeComponentProps(0, {
        accel: [_rt_hz_, 0],
        accel_factor: [_rt_hz_, 1]
    })

);

















EffectComponentsFactory.__registerComponent('sub',

    function () {
        var t = this;
        t.p = { __subEmitter: '' };
    },
    {
        __destruct(emitter) {
            emitter.__render = ParticleEmitterPrototype.__render;
        },

        __initEmitter(emitter) {
            var t = this;

            emitter.__render = function () {
                var particles = this.__particles, p, sz = particles.length;
                for (var i = 0; i < sz; i++) {
                    p = particles[i];
                    if (p.__subEmitters) {
                        for (var j = 0; j < p.__subEmitters.length; j++) {
                            p.__subEmitters[j].__projectionMatrix = this.__projectionMatrix;
                            p.__subEmitters[j].__render();
                        }
                    }
                }
                return ParticleEmitterPrototype.__render.call(this);
            }

            var effect = emitter.__effect;
            while (effect && !(effect instanceof ParticleEffect)) {
                effect = effect.__emitter ? effect.__emitter.__effect : effect.__effect;
            }

            var subEmitter = $find(effect.__emitters, n => n.__name == t.__subEmitter);

            if (subEmitter) {
                subEmitter.__update = subEmitter.__render = function () { return 0 };
                t.__subEmitterJson = subEmitter.__toJson();
            } else {
                t.__needReinit = 1;
            }

        },

        __initParticle(particle, dt) {
            var t = this
                , emitter = particle.__emitter;

            if (t.__subEmitterJson) {

                var subEmitter = new ParticleEmitter(t.__effect, particle);

                if (!particle.__subEmitters) {
                    ObjectDefineProperty(particle, PDM.__live, {
                        set(v) {
                            this.__lll = v;
                            if (!v) {
                                //TODO: live after die
                                for (var i = 0; i < this.__subEmitters.length; i++)
                                    this.__subEmitters[i].__destruct();
                            }
                        },
                        get() {
                            return this.__lll;
                        }
                    });
                    particle.__subEmitters = [];
                }

                particle.__subEmitters.push(subEmitter);
                // subEmitter.__debug = 1;

                subEmitter.__init(t.__subEmitterJson);

            }

        },

        __updateParticle(particle, dt) {
            if (particle.__subEmitters) {
                for (var i = 0; i < particle.__subEmitters.length; i++) {
                    particle.__subEmitters[i].__update(dt);
                }
            }
        }
    },

    makeComponentProps({
        __subEmitter: ''
    })
);









// TargetEmitterComponent

EffectComponentsFactory.__registerComponent('tgt',

    function () {
        var t = this;
        t.p = { __factor: 0 };
        t.g = {
            __factor: defaultZeroFunction
        }
    }, {
    __updateParticle(particle, dt) {
        if (particle.__targetPosition) {
            var pos = particle.__current_position
                , part = this.g.__factor(particle.__part) * dt
                , p = particle.__emitter.__nodeScrollPosition;

            pos.x = lerp(pos.x, particle.__targetPosition.x + p.x, part);
            pos.y = lerp(pos.y, -particle.__targetPosition.y - p.y, part);

        }
    },

    __initParticle(particle) {
        particle.__targetPosition = this.__targetPositions ? this.__targetPositions[randomInt(0, this.__targetPositions.length - 1)] : 0;

    },

    __initEmitter(emitter) {
        var t = this;
        t.__targetPositions = 0;

        var tgt = t.__target;
        if (tgt) {

            if (tgt instanceof ENode) {
                if (tgt.__worldPosition) tgt = [tgt.__worldPosition]; else tgt = 0;
            } else if (isString(tgt)) {
                var node = emitter.__effect.__node;
                if (node) {
                    var root = node.__root || node.__getRoot();
                    if (root) {
                        tgt = $mapAndFilter(root.$(tgt), n => n.__worldPosition);
                    } else tgt = 0;
                } else tgt = 0;
            } else if (isObject(tgt)) {
                var node = emitter.__effect.__node;
                if (node) {
                    var root = node.__root || node.__getRoot();
                    if (root) {
                        var tmp = [];
                        $each(tgt, (v, k)=>{
                            var n = root.__alias(k) || root.__alias(v);
                            if (n) {
                                tmp.push(n.__worldPosition);
                            }
                        });
                        tgt = tmp;
                    } else tgt = 0;
                } else tgt = 0;
            }
            
            if (tgt && tgt.length) {
                t.__targetPositions = tgt;
            }
        }

    }
},

    makeComponentProps(
        __propertiesWithReinit({ __target: 0 })
        , {
            __factor: 0
        })
);








// TailEmitterComponent

EffectComponentsFactory.__registerComponent('tl',

    function () {
        var t = this;
        t.p = { __factor: 1, __linked: 1, __reverseParticlesUpdate: 1 };
        t.g = {
            __factor: defaultOneFunction
        }
    }, {

    __updateParticle(particle, dt) {
        if (this.__currentPosition) {

            particle.__current_position.lerp(this.__currentPosition, clamp(this.g.__factor(particle.__part) * dt, 0, 1));

        }

        this.__currentPosition = particle.__current_position;
    },

    __initParticle(particle) {

    },

    __update(emitter) {

        if (this.__linked) {
            if (this.__currentPosition) {
                this.__currentPosition.set(0, 0);
            }
            else {
                this.__currentPosition = new Vector2(0, 0);
            }

            if (!emitter.linked) {
                var matrixOrParticle = emitter.__parent.__matrixWorld;
                if (matrixOrParticle.e) {
                    this.__currentPosition.__applyMatrix4(matrixOrParticle);
                } else {
                    this.__currentPosition.add(matrixOrParticle.__current_position);
                }
            }
        }

    }

},
    makeComponentProps({
        __reverseParticlesUpdate: 1,
        __linked: 1
    },
        {
            __factor: 1
        })
);



// ExtendedEmitterComponent


EffectComponentsFactory.__registerComponent('eec',

    function () {
        var t = this;
        t.p = {};
        t.__pf = 0;
        t.g = {
            __powerPositionFactor: defaultZeroFunction,
            __power: defaultZeroFunction,
            __angularVelocityFactor: defaultOneFunction,
            __av: defaultZeroFunction,
            __angularVelocity: 0
        }

    }, {

    __destruct(emitter) {
        delete emitter.__powerMod;
    },

    __initEmitter(emitter) {
        var t = this;

        if (t.__power) {
            emitter.__powerMod = function (power) {
                var ap = lerp(
                    power,
                    power * this.__dtPositionGap.__length() * t.g.__power(emitter.__part) / 100,
                    t.g.__powerPositionFactor(emitter.__part)
                );
                return ap;
            }
        } else {
            emitter.__powerMod = 0;
        }

        if (t.__angularVelocity) {

            t.__initParticle = function (particle) {
                particle.__angularVelocity = DEG2RAD * this.g.__angularVelocity(particle.__emitter.__part);
            }


            t.__updateParticle = function (particle, dt) {
                particle.__current_velocity.__rotateAroundZ0(dt * (particle.__angularVelocity || 0) * this.g.__angularVelocityFactor(particle.__part));
            }


        } else {
            t.__initParticle = t.__updateParticle = function () { }
        }

    }

},

    makeComponentProps(0, {
        __power: 0,
        __powerPositionFactor: 0,
        __angularVelocity: 0,
        __angularVelocityFactor: 1
    })

);






// OriginEmitterComponent
var oec_dummyV2 = new Vector2(0, 0);
EffectComponentsFactory.__registerComponent('or',
    function () {  // constructor
        var t = this;
        //TODO: forms
        t.p = { __byNode: 1, __form: 0, __byPerimeter: 0 };
        t.g = {};
        t.__changesListener = t.__setNeedUpdate.bind(t);
    },
    {
        __destruct(emitter) {
            emitter.p.origin = emitter.__originalOriginP;
        },

        __update(emitter) {
            this.__sz = (emitter.__parent || (emitter.__effect || 0).__node).__size || defaultZeroVector2;
        },

        __updatesFuncs: {
            //__byNode
            //TODO: some parameters ?
            1: {
                // by Perimeter
                1: {
                    // form Quad
                    0: function (part) {
                        var x1 = randomBool(), sz = this.__sz, or = this.__original(part);
                        return oec_dummyV2.set(randomSign() * sz.x * (x1 ? random() : 1) / 2 + or.x, randomSign() * sz.y * (x1 ? 1 : random()) / 2 + or.y);
                    }
                },

                // not by Perimeter
                0: {
                    // form Quad
                    0: function (part) {
                        var sz = this.__sz, or = this.__original(part);
                        return oec_dummyV2.set((random() - 0.5) * sz.x + or.x, (random() - 0.5) * sz.y + or.y);
                    }

                }
            }

        },

        __initEmitter(emitter) {
            emitter.__originalOriginP = emitter.p.origin;

            var t = this
                , p = t.p;

            t.__original = hzValueGenerator(emitter.__originalOriginP, defaultZeroVector2, _xy_hz_);

            emitter.__addChangesListener(PDM.origin, t.__changesListener);

            var f = getDeepFieldFromObject(t.__updatesFuncs, p.__byNode ? 1 : 0, t.__byPerimeter ? 1 : 0, t.__form)
            if (f) emitter.g.origin = f.bind(t);

            t.__update(emitter);
        }


    },

    makeComponentProps(
        __propertiesWithReinit({
            __byNode: 1,
            __form: 0,
            __byPerimeter: 0,
        }),
        {
            __parameters: [_xyz_hz_, 0]
        }
    )
);















// ShaderingEmitterComponent

EffectComponentsFactory.__registerComponent('sh',

    function () {
        var t = this;
        t.p = {};
        var f = function () { return 1; };
        t.g = {};
    }, {

    __destruct(emitter) {
        // TODO:
    },

    __initEmitter(emitter) {
        var t = this;
        emitter.__shader = t.__shader;
    },

    __update(emitter) {
        var t = this;
        $each(t.g, function (f, i) { emitter[i] = f(emitter.__part); });
    }
    /*,
    __updateParticle: function(){
        
    }*/

},

    makeComponentProps(
        __propertiesWithReinit({ __shader: '' }),
        {
            f1: 0,
            f2: 0,
            f3: 0,
            f4: 0,
            f5: 0,
            f6: 0,
            f7: 0,
            f8: 0
        })

);










// TexturingEmitterComponent

EffectComponentsFactory.__registerComponent('uv',

    function () {
        var t = this;
        t.p = {
            __uvsTransform: 0,
            __uvsType: 0,
            __animated: 0
        };
        t.g = {
            __animationPostfix() { return 0 },
            __animationPostfix_factor() { return 1 }
        }

    }, {

    __destruct(emitter) {

        emitter.__uvsBuilder = NormalUVSBuilder;
        NormalUVSBuilder.__generateUVS(emitter);

    },

    __updateUVSBuffer(emitter, sz) {

        if (!this.__uvsType && !emitter.__animUVS) {

            return NormalUVSBuilder.__updateUVSBuffer(emitter, sz);

        } else {

            // Tail

            var particles = emitter.__particles,
                sz = particles.length;
            if (!emitter.__uvs || !sz || (sz < 2 && this.__uvsType > 0))
                return 1;

            var last = particles[sz - 1];

            var needFirstDummyVerts = last.__even || 0;

            var bsize = 4;
            if (this.__uvsType == 0 && emitter.__animUVS)
                bsize = 8;

            var buffer = emitter.__uvsBuffer, uvs = buffer.__getArrayOfSize(sz * bsize, 0, 1)

            buffer.__lastFilled = 0;

            if (emitter.__animUVS) {

                // TODO: this.__uvsType ?? 

                var uvsoffs = 0
                    , defuvses = emitter.__uvs;

                for (var i = 0; i < sz; i++) {
                    var particle = particles[i];
                    var uvses = emitter.__animUVS[particle.__animationPostfix] || defuvses;
                    for (var j = 0; j < 8; j++) {
                        uvs[uvsoffs + j] = uvses[j];
                    }
                    uvsoffs += 8;
                }

            }
            else {

                var uvses = emitter.__uvs;

                {
                    var uvsoffs = 0
                        , x1 = uvses[0]
                        , y1 = uvses[1]
                        , x2 = uvses[6]
                        , y2 = uvses[7];

                    switch (this.__uvsType) {
                        case 1:
                            for (var i = 0; i < sz; i++) {
                                var particle = particles[i];
                                var j = (i - needFirstDummyVerts);
                                var y = lerp(y2, y1, j / (sz - 2));
                                uvs[uvsoffs++] = x1;
                                uvs[uvsoffs++] = y;
                                uvs[uvsoffs++] = x2;
                                uvs[uvsoffs++] = y;
                            }
                            break;
                        case 2:
                            for (var i = sz - 1; i >= 0; i--) {
                                var y = lerp(y2, y1, particles[i].__fpart);
                                uvs[uvsoffs++] = x1;
                                uvs[uvsoffs++] = y;
                                uvs[uvsoffs++] = x2;
                                uvs[uvsoffs++] = y;
                            }
                            break;
                    }
                }
            }


        }

    },

    __generateUVS(emitter) {
        var t = this;

        var textureName = emitter.p.texture;

        var frame = globalConfigsData.__frames[textureName];
        if (t.__animated) {
            emitter.__animatedTexture = 1;
            //TODO: use some formatting ??
            if (!frame || frame.__loading)
                frame = globalConfigsData.__frames[textureName + '1'];
        }

        if (!frame || frame.__loading) return;

        var map = frame.tex;
        emitter.map = map;

        if (!emitter.__shader)
            emitter.__shader = 'partnc';

        emitter.__uvs = getFrameUVS(frame, t.__uvsTransform);

        if (t.__animated) {

            emitter.__animUVS = [];
            //debug
            var ftex;
            //undebug
            for (var i = 0; i < 100; i++) {

                var frame = globalConfigsData.__frames[textureName + i];
                if (frame) {
                    //debug
                    if (ftex && ftex != frame.tex) {
                        //WARNING: different textures not supported!
                        debugger;
                    } else {
                        ftex = frame.tex
                    }
                    //undebug

                    emitter.__animUVS[i] = getFrameUVS(frame, t.__uvsTransform);
                }
            }
        } else {
            delete emitter.__animUVS;
        }

        if (emitter.__uvsBuffer) {
            emitter.__uvsBuffer = emitter.__addAttributeBuffer('uv', 2);
        }

        emitter.__updateGeometryBuilder();

    },

    __initEmitter(emitter) {

        emitter.__uvsBuilder = this;
        this.__generateUVS(emitter);

    },

    __updateParticle(particle, dt) {
        if (this.__animated) {
            particle.__animationPostfix = round(this.g.__animationPostfix_factor(particle.__part) * particle.__startAnimationPostfix);
        }
    },

    __initParticle(particle) {
        if (this.__animated) {
            particle.__startAnimationPostfix = this.g.__animationPostfix(particle.__emitter.__part);
        }
    }

},


    makeComponentProps(
        __propertiesWithReinit({ __uvsTransform: 0, __animated: 0 },
            { __uvsType: 0 }),
        {
            __animationPostfix: 0,
            __animationPostfix_factor: 1
        })

);






///////////////////////////////////////////////////////////////////////////////////////
//   Particle
///////////////////////////////////////////////////////////////////////////////////////

function Particle(emitter, part, matrixOrParticle, dtMult) {
    var t = this;

    t.__part = 0;

    t.__emitter = emitter;

    t.__current_lifespan = t.__start_lifespan = emitter.g.lifespan(part);

    t.__current_velocity = new Vector2(1, 0);

    t.__current_color = new Vector4(1, 1, 1, 1);

    var pos = t.__current_position = emitter.g.origin(part).__clone();

    if (!emitter.linked) {
        if (matrixOrParticle.e) {
            pos.__applyMatrix4(matrixOrParticle);
        } else {
            pos.add(matrixOrParticle.__current_position);
        }
        var gap = emitter.__dtPositionGap;
        pos.x -= gap.x * dtMult;
        pos.y += gap.y * dtMult;
    }

    if (emitter.____angleMod == 2) {
        t.__lastPosition = pos.__clone();
    }

}

makeClass(Particle, {

    __update(dt, emitter) {
        var particle = this;

        particle.__current_lifespan -= dt;
        particle.__live = particle.__start_lifespan < 0 || particle.__current_lifespan >= 0;
        if (!particle.__live) {
            return false;
        }

        if (particle.__start_lifespan > 0) {
            particle.__fpart = (particle.__start_lifespan - particle.__current_lifespan) / particle.__start_lifespan;
            particle.__part = round(options.__particlesCurveValuesCacheSize * particle.__fpart);
        } else {
            particle.__fpart =
                particle.__part = 0;
        }

        ///////////////////////////////////////////////////////////////////////////
        ///
        /// TODO: ТЕКСТУРНАЯ АНИМАЦИЯ
        ///
        //  u_uvid = (t.__start_frame * (size_t)emitter.t.__texture.animation.t.__frame_factor->value(lifePart).value) % emitter.t.__texture.animation.uvs.size();
        //         consoleLog (t. __current_velocity, t.__current_position);

        return true;
    }

}, {

    __matrixWorld: {
        get() {

            return this // жесть
        }
    },
    __rotate: {
        get() {
            return this.__current_angle;
        }
    },
    __worldPosition: {
        get() {
            var v = this.__current_position.__clone();
            v.y *= -1;
            return v;
        }
    },
 
    __node: {
        get() {
            return this.__emitter.__parent.__node;
        }
    }

});





































///////////////////////////////////////////////////////////////////////////////////////
//   ParticleEmitter
///////////////////////////////////////////////////////////////////////////////////////



function ParticleEmitter(effect, parent) {
    var t = this;
    t.____visible = 1;
    t.g = {};
    t.p = {};
    Object3D.call(t);
    t.__parent = parent;
    t.__effect = effect;
    t.__particles = [];
    t.__components = [];
    t.__reset();
    t.__dtPositionGap = new Vector2(0, 0);
    t.__nodePosition = new Vector2(0, 0);
    t.__nodeScrollPosition = new Vector2(0, 0);
    t.__geometryBuilder = NormalGeometryBuilder;
    t.__uvsBuilder = NormalUVSBuilder;
    t.__changesListeners = {};
    //cheats
    renderInfo.__emitters++;
    //endcheats
}

options.__defaultParticleEmitterPropertiesValues = {};


var ParticleEmitterPrototype =
    ParticleEmitter.prototype = mergeObj(ObjectCreate(Object3D.prototype), {

        constructor: ParticleEmitter,

        __callChange(p) {
            $fcall(this.__changesListeners[p]);
        },

        __addChangesListener(p, f) {
            if (!this.__changesListeners[p]) {
                this.__changesListeners[p] = [];
            }
            removeFromArray(f, this.__changesListeners[p]);
            this.__changesListeners[p].push(f);

        },
        __removeChangesListener(f, p) {
            if (p) {
                if (this.__changesListeners[p]) {
                    removeFromArray(f, this.__changesListeners[p]);
                }
            } else {
                $each(this.__changesListeners, function (v) {
                    removeFromArray(f, v);
                });
            }
        },

        __isEmitter: 1,
        ____validToSave: 0,
        ____notNormalNode: 1,

        __init(parameters) {

            var t = this;
            var components = parameters.c || parameters.__componentsList;

            if (!t.__defaultComponent) {
                if (!components && !t.__components.length) {
                    t.__defaultComponent = t.__addComponent(EffectComponentsFactory.__createByType('d'))
                } 
            }

            for (var i in parameters) {
                this[i] = parameters[i];
            }

            if (!t.__firstInited) {
                for (var i in options.__defaultParticleEmitterPropertiesValues) {
                    if (!parameters.hasOwnProperty(i))
                        this[i] = options.__defaultParticleEmitterPropertiesValues[i];
                }
                t.__firstInited = 1;
            }

            for (var i = 0; i < components.length; i++) {
                var component = EffectComponentsFactory.__createComponentFromJson(deepclone(components[i]));

                t.__addComponent(component);

                if (component.t == 'd') {
                    t.__defaultComponent = component;
                }

            }

            t.__nodePosition.__copy(t.__parent.__worldPosition);

            return t;
        },

        __addComponent(component) {

            if (component) {
                this.__components.push(component);

                component.__initEmitter(this);

                for (var i = 0, l = this.__particles.length; i < l; i++) {
                    component.__initParticle(this.__particles[i]);
                }
            }
            return component;
        },

        __getComponentByType(type) {
            return $find(this.__components, function (c) { return c.t == type });
        },

        __removeComponent(index) {
            var components = this.__components;
            if (isObject(index)) index = components.indexOf(index);
            if (index >= 0) {
                if (components[index]) {
                    components[index].__destruct(this);
                    components.splice(index, 1);
                }
            }
            return this;
        },

        __destruct() {
            //cheats
            renderInfo.__emitters--;
            renderInfo.particles -= this.__particles.length;
            //endcheats

            //debug
            if (this.__destructed) throw 'this already destructed';
            this.__destructed = 1;
            //undebug

            for (var i = 0; i < this.__components.length; i++)
                this.__components[i].__destruct(this);

            return Object3DPrototype.__destruct.call(this);
        },

        __removeFromParent() {

            if (this.__parent) {
                this.__parent.__removeChild(this);
                this.__parent = 0;
            }

            this.__effect.__pop(this.__destruct());

            return this;
        },


        __reset(clear) {
            var t = this;
            t.__elapsed = 0;
            t.__particles_ready_to_emission = 0;
            t.__enabled = true;
            if (clear) {
                //cheats
                renderInfo.particles -= t.__particles.length;
                //endcheats
                t.__particles = [];
            }
        },

        __render() {
            var t = this;

            if (!t.map) return;

            t.__lastRenderTime = __currentFrame;

            if (t.__geometryBuilder(t)) {
                return 1;
            }

            //cheats
            renderInfo.__emittersRendered++;
            //endcheats

            var count = t.__renderVertexCount;

            if (count == 0) // нечего рисовать :(
                return;

            if (t.linked) {
                var mw = t.__parent.__matrixWorld;
                if (mw.e) {
                    t.__projectionMatrix = t.__projectionMatrix.__clone();
                    // t.__projectionMatrix.__multiply(mw);
                    t.__projectionMatrix.__multiplyMatrices4(t.__projectionMatrix, mw);
                } else 
                // particle
                {
                    t.__projectionMatrix = t.__projectionMatrix.__clone();
            
                    var q = mw.__current_angle,
                        o = mw.__current_position,
                        s = sin(q),
                        c = cos(q);

                        _prtM4_e[0] = c;
                        _prtM4_e[1] = s;
                        _prtM4_e[4] = -s;
                        _prtM4_e[5] = c;
                        _prtM4_e[12] = o.x;
                        _prtM4_e[13] = o.y;

                    t.__projectionMatrix.__multiply(_prtM4_);

                }
            }

            //          t.__drawMode = randomInt(0,3);
            renderer.__draw(t, count);

            return 1;
        },

        __update(dt) {

            var t = this
                , particles = t.__particles
                , particlesLength = particles.length;

            //cheats
            renderInfo.__emittersUpdated++;
            //endcheats


            var updated = 0
                , part = t.__part = ((t.duration > 0 ? floor(options.__particlesCurveValuesCacheSize * mmin(1, t.__elapsed / t.duration)) : 0))
                , components = t.__components
                , componentsLenght = components.length;

            for (var i = 0; i < componentsLenght; i++) {
                if (components[i].__needReinit) {
                    components[i].__needReinit = 0;
                    components[i].__initEmitter(this);
                }
            }

            if (t.____enabled && ((t.duration < 0) || (t.__elapsed < t.duration))) {
                var emission_rate = floor(t.g.rate(part))
                    , emission_power = t.g.power(part)
                    , emminussize = emission_rate - particlesLength
                    , available_particles = emminussize
                    , parent = t.__parent
                    , wp = parent.__worldPosition
                    , twp = t.__nodePosition;

                if (!t.linked) {
                    t.__dtPositionGap.set(wp.x - twp.x, wp.y - twp.y);
                }

                if (t.__powerMod) {
                    emission_power = t.__powerMod(emission_power)
                }

                if (emission_power >= 0) {
                    t.__particles_ready_to_emission += emission_power * dt;
                    available_particles = mmin(emminussize, floor(t.__particles_ready_to_emission));
                }

                if (available_particles > 0) {
                    var emitted_particles = 0, particle, matrix = parent.__matrixWorld;

                    //cheats
                    renderInfo.particles += available_particles;
                    //endcheats

                    for (; emitted_particles < available_particles; emitted_particles++) {
                        particle = new Particle(t, part, matrix, 1 - emitted_particles / available_particles);
                        for (var i = 0; i < componentsLenght; i++) {
                            components[i].__initParticle(particle)
                        }

                        particles.push(particle);
                        particlesLength++;
                    }

                    t.__particles_ready_to_emission -= emitted_particles;



                }

                twp.__copy(wp);

                var scr = (parent.__node || 0).__parentScrollVector;
                if (scr) {
                    t.__nodeScrollPosition.__copy(scr);
                }
                ///
                ////////////////////////////////////////////////////////////////////////
                t.__elapsed += dt;
                updated = 1;

            }

            for (var i = 0; i < componentsLenght; i++) {
                if (components[i].__update(t, dt)) {
                    return false;
                }
            }

            if (particlesLength) {
                // if (t.__debug) debugger;
                for (var i = 0; i < particlesLength; i++) {
                    particles[i].__update(dt, t);
                }

                for (var i = 0; i < componentsLenght; i++) {
                    var component = components[i];
                    if (component.__reverseParticlesUpdate) {
                        for (var j = particlesLength - 1; j >= 0; j--) {
                            component.__updateParticle(particles[j], dt);
                        }
                    }
                    else {
                        for (var j = 0; j < particlesLength; j++) {
                            component.__updateParticle(particles[j], dt);
                        }
                    }
                }



                // if (t.__debug)  debugger;

                t.__particles = particles.filter(function (p) {
                    return p.__live;
                });



                //cheats
                renderInfo.particles -= particlesLength - t.__particles.length;
                //endcheats

                updated = 1;

            }

            if ((t.duration > 0) && (t.__elapsed >= t.duration) && t.loop) {
                t.__reset();
                updated = 1;
            }


            return updated;
        },

        __updateGeometryBuilder() {
            if (this.__geometryMod == 1) {
                this.__geometryBuilder = this.__animUVS ? AnimatedTailGeometryBuilder : TailGeometryBuilder;
            }
            else {
                this.__geometryBuilder = NormalGeometryBuilder;
            }
        },

        __onTextureLoaded(tex) {
            if (this.texture == tex.__src) {
                this.__tl = 1;
                this.texture = tex.__src;
                delete this.__tl;
            }
        }

    });

function tryFindImage(filename) {
    if (filename && filename.replace) {
        var fn1 = filename.replace('.png', '');
        if (globalConfigsData.__frames.hasOwnProperty(fn1)) filename = fn1;
        fn1 = fn1.replace(/.*\//, '');
        if (globalConfigsData.__frames.hasOwnProperty(fn1)) filename = fn1;
    }
    return filename;
}

options.__defaultParticleEmitterProperties = {

    name: {
        set(v) {
            this.__name = v;
        },
        get() {
            return this.__name || ('__emitter_' + this.__effect.__emitters.indexOf(this))
        }
    },

    enabled: {
        set(v) { this.__enabled = v; },
        get() { return this.__enabled }
    },

    __enabled: {
        set(v) {
            this.____enabled = v;
            if (v && this.__effect && !this.__effect.__enabled) {
                this.__effect.__enabled = v;
            }
            this.__lastRenderTime = __currentFrame;
        },
        get() { return this.____enabled }
    },

    __geometryMod: {
        set(v) {
            this.____geometryMod = v;
            this.__updateGeometryBuilder();
        },
        get() { return this.____geometryMod || 0 }
    },

    __angleMod: {
        set(v) { this.____angleMod = v; },
        get() { return this.____angleMod || 0 }
    },

    //DEPRECATED!
    render_mode: {
        set(v) { this.____angleMod = v; },
        get() { return this.____angleMod || 0 }
    },

    sort_mode: 0,
    duration: 1,

    loop: {
        set(v) {
            this.__loop = v;
            if (v) this.__enabled = v;
        },
        get() { return this.__loop }
    },

    linked: false,
    texture_animation: 0,
    blending: {
        set(v) { this.__blending = this.____registeredBlending = v },
        get() { return this.__blending }
    },

    texture: {
        set(v) {
            var t = this;

            // object is DEPRECATED 
            if (isObject(v)) v = v.name;
            if (v == undefined) {
                t.map = undefined;
                return;
            }

            v = tryFindImage(v);

            t.p.texture = v;

            if (v) {
                var frame = globalConfigsData.__frames[v] || 0, map;
                if (frame.__loading) {
                    map = frame.tex;
                } else if (!frame) {
                    // looperPost(function(){ 
                    //   if (!t.__animatedTexture){
                    // __window.__loadImageStack = 'p';
                    if (!this.__tl) {
                        map = loadImage(v, a => { if (t.texture == v) t.texture = v; });
                    }
                    //  }
                    // });
                }
                if (map) {
                    map.__nodesWaitingsForThis = (map.__nodesWaitingsForThis || []);
                    map.__nodesWaitingsForThis.push(t);
                }
            }

            t.__uvsBuilder.__generateUVS(t);


        },

        get() {
            return this.p.texture;
        }
    }

};


options.__defaultParticleEmitterHZProperties = {
    // basic hz
    lifespan: 1,
    rate: 100,
    power: 20,

    origin: [_xy_hz_, 0]

};

var deprecated = {}
function consoleDeprecated(a) {
    //debug
    if (!deprecated[a]) {
        consoleWarn(a, 'is deprecated!');
        deprecated[a] = 1;
    }
    //undebug
}

function createDeprecatedProperties(list, componentEmitterField, componentType) {
    var o = {};
    for (var i in list) o[i] = createDeprecatedProperty(i, list[i], componentEmitterField, componentType);
    return o;
}
function createDeprecatedProperty(
    pname, defaultValue, componentEmitterField, componentType
) {
    return {
        get() { return this.p[pname] },
        set(v) {
            consoleDeprecated('emitter ' + pname);
            var t = this; v == undefined ? defaultValue : v; t.p[pname] = v;
            if (!t[componentEmitterField]) {
                t[componentEmitterField] = t.__addComponent(EffectComponentsFactory.__createByType(componentType));
            }
            t[componentEmitterField][pname] = v;
        }
    }

}

// DEPRECATED !!!
ObjectDefineProperties(ParticleEmitterPrototype,
    addProps(
        options.__defaultParticleEmitterHZProperties,

        addProps(options.__defaultParticleEmitterProperties,
            mergeObjects([
                createDeprecatedProperties({
                    direction: 0,
                    velocity: 0,
                    spin_factor: 1,
                    spin: 0,
                    force: 0,
                    velocity_factor: 1,
                    size: 10,
                    size_factor: 1
                }, PDM.__defaultComponent, 'd')
                ,
                createDeprecatedProperties({
                    accel: 0,
                    accel_factor: 1
                }, PDM.__radTransEmitterComponent, 'rta')
                ,
                createDeprecatedProperties({
                    color: 255,
                    color_factor: 1
                }, PDM.__colorEmitterComponent, 'c')
            ])
            , addEmitterProp),
        addEmitterHZProp
    )
);

ObjectDefineProperties(ParticleEmitterPrototype, {
    __shaderPrefix: {
        get() {
            return this.__colorsBuffer ? 'part' : 'partnc';
        }
    },
    __shader: {
        get() {
            return { v: this.__shaderPrefix, f: this.____shader };
        },
        set(v) {
            if (v) {
                if (isString(v)) {
                    if (v.indexOf('part') != 0) {
                        v = this.__shaderPrefix + v;
                        if (!getFragmentShaderData(v)) {
                            //debug
                            //                     consoleError('no shader for particles:', v)
                            //                     debugger;
                            //undebug
                            return;
                        }
                    }
                    this.____shader = v;
                    this.__program = 0;
                }
            }

        }

    }
});



// TODO: 
// orientation
// sub_emitters
// accuracy













































































function smartToFixedDeep(obj) {
    if (isNumeric(obj)) {
        obj = Number(obj);
        var aobj = abs(obj);
        if (aobj < 0.1) {
            obj = Number(obj.toFixed(6));
        } else
        if (aobj < 1) {
            obj = Number(obj.toFixed(4));
        } else 
        if (aobj < 10) {
            obj = Number(obj.toFixed(2));
        } else {
            obj = parseInt(obj.toFixed(0));
        }
    }
    else if (typeof obj == 'object') {
        for (var i in obj) obj[i] = smartToFixedDeep(obj[i]);
    }
    return obj;
} 


///////////////////////////////////////////////////////////////////////////////////////
//   ParticleEffect
///////////////////////////////////////////////////////////////////////////////////////


function ParticleEffect(parent) {
    this.__node = parent;
    this.__emitters = [];
}

makeClass(ParticleEffect, {

    __init(v) {
        if (isString(v)) v = getEffectByName(v);
        this.loop = v.loop;
        if (v.__emitters) {
            for (var i = 0; i < v.__emitters.length; i++)
                this.__push(v.__emitters[i]);
        }
        return this;
    },

    __push(v) {
        var t = this, emitter = new ParticleEmitter(t, t.__node);
        t.__node.add(emitter);
        t.__emitters.push(emitter);
        emitter.__init(v);
        t.__enabled = 1;
        return emitter;
    },

    __pop(em) {
        removeFromArray(em, this.__emitters);
        return this;
    },

    __removeFromParent() {
        var t = this, e;
        for (var i = 0; i < t.__emitters.length; i++) {
            e = t.__emitters[i].__destruct();
            if (e.__parent) e.__parent.__removeChild(e);
        }
        t.__emitters = [];
        t.__enabled = 0;
    },

    __update() {

        var updated = 0
            , dt = mmin(0.5, __currentFrameDeltaTime / ONE_SECOND);

        for (var i = 0; i < this.__emitters.length; i++) {
            updated += this.__emitters[i].__update(dt);
        }

        if (!updated) {
            if (this.__loop) {
                this.__reset();
                updated = 1;
            }
        }
        return !updated;
    },
    __reset(clear) {
        $each(this.__emitters, function (e) { e.__reset(clear); });
    },
    __disable() {
        $each(this.__emitters, function (e) { e.__enabled = 0; });
    },
    __enable() {
        $each(this.__emitters, function (e) { e.__enabled = 1; });
    }

    , __toJson() {
        var v = {};
        if (this.loop) v.loop = 1;
        for (var j in this.__emitters) {
            if (!v.__emitters) v.__emitters = [];
            v.__emitters.push(this.__emitters[j].__toJson())
        }

        return smartToFixedDeep(v);
    }


}, {
    loop: {
        set(v) { this.__loop = v; if (v) this.__enabled = v; },
        get() { return this.__loop }
    },
    __matrixWorld: {
        get() {
            return this.__node.mw
        }
    },
    __rotate: {
        get() {
            return this.__node.____rotation;
        }
    },
    __worldPosition: {
        get() {
            return this.__node.__worldPosition
        }
    }
});









var emmpropopts = {
    linked: [0, undefined],

    __angleMod: [0, undefined],
    __geometryMod: [0, undefined],

    sort_mode: [0],
    duration: [1],
    blending: [undefined, 1],
    texture: [undefined, ''],
    lifespan: [undefined, 1, [1]],
    rate: [undefined, 100, [100]],
    power: [undefined, 20, [20]],
    origin: [undefined, 0, [0]],
    __target: [undefined, null, 0, ''],
    __subEmitter: [undefined, null, 0, '']

};

ParticleEmitterPrototype.__toJson = function () {
    var v = {}, nosave = 0;
    if (this.loop) v.loop = 1;
    if (this.__name) v.name = this.__name;
    for (var i in emmpropopts) {
        nosave = 0;
        for (var j in emmpropopts[i]) {
            nosave = isValuesEquals(emmpropopts[i][j], this[i]);
            if (nosave) break;
        }
        if (nosave) continue;
        v[i] = this[i];
    }

    v.__componentsList = EffectComponentsFactory.__componentsToJson(this.__components);

    return v;

}





//debug


var particlesPropertiesDescriptions = {

    emitter: {

        linked: { type: 'b' },
        loop: { type: 'b' },

        __angleMod: {
            type: 'list', label: 'angle mod',
            values: ['-', '-', 'Oriented by position', 'Oriented by velocity'],
            _default: 0
        },

        __geometryMod: {
            type: 'list', label: 'geom mod',
            values: ['-', 'Tail'],
            _default: 0
        },

        blending: {
            type: 'list', label: 'blending',
            values: ['NoBlending', 'NormalBlending', 'AdditiveBlending', 'SubtractiveBlending', 'MultiplyBlending'
                // TODO:
                // , 'CustomBlending'
            ],
            _default: 1
        },

        texture: { type: 'img' },

        duration: { type: 'number', step: 0.1, _default: 1 },

        lifespan: { type: 'hz', _default: 1, step: 0.1, standartRange: [0, 10] },
        rate: { type: 'hz', _default: 100, step: 1, standartRange: [0, 1000] },
        power: { type: 'hz', _default: 100, step: 1 },

        origin: { type: '[]', components: { x: { type: 'hz' }, y: { type: 'hz' } } },

    },

    DefaultEmitterComponent: {

        direction: { type: 'hz', standartRange: [0, 360] },

        velocity: { type: 'hz' },
        velocity_factor: {
            type: '[]',
            components: {
                x: { type: 'hz', step: 0.1, _default: 1, standartRange: [0, 1] },
                y: { type: 'hz', step: 0.1, _default: 1, standartRange: [0, 1] }
            },
            step: 0.1,
            _default: 1,
            standartRange: [0, 1]
        },

        spin: { type: 'hz' },
        spin_factor: { type: 'hz', step: 0.1, _default: 1, standartRange: [0, 1] },

        //  anchor:{ type:'[]', components:{ x:{ type:'hz' }, y:{ type:'hz' }, z:{ type:'hz' } } },

        force: { type: '[]', components: { x: { type: 'hz', standartRange: [0, 1000] }, y: { type: 'hz', standartRange: [0, 1000] } }, standartRange: [0, 1000] },

        size: { type: '[]', components: { width: { type: 'hz' }, height: { type: 'hz' } }, subtype: 'sz' },
        size_factor: { type: '[]', components: { width: { type: 'hz', step: 0.1, standartRange: [0, 1] }, height: { type: 'hz', step: 0.1, standartRange: [0, 1] } }, subtype: 'sz', step: 0.1, standartRange: [0, 1] },
    },

    RadTransAccelEmitterComponent: {
        accel: { type: '[]', components: { rad: { type: 'hz' }, trans: { type: 'hz' } } },
        accel_factor: { type: '[]', components: { rad: { type: 'hz', step: 0.1, standartRange: [0, 1] }, trans: { type: 'hz', step: 0.1, standartRange: [0, 1] } }, step: 0.1, standartRange: [0, 1] }

    },

    ColorEmitterComponent: {

        color: {
            type: '[]',
            components: {
                r: { type: 'hz', step: 1, standartRange: [0, 255] },
                g: { type: 'hz', step: 1, standartRange: [0, 255] },
                b: { type: 'hz', step: 1, standartRange: [0, 255] },
                a: { type: 'hz', step: 1, standartRange: [0, 255] }
            },
            subtype: 'color',
            step: 1,
            standartRange: [0, 255]
        },

        color_factor: {
            type: '[]',
            components: {
                r: { type: 'hz', step: 0.1, standartRange: [0, 1] },
                g: { type: 'hz', step: 0.1, standartRange: [0, 1] },
                b: { type: 'hz', step: 0.1, standartRange: [0, 1] },
                a: { type: 'hz', step: 0.1, standartRange: [0, 1] }

            },
            subtype: 'color',
            step: 0.1,
            standartRange: [0, 1]
        }

    },

    ParentColorEmitterComponent: {

        color_factor: {
            type: '[]',
            components: {
                r: { type: 'hz', step: 0.1, standartRange: [0, 1] },
                g: { type: 'hz', step: 0.1, standartRange: [0, 1] },
                b: { type: 'hz', step: 0.1, standartRange: [0, 1] },
                a: { type: 'hz', step: 0.1, standartRange: [0, 1] }
            },
            subtype: 'color',
            step: 0.1,
            standartRange: [0, 1]
        }

    },

    SubEmitterEmitterComponent: {
        __subEmitter: { type: 's', label: 'sub emitter name' }
    },


    TargetEmitterComponent: {
        __target: { type: 's', label: 'target' },
        __factor: { type: 'hz', step: 0.1, _default: 0, standartRange: [0, 1], label: 'factor' },
    },

    TailEmitterComponent: {
        __linked: { type: 'b', label: 'linked' },
        __reverseParticlesUpdate: { type: 'b', label: 'reverse' },
        __factor: { type: 'hz', step: 0.1, _default: 1, standartRange: [0, 1], label: 'factor' }
    },


    TexturingEmitterComponent: {

        __uvsTransform: {
            type: 'list', label: 'transform',
            values: ['-', 'Mirror X', 'Mirror Y', 'Mirror XY', 'Rotatae 90 cw', 'Rotate 90 ccw', 'Rotate 90 cw + Mirror', 'Rotate 90 ccw + Mirror'],
            _default: 0
        },

        __animated: { type: 'b' },

        __animationPostfix: { type: 'hz', step: 1, _default: 0, standartRange: [0, 10], label: 'anim postfix' },
        __animationPostfix_factor: { type: 'hz', step: 0.1, _default: 1, standartRange: [0, 1], label: 'postfix factor' },

        __uvsType: {
            type: 'list', label: 'uv type',
            values: ['-', 'Tail by index', 'Tail by life'],
            _default: 0
        }
    },


    ExtendedEmitterComponent: {
        __power: { type: 'hz', step: 1, _default: 0, standartRange: [0, 100], label: 'power by position' },
        __powerPositionFactor: { type: 'hz', step: 0.1, _default: 0, standartRange: [0, 1], label: 'power factor' },
        __angularVelocity: { type: 'hz', standartRange: [0, 10], step: 0.1, _default: 0, label: 'angular velocity' },
        __angularVelocityFactor: { type: 'hz', standartRange: [0, 1], step: 0.1, _default: 0, label: 'ang vel factor' }

    },

    ShaderingEmitterComponent: {

        __shader: { type: 's', label: 'shader' },

        f1: { type: 'hz', step: 0.1, _default: 0, standartRange: [0, 1], label: 'f1' },
        f2: { type: 'hz', step: 0.1, _default: 0, standartRange: [0, 1], label: 'f2' },
        f3: { type: 'hz', step: 0.1, _default: 0, standartRange: [0, 1], label: 'f3' },
        f4: { type: 'hz', step: 0.1, _default: 0, standartRange: [0, 1], label: 'f4' },
        f5: { type: 'hz', step: 0.1, _default: 0, standartRange: [0, 1], label: 'f5' },
        f6: { type: 'hz', step: 0.1, _default: 0, standartRange: [0, 1], label: 'f6' },
        f7: { type: 'hz', step: 0.1, _default: 0, standartRange: [0, 1], label: 'f7' },
        f8: { type: 'hz', step: 0.1, _default: 0, standartRange: [0, 1], label: 'f8' }

    },

    OriginEmitterComponent: {

        __byNode: { type: 'b', label: 'by node', _default: 1 },
        __form: { type: 'list', label: 'form', values: ['Quad', 'Circle'], _default: 0 },
        __byPerimeter: { type: 'b', label: 'perimeter', _default: 0 },
        __parameters: {
            type: '[]', standartRange: [0, 1000], components: {
                x: { type: 'hz', standartRange: [0, 1000] },
                y: { type: 'hz', standartRange: [0, 1000] },
                z: { type: 'hz', standartRange: [0, 1000] }
            }
        },
    }


};




var ParticlesComponentsTypesMap = {
    c: 'ColorEmitterComponent',
    pc: 'ParentColorEmitterComponent',
    d: 'DefaultEmitterComponent',
    rta: 'RadTransAccelEmitterComponent',
    sub: 'SubEmitterEmitterComponent',
    tgt: 'TargetEmitterComponent',
    tl: 'TailEmitterComponent',
    uv: 'TexturingEmitterComponent',
    eec: 'ExtendedEmitterComponent',
    sh: 'ShaderingEmitterComponent',
    or: 'OriginEmitterComponent'
}

//undebug
