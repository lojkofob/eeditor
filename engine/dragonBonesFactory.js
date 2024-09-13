// This is DragonBonesJS factory for start and play animation, which was made in program DragonBones

var _dragonBonesDataLoadingMap_ = {};

if (typeof dragonBones != undefinedType) {

    var DBEventDispatcher = {

        hasEvent: function () { },
        addEvent: function () { }, //console.log('addEvent', arguments);
        removeEvent: function () { },
        dbInit: function () { },
        dbClear: function () { },
        dbUpdate: function () { },
        _dispatchEvent: function () { } //console.log('_dispatchEvent', arguments); 
    };


    /*
     * egret 
    var enum BinaryOffset {
            WeigthBoneCount = 0,
            WeigthFloatOffset = 1,
            WeigthBoneIndices = 2,
            MeshVertexCount = 0,
            MeshTriangleCount = 1,
            MeshFloatOffset = 2,
            MeshWeightOffset = 3,
            MeshVertexIndices = 4,
            TimelineScale = 0,
            TimelineOffset = 1,
            TimelineKeyFrameCount = 2,
            TimelineFrameValueCount = 3,
            TimelineFrameValueOffset = 4,
            TimelineFrameOffset = 5,
            FramePosition = 0,
            FrameTweenType = 1,
            FrameTweenEasingOrCurveSampleCount = 2,
            FrameCurveSamples = 3,
            FFDTimelineMeshOffset = 0,
            FFDTimelineFFDCount = 1,
            FFDTimelineValueCount = 2,
            FFDTimelineValueOffset = 3,
            FFDTimelineFloatOffset = 4,
        }
        */


    var db_render = function () {
        var t = this;

        if (t.__dirty) t.update();
        if (t.__matrixWorldNeedsUpdate || t.__matrixNeedsUpdate) t.__updateMatrixWorld();
        if (t.__indecesBuffer && (t.map || t.__shader)) {
            //cheats
            renderInfo.nodesRendered++;
            //endcheats
            renderer.__draw(t, t.__indecesBuffer.__realsize);
        }
        return 1;
    }

    mergeObj(dragonBones.Slot.prototype, {

        _disposeDisplay: function () {
            //debug
            throw 'not impl';
            //undebug
        },

        _updateVisible: function () {
            if (this._display)
                this._display.____visible = this._visible;
        },
        _updateBlendMode: function () {

            // TODO:
            //             case "normal": return 0 /* Normal */;
            //             case "add": return 1 /* Add */;
            //             case "alpha": return 2 /* Alpha */;
            //             case "darken": return 3 /* Darken */;
            //             case "difference": return 4 /* Difference */;
            //             case "erase": return 5 /* Erase */;
            //             case "hardlight": return 6 /* HardLight */;
            //             case "invert": return 7 /* Invert */;
            //             case "layer": return 8 /* Layer */;
            //             case "lighten": return 9 /* Lighten */;
            //             case "multiply": return 10 /* Multiply */;
            //             case "overlay": return 11 /* Overlay */;
            //             case "screen": return 12 /* Screen */;
            //             case "subtract": return 13 /* Subtract */;

            var blendModesMap = [NormalBlending, AdditiveBlending /*, ... TODO */];

            this._display.__blending = blendModesMap[this._blendMode] || NormalBlending;

        },

        _updateDisplay: function () { },

        _onUpdateDisplay: function () { },

        _replaceDisplay: function (d) {
            //debug
            throw 'not impl';
            //undebug
        },

        _updateFrame: function () { },

        _createDisplay: function (display) {

            var imgName = display.path || display.name;

            return new Node({
                __img: this.__dbResourceDataAtlasId + imgName,
                __validToSave: 0,
                __isDBDisplay: 1,
                __notNormalNode: 1,
                __render: db_render,
                __disableAlign: 1
            });

        },

        _removeDisplay: function () {
            //debug 
            throw "not impl"
            //undebug 
        },

        _addDisplay: function () {
            this._display = this._rawDisplay;
            this._armature._display.__addChildBox(this._display);
        },


        _updateMesh: function () {
            var t = this;

            var scale = t._armature.armatureData.scale;
            var meshData = t._meshData;
            var weightData = meshData.weight;
            var node = t._rawDisplay;
            var hasFFD = this._ffdVertices.length > 0;
            var data = meshData.__parent.__parent;
            var intArray = data.intArray;
            var floatArray = data.floatArray;
            var vertexCount = intArray[meshData.offset + 0];
            var vertexOffset = intArray[meshData.offset + 2];
            if (vertexOffset < 0) vertexOffset += 65536; // Fixed out of bouds bug. 
            var triangleCount = intArray[meshData.offset + 1];
            var uvOffset = vertexOffset + vertexCount * 2;

            if (!node.__meshed) {
                t._display = t._meshDisplay = node;

                // TODO: must be in _createDisplay
                node.__meshed = 1;

                node.__updateGeometry = node.__updateVertices = node.__updateUVS = function () { return this };

                if (!node.__verticesBuffer)
                    node.__verticesBuffer = node.__addAttributeBuffer('position', 2);

                //TODO: check destruction!!!

                node.__indecesBuffer = new MyBufferAttribute('', Uint16Array, 1, GL_ELEMENT_ARRAY_BUFFER, intArray.slice(meshData.offset + 4, meshData.offset + 4 + triangleCount * 3));

                var frame = node.__frame;

                if (frame) {
                    if (frame.__isSimpleImage) {
                        node.__uvsBuffer = node.__addAttributeBuffer('uv', 2, floatArray.slice(uvOffset, uvOffset + vertexCount * 2));
                    } else {

                        var uvsTransform = frame.v
                            , x = uvsTransform[0]
                            , y = uvsTransform[2]
                            , w = uvsTransform[1] - x
                            , h = uvsTransform[3] - y;

                        node.__uvsBuffer = node.__addAttributeBuffer('uv', 2);
                        var uvs = node.__uvsBuffer.__getArrayOfSize(vertexCount * 2, 1);
                        for (var i = 0; i < vertexCount * 2; i += 2) {
                            uvs[i] = floatArray[uvOffset + i] * w + x;
                            uvs[i + 1] = floatArray[uvOffset + i + 1] * h + y;
                        }

                        // console.log({ vertexCount:vertexCount, vertexOffset: vertexOffset, uvOffset:uvOffset, uvs: uvs });

                    }
                } else {
                    //debug
                    consoleWarn('no frame data for ', node.__img);
                    node.__drawMode = 3;
                    node.__shader = 'c';
                    //undebug
                }


            }

            var vertices = node.__verticesBuffer.__getArrayOfSize(vertexCount * 2, 1);

            if (weightData) {

                //             consoleLog("updated", node.__img);

                var weightFloatOffset = intArray[weightData.offset + 1];
                if (weightFloatOffset < 0) weightFloatOffset += 65536; // Fixed out of bouds bug. 

                for (
                    var i = 0, iD = 0, iB = weightData.offset + 2 + weightData.bones.length, iV = weightFloatOffset, iF = 0;
                    i < vertexCount;
                    ++i
                ) {
                    var boneCount = intArray[iB++];
                    var xG = 0.0, yG = 0.0;
                    for (var j = 0; j < boneCount; ++j) {
                        var boneIndex = intArray[iB++];
                        var bone = t._meshBones[boneIndex];
                        if (bone) {
                            var matrix = bone.globalTransformMatrix;
                            var weight = floatArray[iV++];
                            var xL = floatArray[iV++];
                            var yL = floatArray[iV++];

                            if (hasFFD) {
                                //                             xL += t._ffdVertices[iF++];
                                //                             yL += t._ffdVertices[iF++];
                            }

                            xG += (matrix.a * xL + matrix.c * yL + matrix.tx) * weight;
                            yG += (matrix.b * xL + matrix.d * yL + matrix.ty) * weight;
                        }
                    }

                    //                 if (iD == 0)
                    //                     consoleLog(xG);

                    vertices[iD++] = xG;
                    vertices[iD++] = -yG;
                }

            } else {
                for (var i = 0, l = vertexCount * 2; i < l; ++i) {
                    vertices[i] = floatArray[vertexOffset + i] + t._ffdVertices[i];
                }
            }



        },

        _updateTransform: function () {

            var node = this._display;
            if (node && !node.__meshed) {
                this._updateGlobalTransformMatrix(1);
                node.__offset.x = this.global.x;
                node.__offset.y = this.global.y;
                node.____scale.set(this.global.scaleX, this.global.scaleY);
                node.____rotation = -this.global.rotation;
                node.__skewGradX = this.global.skew;

                //TODO:
                // meshDisplay.$setAnchorOffsetX(this._pivotX);
                // meshDisplay.$setAnchorOffsetY(this._pivotY);
            }
        },

        _updateColor: function () {
            if (this._display) {
                var ct = this._colorTransform;
                /*
                    alphaMultiplier : 1
                    alphaOffset : 0
                    blueMultiplier:1
                    blueOffset:0
                    greenMultiplier:1
                    greenOffset:0
                    redMultiplier:1
                    redOffset:0
                */
                // TODO: offsets
                var c = this._display.__color;
                c.r = ct.redMultiplier;
                c.g = ct.greenMultiplier;
                c.b = ct.blueMultiplier;
                //             console.log(ct.alphaMultiplier);
                this._display.__alpha = clamp(ct.alphaMultiplier, 0, 1); // wtf here?

            }
        }

    });

    var dbEngine = new dragonBones.DragonBones();
    var dragonbonesFactory = mergeObj(new dragonBones.BaseFactory(), {

        __dbDataLoaded: function (dbname, dragonbonesJsonDataName, dbResourceDataAtlasId, oldFormat, isHd) {

            var dbDataConf = globalConfigsData[dragonbonesJsonDataName];

            if (dbDataConf) {
                dbDataConf.__old = oldFormat;

                if (dbDataConf.version == '5.5') {

                    //TODO: bugs with displayFrame animation - remove it
                    $each(dbDataConf.armature, function (a) {
                        $each(a.animation, function (b) {
                            $each(b.slot, function (c) {
                                delete c.displayFrame;
                            })
                        })
                    });

                    var data = _dragonBonesDataLoadingMap_[dbname] = dragonbonesFactory.parseDragonBonesData(dbDataConf, this.__name);
                    dragonbonesFactory._dragonBonesDataMap[dbname] = data;

                    data.__dbResourceDataAtlasId = dbResourceDataAtlasId;

                }
            }
        },

        _buildTextureAtlasData: function () {
            return { returnToPool: function () { } }
        },

        _buildArmature: function (dataPackage) {

            var armature = dragonBones.BaseObject.borrowObject(dragonBones.Armature);

            var armatureDisplay = new Node({
                __size: { x: 1, px: 0, y: 1, py: 0 },
                __disableAlign: 1,
                __validToSave: 0,
                __isDBArmature: 1,
                __render: db_render
            });

            armature.init(dataPackage.armature, DBEventDispatcher, armatureDisplay, dbEngine);

            return armature;
        },

        _buildSlot: function (dataPackage, slotData, displays, armature) {

            var dragonbonesSlot = new dragonBones.Slot();
            dragonbonesSlot._onClear();

            dragonbonesSlot.__dbResourceDataAtlasId = dataPackage.data.__dbResourceDataAtlasId;
            //debug
            if (displays.length > 1) {
                consoleError(displays);
                //             throw "wtf?";
            }
            //undebug

            var display = dragonbonesSlot._createDisplay(displays[0]);

            dragonbonesSlot.init(slotData, displays, display, display);

            return dragonbonesSlot;

        }

    });



    var DragonBonesObject = function (parentNode) {

        this.__parent = parentNode;

    }


    var DragonBonesObjectPrototype = DragonBonesObject.prototype = {

        __constructor: DragonBonesObject,

        __init: function (v) {

            if (isString(v)) {
                v = {
                    __name: v
                };
            }

            mergeObj(this, v);

        },

        __onDataReady: function () {

            var armatureNames = this.__data.armatureNames;

            //debug
            if (armatureNames.length > 1) {
                consoleWarn("ATENTION: a few armatures - need modify function"); //TODO: for a few armatures in dbObject
            }
            //undebug

            this.__createArmature(armatureNames[0]);

            this.__init({
                __ready: 1,
                __animation: this.__defaultAnimationOnStart
            });

            if (this.__parent && this.__parent.__onDBDataReady)
                this.__parent.__onDBDataReady();

        },

        clone: function () {
            return this.__name;
        },

        __destruct: function () {
            this.__stop();
            if (this.__armature && this.__armature._display)
                this.__armature._display.__removeFromParent();
            this.____name = 0;
            delete this.__armature;
        },

        __createArmature: function (armatureName) {
            if (this.__armature) {
                this.__destruct();
            }

            var armature = dragonbonesFactory.buildArmature(armatureName, this.__name);
            if (armature) {
                this.__armature = armature;
                if (this.__armature._display) {
                    this.__parent.__addChildBox(this.__armature._display);

                    if (this.__parent.__dragonBonesUniforms) {
                        this.__armature._display.__traverse(n => {
                            n.__uniforms = this.__parent.__dragonBonesUniforms;
                        });
                    }
                }
            }
        },

        __play: function (params) { // { __animationName, __speedUp, __repeatNumber, __maxTimeForAnim }
            var t = this;

            if (!t.__armature) return;

            if (t.__currentAnimation) {
                t.__stop();
            }

            var animationName = params.__animationName;
            //             speedUp = params.__speedUp ? 1 / params.__speedUp : 0,
            //             repeatNumber = params.__repeatNumber,
            //             maxTimeForAnim = params.__maxTimeForAnim;

            if (isString(params)) {
                animationName = params;
            }

            dbEngine._clock.add(t.__armature);

            t.__currentAnimation = animationName;
            //         t.__maxTimeForAnim = maxTimeForAnim; //in milliseconds
            t.__armature.animation.gotoAndPlay(animationName /* TODO: , fadeInTime, duration, playTimes, layer, group, fadeOutMode, pauseFadeOut, pauseFadeIn */);

            //3. gotoAndPlay (animationName, fadeInTime: number , duration: number, playTimes: number , layer: number , group: string , fadeOutMode: string, pauseFadeOut: boolean , pauseFadeIn: boolean )
            // - Start playing the animation with the specified name (duration - замедление какое-то получается)
            //4. gotoAndStop (animationName, time: number , normalizedTime: number, fadeInTime: number , duration: number , layer: number , group: stringfadeOutMode: string )
            // - Play an animation with the specified name and stop at a certain point in time  

            //this.animation.play(animationName); //Keep the animation from the current position

        },

        __stop: function (animationName) {
            if (this.__currentAnimation) {
                this.__currentAnimation = 0;
                this.__armature.animation.stop(animationName); //Pause animation playback
                dbEngine._clock.remove(this.__armature);
            }
        }

    };


    ObjectDefineProperties(DragonBonesObjectPrototype, {

        __name: {
            get: function () {
                return this.____name;
            },
            set: function (v) {
                var t = this;
                var fv = v;
                v = basename(v);
                t.____name = v;

                var armatures = 0;

                var loadD = _dragonBonesDataLoadingMap_[v];

                if (loadD) {
                    if (loadD.__loading) { loadD.__loading.push(t); return; }
                    if (loadD.__bad) return;

                    t.__data = dragonbonesFactory.getDragonBonesData(v);
                    t.__onDataReady();

                } else {

                    loadD = _dragonBonesDataLoadingMap_[v] = { __loading: [t] };

                    loadDragonBones(fv, function () {

                        $each(loadD.__loading, function (dbobj) {
                            dbobj.__data = dragonbonesFactory.getDragonBonesData(v);
                            dbobj.__onDataReady();
                        });

                        delete loadD.__loading

                    }, function () {
                        _dragonBonesDataLoadingMap_[v] = { __bad: 1 };
                    });

                }



            }
        },

        __defaultAnimationOnStart: {
            get: function () {

                if (this.____defaultAnimationOnStart == undefined) {
                    var armature = this.__armature;
                    if (armature) {
                        var firstAnimation = armature.animation._animationNames[0],
                            armatureDefaultAnim = armature.armatureData.defaultActions;

                        var defaultAnimation = armatureDefaultAnim[0] ? armatureDefaultAnim[0].name : 0;

                        this.____defaultAnimationOnStart = defaultAnimation || firstAnimation;
                    }
                }
                return this.____defaultAnimationOnStart;

            },
            set: function (v) {
                this.____defaultAnimationOnStart = v;
            }
        },

        __animation: {
            get: function () {
                return this.__currentAnimation;
            },
            set: function (v) {
                if (v) this.__play(v);
                else this.__stop();
            }
        }


    });




    var loadDragonBones = function (path, onload, onerror, isHd, oldFormat) {

        return TASKS_RUN([[
            TASKS_DRAGON_BONES, path, isHd, oldFormat
        ]], onload, onerror);

    }



    updatable.__push(dbEngine);

    dbEngine.__update = function (t, dt) {

        //debug
        //     if (!__forceAnimDt)
        //         return;
        //undebug

        dbEngine.advanceTime(dt / 1000);

    }



    ObjectDefineProperties(NodePrototype, {
        __dragonBones: {
            get: function () {
                return this.__dragonBonesObject;
            },
            set: function (v) {
                var t = this;

                if (t.__dragonBonesObject) {
                    t.__dragonBonesObject.__destruct();
                    delete t.__dragonBonesObject;
                }
                if (v) {
                    t.__dragonBonesObject = new DragonBonesObject(this);
                    t.__dragonBonesObject.__init(v);
                }
            }
        }
    });

}
