var stringseaseArrayForEasingConversionFromDigit = [
/*  0   */ 'easeLinear',
/*  1   */ 'easeSineIO',      /*  2   */ 'easeSineI',       /*  3   */ 'easeSineO',
/*  4   */ 'easeElasticIO',   /*  5   */ 'easeElasticI',    /*  6   */ 'easeElasticO',
/*  7   */ 'easeExpoIO',      /*  8   */ 'easeExpoI',       /*  9   */ 'easeExpoO',
/*  10  */ 'easeQuadIO',      /*  11  */ 'easeQuadI',       /*  12  */ 'easeQuadO',
/*  13  */ 'easeCubicIO',     /*  14  */ 'easeCubicI',      /*  15  */ 'easeCubicO',
/*  16  */ 'easeQuartIO',     /*  17  */ 'easeQuartI',      /*  18  */ 'easeQuartO',
/*  19  */ 'easeQuintIO',     /*  20  */ 'easeQuintI',      /*  21  */ 'easeQuintO',
/*  22  */ 'easeCircIO',      /*  23  */ 'easeCircI',       /*  24  */ 'easeCircO',
/*  25  */ 'easeBackIO',      /*  26  */ 'easeBackI',       /*  27  */ 'easeBackO',
/*  28  */ 'easeBounceIO',    /*  29  */ 'easeBounceI',     /*  30  */ 'easeBounceO'
];



var AnimationsWithKitten = (function () {

    var __animStartedTime = TIME_NOW;

    var animationsWithKitten = {
        timeline: 0,
        currentKeyFrame: -1,
        animsPlayed: 0,
        savedLayout: 0,
        recordEnabled: 0,
        histStackEnabled: null,
        propsList: {},

        splitTransform: function () {
            eachSelected(function (n) {
                if (!n.__is3D) {
                    if (((n.__keyframes || 0).__keyframes || 0).__transform) {
                        var keyframes = n.__keyframes.__keyframes;
                        var transform = keyframes.__transform;
                        delete keyframes.__transform;
                        keyframes.__ofs = $map(transform, function (frame) { return { va: [frame.va[0], frame.va[1]] } });
                        keyframes.__rotate = $map(transform, function (frame) { return { va: frame.va[4] } });
                        keyframes.__scale = $map(transform, function (frame) { return { va: [frame.va[2], frame.va[3]] } });
                    }
                }
            });
            setCurrentKeyFrameForce(animationsWithKitten.currentKeyFrame);
        }

    };

    var lastkfevent;
    function doWithKeyframes(node, f, forceCreate, dontSet) {
        var kkf = node.__eKeyframes;
        if (kkf) {
            // convert old format
            if (!kkf.__keyframes)
                kkf = { __keyframes: kkf };

            kkf = deepclone(kkf);

        } else {

            if (forceCreate) {
                kkf = { __keyframes: {} }
            }

        }

        if (kkf) {
            var mustAccepted = !dontSet && (lastkfevent != TIME_NOW);
            if (!f(kkf.__keyframes, kkf, mustAccepted)) {
                if (mustAccepted) {
                    lastkfevent = TIME_NOW;

                    invokeEventWithKitten('set', {
                        __eKeyframes: kkf
                    }, {
                        withHistoryStack: animationsWithKitten.histStackEnabled
                    });
                }
            }
        }

    }

    ObjectDefineProperties(NodePrototype, {
        __eKeyframes: {
            set: function (v) {
                this.__keyframes = v;
                if (lastkfevent != TIME_NOW) {
                    updateTimeLine();
                }
            },
            get: function (v) {
                return this.__keyframes;
            }
        }
    });

    ObjectDefineProperties(
        animationsWithKitten, {
        loopEnabled: {

            set: function (v) {
                eachSelected(function (n) {
                    doWithKeyframes(n, function (frames, keyframes) {
                        if (v) {
                            delete keyframes.__loopDisabled;
                        } else {
                            keyframes.__loopDisabled = 1;
                        }
                    });
                });
            },

            get: function () {
                var v = 0;
                eachSelected(function (n) {
                    doWithKeyframes(n, function (frames, keyframes) {
                        v = keyframes.__loopDisabled;
                    }, 0, 1);
                });
                return !v;
            }
        },
        loop: {

            set: function (v) {
                eachSelected(function (n) {
                    doWithKeyframes(n, function (frames, keyframes) {
                        keyframes.loop = Number(v);
                    });
                });
            },

            get: function () {
                var loop = 100;
                eachSelected(function (n) {
                    doWithKeyframes(n, function (frames, keyframes) {
                        loop = Number(keyframes.loop == undefined ? 100 : keyframes.loop);
                    }, 0, 1);
                });
                return loop;
            }
        },


        __easing: {

            set: function (v) {
                eachSelected(function (n) {
                    doWithKeyframes(n, function (frames, keyframes) {
                        keyframes.__easing = v;
                    });
                });

            },

            get: function () {
                var easing;
                eachSelected(function (n) {
                    doWithKeyframes(n, function (frames, keyframes) {
                        easing = keyframes.__easing;
                    }, 0, 1);
                });
                return easing;
            }

        },

        __lerp: {

            set: function (v) {
                eachSelected(function (n) {
                    doWithKeyframes(n, function (frames, keyframes) {
                        keyframes.__lerp = v;
                    });

                    //for debug
                    n.__text = String(Number(v || 0).toFixed(2));
                    looperPost(function () {
                        makeKeyframesGraph(n);
                    });

                });

            },

            get: function () {
                var lerp;
                eachSelected(function (n) {
                    doWithKeyframes(n, function (frames, keyframes) {
                        lerp = keyframes.__lerp;
                    }, 0, 1);
                });
                return lerp;
            }

        },

        focusedKframe: {
            set: function (v) {
                var fknode = this.timeline.focusedKframe;
                fknode.__visible = v ? 1 : 0;
                this.__fkf = v;
                if (v) {

                    EditFieldsWithKitten.unbindInput(fknode.keyFrame);
                    fknode.keyFrame.__propertyBinding = 'keyFrame';
                    EditFieldsWithKitten.prepare(fknode.keyFrame, null, v);

                    fknode.easing.value.__bindedObject = v;

                }

                updateFocusedKeyFrame();
            },

            get: function () {
                return this.__fkf;
            }
        }
    }
    )


    function playNodeAnim(node) {
        if (!node) return;
        options.__disableAutoanim = 0;
        if (node.__effect) node.__effect.__reset(1);
        if (isString(node.__animation)) node.__animation = node.__animation;
        else node.__simpleAnimation = node.__simpleAnimation;
        node.__keyframes = node.__keyframes;
        for (var i in node.__childs)
            playNodeAnim(node.__childs[i]);
    };

    function updateFocusedKeyFrame() {
        var fkf = animationsWithKitten.focusedKframe;
        if (fkf) {
            EditFieldsWithKitten.updatePropertyData('keyFrame', animationsWithKitten.timeline.focusedKframe.keyFrame, fkf, fkf.keyFrame);
            EditFieldsWithKitten.updatePropertyData('__easing', animationsWithKitten.timeline.focusedKframe.easing.value, fkf, fkf.__easing);
        }
    }

    function updateTimeLine() {

        looperPost(function () {
            animationsWithKitten.timeline.record.__visible =
                animationsWithKitten.timeline.play.__visible =
                animationsWithKitten.timeline.clearAll.__visible =
                Editor.currentLayout ? 1 : 0;
        });

        if (animationsWithKitten.updateTimeLineDisabled)
            return;

        var timeline = animationsWithKitten.timeline.__alias('timeline');

        animationsWithKitten.timeline.loop.value.__numericInputStep = 1;
        if (animationsWithKitten.timeline.lerp)
            animationsWithKitten.timeline.lerp.value.__numericInputStep = 0.1;


        for (var i in timeline.__childs) {
            timeline.__childs[i].removeMark = 1;
        }
        var hasSelected;
        animationsWithKitten.propsList = {};
        eachSelected(function (n) {

            hasSelected = 1;

            // TODO: big fat function - need refactoring!!
            doWithKeyframes(n, function (keyframes) {

                for (var property in keyframes) {
                    var propertyKeyframes = keyframes[property];
                    if (!isObject(propertyKeyframes))
                        return;

                    if (property == '__transform') {
                        animationsWithKitten.propsList.__x = 1;
                        animationsWithKitten.propsList.__y = 1;
                        animationsWithKitten.propsList.__scale = 1;
                        animationsWithKitten.propsList.__rotate = 1;
                    } else if (property == '__skew') {
                        animationsWithKitten.propsList.__skewGrad = 1;
                    } else {
                        animationsWithKitten.propsList[property] = 1;
                    }


                    var p = '+' + property;
                    if (!timeline[p]) {
                        timeline[p] = timeline.__addChildBox({
                            property: property,
                            __color: 0x333333,
                            __alpha: 0.3,
                            __size: { x: 1, px: 1, y: 33 },
                            ha: 0,
                            __childs: {
                                rm: {
                                    __class: 'e-btn-x',
                                    sha: 0,
                                    __onTap: function () {
                                        var pr = this.__parent.property;
                                        doWithKeyframes(n, function (keyframes) {
                                            delete keyframes[pr];
                                        });
                                        updateTimeLine();
                                        return 1;
                                    }
                                },
                                text: {
                                    __text: { __text: property, __fontsize: 18, __autoscale: 1 },
                                    __size: { x: 80, y: 20 },
                                    ha: 0,
                                    __x: 20,
                                },
                                line: {
                                    __color: 0x333333, __alpha: 0.3,
                                    __size: { x: 1, y: 1 }, ha: 0,
                                    __margin: [0, 100, 0, 0]
                                }
                            }
                        });
                        onTapHighlight(timeline[p].rm);
                    }

                    var row = timeline[p], propertyLine = row.line;
                    row.removeMark = 0;

                    for (var t in propertyLine.__childs) {
                        propertyLine.__childs[t].removeMark = 1;
                    }

                    for (var t in propertyKeyframes) {
                        t = Number(t);
                        var kframe = propertyLine[p + '_' + t];
                        if (!kframe) {
                            //                         consoleLog(t, propertyKeyframes[t]);
                            kframe = propertyLine.__addChildBox({
                                __img: 'rbord_20_w',
                                __size: { x: 7, y: 20 },

                                node: n,
                                property: property,
                                __keyFrame: t,

                                __x: t / animationsWithKitten.timeline.table.timelineScale,
                                __z: -3,

                                name: p + '_' + t,
                                __color: 0x9999cc,
                                __alpha: 0.6,
                                __onDestruct: function () {
                                    this.__unfocus();
                                    delete propertyLine[this.name];

                                },
                                __focus: function () {

                                    this.__alpha = 1;
                                    if (animationsWithKitten.focusedKframe)
                                        animationsWithKitten.focusedKframe.__unfocus();

                                    animationsWithKitten.focusedKframe = this;

                                },

                                __unfocus: function () {

                                    if (animationsWithKitten.focusedKframe == this)
                                        animationsWithKitten.focusedKframe = 0;

                                    this.__alpha = 0.6;
                                },

                                __onTap: function () {
                                    this.__focus();
                                    setCurrentKeyFrame(this.keyFrame);
                                    return 1;
                                },
                                __drag: function (x, y, dx, dy) {

                                    animationsWithKitten.histStackEnabled = 1;
                                    animationsWithKitten.updateTimeLineDisabled = 1;
                                    this.keyFrame += dx * animationsWithKitten.timeline.table.timelineScale * 1.5;
                                    animationsWithKitten.updateTimeLineDisabled = 0;
                                    animationsWithKitten.histStackEnabled = 0;

                                },

                                __dragEnd: function () {
                                    BUS.__post('FLUSH_HISTORY_STACK');
                                },
                            });

                            onTapHighlight(kframe);

                            ObjectDefineProperties(kframe, {

                                __easing: {

                                    set: function (v) {

                                        doWithKeyframes(this.node, function (kkf) {
                                            kkf = kkf[this.property];
                                            if (kkf) {
                                                var frame = kkf[this.__keyFrame];
                                                if (frame) frame.$ = v;
                                            }
                                        }.bind(this));

                                    },

                                    get: function () {
                                        var easing;
                                        doWithKeyframes(this.node, function (kkf) {
                                            kkf = kkf[this.property];
                                            if (kkf) {
                                                var frame = kkf[this.__keyFrame];
                                                if (frame) easing = frame.$;
                                            }
                                        }.bind(this), 0, 1);
                                        return easing;
                                    }

                                },

                                keyFrame: {
                                    set: function (v) {
                                        v = mmax(0, round(v));
                                        if (this.__keyFrame != v) {
                                            var immmppp;
                                            doWithKeyframes(this.node, function (keyframes, kkf, mustAccepted) {
                                                if (!mustAccepted) {
                                                    immmppp = 1;
                                                    return;
                                                }

                                                keyframes = keyframes[this.property];
                                                if (keyframes) {

                                                    var frame = keyframes[this.__keyFrame];

                                                    if (!frame)
                                                        return;

                                                    var impossible = keyframes[v];
                                                    while (impossible) {
                                                        if (v > this.__keyFrame) {
                                                            v++;
                                                        }
                                                        else {
                                                            v--;
                                                        }

                                                        if (v == -1) {
                                                            immmppp = 1;
                                                            return;
                                                        }

                                                        impossible = keyframes[v];

                                                    }

                                                    keyframes[v] = frame;
                                                    delete keyframes[this.__keyFrame];

                                                } else {
                                                    return true;
                                                }
                                            }.bind(this));

                                            if (!immmppp) {
                                                this.__keyFrame = v;
                                                this.__x = this.__keyFrame / animationsWithKitten.timeline.table.timelineScale;
                                                setCurrentKeyFrameForce(animationsWithKitten.currentKeyFrame);
                                            }

                                            if (animationsWithKitten.focusedKframe == this) {
                                                updateFocusedKeyFrame();
                                            }

                                        }

                                    },

                                    get: function () {
                                        return this.__keyFrame;
                                    }
                                }
                            });

                        } else {
                            kframe.removeMark = 0;
                        }
                    }
                }
            }, 0, 1);
        });

        var rem = timeline.__getObjectsByProperty('removeMark', 1);
        for (var i in rem) {
            timeline['+' + rem[i].property] = 0;
            rem[i].__removeFromParent();
        }

        for (var i in timeline.__childs) {
            timeline.__childs[i].__y = i * 35;
        }

        if (hasSelected) {

            EditFieldsWithKitten.updatePropertyData('loopEnabled', animationsWithKitten.timeline.loop.enabled, animationsWithKitten, animationsWithKitten.loopEnabled);
            EditFieldsWithKitten.updatePropertyData('loop', animationsWithKitten.timeline.loop, animationsWithKitten, animationsWithKitten.loop);
            EditFieldsWithKitten.updatePropertyData('__easing', animationsWithKitten.timeline.easing.value, animationsWithKitten, animationsWithKitten.__easing);
            if (animationsWithKitten.timeline.lerp)
                EditFieldsWithKitten.updatePropertyData('__lerp', animationsWithKitten.timeline.lerp, animationsWithKitten, animationsWithKitten.__lerp);

        }
        if (animationsWithKitten.timeline.lerp)
            animationsWithKitten.timeline.lerp.__visible = hasSelected;

        animationsWithKitten.timeline.loop.__visible =
            animationsWithKitten.timeline.easing.__visible = hasSelected;

        updateFocusedKeyFrame();

        timeline.update(1);
    }

    function recordSetEvent(node, change) {
        //         consoleLog(change);
        doWithKeyframes(node, function (keyframes) {

            var changed = 0;
            var prop = change.prop;
            switch (prop) {

                case '__eSize.x': prop = '__width'; break;
                case '__eSize.y': prop = '__height'; break;

                case '__x': prop = '__ofs.x'; break;
                case '__y': prop = '__ofs.y'; break;
                case '__z': prop = '__ofs.z'; break;

                case '__crop.0': prop = 'cropx'; break;
                case '__crop.1': prop = 'cropy'; break;
                case '__scale.0': prop = '__scalex'; break;
                case '__scale.1': prop = '__scaley'; break;
                case '__scale.x': prop = '__scalex'; break;
                case '__scale.y': prop = '__scaley'; break;

                case '__skewGrad.0': prop = '__skewGradX'; break;
                case '__skewGrad.1': prop = '__skewGradY'; break;
                case '__skewGrad.x': prop = '__skewGradX'; break;
                case '__skewGrad.y': prop = '__skewGradY'; break;

                case 'color': prop = '__color'; break;

            }

            var prev = change.prev && change.prev.__clone ? change.prev.__clone() : deepclone(change.prev);
            var next = change.next && change.next.__clone ? change.next.__clone() : deepclone(change.next);

            var o = node.__ofs;

            switch (prop) {

                case '__ofs.x': prop = '__ofs'; prev = o.__clone(); next = o.__clone(); prev.x = change.prev; break;
                case '__ofs.y': prop = '__ofs'; prev = o.__clone(); next = o.__clone(); prev.y = change.prev; break;
                case '__ofs.z': prop = '__ofs'; prev = o.__clone(); next = o.__clone(); prev.z = change.prev; break;

            }

            function addKFrameSimpleProp(p, prevval, nextval, checkEquals, firstKeyFrame) {
                if (checkEquals && (prevval == nextval))
                    return;

                if (!keyframes[p])
                    keyframes[p] = { 0: { va: prevval } };

                if (!keyframes[p][animationsWithKitten.currentKeyFrame]) {
                    if (firstKeyFrame) {
                        keyframes[p][animationsWithKitten.currentKeyFrame] = { 0: { va: firstKeyFrame } };
                    } else {
                        keyframes[p][animationsWithKitten.currentKeyFrame] = {};
                    }
                }

                keyframes[p][animationsWithKitten.currentKeyFrame].va = nextval;
                changed = 1;
            }

            function trrransforrrrmmmm() {

                if (!keyframes.__transform) {
                    var firstKeyFrame = node.__transform;

                    if (node.__is3D){
                        switch (prop) {
                            case '__ofs': firstKeyFrame[0] = prev.x; firstKeyFrame[1] = prev.y; firstKeyFrame[2] = prev.z; break;

                            case '__scale.x': case '__scalex': firstKeyFrame[3] = prev; break;
                            case '__scale.y': case '__scaley': firstKeyFrame[4] = prev; break;
                            case '__scale.z': case '__scalez': firstKeyFrame[5] = prev; break;

                            case '__rotation3d.x': case '__rotation3d_x': firstKeyFrame[6] = prev; break;
                            case '__rotation3d.y': case '__rotation3d_y': firstKeyFrame[7] = prev; break;
                            case '__rotate': 
                            case '__rotation3d.z': case '__rotation3d_z': firstKeyFrame[8] = prev; break;
                            
                            case '__rotation3dDeg.x': firstKeyFrame[6] = prev * DEG2RAD; break;
                            case '__rotation3dDeg.y': firstKeyFrame[7] = prev * DEG2RAD; break;
                            case '__rotation3dDeg.z': firstKeyFrame[8] = prev * DEG2RAD; break;

                            
                        }

                    } else {

                        switch (prop) {
                            case '__ofs': firstKeyFrame[0] = prev.x; firstKeyFrame[1] = prev.y; break;
                            case '__scale.x': case '__scalex': firstKeyFrame[2] = prev; break;
                            case '__scale.y': case '__scaley': firstKeyFrame[3] = prev; break;
                            case '__rotate': firstKeyFrame[4] = prev; break;
                        }
                    }
                    keyframes.__transform = { 0: { va: firstKeyFrame } };

                }

                if (!keyframes.__transform[animationsWithKitten.currentKeyFrame])
                    keyframes.__transform[animationsWithKitten.currentKeyFrame] = {};

                keyframes.__transform[animationsWithKitten.currentKeyFrame].va = node.__transform;

                if (!node.__is3D) {
                    if (prop == '__ofs' && prev.z != node.__z) {
                        if (!keyframes.__z) keyframes.__z = { 0: { va: prev.z } };
                        if (!keyframes.__z[animationsWithKitten.currentKeyFrame])
                            keyframes.__z[animationsWithKitten.currentKeyFrame] = {};
                        keyframes.__z[animationsWithKitten.currentKeyFrame].va = node.__z;
                    }
                }

                changed = 1;
            }


            function isTransformSplitted() {
                return keyframes.__ofs || keyframes.__rotate || keyframes.__scalex || keyframes.__scaley;
            }

            
            switch (prop) {

                case '__ofs':
                    if (isTransformSplitted()) {
                        prev = prev || 0;
                        next = next || 0;
                        addKFrameSimpleProp('__ofs', [prev.x, prev.y], [next.x, next.y]);
                    } else {
                        trrransforrrrmmmm();
                    }
                    break;

                case '__rotation3dDeg.x':
                case '__rotation3dDeg.y':
                case '__rotation3dDeg.z':
                    // if (isTransformSplitted()) { // not for 3d now
                    //    addKFrameSimpleProp('__rotation3d', [prev.x, prev.y, prev.z], [next.x, next.y, next.z]);
                    //} else {
                        trrransforrrrmmmm();
                   // }
                    break;

                case '__rotation3d':
                    //if (isTransformSplitted()) { // not for 3d now
                      //  addKFrameSimpleProp('__rotation3d', [prev.x, prev.y, prev.z], [next.x, next.y, next.z]);
                    //} else {
                        trrransforrrrmmmm();
                    //}
                    break;


                case '__rotate':
                    if (isTransformSplitted()) {
                        addKFrameSimpleProp('__rotate', numeric(prev), numeric(next));
                    } else {
                        trrransforrrrmmmm();
                    }
                    break;

                case '__scalex':
                    if (isTransformSplitted()) {
                        addKFrameSimpleProp('__scalex', numeric(prev), numeric(next));
                    } else {
                        trrransforrrrmmmm();
                    }
                    break;

                case '__scaley':
                    if (isTransformSplitted()) {
                        addKFrameSimpleProp('__scalex', numeric(prev), numeric(next));
                    } else {
                        trrransforrrrmmmm();
                    }
                    break;

                case '__color':
                    prev = prev || 0;
                    next = next || 0;
                    var kf = { r: prev.r || 0, g: prev.g || 0, b: prev.b || 0 };
                    addKFrameSimpleProp('__color', kf, { r: next.r || 0, g: next.g || 0, b: next.b || 0 }, 0, kf);
                    break;

                case '__skewGradX':
                case '__skewGradY':
                case '__skewGrad':

                    var kf = node.__skew.__clone();
                    kf = { x: kf.x, y: kf.y };
                    var prevKeyFrame = kf;

                    switch (prop) {
                        case '__skewGrad': prevKeyFrame = { x: prev.x * DEG2RAD, y: prev.y * DEG2RAD }; break;
                        case '__skewGradX': prevKeyFrame.x = prev * DEG2RAD; break;
                        case '__skewGradY': prevKeyFrame.y = prev * DEG2RAD; break;
                    }

                    addKFrameSimpleProp('__skew', prevKeyFrame, kf, 0, prevKeyFrame);
                    break;

                case '__eSize':
                    addKFrameSimpleProp('__width', (prev || 0).x || 0, (next || 0).x || 0, 1);
                    addKFrameSimpleProp('__height', (prev || 0).y || 0, (next || 0).y || 0, 1);
                    break;


                case 'f1': case 'f2': case 'f3': case 'f4': case 'f5': case 'f6': case 'f7': case 'f8':


                case '__width':
                case '__height':
                case 'cropy':
                case 'cropx':
                case '__alpha':
                case '__visible':
                    addKFrameSimpleProp(prop, prev || 0, next);
                    break;


            }

            updateTimeLine();
            return !changed;

        },
            1);
    }

    function setCurrentKeyFrameForce(k, n) {
        animationsWithKitten.currentKeyFrame = k - 1;
        setCurrentKeyFrame(k, n);
    }

    function setCurrentKeyFrame(kf, noreset) {

        if (!noreset) {
            __animStartedTime = kf * 10
        }

        kf = mmax(0, round(kf));

        if (animationsWithKitten.currentKeyFrame != kf) {
            animationsWithKitten.currentKeyFrame = kf;
            var table = animationsWithKitten.timeline.table;
            table.thumb.text.__text = animationsWithKitten.currentKeyFrame;
            table.thumb.__x = animationsWithKitten.currentKeyFrame / table.timelineScale - 10 + 100;

            __forceAnimTime = kf * 10;
            __forceAnimDt = 17;

            $each(updatable.a, function (u) {
                $each(u.a, function (a) {
                    if (a.editorSupportedUpdate) {
                        a.editorSupportedUpdate(!noreset);
                    }
                });
            })

            //             dbEngine.advanceTime(__forceAnimDt / 1000);

            __forceAnimDt = 0;
        }

        // if (!noreset){

        forOneSelected(function (n) {
            EditFieldsWithKitten.updateAllProps(animationsWithKitten.propsList, n);
        });

    }


    function updateTimeLines() {
        var tl = animationsWithKitten.timeline.__alias('timeline');
        for (var i in tl.__childs) {
            var line = tl.__childs[i].line;
            for (var j in line.__childs)
                line.__childs[j].__x = line.__childs[j].keyFrame / animationsWithKitten.timeline.table.timelineScale;
        }
    }

    mergeObjectDeep(EditorUIBehavioursWithKitten, {

        behaviours: {

            animationTimeline: function (n) {


                n.__parent.__visible = 0;
                animationsWithKitten.timeline = n;


                n.loop.__propertyBinding = 'loop';
                EditFieldsWithKitten.prepare(n.loop, null, animationsWithKitten);

                if (n.lerp) {
                    n.lerp.__propertyBinding = '__lerp';
                    EditFieldsWithKitten.prepare(n.lerp, null, animationsWithKitten);
                }

                n.loop.enabled.__propertyBinding = 'loopEnabled=!';
                EditFieldsWithKitten.prepare(n.loop.enabled, null, animationsWithKitten);

                //                 n.easing.value.__propertyBinding = '__easing='+JSON.stringify(stringseaseArrayForEasingConversionFromDigit);
                //                 n.easing.value.__stringifiedProperties = 1;
                EditFieldsWithKitten.prepare(n.easing.value, null, animationsWithKitten);

                var table = n.__alias('table');
                table.timelineScale = 1;

                table.__wheel = function (w) {
                    table.timelineScale = clamp(table.timelineScale + w * 0.05, 0.05, 100);
                    setCurrentKeyFrameForce(animationsWithKitten.currentKeyFrame);
                    updateTimeLines();
                    return 1;
                };

                table.__onTap =
                    table.__canDrag =
                    table.__drag = function () {
                        var sx = table.__size.x;
                        var sp = table.__worldPosition;
                        var m = toNodeCoords(mouse);
                        table.thumb.__x = mmin(sx - 17, mmax(-10 + 100, m.x - sp.x + sx / 2 - 17));
                        setCurrentKeyFrame((table.thumb.__x + 10 - 100) * table.timelineScale);

                        return 1;
                    }

                var ftimeplayed = 0;
                BUS.__addEventListener({

                    LAYOUT_ACTIVATED: function (t, l) {
                        updateTimeLine();

                        if (!ftimeplayed && findGetParameter('autoplay')) {
                            looperPost(function () {
                                invokeEventWithKitten('Animation.play');
                            });
                        }
                        ftimeplayed = 1;

                        // to convert old anims                         
                        //                         l.layoutView.$( function(n){
                        //                             if (n.__keyframes){
                        //                                 if (n.__keyframes.loop == 0){
                        //                                     n.__keyframes.__loopDisabled = 1;
                        //                                 }
                        //                             }
                        //                         } );
                        //                         

                    },

                    __ON_NODE_SELECTED: looperPostOne(updateTimeLine),
                    __ON_NODE_UNSELECTED: looperPostOne(updateTimeLine),
                    __OBJECT_CHANGED_set: function (t, change) {

                        if (animationsWithKitten.recordEnabled) {

                            recordSetEvent(change.node, change);

                        }
                    },
                    EDITOR_PREPARED: updateTimeLine


                });

                setCurrentKeyFrame(0);

                animationsWithKitten.focusedKframe = 0;

            }

        }

    });


    addEditorEvents('Animation', {

        prevFrame: function () {

            setCurrentKeyFrame(animationsWithKitten.currentKeyFrame - (isShiftPressed ? 10 : 1));

        },

        nextFrame: function () {

            setCurrentKeyFrame(animationsWithKitten.currentKeyFrame + (isShiftPressed ? 10 : 1));

        },

        setCurrentKeyFrame: function (d) {

            setCurrentKeyFrame(numeric(d));

        },

        clearKeyFrameEasing: function () {
            //TODO: history
            if (animationsWithKitten.focusedKframe) {
                animationsWithKitten.focusedKframe.__easing = undefined;
            }
            updateTimeLine();
        },

        clearKeyFramesEasing: function () {

            animationsWithKitten.__easing = undefined;
            updateTimeLine();
        },

        clearKeyFramesLoop: function () {
            animationsWithKitten.loop = 0;
            updateTimeLine();
        },

        clearKeyFramesLerp: function () {
            animationsWithKitten.__lerp = 0;
            updateTimeLine();
        },

        clearAll: function (d) {
            //TODO: history
            eachSelected(function (n) {
                n.__keyframes = undefined;
                resetNodePropertiesToNow(n);
            });
            updateTimeLine();
        },

        playFromStart: function () {
            setCurrentKeyFrame(0);
            if (!animationsWithKitten.animsPlayed) {
                invokeEventWithKitten('Animation.play');
            }
        },

        play: function (d) {


            animationsWithKitten.timeline.play.__classModificator = animationsWithKitten.animsPlayed ? 0 : 'checked';

            //                         eachSelected(function(sn){ sn.__unselect(); });

            animationsWithKitten.animsPlayed = !animationsWithKitten.animsPlayed;

            if (Editor.currentLayout) {

                if (animationsWithKitten.animsPlayed) {
                    //TODO:

                    //                                 animationsWithKitten.savedLayout = Editor.currentLayout.layoutView.__toJson();
                    BUS.__post('__ANIMATION_STARTED');

                    // __animStartedTime = 0;
                    animationsWithKitten.animsUpdatable = {
                        __update: function (t, dt) {
                            __animStartedTime += dt;
                            setCurrentKeyFrame(__animStartedTime / 10, 1);
                        }
                    }

                    updatable.push(animationsWithKitten.animsUpdatable);

                    playNodeAnim(Editor.currentLayout.layoutView);

                } else {

                    BUS.__post('__ANIMATION_STOPPED');

                    //                                 Editor.currentLayout.layoutView.__apply(animationsWithKitten.savedLayout);
                    updatable.pop(animationsWithKitten.animsUpdatable);
                    Editor.currentLayout.layoutView.update(1);
                    EditFieldsWithKitten.updateAllProps();

                }
            }

        },

        removeKeyFrame: function () {

            if (animationsWithKitten.focusedKframe) {

                forOneSelected(function (n) {
                    var p = animationsWithKitten.focusedKframe.property;
                    var kf = animationsWithKitten.focusedKframe.keyFrame;
                    doWithKeyframes(n, function (frames) {
                        if (frames[p]) {
                            delete frames[p][kf];
                            setCurrentKeyFrameForce(animationsWithKitten.currentKeyFrame);
                        } else {
                            return 1;
                        }
                    });
                });

                if (animationsWithKitten.focusedKframe)
                    animationsWithKitten.focusedKframe.__removeFromParent();
                animationsWithKitten.focusedKframe = 0;
            }
        },

        record: function (d) {

            animationsWithKitten.timeline.record.__classModificator = animationsWithKitten.recordEnabled ? 0 : 'checked';

            animationsWithKitten.recordEnabled = !animationsWithKitten.recordEnabled;

        }

    });

    addKeyboardMap({
        '<': 'Animation.prevFrame',
        '>': 'Animation.nextFrame',
        'space': 'Animation.play',
        'ctrl+space': 'Animation.playFromStart'
    });

    return animationsWithKitten;
})();


function resetNodePropertiesToNow(n) {
    if (n) {
        if (n.__keyframes) {
            for (var i in n.__selfProperties) {
                if (i != '__text') {
                    if (n.__selfProperties[i] != undefined) {
                        n.__selfProperties[i] = n[i];
                    }
                }
            }
        }
    } else {
        forOneSelected().$(resetNodePropertiesToNow);
    }

}


function setLerp(d, n) {
    var n = n || forOneSelected();
    if (!n.__keyframes) {
        n.$(function (k) {
            if (k.__keyframes) {
                setLerp(d, k);
            }
        });
        return;
    }
    n.__text = d || "0";
    n.__keyframes.__lerp = d;
    n.__keyframes = n.__keyframes;
    looperPost(function () {
        makeKeyframesGraph(n);
    });
}


function makeKeyframesGraph(n) {
    var n = n || forOneSelected();
    if (!n.__keyframes) {
        n.$(function (k) {
            if (k.__keyframes) {
                makeKeyframesGraph(k);
            }
        });
        return;
    }
    var parent = n.__parent;
    if (parent) {

        var kf = (n.____keyframesAnimations || 0).__transform || (n.____keyframesAnimations || 0).__ofs;
        if (kf && kf.a) {

            if (kf.lp) {
                var curveData = [];

                $each(kf.a, function (frame) {
                    curveData.push(frame.s.va[0]);
                    curveData.push(-frame.s.va[1]);
                    curveData.push(frame.d1[0]);
                    curveData.push(-frame.d1[1]);
                    curveData.push(frame.d2[0]);
                    curveData.push(-frame.d2[1]);
                });

                if (kf.L) {
                    curveData.push(kf.a[0].s.va[0]);
                    curveData.push(-kf.a[0].s.va[1]);
                }

                if (parent.__lnnnlp)
                    parent.__lnnnlp.curveData = curveData;
                else
                    parent.__lnnnlp = parent.__addChildBox(new LineNode({
                        curveData: curveData, __color: 0x4444ff,

                        __pointDrag: function (x, y, dx, dy) {
                            var index = this.index;
                            if (!(index % 3)) return 1;
                            this.__x += dx;
                            this.__y += dy;

                            var kkf = ((n.__keyframes || 0).__keyframes || 0).__transform || ((n.__keyframes || 0).__keyframes || 0).__ofs;
                            var kk = 0;
                            var pp = 'd' + (index % 3);
                            if (kkf) {
                                for (var i in kkf) {
                                    if (kk == floor((index) / 3)) {
                                        if (!kkf[i][pp]) {
                                            kkf[i][pp] = [this.__x, this.__y];
                                        }
                                        kkf[i][pp][0] += dx;
                                        kkf[i][pp][1] += dy;
                                        n.__keyframes = n.__keyframes;
                                        looperPost(function () {
                                            makeKeyframesGraph(n);
                                        });
                                        return 1;
                                    }
                                    kk++;
                                }

                            }
                            return 1;
                        }

                    }));

            }

            var curveData = [];
            $each(kf.a, function (frame) {
                curveData.push(frame.s.va[0]);
                curveData.push(-frame.s.va[1]);
            });
            if (kf.L) {
                curveData.push(kf.a[0].s.va[0]);
                curveData.push(-kf.a[0].s.va[1]);
            }

            if (parent.__lnnn) {
                parent.__lnnn.curveData = curveData;
            } else {

                parent.__lnnn = parent.__addChildBox(new LineNode({
                    curveData: curveData,

                    __pointDrag: function (x, y, dx, dy) {
                        // TODO:
                        this.__x += dx;
                        this.__y += dy;
                        var index = this.index;
                        var kkf = ((n.__keyframes || 0).__keyframes || 0).__transform || ((n.__keyframes || 0).__keyframes || 0).__ofs;
                        var kk = 0;
                        if (kkf) {
                            for (var i in kkf) {
                                if (kk == index) {
                                    kkf[i].va[0] += dx;
                                    kkf[i].va[1] += dy;
                                    n.__keyframes = n.__keyframes;
                                    looperPost(function () {
                                        makeKeyframesGraph(n);
                                    });
                                    return 1;
                                }
                                kk++;
                            }

                        }
                        return 1;
                    }

                }));
            }

        }
    }
}
