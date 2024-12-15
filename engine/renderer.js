//cheats
var renderInfo = {

    matrixWorldUpdates: 0,
    matrixUpdates: 0,
    matrixScrollUpdates: 0,
    renderTargetsCount: 0,
    totalTexturesCount: 0,
    totalBuffersCount: 0,
    bindTexturesCount: 0,
    totalTextureMemory: 0,

    calls: 0,
    vertices: 0,
    canBatch: 0,
    frames: 0,
    nodes: 0,
    nodesRendered: 0,
    texts: 0,
    textsRendered: 0,
    textsTextures: 0,
    textsGenerated: 0,
    emitters: 0,
    particles: 0,
    emittersRendered: 0,
    emittersUpdated: 0,

    nodesUpdated: 0,
    nodesRealUpdated: 0,
    nodesUpdatedDeep: 0,

    renderTime: 0,
    drawTime: 0

};
//endcheats

var gl
    , _emptyImage
    , textureIdCount = 0
    , _texturesCache = {}
    , _depthRenderbuffer

    , CullFaceNone = 0
    , CullFaceBack = 1
    , CullFaceFront = 2
    , CullFaceFrontBack = 3
    , FrontFaceDirectionCW = 0
    , FrontFaceDirectionCCW = 1

    , FrontSide = 0
    , BackSide = 1
    , DoubleSide = 2
    , NoColors = 0
    , FaceColors = 1
    , VertexColors = 2

    , NoBlending = 0
    , NormalBlending = 1
    , AdditiveBlending = 2
    , SubtractiveBlending = 3
    , MultiplyBlending = 4

    , GL_FRAMEBUFFER = 36160
    , GL_RENDERBUFFER = 36161
    , GL_COLOR_ATTACHMENT0 = 36064


    , GL_TEXTURE_2D
    , GL_ARRAY_BUFFER = 34962
    , GL_ELEMENT_ARRAY_BUFFER = 34963

    , GL_RGB = 6407
    , GL_RGBA = 6408
    , GL_LUMINANCE = 6409
    , GL_DEPTH_COMPONENT = 6402
    , GL_UNSIGNED_BYTE = 5121
    , GL_UNSIGNED_SHORT = 5123

    , GL_LINEAR = 9729
    , GL_NEAREST = 9728

    , GL_FUNC_ADD = 32774
    , GL_FUNC_SUBTRACT = 32778
    , GL_FUNC_REVERSE_SUBTRACT = 32779

    , GL_ZERO = 0
    , GL_ONE = 1
    , GL_SRC_COLOR = 768
    , GL_ONE_MINUS_SRC_COLOR = 769
    , GL_SRC_ALPHA = 770
    , GL_ONE_MINUS_SRC_ALPHA = 771
    , GL_DST_ALPHA = 772
    , GL_ONE_MINUS_DST_ALPHA = 773

    , GL_DST_COLOR = 774
    , GL_ONE_MINUS_DST_COLOR = 775
    , GL_SRC_ALPHA_SATURATE = 776

    , GL_CONSTANT_COLOR = 32769
    , GL_ONE_MINUS_CONSTANT_COLOR = 32770
    , GL_CONSTANT_ALPHA = 32771
    , GL_ONE_MINUS_CONSTANT_ALPHA = 32772


    , GL_CLAMP_TO_EDGE = 33071
    , GL_REPEAT = 10497
    , GL_MIRRORED_REPEAT = 33648

    , GL_POINTS
    , GL_LINE_STRIP
    , GL_LINE_LOOP
    , GL_LINES
    , GL_TRIANGLE_STRIP
    , GL_TRIANGLE_FAN
    , GL_TRIANGLES

    , GL_NEVER
    , GL_ALWAYS
    , GL_LESS
    , GL_LEQUAL
    , GL_EQUAL
    , GL_GEQUAL
    , GL_GREATER
    , GL_NOTEQUAL 
 
    , blendingsList
    , glAttributes
    , textureRepeatsList
    , defaultShader = 'base'
    , _shader_precision
    , _shader_defines_str = "#ifdef GL_ES\n#define LOWP lowp\n#define MEDIUMP mediump\n#define HIGHP highp\n#else\n#define LOWP\n#define MEDIUMP\n#define HIGHP\n#endif\n"
    , depthBuffer;

function __setGLGlobals(gl) {

    GL_TEXTURE_2D = gl.TEXTURE_2D;
    GL_ELEMENT_ARRAY_BUFFER = gl.ELEMENT_ARRAY_BUFFER;
    GL_ARRAY_BUFFER = gl.ARRAY_BUFFER;

    GL_RGB = gl.RGB;
    GL_RGBA = gl.RGBA;
    GL_LUMINANCE = gl.LUMINANCE;
    GL_DEPTH_COMPONENT = gl.DEPTH_COMPONENT;

    GL_UNSIGNED_BYTE = gl.UNSIGNED_BYTE;
    GL_UNSIGNED_SHORT = gl.UNSIGNED_SHORT;

    GL_LINEAR = gl.LINEAR;
    GL_NEAREST = gl.NEAREST;


    GL_FUNC_ADD = gl.FUNC_ADD;
    GL_FUNC_SUBTRACT = gl.FUNC_SUBTRACT;
    GL_FUNC_REVERSE_SUBTRACT = gl.FUNC_REVERSE_SUBTRACT;

    GL_ZERO = gl.ZERO;
    GL_ONE = gl.ONE;
    GL_SRC_COLOR = gl.SRC_COLOR;
    GL_ONE_MINUS_SRC_COLOR = gl.ONE_MINUS_SRC_COLOR;
    GL_SRC_ALPHA = gl.SRC_ALPHA;
    GL_ONE_MINUS_SRC_ALPHA = gl.ONE_MINUS_SRC_ALPHA;
    GL_DST_ALPHA = gl.DST_ALPHA;
    GL_ONE_MINUS_DST_ALPHA = gl.ONE_MINUS_DST_ALPHA;

    GL_DST_COLOR = gl.DST_COLOR;
    GL_ONE_MINUS_DST_COLOR = gl.ONE_MINUS_DST_COLOR;
    GL_SRC_ALPHA_SATURATE = gl.SRC_ALPHA_SATURATE;

    GL_CONSTANT_COLOR = gl.CONSTANT_COLOR;
    GL_ONE_MINUS_CONSTANT_COLOR = gl.ONE_MINUS_CONSTANT_COLOR;
    GL_CONSTANT_ALPHA = gl.CONSTANT_ALPHA;
    GL_ONE_MINUS_CONSTANT_ALPHA = gl.ONE_MINUS_CONSTANT_ALPHA;

    GL_CLAMP_TO_EDGE = gl.CLAMP_TO_EDGE;
    GL_REPEAT = gl.REPEAT;
    GL_MIRRORED_REPEAT = gl.MIRRORED_REPEAT;

    GL_POINTS = gl.POINTS;
    GL_LINE_STRIP = gl.LINE_STRIP;
    GL_LINE_LOOP = gl.LINE_LOOP;
    GL_LINES = gl.LINES;
    GL_TRIANGLE_STRIP = gl.TRIANGLE_STRIP;
    GL_TRIANGLE_FAN = gl.TRIANGLE_FAN;
    GL_TRIANGLES = gl.TRIANGLES;

    GL_NEVER = gl.NEVER;
    GL_ALWAYS = gl.ALWAYS;
    GL_LESS = gl.LESS;
    GL_LEQUAL = gl.LEQUAL;
    GL_EQUAL = gl.EQUAL;
    GL_GEQUAL = gl.GEQUAL;
    GL_GREATER = gl.GREATER;
    GL_NOTEQUAL = gl.NOTEQUAL;

    blendingsList = [
        []// NoBlending

        // 1, __blendSrc __blendDst __blendEquation __blendSrcAlpha __blendDstAlpha __blendEquationAlpha

        , [1, GL_ONE, GL_ONE_MINUS_SRC_ALPHA, GL_FUNC_ADD, GL_ONE, GL_ONE, GL_FUNC_ADD] // NormalBlending

        , [0, GL_ONE, GL_ONE, GL_FUNC_ADD] // AdditiveBlending
        , [1, GL_ZERO, GL_ONE_MINUS_SRC_COLOR, GL_FUNC_ADD, GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA, GL_FUNC_ADD] // SubtractiveBlending
        , [0, GL_ZERO, GL_SRC_COLOR, GL_FUNC_ADD] // MultiplyBlending

    ];

    textureRepeatsList = [GL_CLAMP_TO_EDGE, GL_REPEAT, GL_MIRRORED_REPEAT];

}





//cheats
function debugOnGLError() { }
//endcheats

var __onLowGlMemCallback;
function __checkGLErrors(createdElement) {
    if (__onLowGlMemCallback) {
        var e = gl.getError();
        if ((!createdElement || e == gl.OUT_OF_MEMORY)) {
            //cheats
            if (e == gl.OUT_OF_MEMORY) consoleError('GL_OUT_OF_MEMORY catched');
            //endcheats
            __onLowGlMemCallback();
        }
    }
}

function registerBlending(o) {

    var newBlend =
        (o.__blendSrcAlpha == undefined &&
            o.__blendDstAlpha == undefined &&
            o.__blendEquationAlpha == undefined) ? [
            0,
            ifdef(o.__blendSrc, GL_ONE),
            ifdef(o.__blendDst, GL_ONE_MINUS_SRC_ALPHA),
            ifdef(o.__blendEquation, GL_FUNC_ADD)
        ] : [
            1,
            ifdef(o.__blendSrc, GL_ONE),
            ifdef(o.__blendDst, GL_ONE_MINUS_SRC_ALPHA),
            ifdef(o.__blendEquation, GL_FUNC_ADD),
            ifdef(o.__blendSrcAlpha, GL_ONE),
            ifdef(o.__blendDstAlpha, GL_ONE),
            ifdef(o.__blendEquationAlpha, GL_FUNC_ADD)
        ]
        , l = blendingsList.length
        , founded
        , i, j;

    for (i = 0; i < l; i++) {
        founded = i;
        for (j = 0; j < 7; j++) {
            if (blendingsList[i][j] != newBlend[j]) {
                founded = 0;
                break;
            }
        }
        if (founded)
            return founded;
    }

    blendingsList.push(newBlend);
    return l;


}


function Texture(image, params) {

    _texturesCache[textureIdCount] = this;
    params = params || 0;

    this.__init(mergeObj({
        __magFilter: GL_LINEAR,
        __minFilter: GL_LINEAR,
        __flipY: true,
        __wraps: GL_CLAMP_TO_EDGE,
        __wrapt: GL_CLAMP_TO_EDGE,
        __format: GL_RGBA,
        __type: GL_UNSIGNED_BYTE,
        id: textureIdCount++,
        __image: image,
        __premultiplyAlpha: true,
        __unpackAlignment: 4,
        v: 0
    }, params));
}

Texture.prototype = {

    constructor: Texture,

    set __needsUpdate(value) {
        if (value) {
            this.v++;
        }
    },

    __clone() {
        // please never clone textures!
        return this;
    },

    __onContextLost() {
        this.__destruct(1);
        this.__needsUpdate = 1;
    },
    //cheats
    __getMem() {
        return (this.__image ? (this.__image.width * this.__image.height * 4 / 1024 / 1024) : 0) || 0;
    },
    //endcheats
    __destruct(keepInCache) {
        if (this.__webglTexture) {
            this.__webgl.deleteTexture(this.__webglTexture);
            this.__webglTexture = 0;

            //cheats
            var mem = this.__getMem();
            looperPost(function () {
                renderInfo.totalTextureMemory -= mem;
            });
            renderInfo.totalTexturesCount--;
            //endcheats
        }

        this.__image = 0;

        if (!keepInCache) {
            delete _texturesCache[this.id];
        }
    },

    __checkGLTexture() {

        if (!this.__webglTexture) {

            this.__webglTexture = gl.createTexture();
            this.__webgl = gl;

            __checkGLErrors(this.__webglTexture);

            //cheats
            renderInfo.totalTextureMemory += this.__getMem();
            renderInfo.totalTexturesCount++;
            //endcheats
        } else {
            if (this.__webgl != gl) {

                this.__webgl.deleteTexture(this.__webglTexture);
                this.__webglTexture = gl.createTexture();

                __checkGLErrors(this.__webglTexture);

                this.__webgl = gl;
            }
        }
        return this.__webglTexture;
    },

    __init: defaultMergeInit,

    __setWrapS(v) {
        if (v != undefined) {
            v = textureRepeatsList[v] || GL_CLAMP_TO_EDGE;
            if (this.__wraps != v) {
                this.__wraps = v;
                this.__needsUpdate = 1;
            }
        }
    },

    __setWrapT(v) {
        if (v != undefined) {
            v = textureRepeatsList[v] || GL_CLAMP_TO_EDGE;
            if (this.__wrapt != v) {
                this.__wrapt = v;
                this.__needsUpdate = 1;
            }
        }
    }

};



var _renderTargetsCache = {}, _renderTargetsId = 0;

function WebGLRenderTarget(width, height, params) {
    params = params || {};

    _renderTargetsCache[_renderTargetsId] = this;

    //cheats
    renderInfo.renderTargetsCount++;
    //endcheats
    var img = params.__image || { width: width, height: height };
    //     var img = new Image();
    //     img.width = width;
    //     img.height = height;
    mergeObj(this, {
        id: _renderTargetsId,
        width: width,
        height: height,
        __scissor: new Vector4(0, 0, width, height),
        __scissorTest: false,
        __viewport: new Vector4(0, 0, width, height),
        __texture: new Texture(img, params)
    });

    _renderTargetsId++;

}

WebGLRenderTarget.prototype = {

    __setSize(width, height) {

        if (this.width !== width || this.height !== height) {

            this.width = width;
            this.height = height;

            this.__destruct();

        }

        this.__viewport.set(0, 0, width, height);
        this.__scissor.set(0, 0, width, height);

    },
    /*
        __createImage: function(){
            if (this.__texture.__dynamic) {
                this.__texture.__image = new Image();
            }
            else {
                this.__texture.__image = createCanvasFromRenderTarget(this);
            }
        },*/

    __destruct() {

        //cheats
        renderInfo.renderTargetsCount--;
        //endcheats

        delete _renderTargetsCache[this.id];

        if (this.__texture) {
            this.__texture.__destruct();
        }

        if (this.__webglFramebuffer) {
            gl.deleteFramebuffer(this.__webglFramebuffer);
            delete this.__webglFramebuffer;
        }

    },


    __onContextLost() {
        if (this.__texture) {
            this.__texture.__destruct(1);
        }
        if (this.__webglFramebuffer && gl) {
            gl.deleteFramebuffer(this.__webglFramebuffer);
        }
        this.__webglFramebuffer = 0;

    },

    __clear(r, g, b, a) {
        renderer.__setRenderTarget(this);
        renderer.__glClearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT);

    }


};




function ColorBuffer() {
    var color = new Vector4(), currentColorMask = null, currentColorClear = new Vector4(0, 0, 0, 1);
    return {
        __setMask(colorMask) {
            if (currentColorMask !== colorMask) {
                gl.colorMask(colorMask, colorMask, colorMask, colorMask);
                currentColorMask = colorMask;
            }
        },
        __setClear(r, g, b, a) {
            color.set(r, g, b, a);
            if (currentColorClear.__equals(color) === false) {
                gl.clearColor(r, g, b, a);
                currentColorClear.__copy(color);
            }
        },
        __reset() {
            currentColorMask = null;
            currentColorClear.set(0, 0, 0, 1);
        }
    };
}

var gl_alpha = false
    , gl_antialias = false
    , gl_depth = true
    , gl_premultipliedAlpha = true
    , gl_preserveDrawingBuffer = false
    , gl_attributesCount = 4;

function WebGLRenderer() {
    
    var __domElement = __document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas')
        , _this = this

        , gl_instanced_ext
        , _currentProgram
        , _currentRenderTarget
        , _currentFramebuffer = 0

        // , _isScissorEmpty

        , _currentViewport = new Vector4()
        , _usedTextureUnits = 0
        , _clearColor = new Color(0x000000)
        , _clearAlpha = 0

        , _width = __domElement.width
        , _height = __domElement.height

        , _pixelRatio = 1

        , _scissor = new Vector4(0, 0, _width, _height)
        , _scissorTest = 0

        , _viewport = new Vector4(0, 0, _width, _height)

        , _currentProjectionMatrix

        , _colorBuffer = new ColorBuffer()

        , _newAttributes
        , _maxVertexAttributes = gl_attributesCount
        , _enabledAttributes
        , _enabledInstancingdAttributes
        , _maxTextures
        , _maxTextureSize = 2048

        , _enabledGLFlags = {}

        , _currentBlending
        , _currentRenderList = []

        , _currentFlipSided
        , _currentCullFace

        , _currentTextureSlot = null
        , _currentBoundTextures = {}

        , _currentScissorTest
        , _currentScissor = new Vector4()
        , _currentViewport = new Vector4()

        , _programsCache = {}
        , _shadersCache = { f: {}, v: {} }

        //cheats
        , _debugGlEnabled
        , _glwrapped
        //endcheats

        , _shaderDefines = { PI: PI }
        , _shaderMod

        , _emptyTexture = new Texture()

        , _uniformSettersByType = {

            0x1406: function (v) { gl.uniform1f(this.l, v || 0) },
            0x8b50: function (v) { if (!v) gl.uniform2f(this.l, 0, 0); else if (v.length) gl.uniform2fv(this.l, v); else gl.uniform2f(this.l, v.x, v.y); },
            0x8b51: function (v) { if (!v) gl.uniform3f(this.l, 0, 0, 0); else if (v.length) gl.uniform3fv(this.l, v); else if (v.r !== undefined) gl.uniform3f(this.l, v.r, v.g, v.b); else gl.uniform3f(this.l, v.x, v.y, v.z); },
            0x8b52: function (v) { if (!v) gl.uniform4f(this.l, 0, 0, 0, 0); else if (v.length) gl.uniform4fv(this.l, v); else gl.uniform4f(this.l, v.x, v.y, v.z, v.w); },
            0x8b5a: function (v) {
                //debug
                v = v || defaultIdentityMatrix;
                //undebug
                gl.uniformMatrix2fv(this.l, false, v.e || v);
            },
            0x8b5b: function (v) {
                //debug
                v = v || defaultIdentityMatrix;
                //undebug
                gl.uniformMatrix3fv(this.l, false, v.e || v);
            },
            0x8b5c: function (v) {
                //debug
                v = v || defaultIdentityMatrix;
                //undebug
                gl.uniformMatrix4fv(this.l, false, v.e || v);
            },
            0x8d66: __setTexture2D,
            0x8b5e: __setTexture2D,
            0x1404: function (v) { gl.uniform1i(this.l, v); },
            0x8b56: function (v) { gl.uniform1i(this.l, v); },
            0x8b53: function (v) { gl.uniform2iv(this.l, v); },
            0x8b57: function (v) { gl.uniform2iv(this.l, v); },
            0x8b54: function (v) { gl.uniform3iv(this.l, v); },
            0x8b58: function (v) { gl.uniform3iv(this.l, v); },
            0x8b55: function (v) { gl.uniform4iv(this.l, v); },
            0x8b59: function (v) { gl.uniform4iv(this.l, v); }

        };

    function __initAttributes() {

        for (var i = 0, l = _newAttributes.length; i < l; i++) {

            _newAttributes[i] = 0;

        }

    }

    function __enableAttribute(attribute, divisor) {

        _newAttributes[attribute] = 1;

        if (_enabledAttributes[attribute] === 0) {

            gl.enableVertexAttribArray(attribute);
            _enabledAttributes[attribute] = 1;

        }

        if (_enabledInstancingdAttributes[attribute] !== divisor) {
            if (gl_instanced_ext) {
                gl_instanced_ext.vertexAttribDivisorANGLE(attribute, divisor)
            } else {
                gl.vertexAttribDivisor(attribute, divisor);
            }
            _enabledInstancingdAttributes[attribute] = divisor;
        }
    }


    function __disableUnusedAttributes() {

        for (var i = 0, l = _enabledAttributes.length; i !== l; ++i) {

            if (_enabledAttributes[i] !== _newAttributes[i]) {

                gl.disableVertexAttribArray(i);
                _enabledAttributes[i] = 0;
                _enabledInstancingdAttributes[i] = 0;

            }

        }

    }

    function __enable(id) {

        if (!_enabledGLFlags[id]) {
            gl.enable(id);
            _enabledGLFlags[id] = 1;
        }
    }

    function __disable(id) {
        if (_enabledGLFlags[id]) {
            gl.disable(id);
            _enabledGLFlags[id] = 0;
        }
    }


    let currentDepthMask = null;
    let currentDepthFunc = null;
    let currentDepthClear = null;

    depthBuffer = (function () {

        let locked = false;

        return {
            __setTest: function (depthTest) {
                (depthTest ? __enable : __disable)(gl.DEPTH_TEST);
            },
            __setMask: function (depthMask) {
                if (currentDepthMask !== depthMask && !locked) {
                    gl.depthMask(depthMask);
                    currentDepthMask = depthMask;
                }
            },
            __setFunc: function (depthFunc) {
                if (currentDepthFunc !== depthFunc) {
                    gl.depthFunc(depthFunc);
                    currentDepthFunc = depthFunc;
                }
            },
            __setLocked: function (lock) {
                locked = lock;
            },
            __setClear: function (depth) {
                currentDepthClear = depth;
            },
            __clear() {
                gl.clearDepth(currentDepthClear);
                gl.clear(gl.DEPTH_BUFFER_BIT)
            },
            __reset: function () {
                locked = false;
                currentDepthMask = null;
                currentDepthFunc = null;
                currentDepthClear = null;
            }
        };

    })();

    function __setBlending(blending) {

        _currentBlending = blending;

        if (blending === NoBlending) {

            __disable(gl.BLEND);

        } else {

            __enable(gl.BLEND);

            blending = blendingsList[blending] || blendingsList[1];

            if (blending[0]) {

                gl.blendEquationSeparate(blending[3], blending[6]);
                gl.blendFuncSeparate(blending[1], blending[2], blending[4], blending[5]);

            } else {

                gl.blendEquation(blending[3]);
                gl.blendFunc(blending[1], blending[2]);

            }

        }

    }

    function __setFlipSided(flipSided) {

        if (_currentFlipSided !== flipSided) {

            if (flipSided) {

                gl.frontFace(gl.CW);

            } else {

                gl.frontFace(gl.CCW);

            }

            _currentFlipSided = flipSided;

        }

    }

    function __setCullFace(cullFace) {

        if (cullFace !== _currentCullFace) {

            if (cullFace !== CullFaceNone) {

                __enable(gl.CULL_FACE);

                if (cullFace === CullFaceBack) {

                    gl.cullFace(gl.BACK);

                } else if (cullFace === CullFaceFront) {

                    gl.cullFace(gl.FRONT);

                } else {

                    gl.cullFace(gl.FRONT_AND_BACK);

                }

            } else {

                __disable(gl.CULL_FACE);

            }

            _currentCullFace = cullFace;
        }

    }

    function __setScissorTest(scissorTest) {

        if (_currentScissorTest != scissorTest) {
            _currentScissorTest = scissorTest;

            if (scissorTest) {

                __enable(gl.SCISSOR_TEST);

            } else {

                __disable(gl.SCISSOR_TEST);

            }
        }

    }

    function __activeTexture(webglSlot) {

        if (webglSlot === undefined)
            webglSlot = gl.TEXTURE0 + _maxTextures - 1;

        if (_currentTextureSlot !== webglSlot) {
            gl.activeTexture(webglSlot);
            _currentTextureSlot = webglSlot;
        }

    }

    function __bindTexture(webglTexture, slot) {

        if (_currentTextureSlot === null) {

            __activeTexture(slot);

        }

        var boundTexture = _currentBoundTextures[_currentTextureSlot];

        webglTexture = webglTexture || _emptyImage;
        if (boundTexture !== webglTexture) {
            //cheats
            renderInfo.bindTexturesCount++;
            //endcheats
            gl.bindTexture(GL_TEXTURE_2D, webglTexture);
            _currentBoundTextures[_currentTextureSlot] = webglTexture;
        }

    }

    function __texImage2D() {
        gl.texImage2D.apply(gl, arguments);
    }

    function __scissor(scissor, useIntersect) {

        if (_currentScissor.__equals(scissor) === false) {

            if (useIntersect) {
                scissor.x = mmax(_currentScissor.x, scissor.x);
                scissor.y = mmax(_currentScissor.y, scissor.y);
                scissor.z = mmin(_currentScissor.x + _currentScissor.z, scissor.x + scissor.z) - scissor.x;
                scissor.w = mmin(_currentScissor.y + _currentScissor.w, scissor.y + scissor.w) - scissor.y;
            }

            // _isScissorEmpty = scissor.w < 0 || scissor.z < 0;

            scissor.w = mmax(scissor.w, 0);
            scissor.z = mmax(scissor.z, 0);

            gl.scissor(scissor.x, scissor.y, scissor.z, scissor.w);
            _currentScissor = scissor.__clone();

        }

    }

    function __viewport(viewport) {

        if (_currentViewport.__equals(viewport) === false) {

            if (gl && gl.viewport) {
                gl.viewport(viewport.x, viewport.y, viewport.z, viewport.w);
                _currentViewport.__copy(viewport);
            }

        }

    }

    function __createWebGLShader(file, type, source) {

        var shader = gl.createShader(type);

        __checkGLErrors(shader);

        if (!shader)
            return 0;

        gl.shaderSource(shader, source);

        __checkGLErrors(shader);

        gl.compileShader(shader);

        //cheats
        var status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (status === false) {
            consoleError('Shader ' + file + ' couldn\'t compile.');
        }

        var log = gl.getShaderInfoLog(shader);
        if (log !== '') {
            consoleWarn(file, 'gl.getShaderInfoLog()', type == gl.VERTEX_SHADER ? "vertex" : "fragment", log, source);
        }
        //endcheats
        return {
            __shader: shader
            //cheats
            , src: source
            , log: log
            , compileStatus: status
            //endcheats
        };
    }

    /// \todo: bad bad bad!!!
    function __shader_needs_uv(file, data) {
        return file != 'c.v';
    }

    function __getWebGLVertexShader(file, raw) {
        var s = _shadersCache.v[file];
        if (!s) {
            if (options.__useRawShaders || raw) {
                s = _shadersCache.v[file] = __createWebGLShader(file, gl.VERTEX_SHADER, getVertexShaderData(file));
            }
            else {
                var data = getVertexShaderData(file);
                s = _shadersCache.v[file] = __createWebGLShader(file, gl.VERTEX_SHADER, [
                    _shader_defines_str,
                    'precision ' + _shader_precision + ' float;',
                    'precision ' + _shader_precision + ' int;',
                    'uniform mat4 matrixWorld;',
                    'uniform mat4 projectionMatrix;',
                    'attribute vec2 position;',
                    __shader_needs_uv(file, data) ? 'attribute vec2 uv;' : '',
                    data
                ].join('\n'));
            }
        }
        return s;
    }

    function __getWebGLFragmentShader(file, raw) {
        var s = _shadersCache.f[file];
        if (!s) {
            if (options.__useRawShaders || raw) {
                s = _shadersCache.f[file] = __createWebGLShader(file, gl.FRAGMENT_SHADER, getFragmentShaderData(file))
            } else {
                s = _shadersCache.f[file] = __createWebGLShader(file, gl.FRAGMENT_SHADER, [
                    _shader_defines_str,
                    'precision ' + _shader_precision + ' float;',
                    'precision ' + _shader_precision + ' int;',
                    getFragmentShaderData(file)
                ].join('\n'));
            }
        }
        return s;
    }

    function __makePowerOfTwo(image) {

        if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) {

            var canvas = __document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
            canvas.width = nearestPowerOfTwo(image.width);
            canvas.height = nearestPowerOfTwo(image.height);

            var context = canvas.getContext('2d');
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            //debug
            consoleWarn('WebGL: image is not power of two (' + image.width + 'x' + image.height + '). Resized to ' + canvas.width + 'x' + canvas.height, image);
            //undebug
            return canvas;

        }

        return image;

    }
    /*
        function __updateRenderTargetMipmap( renderTarget ) {
     
            var texture = renderTarget.__texture;
     
            if ( texture.__generateMipmaps && isPowerOfTwo( renderTarget ) ) {
     
                __bindTexture( texture.__webglTexture );
                gl.generateMipmap( GL_TEXTURE_2D );
                __bindTexture( null );
     
            }
     
        }*/

    function __clampImageToMaxSize(image, maxSize) {

        if (image.width > maxSize || image.height > maxSize) {

            // Warning: Scaling through the canvas will only work with images that use
            // premultiplied alpha.

            var scale = maxSize / mmax(image.width, image.height);

            var canvas = __document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
            canvas.width = floor(image.width * scale);
            canvas.height = floor(image.height * scale);

            var context = canvas.getContext('2d');
            context.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);

            image.__scaled = 1 / scale;
            return canvas;

        }

        return image;

    }

    function __textureNeedsPowerOfTwo(texture) {

        return texture.__minFilter !== GL_NEAREST && texture.__minFilter !== GL_LINEAR;

    }

    function __isImagePowerOfTwo(image) {

        return isPowerOfTwo(image.width) && isPowerOfTwo(image.height);

    }

    function __setTextureParameters(texture) {

        gl.texParameteri(GL_TEXTURE_2D, gl.TEXTURE_WRAP_S, texture.__wraps);
        gl.texParameteri(GL_TEXTURE_2D, gl.TEXTURE_WRAP_T, texture.__wrapt);

        gl.texParameteri(GL_TEXTURE_2D, gl.TEXTURE_MAG_FILTER, texture.__magFilter);
        gl.texParameteri(GL_TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texture.__minFilter);

    }


    function __uploadTexture(texture, slot) {

        var image = texture.__image,
            //             isPowerOfTwoImage = __isImagePowerOfTwo( image ),
            glFormat = texture.__format,
            glType = texture.__type,
            webglTexture = texture.__checkGLTexture();

        image = texture.__image = __clampImageToMaxSize(image, _maxTextureSize);

        __activeTexture(gl.TEXTURE0 + slot);
        __bindTexture(webglTexture);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, texture.__flipY);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.__premultiplyAlpha);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, texture.__unpackAlignment);

        //TODO ?

        //         if ( __textureNeedsPowerOfTwo( texture ) && __isImagePowerOfTwo( image ) === false ) {
        //              image = __makePowerOfTwo( image );
        //         }

        __setTextureParameters(texture);

        //         var mipmaps = texture.__mipmaps;
        // 
        //         if ( mipmaps.length > 0 && isPowerOfTwoImage ) {
        // 
        //             for ( var i = 0, il = mipmaps.length; i < il; i ++ ) {
        // 
        //                 __texImage2D( GL_TEXTURE_2D, i, glFormat, glFormat, glType, mipmaps[ i ] );
        // 
        //             }
        // 
        //             texture.__generateMipmaps = 0;
        // 
        //         } else {
        // 
        // populate depth texture with dummy data

        // glInternalFormat = ;

        // 				if ( texture.type === FloatType ) {
        // 
        // 					if ( ! capabilities.isWebGL2 ) throw new Error( 'Float Depth Texture only supported in WebGL2.0' );
        // 					glInternalFormat = 36012;
        // 
        // 				} else if ( capabilities.isWebGL2 ) {
        // 
        // 					// WebGL 2.0 requires signed internalformat for glTexImage2D
        // 					glInternalFormat = 33189;
        // 
        // 				}
        // 
        // 				if ( texture.format === DepthFormat && glInternalFormat === 6402 ) {
        // 
        // 					// The error INVALID_OPERATION is generated by texImage2D if format and internalformat are
        // 					// DEPTH_COMPONENT and type is not UNSIGNED_SHORT or UNSIGNED_INT
        // 					// (https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/)
        // 					if ( texture.type !== UnsignedShortType && texture.type !== UnsignedIntType ) {
        // 
        // 						console.warn( 'THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture.' );
        // 
        // 						texture.type = UnsignedShortType;
        // 						glType = utils.convert( texture.type );
        // 
        // 					}
        // 
        // 				}

        //             if (glFormat == GL_DEPTH_COMPONENT) {
        //                 __texImage2D( GL_TEXTURE_2D, 0, GL_DEPTH_COMPONENT, image.width, image.height, 0, GL_DEPTH_COMPONENT, glType, null );
        //             } else {

        if (image.data instanceof Uint8Array) {
            __texImage2D(GL_TEXTURE_2D, 0, glFormat, image.width, image.height, 0, glFormat, glType, image.data);
        } else {
            __texImage2D(GL_TEXTURE_2D, 0, glFormat, glFormat, glType, image);
        }
        //             }
        //             
        //         }
        // 
        //         if ( texture.__generateMipmaps && isPowerOfTwoImage ) {
        //             gl.generateMipmap( GL_TEXTURE_2D );
        //         }

        __checkGLErrors(1);

        texture.__version = texture.v;

        //collect garbage - disabled normal gl context restores!
        if (!texture.__isVideo)
            texture.__image = { width: image.width, height: image.height };

        if (image.__scaled) texture.__image.__scaled = image.__scaled;

        texture.__uploaded = 1;

    }

    function __setTexture2D(texture) {

        texture = texture || _emptyTexture;

        if (_currentRenderTarget && _currentRenderTarget.__texture == texture)
            return;

        var slot = _usedTextureUnits++;

        gl.uniform1i(this.l, slot);

        if (texture.v > 0 && texture.__version !== texture.v) {
            if (texture.__image) {
                __uploadTexture(texture, slot);
                return;
            }
        }

        __activeTexture(gl.TEXTURE0 + slot);
        __bindTexture(texture.__webglTexture);

    }

    function __getWebGLProgram(shader) {

        if (isString(shader)) {
            shader = { v: shader, f: shader };
        }
        if (!shader.f) shader.f = defaultShader;
        if (!shader.v) shader.v = defaultShader;

        if (!shader.f.__shader && !getFragmentShaderData(shader.f)) shader.f = defaultShader;
        if (!shader.v.__shader && !getVertexShaderData(shader.v)) shader.v = defaultShader;

        if (_shaderMod) _shaderMod(shader);

        var id = (shader.v.id || shader.v) + '_' + (shader.f.id || shader.f);

        if (!_programsCache[id]) {
            var program = gl.createProgram()
                , glVertexShader = shader.v.__shader ? shader.v : __getWebGLVertexShader(shader.v, shader.r)
                , glFragmentShader = shader.f.__shader ? shader.f : __getWebGLFragmentShader(shader.f, shader.r)
                , attributes = {}
                , uniforms = {};

            __checkGLErrors(program);

            if (!glFragmentShader.id)
                glFragmentShader.id = shader.f;

            gl.attachShader(program, glFragmentShader.__shader);

            if (!glVertexShader.id)
                glVertexShader.id = shader.f;

            gl.attachShader(program, glVertexShader.__shader);

            gl.linkProgram(program);

            var log = gl.getProgramInfoLog(program);

            var status = gl.getProgramParameter(program, gl.LINK_STATUS);
            //cheats
            if (status === false) {

                consoleError(id, 'shader error: ', gl.getError(), 'gl.VALIDATE_STATUS', gl.getProgramParameter(program, gl.VALIDATE_STATUS),
                    'gl.getProgramInfoLog', log, glVertexShader.log, glFragmentShader.log);

            } else if (log !== '') {

                consoleWarn(id, 'gl.getProgramInfoLog()', log);

            }
            //endcheats

            for (var i = 0, n = n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES); i < n; i++) {
                var name = gl.getActiveAttrib(program, i).name;
                attributes[name] = gl.getAttribLocation(program, name);
            }


            for (var i = 0, n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i < n; i++) {

                var info = gl.getActiveUniform(program, i),
                    name = info.name;
                if (name) {
                    uniforms[name] = {
                        set: _uniformSettersByType[info.type],
                        l: gl.getUniformLocation(program, name)
                        //debug
                        , info: info
                        //undebug
                    };
                }

            }

            _programsCache[id] = {
                id: id,
                v: glVertexShader,
                f: glFragmentShader,
                __program: program,
                //cheats
                log: log,
                compileStatus: status,
                //endcheats
                attributes: attributes,
                uniforms: uniforms,
                __onContextLost: function () {
                    this.__contextlost = 1;
                    //TODO: cleanup?
                }
            }

        }

        return _programsCache[id];
    }
    //cheats
    function __disableGLDebug() {
        _debugGlEnabled = 0;
    }

    function __enableGLDebug() {
        _debugGlEnabled = 1;

        function transformate(d) {
            if (d === undefined) return '.';
            if (isNumeric(d)) {
                if (translatorObj[d])
                    return translatorObj[d];
            }
            return d
        }

        function transformateAll() {
            var arr = []; for (var i in arguments) arr.push(arguments[i]);
            return arr.map(transformate).join(' ');
        }


        function overrider(fname) {
            return function (a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
                var res = wraps[fname].apply(this, arguments);
                if (_debugGlEnabled) consoleLog('gl.' + fname + '(',
                    transformate(a),
                    transformate(b),
                    transformate(c),
                    transformate(d),
                    transformate(e),
                    transformate(f),
                    transformate(g),
                    transformate(h),
                    transformate(i),
                    transformate(j),
                    transformate(k),
                    transformate(l),
                    transformate(m),
                    transformate(n),
                    ') =', res);
                return res;
            }
        }

        if (!_glwrapped) {

            var wraps = {};
            _glwrapped = 1;

            var translatorObj = {};

            for (var i in gl) {

                if (isFunction(gl[i])) {
                    wraps[i] = gl[i].bind(gl);
                    gl[i] = overrider(i);
                } else {
                    translatorObj[gl[i]] = i;
                }
            }
        }

        var t = _this;
        if (!t.__wrapped) {
            t.__wrapped = 1;
            $each(t, function (f, i) {
                if (isFunction(f)) {
                    t[i] = function () {
                        if (_debugGlEnabled) {
                            consoleLog(i);
                        }
                        return f.apply(t, arguments);
                    };
                }
            })
        }
    }
    //endcheats        
    function __getMaxPrecision(precision) {
        function gmpTemp(f) {
            var vsp = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, f),
                fsp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, f);
            return vsp && fsp && vsp.precision > 0 && fsp.precision > 0;
        }
        if (precision == 'highp') {
            if (gmpTemp(gl.HIGH_FLOAT)) return precision;
            precision = 'mediump';
        }
        if (precision == 'mediump') {
            if (gmpTemp(gl.MEDIUM_FLOAT)) return precision;
        }
        return 'lowp';
    }

    function __setClearColor(c, a){
        _clearColor = c;
        _clearAlpha = a || c.a || 0;
    }

    function __glClearColor(r, g, b, a) {
        if (gl_premultipliedAlpha) { r *= a; g *= a; b *= a; }
        _colorBuffer.__setMask(1);
        _colorBuffer.__setClear(r, g, b, a);
    }

    function getGLParameter(a) {
        if (gl) return gl.getParameter(a);
    }

    function __invalidateState() {
        _currentProgram =
            _currentTextureSlot =
            _currentBlending =
            _currentFlipSided =
            _currentScissorTest =
            _currentCullFace = null;

        _enabledGLFlags = {};
    }

    function __setDefaultGLState(callback) {

        gl = __domElement.getContext('webgl2', glAttributes);

        if (!gl) {
            //debug
            debugger;
            //undebug
            gl = __domElement.getContext('webgl', glAttributes) ||
                __domElement.getContext('experimental-webgl', glAttributes);

            if (gl) {
                gl_instanced_ext = gl.getExtension("ANGLE_instanced_arrays");
            }

        }

        if (!gl) {

            if (__mraid && callback) {
                setTimeout(() => {
                    __setDefaultGLState(callback)
                }, options.__glReadyTimeoutMs || 100);
            }

            if (__domElement.getContext('webgl') !== null) {
                setErrorReportingFlagWEBGL(2);
                throw 'Error creating WebGL (2)';
            } else {
                setErrorReportingFlagWEBGL(1);
                throw 'Error creating WebGL (1)';
            }

        }

        __setGLGlobals(gl);

        // Some experimental-webgl implementations do not have getShaderPrecisionFormat

        if (gl.getShaderPrecisionFormat === undefined) {

            gl.getShaderPrecisionFormat = function () { return { rangeMin: 1, rangeMax: 1, precision: 1 }; };

        }

        _maxVertexAttributes = mmin(getGLParameter(gl.MAX_VERTEX_ATTRIBS), gl_attributesCount);
        //debug
        if (_maxVertexAttributes < gl_attributesCount) {
            throw "Not enought gl attributes";
        }
        //undebug
        _newAttributes = new Uint8Array(_maxVertexAttributes);
        _enabledAttributes = new Uint8Array(_maxVertexAttributes);
        _enabledInstancingdAttributes = new Uint8Array(_maxVertexAttributes);
        _maxTextures = getGLParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        _maxTextureSize = getGLParameter(gl.MAX_TEXTURE_SIZE);

        _emptyImage = gl.createTexture();
        gl.bindTexture(GL_TEXTURE_2D, _emptyImage);
        gl.texParameteri(GL_TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(GL_TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        __texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 1, 1, 0, GL_RGBA, GL_UNSIGNED_BYTE, new Uint8Array(4));

        _shader_precision = _shader_precision || __getMaxPrecision('highp');

        // _shader_precision = _shader_precision || __getMaxPrecision('mediump');

        _shader_defines_str += '\nprecision ' + _shader_precision + ' float;\n';
        _shader_defines_str += 'precision ' + _shader_precision + ' int;\n'

        _shader_precision = _shader_precision.toUpperCase()

        __setFlipSided(false);

        __setFaceCulling(CullFaceNone)

        __setBlending(NormalBlending);

        __scissor(_scissor);
        __viewport(_viewport);

        depthBuffer.__setFunc(GL_GEQUAL);
        depthBuffer.__setMask(1);
        depthBuffer.__setTest(0);
        depthBuffer.__setClear(0);

        __glClearColor(_clearColor.r, _clearColor.g, _clearColor.b, _clearAlpha);

        if (callback) {
            callback();
        }
    }

    function __resetGLState() {

        __invalidateState();

        $each([_programsCache, _texturesCache, _buffersCache, _renderTargetsCache],
            function (o) {
                $each(o, function (l) {
                    l.__onContextLost();
                });
            });

        _programsCache = {};
        _shadersCache = { f: {}, v: {} };

        _currentBoundTextures = {};

        if (_enabledAttributes) {
            for (var i = 0; i < _enabledAttributes.length; i++) {

                if (_enabledAttributes[i] === 1) {

                    gl.disableVertexAttribArray(i);
                    _enabledAttributes[i] = 0;

                }

            }
        }

        _colorBuffer.__reset();


    }

    function __setPixelRatio(value) {

        _pixelRatio = value;

    }

    function __setSize(width, height, updateStyle) {

        _width = width;
        _height = height;

        if (updateStyle) {

            __domElement.width = width * _pixelRatio;
            __domElement.height = height * _pixelRatio;

            __domElement.style.width = width + 'px';
            __domElement.style.height = height + 'px';

        }

        _scissor.set(0, 0, width * _pixelRatio, height * _pixelRatio);
        _viewport.set(0, 0, width * _pixelRatio, height * _pixelRatio);

        __viewport(_viewport);

    }


    function __reversePainterSortStable(a, b) {

        return a.z == b.z ? a.id - b.id : a.z - b.z;

    }

    function __clear() {
        __glClearColor(_clearColor.r, _clearColor.g, _clearColor.b, _clearAlpha);
        gl.clear(gl.COLOR_BUFFER_BIT)
        depthBuffer.__clear();
    }


    function __createScissorsStack() {
        return {

            a: [],

            __push: function (sciss) {
                this.a.push(sciss);
                __scissor(sciss, 1);
                __setScissorTest(true);
                return sciss;
            },
            __pop: function () {
                this.a.pop();
                var lastSciss = this.a[this.a.length - 1];
                if (lastSciss) {
                    __scissor(lastSciss);
                    __setScissorTest(true);
                } else {
                    __scissor(new Vector4(0, 0, _width * _pixelRatio, _height * _pixelRatio));
                    __setScissorTest(false);
                }
                return lastSciss;
            }

        }
    }

    var _scissStack = __createScissorsStack();


    function __render(object, camera) {

        _currentProjectionMatrix = camera.__projectionMatrix;

        _currentRenderList = [];

        _scissStack.a = [];

        __projectObject(object, _currentRenderList, _scissStack);

        _currentRenderList.sort(__reversePainterSortStable);

        __renderObjects(_currentRenderList);

    }

    function __finishRender() {

        gl.flush();
        //         gl.finish();
        //         __checkGLErrors(1);

    }


    function __projectObject(object, toList, scissorsStack, baseList) {

        if (!object.__viewable || !object.____visible)
            return;

        var sciss = object.__glscissor, mtrx = _currentProjectionMatrix, baseList = baseList || toList;

        if (object.__dirty)
            object.update();

        if (object.__ignoreScissor)
            toList = baseList;

        if (sciss) {

            var tmp = {
                __render: function (c) {
                    scissorsStack.__push(sciss.__multiplyScalar(_pixelRatio));
                    return 1;
                },
                __renderList: [],
                z: object.__matrixWorld.e[14],
                id: object.id
            };


            toList.push(tmp);

            toList = tmp.__renderList;

        }

        if (object.__allProjectionMatrix) {
            _currentProjectionMatrix = object.__allProjectionMatrix;
        }

        object.__projectionMatrix = _currentProjectionMatrix;

        if (object.__stableZ) {
            // warning: __matrixWorld должно браться именно перед if-ом
            var mw = object.__matrixWorld;
            if (object.z == undefined) {
                object.z = mw.e[14];
            }
        } else {
            object.z = object.__matrixWorld.e[14];
        }

        toList.push(object);

        if (object.__childsProjectionMatrix) {
            _currentProjectionMatrix = _currentProjectionMatrix.__clone().__multiply(object.__childsProjectionMatrix);
        } else
            if (object.__scrollVector) {
                _currentProjectionMatrix = _currentProjectionMatrix.__clone().__moveByVector2(object.__scrollVector);
                _currentProjectionMatrix.__isScrollMatrix = 1;
            }

        var childs = object.__childsForRender || object.__childs;

        for (var i = 0, l = childs.length; i < l; i++) {
            __projectObject(childs[i], toList, scissorsStack, baseList);
        }

        if (sciss) {
            toList.sort(__reversePainterSortStable);
            toList.push({
                __render: function (c) {
                    scissorsStack.__pop();
                    return 1;
                }
            })
        }

        _currentProjectionMatrix = mtrx;
        return toList;
    }

    function __renderObjects(renderList) {

        for (var i = 0, l = renderList.length; i < l; i++) {

            var object = renderList[i];


            //debug
            if (object.__debugDrawing) {
                debugger;
                renderer.__enableGLDebug();
            }
            //undebug

            object.__render();

            //debug
            if (object.__debugDrawing) {
                renderer.__disableGLDebug();
                delete object.__debugDrawing;
            }
            //undebug

            if (object.__renderList) {
                __renderObjects(object.__renderList);
            }

        }

    }


    function __setFaceCulling(cullFace, frontFaceDirection) {

        __setCullFace(cullFace);
        __setFlipSided(frontFaceDirection === FrontFaceDirectionCW);

    }

    function __setRenderTarget(renderTarget) {

        _currentRenderTarget = renderTarget;

        var framebuffer;

        if (renderTarget) {

            if (!renderTarget.__webglFramebuffer) {

                var texture = renderTarget.__texture;
                texture.__checkGLTexture();

                var isTargetPowerOfTwo = isPowerOfTwo(renderTarget);

                // Setup framebuffer

                renderTarget.__webglFramebuffer = gl.createFramebuffer();

                __checkGLErrors(renderTarget.__webglFramebuffer);

                __bindTexture(texture.__webglTexture);
                __setTextureParameters(texture);

                var glFormat = texture.__format;
                var glType = texture.__type;

                __texImage2D(GL_TEXTURE_2D, 0, glFormat, renderTarget.width, renderTarget.height, 0, glFormat, glType, null);

                gl.bindFramebuffer(GL_FRAMEBUFFER, renderTarget.__webglFramebuffer);

                gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, texture.__webglTexture, 0);

                // TODO: depth                
                /*
                _depthRenderbuffer = gl.createRenderbuffer();
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, renderTarget.width, renderTarget.height);
                gl.bindRenderbuffer(gl.RENDERBUFFER, _depthRenderbuffer);
                gl.framebufferRenderbuffer(GL_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, _depthRenderbuffer);
                */

                gl.bindFramebuffer(GL_FRAMEBUFFER, null);
                /*
                if ( texture.__generateMipmaps && isTargetPowerOfTwo ) {
                    gl.generateMipmap( GL_TEXTURE_2D );
                }
                */

                __checkGLErrors(renderTarget.__webglFramebuffer);

                __bindTexture(null);

            }


            framebuffer = renderTarget.__webglFramebuffer;

            if (_currentFramebuffer !== framebuffer) {
                __scissor(renderTarget.__scissor);
                __setScissorTest(renderTarget.__scissorTest);
                __viewport(renderTarget.__viewport);
            }


        } else {

            __scissor(_scissor);
            __setScissorTest(_scissorTest);
            __viewport(_viewport);

        }

        if (_currentFramebuffer !== framebuffer) {

            gl.bindFramebuffer(GL_FRAMEBUFFER, framebuffer);
            _currentFramebuffer = framebuffer;

        }

    }

    function __readRenderTargetPixels(renderTarget, x, y, w, h, buffer) {

        var framebuffer = renderTarget.__webglFramebuffer;

        if (framebuffer) {

            var restore = false;

            if (framebuffer !== _currentFramebuffer) {

                gl.bindFramebuffer(GL_FRAMEBUFFER, framebuffer);

                restore = true;

            }

            try {

                w = floor(w) || floor(renderTarget.width || renderTarget.__image.width);
                h = floor(h) || floor(renderTarget.height || renderTarget.__image.height);
                x = x || 0;
                y = y || 0;

                buffer = buffer || new Uint8Array(4 * w * h);

                if (gl.checkFramebufferStatus(GL_FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {

                    // the following if statement ensures valid read requests (no out-of-bounds pixels, see #8604)

                    if ((x >= 0 && x <= (renderTarget.width - w)) && (y >= 0 && y <= (renderTarget.height - h))) {

                        gl.readPixels(x, y, w, h, renderTarget.__texture.__format, renderTarget.__texture.__type, buffer);

                    }

                } else {

                    //                      consoleError( 'WebGL.readRenderTargetPixels: readPixels from renderTarget failed. Framebuffer not complete.' );

                }

            } finally {

                if (restore) {

                    gl.bindFramebuffer(GL_FRAMEBUFFER, _currentFramebuffer);

                }

            }

            return buffer;

        }
    }


    //     function __disposeRenderer() {
    //          __domElement.removeEventListener( 'webglcontextlost', __onContextLost, false );
    //          __domElement.removeEventListener( 'webglcontextrestored', __onContextRestored, false ); 
    //      };

    function onContextLost(event) {
        setErrorReportingFlagWEBGL(3);
        consoleWarn('gl lost');
        event.preventDefault();
        __resetGLState();
        gl = 0;
        //TODO: b-1127
        __domElement.hidden = 1;
        throw 'gl lost';
    }

    function onContextRestored(event) {
        setErrorReportingFlagWEBGL(4);
        throw 'gl restored';
        consoleWarn('gl restored');
        event.preventDefault();
        __resetGLState();
        __setDefaultGLState();
    }
 

    function __draw(object, count, forceShader, start) {

        var blending = object.____registeredBlending;
        if (blending != _currentBlending) {
            __setBlending(blending);
        }

        _usedTextureUnits = 0;

        var program = object.__program;

        if (!program || program.__contextlost) {
            program = object.__program = __getWebGLProgram(object.__forceShader || forceShader || object.__shader || defaultShader);
            program.__contextlost = 0;
        }

        if (_currentProgram !== program) {
            gl.useProgram(program.__program);
            _currentProgram = program;
        }

        var p_uniforms = program.uniforms;

        //debug
        if (object.__debugDrawing) {
            for (var uname in p_uniforms) {
                consoleLog('pass uniform', uname, 'to program', program, object[uname]);
                p_uniforms[uname].set(object[uname]);
            }
        } else
            //undebug
            for (var uname in p_uniforms) {
                //debug
                if (1) {
                    try {
                        p_uniforms[uname].set(object[uname]);
                    }
                    catch (e) {
                        consoleLog('uniform', uname);
                        consoleError(e);
                        debugger;
                    }
                } else
                    //undebug
                    p_uniforms[uname].set(object[uname]);
            }

        renderer.__initAttributes();

        var r = object.__setupVertexAttributes(program);

        renderer.__disableUnusedAttributes();

        //cheats
        renderInfo.calls++;
        renderInfo.vertices += count;
        //endcheats
                
        //3d
        __setFaceCulling(object.__cullFace, object.__frontFaceDirection || 1);
        depthBuffer.__setTest(object.__useDepth || 0);
        //no3d

        if (r) {

            //cheats
            var tm = Date.now();
            //endcheats

            var icount = object.__instancesCount, dmode = object.__drawMode || gl.TRIANGLES;
            if (object.__indecesBuffer) {
                if (icount) {
                    gl.drawElementsInstanced(dmode, count, gl.UNSIGNED_SHORT, 0, icount);
                } else {
                    gl.drawElements(dmode, count, gl.UNSIGNED_SHORT, 0);
                }
            } else {
                start = start || 0;
                if (icount) {
                    if (gl_instanced_ext) {
                        gl_instanced_ext.drawArraysInstancedANGLE(dmode, start, count, icount);
                    } else {
                        gl.drawArraysInstanced(dmode, start, count, icount);
                    }
                } else {
                    gl.drawArrays(dmode, start, count);
                }
            }

            //cheats
            renderInfo.drawTime += ( Date.now() - tm ) / ONE_SECOND;
            //endcheats
 
        }


        //cheats
        debugOnGLError();
        //endcheats

        return r;
    }

    function __getVideoInfo() {
        if (gl) {
            var info = {
                __version: getGLParameter(gl.VERSION),
                __shaders: getGLParameter(gl.SHADING_LANGUAGE_VERSION),
                __vendor: getGLParameter(gl.VENDOR),
                __renderer: getGLParameter(gl.RENDERER)
            };

            var gldebugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (gldebugInfo) {
                info.__unmaskedVendorWebGL = getGLParameter(gldebugInfo.UNMASKED_VENDOR_WEBGL);
                info.__unmaskedRendererWebGL = getGLParameter(gldebugInfo.UNMASKED_RENDERER_WEBGL);
            }
        }
    }

    function __init(_readyCallback){
        
        _currentScissor.set(0, 0, _width * _pixelRatio, _height * _pixelRatio);

        for (var i in _shaderDefines)
            _shader_defines_str += '\n#define ' + i + ' ' + _shaderDefines[i];

        glAttributes = {
            alpha: gl_alpha,
            antialias: gl_antialias,
            depth: gl_depth,
            premultipliedAlpha: gl_premultipliedAlpha,
            preserveDrawingBuffer: gl_preserveDrawingBuffer
        };


        addEventListenersToElement(__domElement, set({},
            'webglcontextlost', onContextLost,
            'webglcontextrestored', onContextRestored
        ));
    
        __resetGLState();
        __setDefaultGLState(_readyCallback);
        
    }

    //cheats
    function __handleGLErrors(val) {
        debugOnGLError = val ? function(){
            var e = gl.getError();
            if (e) {
                debugger;
                // alert(err);
            }
        } : function(){}
    }
    //endcheats

    return {
        __domElement: __domElement
        , __init: __init
        , __initAttributes: __initAttributes
        , __enableAttribute: __enableAttribute
        , __disableUnusedAttributes: __disableUnusedAttributes
        , __setPixelRatio: __setPixelRatio
        , __setSize: __setSize
        , __render: __render
        , __finishRender: __finishRender
        , __clear: __clear
        , __setClearColor: __setClearColor
        , __glClearColor: __glClearColor
        , __setRenderTarget: __setRenderTarget
        , __draw: __draw
        , __maxTextureSize: _maxTextureSize
        , __readRenderTargetPixels: __readRenderTargetPixels
        , __getWebGLProgram: __getWebGLProgram
        , __setShaderMod: function (v) {
            _shaderMod = v;
            return _programsCache;
        }
        , __getVideoInfo: __getVideoInfo
        , __getCurrentProgram() { return _currentProgram }
        , __setTexture2D: __setTexture2D
        , __invalidateState: __invalidateState
        , __setBlending: __setBlending
        //cheats
        , __handleGLErrors: __handleGLErrors
        , __disableGLDebug: __disableGLDebug
        , __enableGLDebug: __enableGLDebug
        //endcheats
    }

}
