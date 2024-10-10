
var spineFactory = mergeObj({}, {

    __spineDataMap: {},

    __onDataLoaded: function (resourceName, jsonDataName, atlas, isBinary) {
        spineFactory.__spineDataMap[resourceName] = {
            __data: globalConfigsData[jsonDataName],
            __atlas: atlas,
            __isBinary: isBinary
        };
        return;
    },

    __atlasDataConverter: function (atlas, atlasText) {

        if (isString(atlasText)) {
            var atlasData = {};
            atlasText.replace(/size:\s*(\d+),\s*(\d+)\n/, (d, w, h) => {
                atlas.__size = new Vector2(parseInt(w), parseInt(h));
            }).replace(/(\w*)\n\s+rotate:\s*(\w+)\n\s+xy:\s*(\d+),\s*(\d+)\n\s+size:\s*(\d+),\s*(\d+)\n\s+orig:\s*(\d+),\s*(\d+)\n\s+offset:\s*(\d+),\s*(\d+)/gim, (d, name, r, x, y, w, h, ox, oy, ofx, ofy, i) => {
                atlasData[name] = [x, y, w, h, r == "true" ? 1 : 0, ofx, ofy].map(function (d) { return parseInt(d) });
            });

            atlas.__rawText = atlasText;

            return atlasData;
        }
        return atlasText;
    }


});



var SpineObject = (function () {

    function calculateBounds(skeleton) {
        skeleton.setToSetupPose();
        skeleton.updateWorldTransform();
        var offset = new spine.Vector2();
        var size = new spine.Vector2();
        skeleton.getBounds(offset, size, []);
        return { offset: offset, size: size };
    }

    //debug
    var debugShader, debugRenderer, debugBatcher;
    //undebug

    var defSpineShader, skeletonRenderer, batcher, _currentSpineProgram;

    var SHD = spine.webgl.Shader;

    function _mpname(d) {
        if (isObject(d))
            return objectKeys(d);
        return $map(d, function (s) { return s.name });
    }

    //TODO:
    mergeObjExclude(Texture.prototype, {
        // spine.GLTexture
        setFilters: function (minFilter, magFilter) {
        },
        setWraps: function (uWrap, vWrap) {
        },
        update: function (useMipMaps) {
        },
        restore: function () {
        },
        bind: function (unit) {

            // TODO: надо бы как-то по-нормальному сделать
            renderer.l = gl.getUniformLocation(_currentSpineProgram, 'u_texture');
            renderer.__setTexture2D(this);
        },
        unbind: function () {
        },
        dispose: function () {
        },
        // spine.Texture
        getImage: function () {
            return this.__image;
        },
        filterFromString: function (text) {
        },
        wrapFromString: function (text) {
        }
    });


    globalConfigsData[options.__baseShadersFolder + 'spine.v'] = "\
attribute vec4 a_position;\
attribute vec4 a_color;\
attribute vec4 a_color2;\
attribute vec2 a_texCoords;\
uniform mat4 u_projTrans;\
varying vec4 v_light;\
varying vec4 v_dark;\
varying vec2 v_texCoords;\
void main(){\
v_light = a_color;\
v_dark = a_color2;\
v_texCoords = a_texCoords;\
gl_Position = u_projTrans * a_position;\
}";

    globalConfigsData[options.__baseShadersFolder + 'spine.f'] = "\
#ifdef GL_ES\n#define LOWP lowp\nprecision mediump float;\n#else\n#define LOWP\n#endif\n\
varying LOWP vec4 v_light;\
varying LOWP vec4 v_dark;\
varying vec2 v_texCoords;\
uniform sampler2D u_texture;\
uniform LOWP vec3 color;\
uniform LOWP float a;\
void main(){\
    vec4 texColor = texture2D(u_texture, v_texCoords);\
    float alpha = texColor.a * v_light.a;\
    vec4 c = vec4(a * color * ( (1.0 - texColor.rgb) * v_dark.rgb * alpha + texColor.rgb * v_light.rgb ), alpha * a);\
    gl_FragColor = c;\
}";


    //debug
    globalConfigsData[options.__baseShadersFolder + 'spine_debug.v'] = "\
attribute vec4 a_position;\
attribute vec4 a_color;\
uniform mat4 u_projTrans;\
varying vec4 v_color;\
void main(){\
v_color = a_color;\
gl_Position = u_projTrans * a_position;\
}";

    globalConfigsData[options.__baseShadersFolder + 'spine_debug.f'] = "\
#ifdef GL_ES\n#define LOWP lowp\nprecision mediump float;\n#else\n#define LOWP\n#endif\n\
varying LOWP vec4 v_color;\
uniform LOWP vec3 color;\
uniform LOWP float a;\
void main(){\
    gl_FragColor = vec4( v_color.rgb * color, v_color.a * a);\
}";
    //undebug


    SHD.prototype.compile = function () {
        this.__program = renderer.__getWebGLProgram({
            v: getVertexShaderData(this.vertexShader) ? this.vertexShader : 'spine',
            f: getFragmentShaderData(this.fragmentShader) ? this.fragmentShader : 'spine'
        });
        this.program = this.__program.__program;
    };


    function draw(skeleton, shader, batcher, renderer, uniforms1, uniforms2) {

        shader.bind();

        _currentSpineProgram = shader.program;

        var p_uniforms = shader.__program.uniforms;

        uniforms2 = uniforms2 || 0;
        uniforms1 = uniforms1 || 0;
        for (var uname in p_uniforms) {
            p_uniforms[uname].set(uniforms2[uname] == undefined ? uniforms1[uname] : uniforms2[uname]);
        }

        batcher.begin(shader);
        renderer.draw(batcher, skeleton);
        batcher.end();

        shader.unbind();

    }

    function checkSpineVars() {
        if (!defSpineShader) {
            defSpineShader = new SHD(gl, 'spine', 'spine');

            batcher = new spine.webgl.PolygonBatcher(gl);
            skeletonRenderer = new spine.webgl.SkeletonRenderer(gl);
            skeletonRenderer.premultipliedAlpha = true;

            //debug
            debugRenderer = new spine.webgl.SkeletonDebugRenderer(gl);
            debugRenderer.drawRegionAttachments = true;
            debugRenderer.drawBoundingBoxes = true;
            debugRenderer.drawMeshHull = true;
            debugRenderer.drawMeshTriangles = true;
            debugRenderer.drawPaths = true;

            debugShader = new SHD(gl, 'spine_debug', 'spine_debug');
            debugBatcher = new spine.webgl.ShapeRenderer(gl);
            //undebug
        }
    }

    var sp_render = function () {
        var t = this.t;
        var th = this;

        if (th.__matrixWorldNeedsUpdate || th.__matrixNeedsUpdate) {
            th.__updateMatrixWorld();
        }

        // Apply the animation state based on the delta time.
        var state = t.__animationState;
        var skeleton = t.__skeleton;

        state.update(__currentFrameDeltaTime / 1000);
        state.apply(skeleton);
        skeleton.updateWorldTransform();

        draw(skeleton, t.__shader, batcher, skeletonRenderer, th, t.__uniforms);

        //debug
        // draw debug information
        if (t.__debugDrawing) {
            draw(skeleton, debugShader, debugBatcher, debugRenderer, th, t.__uniforms);
        }
        //undebug

        renderer.__invalidateState();

        return 1;
    }



    ObjectDefineProperties(NodePrototype, {
        __spine: {
            get: function () {
                return this.__spineObject;
            },
            set: function (v) {
                var t = this;
                if (t.____spineObject) {
                    t.____spineObject.__destruct();
                    delete t.____spineObject;
                }
                if (v) {
                    t.__spineObject = v;
                }
            }
        },

        __spineObject: {
            get: function () {
                return this.____spineObject;
            },
            set: function (v) {
                var t = this;
                if (t.____spineObject == v)
                    return;

                if (t.____spineObject && (!v || (v instanceof SpineObject))) {
                    t.____spineObject.__destruct();
                    delete t.____spineObject;
                }

                if (v instanceof SpineObject) {
                    t.____spineObject = v;
                }
                else if (v) {
                    if (!t.____spineObject) {
                        t.____spineObject = new SpineObject(this)
                    }
                    t.____spineObject.__init(v);
                }
            }
        }

    });

    return makeClass(function (parentNode) {

        this.__parent = parentNode;

    }, {

        __init: function (v) {

            if (isString(v)) {
                v = {
                    __name: v
                };
            }
            var n = v.__name;
            delete v.__name;

            mergeObj(this, v);

            if (n) {
                this.__name = n;
                v.__name = n;
            }
            return this;

        },

        __onDataReady: function () {
            try {

                // Load the texture atlas using name.atlas and name.png from the AssetManager.
                // The function passed to TextureAtlas is used to resolve relative paths.
                var t = this;
                var data = t.__data;

                var atl = data.__atlas;
                if (!atl) return;

                // пока тока одна текстура поддерживается
                var tex = globalConfigsData.__frames[atl.__atlasImageFile].tex;

                var atlas = new spine.TextureAtlas(atl.__rawText, path => tex);

                if (atl.__size) {
                    var sx = tex.__image.width / atl.__size.x;
                    var sy = tex.__image.height / atl.__size.y;
                    if (sx != 1 || sy != 1) {
                        $each(atlas.regions, r => {
                            r.u *= sx;
                            r.u2 *= sx;
                            r.v *= sy;
                            r.v2 *= sy;
                            r.x *= sx;
                            r.y *= sx;
                            r.width *= sx;
                            r.height *= sy;
                            r.offsetX *= sx;
                            r.offsetY *= sy;
                            r.originalHeight *= sy;
                            r.originalWidth *= sx;
                        });
                    }
                }

                // Create a AtlasAttachmentLoader that resolves region, mesh, boundingbox and path attachments
                var atlasLoader = new spine.AtlasAttachmentLoader(atlas);

                // Create a SkeletonJson instance for parsing the .json file.
                var skeletonJson = data.__isBinary ? new spine.SkeletonBinary(atlasLoader) : new spine.SkeletonJson(atlasLoader);

                // Set the scale to apply during parsing, parse the file, and create a new skeleton.
                if (options.__spineHD || this.__hd)
                    skeletonJson.scale = 0.5;

                if (isObject(data.__data.skins)) { // json data convert from 3.7

                    data.__data.skins = $mapObjectToArray(data.__data.skins, (s, i) => {
                        return { name: i, attachments: s }
                    });

                    function replaceCurve(o) {
                        if (isArray(o)) {
                            $each(o, replaceCurve);
                        } else if (isObject(o)) {
                            if (isArray(o.curve)) {
                                if (o.curve[3] != undefined) o.c4 = o.curve[3];
                                if (o.curve[2] != undefined) o.c3 = o.curve[2];
                                if (o.curve[1] != undefined) o.c2 = o.curve[1];
                                if (o.curve[0] != undefined) o.curve = o.curve[0];
                            } else {
                                $each(o, replaceCurve);
                            }
                        }
                    }
                    replaceCurve(data.__data.animations);

                }
                /*
                try {
                    
                    getJson("res/mm/animatedNPC/new_mm_NPC_cat_idle/mm_NPC_cat_idle.json?", r => ncat = r);
                    
                // debugger;
                    if (ncat) {
                        consoleLog( data.__data.skins[0].attachments.body.body );
                        jsonDiff(data.__data.animations.mm_NPC_cat_idle.deform.default.head.head, ncat.animations.mm_NPC_cat_idle.deform.default.head.head);
                        data.__data.animations = ncat.animations;
                    }
                    
                    
                } catch(e) {
                    console.error(e);
                }
                */

                t.__setSkeleton(skeletonJson.readSkeletonData(data.__data));
                //debugger;
                // Create an AnimationState, and set the initial animation in looping mode.
                t.__animationStateData = new spine.AnimationStateData(t.__skeleton.data);

                var animationState = t.__animationState = new spine.AnimationState(t.__animationStateData);

                t.__createArmature();

                t.__init({
                    __ready: 1,
                    __animation: t.__defaultAnimationOnStart
                });

                if (options.__spineLogEvents) {
                    animationState.addListener({
                        start: function (track) {
                            consoleLog("Animation on track " + track.trackIndex + " started");
                        },
                        interrupt: function (track) {
                            consoleLog("Animation on track " + track.trackIndex + " interrupted");
                        },
                        end: function (track) {
                            consoleLog("Animation on track " + track.trackIndex + " ended");
                        },
                        disposed: function (track) {
                            consoleLog("Animation on track " + track.trackIndex + " disposed");
                        },
                        complete: function (track) {
                            consoleLog("Animation on track " + track.trackIndex + " completed");
                        },
                        event: function (track, event) {
                            consoleLog("Event on track " + track.trackIndex + ": " + JSON.stringify(event));
                        }
                    });
                }

                if (t.__parent && t.__parent.__onSpineReady)
                    t.__parent.__onSpineReady();
            } catch (e) {
                consoleError(e);
            }

        },

        __clone: function () {
            return this.__toJson();
        },

        __toJson: function () {
            var t = this;
            return $filterObject({
                __name: t.__name,
                __hd: t.__hd,
                __skin: t.____skin,
                __binary: t.__binary
            }, a => a);
        },


        __destruct: function () {
            this.__stop();
            if (this.__armature)
                this.__armature.__removeFromParent();
            delete this.____name;
            delete this.__armature;
        },

        __createArmature: function (armatureName) {
            var t = this;
            if (t.__armature) {
                t.__destruct();
            }

            checkSpineVars();

            var a = t.__armature = t.__parent.__addChildBox({
                __size: [100, 100],
                __render: sp_render,
                t: t,
                __validToSave: 0,
                __uniforms: {
                    u_projTrans: function () {
                        var m = a.__projectionMatrix.__clone().__multiply(a.__matrixWorld).e;
                        m[14] = 0;
                        return m;
                    },
                    a: function () { return a.__alpha }
                    //                 color: function(){ return a.__color }
                }
            });
            return this;
        },

        __play: function (params) { // { __animationName, __speedUp, __repeatNumber, __maxTimeForAnim }
            var t = this;

            if (!t.__autoplay)
                return;

            if (!t.__armature) return;

            if (t.__currentAnimation) {
                t.__stop();
            }
            params = params || 0;
            var animationName = params.__animationName || params.name || params;
            //             speedUp = params.__speedUp ? 1 / params.__speedUp : 0,
            //             repeatNumber = params.__repeatNumber,
            //             maxTimeForAnim = params.__maxTimeForAnim;

            t.__currentAnimation = animationName;

            t.__animationState.setAnimation(0, animationName, true);
            return this;
        },

        __setEmptyAnimations: function (mixDuration, trackIndex, delay) {
            if (this.__currentAnimation && this.__animationState) {
                if (isNumeric(trackIndex))
                    this.__animationState.setEmptyAnimation(trackIndex, mixDuration || 0, delay || 0);
                else
                    this.__animationState.setEmptyAnimations(mixDuration || 0);
            }
            return this;
        },

        __stop: function () {
            //this.__setEmptyAnimations();
            return this;
        },

        __setSkin: function (skin, add) {

            var t = this;
            var skeleton = t.__skeleton;
            if (!skeleton)
                return;

            function _setSkin(skin, add) {
                if (skin) {
                    if (add) {
                        skeleton.skin = null;
                    }
                    skeleton.setSkin(skin);
                }
            }

            function setSkin(skin, add) {
                if (isString(skin)) {
                    if (!skeleton.skin || skeleton.skin.name != skin) {
                        var sk = skeleton.data.findSkin(skin);
                        //debug
                        if (!sk) {
                            consoleError(t.__name, "spine no skin", skin, "available skins:", $map(skeleton.data.skins, s => s.name).join(", "));
                        }
                        //undebug
                        _setSkin(sk, add);
                    }
                } else if (isObject(skin)) {
                    if (!skeleton.skin || skeleton.skin.name != skin.name) {
                        _setSkin(skin, add);
                    }
                } else if (isArray(skin)) {
                    if (skin.length) {
                        setSkin(skin[0]);
                        for (var i = 1; i < skin.length; i++) {
                            setSkin(skin[i], 1);
                        }
                    } else {
                        setSkin('default');
                    }
                }
            }

            setSkin(skin, add);

            t.____skinChanged = 0;

        },

        __setSkeleton: function (data) {
            var t = this;

            if (t.__skeletonData != data || t.____skinChanged) {
                t.__skeletonData = data;
                t.__skeleton = new spine.Skeleton(data);
                t.__bounds = calculateBounds(t.__skeleton);
            }

            t.__setSkin(t.__skin);

        }

    }, {

        __name: createSomePropertyWithGetterAndSetter(
            function () {
                return this.____name;
            },
            function (v) {
                var t = this;
                delete t.__opts;

                if (isObject(v)) {
                    t.__opts = v;
                    v = v.path;
                }

                var bv = basename(v).replace(/\?.*$/, '');
                t.____name = v;
                var isBinary = t.__binary;
                var loadD = spineFactory.__spineDataMap[bv];
                if (loadD) {
                    if (loadD.__loading) { loadD.__loading.push(t); return; }
                    if (loadD.__bad) return;
                    t.__data = spineFactory.__spineDataMap[bv];
                    t.__onDataReady();
                } else {
                    loadD = spineFactory.__spineDataMap[bv] = { __loading: [t] };
                    loadSpine(t.__opts || v, function () {

                        $each(loadD.__loading, function (l) {
                            l.__data = spineFactory.__spineDataMap[bv];
                            l.__onDataReady();
                        });

                        delete loadD.__loading;

                    }, function () {
                        spineFactory.__spineDataMap[bv] = { __bad: 1 };
                    }, isBinary, this.__hd);
                    return;
                }
            }
        ),

        __defaultAnimationOnStart: createSomePropertyWithGetterAndSetter(
            function () {
                var t = this;
                if (t.____defaultAnimationOnStart == undefined && t.__skeleton) {
                    t.____defaultAnimationOnStart = ($find(t.__skeleton.data.animations, a => 1) || 0).name;
                }
                return this.____defaultAnimationOnStart;

            },
            function (v) {
                this.____defaultAnimationOnStart = v;
            }
        ),

        __animation: createSomePropertyWithGetterAndSetter(
            function () {
                return this.__currentAnimation;
            },
            function (v) {
                if (v) {
                    if (this.__armature) {
                        this.__play(v);
                    } else {
                        this.__defaultAnimationOnStart = v;
                    }
                }
                else this.__stop();
            }
        ),

        __skin: createSomePropertyWithGetterAndSetter(
            function () {
                return this.____skin || 'default';
            },
            function (v) {
                if (isValuesEquals(this.____skin, v))
                    return;

                this.____skin = v;
                this.____skinChanged = 1;

                if (this.__skeletonData && this.__skeleton) {
                    this.__setSkeleton(this.__skeletonData);
                }
            }
        ),

        __skinStr: createSomePropertyWithGetterAndSetter(
            function () {
                return isString(this.____skin) ? this.____skin : isArray(this.____skin) ? this.____skin.join(', ') : '';
            },
            function (v) {
                this.__skin = isString(v) ? explodeString(v) : v;
            }
        ),

        __availableSkins: createSomePropertyWithGetterAndSetter(
            function () {
                var skins = getDeepFieldFromObject(this, '__skeleton', 'data', 'skins');
                if (!skins) skins = getDeepFieldFromObject(this.__data, '__data', 'skins');
                return _mpname(skins);

            }
        ),

        __availableAnimations: createSomePropertyWithGetterAndSetter(
            function () {
                var animations = getDeepFieldFromObject(this, '__skeleton', 'data', 'animations');
                if (!animations) animations = getDeepFieldFromObject(this.__data, '__data', 'animations');
                return _mpname(animations);
            }
        ),

        __autoplay: createSomePropertyWithGetterAndSetter(
            function () { return this.____autoplay == undefined || this.____autoplay ? 1 : 0; },
            function (v) {
                var t = this;
                if (t.__autoplay && (v == false || v == 0)) {
                    t.__setEmptyAnimations();
                    t.____autoplay = v;
                } else
                    if (!t.__autoplay && (v || v == undefined)) {
                        t.____autoplay = v;
                        t.__play(t.__currentAnimation || t.__defaultAnimationOnStart);
                    } else {
                        t.____autoplay = v;
                    }
            }
        ),

        __shader: createSomePropertyWithGetterAndSetter(
            function () {
                return this.____shader || defSpineShader;
            },
            function (v) {
                var t = this;
                if (v) {
                    if (t.____shader && t.____shader.s == v) {
                        // equals, noting to do
                    } else {
                        if (t.____shader) {
                            t.____shader.dispose();
                        }
                        t.____shader = new SHD(gl, v, v);
                        t.____shader.s = v;
                    }
                } else {
                    t.____shader = null;
                }

            }
        )


    });


})();


var loadSpine = function (path, onload, onerror, isBinary, isHD) {

    return TASKS_RUN([[TASKS_SPINE, path, isBinary, isHD]], onload, onerror);

}
