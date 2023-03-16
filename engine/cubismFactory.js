var LCC = Live2DCubismCore,
    LCCU = LCC.Utils;

var cubismFactory = {

    __cubismDataMap: {},

    __onDataLoaded(resourceName, jsonDataName, path) {
        var cd = cubismFactory.__cubismDataMap[resourceName]
            , data = globalConfigsData[jsonDataName]
            , onErr = m => {
                consoleError(m, jsonDataName);
                delete cd.__loading;
                cd.__bad = 1;
                //debug
                debugger;
                //undebug
            };

        if (!data) {
            return onErr('Data not exist.');
        }

        cd.__data = data;

        // $each(loadD.__loading, (l) => {
        //     l.__data = cubismFactory.__cubismDataMap[bv];
        //     l.__onDataReady();
        // });

        // delete loadD.__loading;

        /*
        cubismFactory.__cubismDataMap[resourceName] = {
            __data: data
        }; */

        var fr = data.FileReferences || 0;

        if (fr.Moc) {

            var tasks =
                concatArrays(
                    [
                        [TASKS_RAWBUFFER, path + fr.Moc],
                        fr.Physics ? [TASKS_CONFIG, fr.Physics] : 0,
                        fr.DisplayInfo ? [TASKS_CONFIG, fr.DisplayInfo] : 0,
                        fr.Pose ? [TASKS_CONFIG, fr.Pose] : 0,
                        fr.UserData ? [TASKS_CONFIG, fr.UserData] : 0
                    ],
                    $map(fr.Expressions, a => [TASKS_CONFIG, a.File]),
                    $map(fr.Textures, a => [TASKS_IMAGE, a]),
                    concatArrays.apply(this,
                        $mapObjectToArray(fr.Motions, arr => $map(arr, a => [TASKS_CONFIG, a.File]))
                    )
                ),

                bcf = options.__baseConfigsFolder,
                bif = options.__baseImgFolder;

            activateProjectOptions();
            options.__baseConfigsFolder = path;
            options.__baseImgFolder = path;
            TASKS_RUN(tasks, () => {
                cd.__Moc = globalConfigsData[path + fr.Moc];
                if (fr.Physics) cd.__Physics = globalConfigsData[path + fr.Physics];
                if (fr.DisplayInfo) cd.__DisplayInfo = globalConfigsData[path + fr.DisplayInfo];
                if (fr.Pose) cd.__Pose = globalConfigsData[path + fr.Pose];
                if (fr.UserData) cd.__UserData = globalConfigsData[path + fr.UserData];
                if (fr.Expressions) {
                    cd.__Expressions = {};
                    $each(fr.Expressions, v => {
                        cd.__Expressions[v.Name] = globalConfigsData[path + v.File];
                    });
                }
                if (fr.Textures) {
                    cd.__Textures = $map(fr.Textures, a => globalConfigsData.__frames[a]);
                }
                if (fr.Motions) {
                    cd.__Motions = deepclone(fr.Motions);
                    $each(cd.__Motions, m => {
                        $each(m, m => {
                            m.__data = globalConfigsData[path + m.File];
                        });
                    });
                }

                $each(cd.__loading, t => { t.__data = cd; t.__onDataReady(); });
                delete cd.__loading;

            }, () => {
                onErr('Error while load live2d files.');
            });
            deactivateProjectOptions();
            options.__baseConfigsFolder = bcf;
            options.__baseImgFolder = bif;

        } else {
            onErr('Model data does not exist.');
        }
    },

    __atlasDataConverter(atlas, atlasText) {

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
    },

    __textures: {},

    __init() {

        this.__CubismCullBlending = registerBlending(
            {
                __blendSrc: GL_ZERO,
                __blendDst: GL_ONE_MINUS_SRC_COLOR,
                __blendSrcAlpha: GL_ZERO,
                __blendDstAlpha: GL_ONE_MINUS_SRC_ALPHA
            }
        );
    },

    __drawMesh(obj, mesh, opacity, blending, invertedMask) {

        var t = this;

        if (t.__isCulling) {
            gl.enable(gl.CULL_FACE);
        } else {
            gl.disable(gl.CULL_FACE);
        }

        gl.frontFace(gl.CCW);

        var color = obj.__color;

        if (t.__clippingContextBufferForMask == null) {
            color = color.clone();
            // color.a *= opacity;
            // if (t.___isPremultipliedAlpha) {
            //     color.__multiplyScalar(color.a);
            // }
        }

        var program = renderer.__getWebGLProgram({ v: 'base', f: 'base' });

        /* if (t.__clippingContextBufferForMask != null) {
    
            var program = renderer.__getWebGLProgram({
                v: 'vertexShaderSrcSetupMask',
                f: 'fragmentShaderSrcsetupMask'
            });
    
            var shaderSet = t.__shaderSets[0]; // ShaderNames.ShaderNames_SetupMask);
    
            gl.useProgram(program.__program);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(GL_TEXTURE_2D, textureId);
            gl.uniform1i(program.samplerTexture0Location, 0);
            if (bufferData.vertex == null) {
                bufferData.vertex = gl.createBuffer();
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.vertex);
            gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(program.attributePositionLocation);
            gl.vertexAttribPointer(program.attributePositionLocation, 2, gl.FLOAT, false, 0, 0);
            if (bufferData.uv == null) {
                bufferData.uv = gl.createBuffer();
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferData.uv);
            gl.bufferData(gl.ARRAY_BUFFER, uvArray, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(program.attributeTexCoordLocation);
            gl.vertexAttribPointer(program.attributeTexCoordLocation, 2, gl.FLOAT, false, 0, 0);
            var channelNo = t.__clippingContextBufferForMask._layoutChannelNo;
            var colorChannel = t.__clippingContextBufferForMask.getClippingManager().getChannelFlagAsColor(channelNo);
            gl.uniform4f(program.uniformChannelFlagLocation, colorChannel.R, colorChannel.G, colorChannel.B, colorChannel.A);
            gl.uniformMatrix4fv(program.uniformClipMatrixLocation, false, t.__clippingContextBufferForMask._matrixForMask.getArray());
            var rect = t.__clippingContextBufferForMask._layoutBounds;
            gl.uniform4f(program.uniformBaseColorLocation, rect.x * 2.0 - 1.0, rect.y * 2.0 - 1.0, rect.getRight() * 2.0 - 1.0, rect.getBottom() * 2.0 - 1.0);
    
            renderer.__setBlending(CubismCullBlending);
        } else 
        */
        {
            var masked = renderer.__clippingContextBufferForDraw != null;
            var offset = masked ? (invertedMask ? 2 : 1) : 0;

            mergeObj(obj, mesh);

            obj.____registeredBlending = blending + offset;
            obj.color = color;
            obj.____alpha = opacity;
            obj.__program = program;

            renderer.__draw(obj, mesh.ic);

            /*
                if (masked) {
                    gl.activeTexture(gl.TEXTURE1);
                    var tex = renderer.__clippingContextBufferForDraw.getClippingManager().getColorBuffer();
                    gl.bindTexture(gl.TEXTURE_2D, tex);
                    gl.uniform1i(shaderSet.samplerTexture1Location, 1);
                    gl.uniformMatrix4fv(shaderSet.uniformClipMatrixLocation, false, renderer.__clippingContextBufferForDraw._matrixForDraw.getArray());
                    var channelNo = renderer.__clippingContextBufferForDraw._layoutChannelNo;
                    var colorChannel = renderer.__clippingContextBufferForDraw.getClippingManager().getChannelFlagAsColor(channelNo);
                    gl.uniform4f(shaderSet.uniformChannelFlagLocation, colorChannel.R, colorChannel.G, colorChannel.B, colorChannel.A);
                }
            */

            t.__clippingContextBufferForDraw = null;
            t.__clippingContextBufferForMask = null;

        }
    }
};



var CubismObject = (() => {


    var ACubismMotion = makeClass(function () {
        var t = this;
        t.__fadeInSeconds = -1;
        t.__fadeOutSeconds = -1;
        t.__weight = 1;
        t.__offsetSeconds = 0;
        t.__firedEventValues = [];
    }, {
        // __delete(motion) {
        //     motion.__release();
        //     motion = null;
        // },
        // __release() {
        //     this.__weight = 0;
        // },

        __updateParameters(model, motionQueueEntry, userTimeSeconds) {
            if (!motionQueueEntry.isAvailable() || motionQueueEntry.isFinished()) {
                return;
            }
            var t = this;
            if (!motionQueueEntry.isStarted()) {
                motionQueueEntry.setIsStarted(true);
                motionQueueEntry.setStartTime(userTimeSeconds - t.__offsetSeconds);
                motionQueueEntry.setFadeInStartTime(userTimeSeconds);
                var duration = t.__getDuration() || -1;
                if (motionQueueEntry.__endTime < 0) {
                    motionQueueEntry.setEndTime(duration <= 0 ? -1 : motionQueueEntry.getStartTime() + duration);
                }
            }
            var fadeWeight = t.__weight;
            var fadeIn = t.__fadeInSeconds ? getEasingSine((userTimeSeconds - motionQueueEntry.__fadeInStartTime) / this.__fadeInSeconds) : 1;
            var fadeOut = t.__fadeOutSeconds == 0 || motionQueueEntry.__endTime < 0 ? 1 : getEasingSine((motionQueueEntry.__endTime - userTimeSeconds) / this.__fadeOutSeconds);
            fadeWeight = fadeWeight * fadeIn * fadeOut;
            motionQueueEntry.setState(userTimeSeconds, fadeWeight);
            t.__doUpdateParameters(model, userTimeSeconds, fadeWeight, motionQueueEntry);
            if (motionQueueEntry.__endTime > 0 && motionQueueEntry.__endTime < userTimeSeconds) {
                motionQueueEntry.setIsFinished(true);
            }
        }
    });



    var UseOldBeziersCurveMotion = false;

    function linearEvaluate(p, t) {
        return lerp(p[0].v, p[1].v, mmax(0, (t - p[0].t) / (p[1].t - p[0].t)));
    }

    function bezierEvaluate(p, t) {
        var p0 = p[0].v, p1 = p[1].v, p2 = p[2].v, p3 = p[3].v;
        t = mmax(0, (t - p0.t) / (p3.t - p0.t));
        var t1 = 1 - t, p12 = t1 * p1 + t * p2, t1t = t1 * t;
        return t1 * t1 * t1 * p0 + t1t * (t1 * p1 + 2 * p12 + t * p2) + t * t * t * p3;
    }

    function cbrt(x) {
        if (x === 0) { return x; }
        var cx = x, isNegativeNumber = cx < 0;
        if (isNegativeNumber) {
            cx = -cx;
        }
        if (cx === Infinity) {
            x = Infinity;
        } else {
            x = Math.exp(Math.log(cx) / 3);
            x = (cx / (x * x) + 2 * x) / 3;
        }
        return isNegativeNumber ? -x : x;
    }

    function quadraticEquation(a, b, c) {
        return (abs(a) < 0.00001) ? (abs(b) < 0.00001) ? -c : -c / b : -(b + sqrt(b * b - 4 * a * c)) / (2 * a);
    }

    function cardanoAlgorithmForBezier(a, b, c, d) {
        if (sqrt(a) < 0.00001) {
            return clamp(quadraticEquation(b, c, d), 0, 1);
        }
        var ba = b / a
            , ba3 = ba / 3
            , ca = c / a
            , p = ca - ba * ba3
            , pq3 = p * p * p
            , q2 = (ba * ba * ba - 4.5 * ba * ca) / 27 + d / a / 2
            , discriminant = q2 * q2 + pq3
            , center = 0.5
            , threshold = center + 0.01;

        if (discriminant < 0) {
            var phi = acos(clamp(-q2 / sqrt(-pq3 / 27), -1, 1))
                , t1 = 2 * cbrt(r)
                , root1_1 = t1 * cos(phi / 3) - ba3;
            if (abs(root1_1 - center) < threshold) {
                return clamp(root1_1, 0, 1);
            }
            var root2 = t1 * cos((phi + 2 * PI) / 3) - ba3;
            if (abs(root2 - center) < threshold) {
                return clamp(root2, 0, 1);
            }
            return clamp(t1 * cos((phi + 4 * PI) / 3) - ba3, 0, 1);
        }
        if (discriminant == 0) {
            var u1_1 = (q2 < 0) ? cbrt(-q2) : -cbrt(q2)
                , root1_2 = 2 * u1_1 - ba3;
            if (abs(root1_2 - center) < threshold) {
                return clamp(root1_2, 0, 1);
            }
            return clamp(-u1_1 - ba3, 0, 1);
        }
        discriminant = sqrt(discriminant);
        return clamp(cbrt(discriminant - q2) - cbrt(discriminant + q2) - ba3, 0, 1);
    }

    function bezierEvaluateCardanoInterpretation(p, t) {
        var x1 = p[0].t
            , x2 = p[3].t
            , cx1 = p[1].t
            , cx2 = p[2].t
            , a = x2 - 3 * cx2 + 3 * cx1 - x1
            , b = 3 * cx2 - 6 * cx1 + 3 * x1
            , c = 3 * cx1 - 3 * x1
            , d = x1 - t;
        t = cardanoAlgorithmForBezier(a, b, c, d);
        var p0 = p[0].v, p1 = p[1].v, p2 = p[2].v, p3 = p[3].v;
        var t1 = 1 - t, p12 = t1 * p1 + t * p2, t1t = t1 * t;
        return t1 * t1 * t1 * p0 + t1t * (t1 * p1 + 2 * p12 + t * p2) + t * t * t * p3;
    }
    function steppedEvaluate(p) { return p[0].v; }
    function inverseSteppedEvaluate(p) { return p[1].v; }

    function evaluateCurve(curve, time) {
        // what? проходим по всем сегментам? надо хотя бы бинарный поиск юзать!
        var seg = $find(curve.__segments, seg => {
            return seg.__points[seg.__points.length - 1].t > time;
        });
        if (seg) {
            return seg.__evaluate(seg.__points, time);
        } else {
            var points = curve.__segments[curve.__segments.length - 1].__points;
            return points[points.length - 1].v;
        }
    }

    function CEaseSineIO(t) {
        return easeSineIO(clamp(t, 0, 1));
    }


    var CubismMotion = makeClass(function (obj, json, onFinishedMotionHandler) {
        var t = this
            , data = json.__data
            , curves = data.Curves
            , Meta = data.Meta;

        ACubismMotion.call(t);

        t.__fadeInSeconds = json.FadeInTime > 0 ? json.FadeInTime : 1;
        t.__fadeOutSeconds = json.FadeOutTime > 0 ? json.FadeOutTime : 1;

        t.__isLoop = Meta.Loop;
        t.__isLoopFadeIn = true;
        t.__lastWeight = 0;

        t.__onFinishedMotion = onFinishedMotionHandler;


        t.__curves = { Model: [], Parameter: [], PartOpacity: [] };
        t.__duration = Meta.Duration;
        t.__fps = Meta.Fps || 30;
        t.__curveCount = Meta.CurveCount;

        var tttr = [linearEvaluate,
            Meta.AreBeziersRistricted || UseOldBeziersCurveMotion ? bezierEvaluate : bezierEvaluateCardanoInterpretation,
            steppedEvaluate,
            inverseSteppedEvaluate
        ];

        $each(curves, curve => {
            var Segments = curve.Segments;

            curve.__segments = [{ __points: [{ t: Segments[0], v: Segments[1] }] }];

            for (var segmentPosition = 2; segmentPosition < Segments.length;) {
                var seg = {
                    __segmentType: Segments[segmentPosition],
                    __evaluate: tttr[Segments[segmentPosition]]
                };
                switch (seg.__segmentType) {
                    case 0:
                    case 2:
                    case 3:
                        seg.__points = [{ t: Segments[segmentPosition + 1], v: Segments[segmentPosition + 2] }];
                        segmentPosition += 3;
                        break;

                    case 1:
                        seg.__points = [{ t: Segments[segmentPosition + 1], v: Segments[segmentPosition + 2] },
                        { t: Segments[segmentPosition + 3], v: Segments[segmentPosition + 4] },
                        { t: Segments[segmentPosition + 5], v: Segments[segmentPosition + 6] }];
                        segmentPosition += 7;
                        break;
                }
                curve.__segments.push(seg);
            }

            if (curve.Id == 'EyeBlink') {
                t.__eyeBlinkCurve = curve;
            } else if (curve.Id == 'LipSync') {
                t.__lipSyncCurve = curve;
            }

            t.__curves[curve.Target].push(curve);
        });

        t.__events = json.UserData;

    },
        {
            __doUpdateParameters(obj, userTimeSeconds, fadeWeight, motionQueueEntry) {
                var t = this
                    , timeOffsetSeconds = mmax(0, userTimeSeconds - motionQueueEntry.getStartTime())
                    , tmpFadeIn = t.__fadeInSeconds <= 0 ? 1 : CEaseSineIO((userTimeSeconds - motionQueueEntry.__fadeInStartTime) / t.__fadeInSeconds)
                    , tmpFadeOut = t.__fadeOutSeconds <= 0 || motionQueueEntry.__endTime < 0 ? 1 : CEaseSineIO((motionQueueEntry.__endTime - userTimeSeconds) / t.__fadeOutSeconds)
                    , time = timeOffsetSeconds
                    , curves = t.__curves
                    , eyeBlinkParameterIds = (obj.__groups.EyeBlink || 0).__idsObj
                    , lipSyncParameterIds = (obj.__groups.LipSync || 0).__idsObj;

                if (t.__isLoop) {
                    time = time * floor(time / t.__duration) - t.__duration;
                }

                $each(curves.Model, curve => {
                    curve.v = evaluateCurve(curve, time);
                });

                var lipSyncValue = (t.__lipSyncCurve || 0).v
                    , eyeBlinkValue = (t.__eyeBlinkCurve || 0).v;

                $each(curves.PartOpacity, curve => {
                    model.setParameterValueById(curve.Id, evaluateCurve(curve, time));
                });

                $each(curves.Parameter, curve => {

                    curve.v = evaluateCurve(curve, time);

                    if (eyeBlinkValue != undefined && eyeBlinkParameterIds[curve.Id]) {
                        curve.v *= eyeBlinkValue;
                        eyeBlinkParameterIds[curve.Id].o = 1;
                    }
                    if (lipSyncValue != undefined && lipSyncParameterIds[curve.Id]) {
                        curve.v += lipSyncValue;
                        lipSyncParameterIds[curve.Id].o = 1;
                    }

                    var fw = fadeWeight;
                    if (curve.FadeInTime != undefined || curve.FadeOutTime != undefined) {
                        var fin = curve.FadeInTime < 0 ? tmpFadeIn : curve.FadeInTime == 0 ?
                            1 : CEaseSineIO((userTimeSeconds - motionQueueEntry.__fadeInStartTime) / curve.FadeInTime)
                        fout = curve.FadeOutTime < 0 ? tmpFadeOut : curve.FadeOutTime == 0 || motionQueueEntry.__endTime < 0 ?
                            1 : CEaseSineIO((motionQueueEntry.__endTime - userTimeSeconds) / curve.FadeOutTime);

                        fw = t.__weight * fin * fout;
                    }

                    obj.__setParameterValueById(curve.Id, curve.v, fw);
                });


                if (eyeBlinkValue != undefined) {
                    $each(eyeBlinkParameterIds, (p, id) => {
                        if (p.o) {
                            delete p.o;
                            model.__setParameterValueById(id, eyeBlinkValue, fadeWeight);
                        }
                    });
                }

                if (lipSyncValue != undefined) {
                    $each(lipSyncParameterIds, (p, id) => {
                        if (p.o) {
                            delete p.o;
                            model.__setParameterValueById(id, lipSyncValue, fadeWeight);
                        }
                    });
                }

                if (timeOffsetSeconds >= t.__duration) {
                    if (t.__isLoop) {
                        motionQueueEntry.__startTime = userTimeSeconds;
                        if (t.__isLoopFadeIn) {
                            motionQueueEntry.__fadeInStartTime = userTimeSeconds;
                        }
                    } else {
                        if (t.__onFinishedMotion) {
                            t.__onFinishedMotion(this);
                        }
                        motionQueueEntry.__finished = true;
                    }
                }
                t.__lastWeight = fadeWeight;
            },

            __getDuration() {
                return this.__isLoop ? -1 : t.__duration;
            },
            /*
                        __setParameterFadeInTime = function (parameterId, value) {
                            var curves = this.__curves;
                            for (var i = 0; i < this.__t.__curveCount; ++i) {
                                if (parameterId == curves.at(i).id) {
                                    curves.at(i).fadeInTime = value;
                                    return;
                                }
                            }
                        },
                        __setParameterFadeOutTime = function (parameterId, value) {
                            var curves = this.__curves;
                            for (var i = 0; i < this.__t.__curveCount; ++i) {
                                if (parameterId == curves.at(i).id) {
                                    curves.at(i).fadeOutTime = value;
                                    return;
                                }
                            }
                        },
                        __getParameterFadeInTime = function (parameterId) {
                            var curves = this.__curves;
                            for (var i = 0; i < this.__t.__curveCount; ++i) {
                                if (parameterId == curves.at(i).id) {
                                    return curves.at(i).fadeInTime;
                                }
                            }
                            return -1;
                        },
                        __getParameterFadeOutTime = function (parameterId) {
                            var curves = this.__curves;
                            for (var i = 0; i < this.__t.__curveCount; ++i) {
                                if (parameterId == curves.at(i).id) {
                                    return curves.at(i).fadeOutTime;
                                }
                            }
                            return -1;
                        },*/

            __getFiredEvent(beforeCheckTimeSeconds, motionTimeSeconds) {
                this._firedEventValues.updateSize(0);
                for (var u = 0; u < this.__motionData.eventCount; ++u) {
                    if (this.__motionData.events.at(u).fireTime > beforeCheckTimeSeconds && this.__motionData.events.at(u).fireTime <= motionTimeSeconds) {
                        this._firedEventValues.pushBack(new csmstring_1.csmString(this.__motionData.events.at(u).value.s));
                    }
                }
                return this._firedEventValues;
            }
        }, 0, ACubismMotion);



    var AirResistance = 5
        , MaximumWeight = 100
        , MovementThreshold = 0.001
        , __PMPH = {
            X: {
                __getValue(translation, particles, particleIndex, isInverted, parentGravity) { return isInverted ? -translation.x : translation.x; },
                __getScale(translationScale, Scale) { return translationScale.x; },
                __type: 0,
                __getNormalizedParameterValue(targetTranslation, targetAngle, value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalization, isInverted, weight) {
                    targetTranslation.x += normalizeParameterValue(value,
                        parameterMinimumValue,
                        parameterMaximumValue, parameterDefaultValue,
                        normalization.Position.Minimum,
                        normalization.Position.Maximum,
                        normalization.Position.Default,
                        isInverted) * weight;
                }
            },
            Y: {
                __getValue(translation, particles, particleIndex, isInverted, parentGravity) { return isInverted ? -translation.y : translation.y; },
                __getScale(translationScale, Scale) { return translationScale.y; },
                __type: 1,
                __getNormalizedParameterValue(targetTranslation, targetAngle, value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalization, isInverted, weight) {
                    targetTranslation.y += normalizeParameterValue(value,
                        parameterMinimumValue,
                        parameterMaximumValue,
                        parameterDefaultValue,
                        normalization.Position.Minimum,
                        normalization.Position.Maximum,
                        normalization.Position.Default,
                        isInverted) * weight;
                }
            },
            Angle: {
                __getValue(translation, particles, particleIndex, isInverted, parentGravity) {
                    if (particleIndex >= 2) {
                        parentGravity = particles[particleIndex - 1].__position.__clone().sub(particles[particleIndex - 2].__position);
                    } else {
                        parentGravity = parentGravity.__clone().__multiplyScalar(-1);
                    }
                    var outputValue = parentGravity.__angleTo(translation);
                    return isInverted ? -outputValue : outputValue;
                },
                __getScale(translationScale, Scale) { return Scale; },
                __type: 2,
                __getNormalizedParameterValue(targetTranslation, targetAngle, value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalization, isInverted, weight) {
                    targetAngle.angle += normalizeParameterValue(value,
                        parameterMinimumValue,
                        parameterMaximumValue,
                        parameterDefaultValue,
                        normalization.Angle.Minimum,
                        normalization.Angle.Maximum,
                        normalization.Angle.Default,
                        isInverted) * weight;
                }
            }
        };



    function normalizeParameterValue(value, parameterMinimum,
        parameterMaximum, parameterDefault,
        normalizedMinimum, normalizedMaximum,
        normalizedDefault, isInverted) {
        value = clamp(value, parameterMinimum, parameterMaximum);
        normalizedDefault = normalizedDefault || 0;
        var result = 0
            , middleValue = (parameterMinimum + parameterMaximum) / 2
            , paramValue = value - middleValue;

        switch (sign(paramValue)) {
            case 1:
                {
                    var nLength = normalizedMaximum - normalizedDefault
                        , pLength = parameterMaximum - middleValue;
                    if (pLength != 0) {
                        result = paramValue * (nLength / pLength);
                        result += normalizedDefault;
                    }
                    break;
                }
            case -1:
                {
                    var nLength = normalizedMinimum - normalizedDefault
                        , pLength = parameterMinimum - middleValue;
                    if (pLength != 0) {
                        result = paramValue * (nLength / pLength);
                        result += normalizedDefault;
                    }
                    break;
                }
            case 0:
                {
                    result = normalizedDefault;
                    break;
                }
        }
        return isInverted ? result : result * -1;
    }

    var CubismPhysics = makeClass(function (obj, json) {
        json = deepclone(json);
        var t = this,
            Meta = json.Meta,
            PhysicsSettings = json.PhysicsSettings,
            gravity = Meta.EffectiveForces.Gravity,
            wind = Meta.EffectiveForces.Wind;

        t.__gravity = new Vector2(gravity.X, gravity.Y);
        t.__wind = new Vector2(wind.X, wind.Y);
        t.__settings = PhysicsSettings;

        $each(PhysicsSettings, currentSetting => {
            $each(currentSetting.Input, i => {
                i.t = __PMPH[i.Type];
                i.__sourceParameterIndex = obj.__getParameterIndex(i.Source.Id);
            });

            $each(currentSetting.Output, o => {
                o.t = __PMPH[o.Type];
                o.__destinationParameterIndex = obj.__getParameterIndex(o.Destination.Id);
                o.__translationScale = new Vector2(0, 0);
            });


            var prevPos = defaultZeroVector2;
            $each(currentSetting.Vertices, strand => {
                prevPos = strand.__position = new Vector2(prevPos.x, prevPos.y + strand.Radius);
                strand.__lastGravity = new Vector2(0, 1);
                strand.__velocity = new Vector2();
            });
        });

    }, {

        __update(obj, deltaTimeSeconds) {
            var t = this
                , totalAngle
                , angle
                , weight
                , outputValue
                , totalTranslation = new Vector2()
                , model = obj.__model
                , p = model.parameters
                , parameterValues = p.values
                , parameterMaximumValues = p.maximumValues
                , parameterMinimumValues = p.minimumValues
                , parameterDefaultValues = p.defaultValues
                , strand, prevStrand, force, delay, radian, lastPosition
                , Vertices, strandCount, currentGravity, thresholdValue
                , spi;

            $each(t.__settings, currentSetting => {

                totalAngle = { angle: 0 };
                totalTranslation.x = 0;
                totalTranslation.y = 0;

                // currentOutput = physicsRig.outputs.get(currentSetting.baseOutputIndex);
                // Vertices = physicsRig.particles.get(currentSetting.basevertexIndex);

                $each(currentSetting.Input, input => {
                    weight = input.Weight / MaximumWeight;
                    spi = input.__sourceParameterIndex;
                    input.t.__getNormalizedParameterValue(
                        totalTranslation,
                        totalAngle,
                        parameterValues[spi],
                        parameterMinimumValues[spi],
                        parameterMaximumValues[spi],
                        parameterDefaultValues[spi],
                        currentSetting.Normalization,
                        input.Reflect,
                        weight);
                });

                angle = degToRad(totalAngle.angle);
                totalTranslation.__rotateAroundZ0(-angle);

                Vertices = currentSetting.Vertices;
                strandCount = Vertices.length;
                currentGravity = new Vector2(sin(angle), cos(angle));
                thresholdValue = MovementThreshold * currentSetting.Normalization.Position.Maximum;
                prevStrand = Vertices[0];
                prevStrand.__position = totalTranslation;

                for (var i = 1; i < strandCount; ++i) {
                    strand = Vertices[i];
                    delay = strand.Delay * deltaTimeSeconds * 30;
                    radian = strand.__lastGravity.__angleTo(currentGravity) / AirResistance;
                    force = currentGravity.__clone()
                        .__multiplyScalar(strand.Acceleration)
                        .__add(t.__wind)
                        .__multiplyScalar(delay * delay);
                    lastPosition = strand.__position.clone();
                    strand.__position = prevStrand.__position.clone()
                        .__add(
                            // newDirection
                            strand.__position.__clone()
                                .sub(prevStrand.__position)
                                .__rotateAroundZ0(radian)
                                .__add(strand.__velocity.__multiplyScalar(delay)).__add(force)
                                .__normalize()
                                .__multiplyScalar(strand.Radius)
                        );
                    if (abs(strand.__position.x) < thresholdValue) {
                        strand.__position.x = 0;
                    }
                    if (delay != 0) {
                        strand.__velocity = strand.__position.__clone().sub(lastPosition)
                            .__divideScalar(delay).__multiplyScalar(strand.Mobility);
                    }
                    strand.__lastGravity = currentGravity;
                    prevStrand = strand;
                }

                $each(currentSetting.Output, o => {
                    var i = o.VertexIndex;
                    if (i < 1 || i >= strandCount) {
                        return;
                    }
                    lastPosition = Vertices[i].__position.clone().sub(Vertices[i - 1].__position);
                    outputValue = o.t.__getValue(lastPosition, Vertices, i, o.Reflect, t.__gravity);

                    obj.__setParameterValueByIndex(
                        o.__destinationParameterIndex,
                        outputValue * o.t.__getScale(o.__translationScale, o.Scale),
                        mmin(o.Weight / MaximumWeight, 1));
                });

            });
        }
    });


    var Epsilon = 0.001;
    var DefaultFadeInSeconds = 0.5;
    function __initpart(p, obj) {
        p.__parameterIndex = obj.__getParameterIndex(p.Id);
        p.__partIndex = obj.__getPartIndex(p.Id);
        obj.__setParameterValueByIndex(p.__parameterIndex, 1);
    }

    var CubismPose = makeClass(function (obj, json) {
        var t = this;
        t.__fadeTimeSeconds = json.FadeInTime > 0 ? json.FadeInTime : DefaultFadeInSeconds;
        t.__partGroups = deepclone(json.Groups);
    }, {

        __update(obj, deltaTimeSeconds) {
            var t = this;
            if (obj != t.__lastModel) {
                t.__reset(obj);
                t.__lastModel = obj;
            }

            $each(t.__partGroups, g => {
                var newOpacity = 1
                    , phi = 0.5
                    , backOpacityThreshold = 0.15;

                var visPart = $find(g, gg => {
                    if (obj.__getParameterValueByIndex(gg.__parameterIndex) > Epsilon) {
                        newOpacity = obj.__getPartOpacityByIndex(gg.__partIndex);
                        newOpacity += deltaTimeSeconds / t.__fadeTimeSeconds;
                        if (newOpacity > 1) {
                            newOpacity = 1;
                        }
                        return 1;
                    }
                }) || g[0];

                $each(g, gg => {
                    if (visPart == gg) {
                        obj.__setPartOpacityByIndex(gg.__partIndex, newOpacity);
                    } else {
                        var opacity = obj.__getPartOpacityByIndex(gg.__partIndex),
                            no1 = (1 - newOpacity),
                            a1 = newOpacity < phi ?
                                (newOpacity * (phi - 1)) / phi + 1 : (no1 * phi) / (1 - phi);

                        var backOpacity = (1 - a1) * no1;
                        if (backOpacity > backOpacityThreshold) {
                            a1 = 1 - backOpacityThreshold / no1;
                        }

                        obj.__setPartOpacityByIndex(gg.__partIndex, mmin(a1, opacity));
                    }
                });

            });

            t.__copyPartOpacities(obj);
        },

        __reset(obj) {
            $each(this.__partGroups, g => {
                var j = 1;
                $each(g, gg => {
                    __initpart(gg, obj);
                    if (gg.__partIndex > 0) {
                        obj.__setPartOpacityByIndex(gg.__partIndex, j);
                        obj.__setParameterValueByIndex(gg.__parameterIndex, j);
                        $each(gg.Link, link => {
                            __initpart(link, obj);
                        });
                    }
                });
                j = 0;
            });
        },

        __copyPartOpacities(obj) {
            $each(this.__partGroups, g => {
                $each(g, gg => {
                    var opacity = obj.__getPartOpacityByIndex(gg.__partIndex);
                    $each(gg.Link, link => {
                        obj.__setPartOpacityByIndex(link.__partIndex, opacity);
                    });
                });
            });
        }
    });


    ObjectDefineProperties(NodePrototype, {
        __cubism: {
            get() {
                return this.____cubismObject;
            },
            set(v) {
                var t = this;
                if (t.____cubismObject == v)
                    return;

                if (t.____cubismObject) {
                    t.____cubismObject.__removeFromParent();
                    delete t.____cubismObject;
                }

                if (v instanceof CubismObject) {
                    t.____cubismObject = v;
                }
                else if (v) {
                    t.____cubismObject = new CubismObject(this)
                    t.____cubismObject.__init(v);
                }
            }
        }
    });


    function cloneArray(from, to) {
        for (var i = 0, l = from.count || from.length; i < l; i++) to[i] = from[i];
    }


    var CubismTargetPoint = makeClass(function () {
        var t = this;
        t.__faceTarget = new Vector2();
        t.__face = new Vector2();
        t.__faceV = new Vector2();
        t.__FrameRate = 30;
        t.__Epsilon = 0.01;
    }, {
        __update(obj, deltaTimeSeconds) {
            var t = this;
            /*
            t.__faceTarget.set(mouse.x, mouse.y);
            var d = t.__faceTarget.clone().sub(t.__face)
                , dl = d.__length();
            if (dl <= t.__Epsilon) {
                return;
            }
            var maxV = 4 / t.__FrameRate
                , deltaTimeWeight = deltaTimeSeconds * t.__FrameRate
                , frameToMaxSpeed = 0.15 * t.__FrameRate
                , maxA = (deltaTimeWeight * maxV) / frameToMaxSpeed;
    
            d.__multiplyScalar(maxV / dl).sub(t.__face);
    
            var al = d.__length();
            if (al > maxA) {
                d.__multiplyScalar(maxA / al);
            }
    
            t.__faceV.add(d);
    
            var maxV_1 = 0.5 * (sqrt(maxA * maxA + 16 * maxA * dl - 8 * maxA * dl) - maxA)
                , curV = t.__faceV.__length();
    
            if (curV > maxV_1) {
                t.__faceV.__multiplyScalar(maxV_1 / curV);
            }
    
            t.__face.add(t.__faceV);
        */
            deltaTimeSeconds = clamp(deltaTimeSeconds, 0, 1);
            t.__face.set(mouse.x / __screenCenter.x - 0.6, 1 - mouse.y / __screenCenter.y);
            obj.__setParameterValueByIndex(obj.__idParamAngleX, t.__face.x * 30, 2 * deltaTimeSeconds);
            obj.__setParameterValueByIndex(obj.__idParamAngleY, t.__face.y * 30, 2 * deltaTimeSeconds);
            obj.__setParameterValueByIndex(obj.__idParamAngleZ, t.__face.x * t.__face.y * -30, 4 * deltaTimeSeconds);
            obj.__setParameterValueByIndex(obj.__idParamBodyAngleX, t.__face.x * 10, 4 * deltaTimeSeconds);
            obj.__setParameterValueByIndex(obj.__idParamEyeBallX, t.__face.x, 15 * deltaTimeSeconds);
            obj.__setParameterValueByIndex(obj.__idParamEyeBallY, t.__face.y, 15 * deltaTimeSeconds);

        }
    });

    var COP = makeClass(function (parentNode) {
        var t = this;
        Node.call(t);
        t.__parent = parentNode;
        t.__scaleF = 1000;
        t.__components = [];
        t.__validToSave = 0;
        t.__childs = [];
    }, {

        __addComponent(c) {
            if (c) this.__components.push(c);
            return this;
        },

        __removeComponent(c) {
            removeFromArray(c, this.__components);
            return this;
        },

        __destruct() {

            var t = this;
            NodePrototype.__destruct.call(t);
            if (t.__model) {
                t.__model.release();
                delete t.__model;
            }
            if (t.__moc) {
                t.__moc._release();
                delete t.__moc;
            }
            // this.__stop();
            delete this.____name;
            delete this.__armature;
        },

        __render() {

            var t = this, model = t.__model;
            if (!model || !t.__parent) return;
            // (t.map || t.____shader)) {

            t.__opacityDeep = t.__alphaDeep * t.__parent.__opacityDeep;

            /* автоскейл под экран, это тут не нужно
            var projection = new cubismmatrix44_1.CubismMatrix44();
     
             if (model.getModel()) {
                if (model.getModel().getCanvasWidth() > 1 && width < height) {
                    model.getModelMatrix().setWidth(2);
                    projection.scale(1, width / height);
                } else {
                    projection.scale(height / width, 1);
                }
                if (this._viewMatrix) {
                    projection.multiplyByMatrix(this._viewMatrix);
                }
            }*/

            /// start update block

            var deltaTimeSeconds = __currentFrameDeltaTime / 1000;



            // t.__userTimeSeconds += deltaTimeSeconds;


            var motionUpdated = false;

            // какие-то параметры?
            // t.__loadParameters();

            // end load parameters 

            /*
                        if (t.__motionManager.isFinished()) {
                            // TODO:
                            // t.startRandomMotion(MotionGroupIdle, PriorityIdle);
            
                        } else {
                            motionUpdated = t.__motionManager.updateMotion(model, deltaTimeSeconds);
                        }
            */

            // t.__saveParameters();

            $mcall(t.__components, '__update', [t, deltaTimeSeconds]);

            // моргание 
            // if (!motionUpdated) {
            // if (t._eyeBlink) {
            // t._eyeBlink.updateParameters(model, deltaTimeSeconds);
            // }
            // }

            /* не понятно что это, но оно что-то должно обновлять
            if (t._expressionManager) {
                t._expressionManager.updateMotion(model, deltaTimeSeconds);
            }*/


            /* дыхание
             if (t._breath) {
                t._breath.updateParameters(model, deltaTimeSeconds);
            } */



            /* синхронизация губ со звуком
            if (t._lipsync) {
                var value = 0;
                t._wavFileHandler.update(deltaTimeSeconds);
                value = t._wavFileHandler.getRms();
                for (var i = 0; i < t._lipSyncIds.length; ++i) {
                    model.addParameterValueById(t._lipSyncIds.at(i), value, 0.8);
                }
            }*/


            model.update();

            var drawables = model.drawables;
            drawables.resetDynamicFlags();

            /// end update block

            // model.draw(projection) - 
            //      projection.multiplyByMatrix(this._modelMatrix);
            //      this.getRenderer().setMvpMatrix(projection); 
            //      this.doDraw();

            //          var viewport = [0, 0, lappdelegate_1.canvas.width, lappdelegate_1.canvas.height];
            //          this.getRenderer().setRenderState(lappdelegate_1.frameBuffer, viewport);
            //          this.getRenderer().drawModel();


            // use t.mw !

            /*
            if (this._clippingManager != null) {
                this.preDraw();
                this._clippingManager.setupClippingContext(model, this);
            }
            this.preDraw();
            */

            /// TODO: возможно оно и не нужно тут на каждый рендер вызывать
            var drawableCount = drawables.count
                , renderOrder = drawables.renderOrders
                , td = t.__drawables
                , mw = t.mw.e;


            for (var i = 0; i < drawableCount; ++i) {
                t.__sortedDrawableIndexList[renderOrder[i]] = i;
            }

            for (var i = 0; i < drawableCount; ++i) {
                var drawableIndex = t.__sortedDrawableIndexList[i];

                if (!LCCU.hasIsVisibleBit(drawables.dynamicFlags[drawableIndex])) {
                    continue;
                }

                // t.setClippingContextBufferForDraw(this._clippingManager != null ? this._clippingManager.getClippingContextListForDraw().at(drawableIndex) : null);
                // t.setIsCulling(model.getDrawableCulling(drawableIndex));

                var cf = drawables.constantFlags[drawableIndex]
                    , tdi = td[drawableIndex];

                tdi.__verticesBuffer.__getArrayOfSize(drawables.vertexCounts[drawableIndex] * 2, 1).set(
                    drawables.vertexPositions[drawableIndex]);

                cubismFactory.__drawMesh(
                    t, tdi, drawables.opacities[drawableIndex],

                    LCCU.hasBlendAdditiveBit(cf)
                        ? AdditiveBlending :
                        LCCU.hasBlendMultiplicativeBit(cf) ?
                            MultiplyBlending :
                            NormalBlending,

                    LCCU.hasIsInvertedMaskBit(cf)
                );
            }

            renderer.__invalidateState();

        },

        __init(v) {
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

        __getPartIndex(partId) { return this.__partIds[partId]; },

        __getPartCount() { return this.__model.parts.count; },
        __setPartOpacityByIndex(partIndex, opacity) { this.__partOpacities[partIndex] = opacity; },
        __setPartOpacityById(partId, opacity) { this.__setPartOpacityByIndex(this.__getPartIndex(partId), opacity); },
        __getPartOpacityByIndex(partIndex) { return this.__partOpacities[partIndex]; },
        __getPartOpacityById(partId) { return this.__getPartOpacityByIndex(this.__getPartIndex(partId)); },

        __getParameterIndex(parameterId) { return this.__parametersIds[parameterId]; },
        __getParameterCount() { return this.__parameters.count; },
        __getParameterMaximumValue(parameterIndex) { return this.__parameters.maximumValues[parameterIndex]; },
        __getParameterMinimumValue(parameterIndex) { return this.__parameters.minimumValues[parameterIndex]; },
        __getParameterDefaultValue(parameterIndex) { return this.__parameters.defaultValues[parameterIndex]; },
        __getParameterValueByIndex(parameterIndex) { return this.__parameters.values[parameterIndex]; },
        __getParameterValueById(parameterId) { return this.__getParameterValueByIndex(this.__getParameterIndex(parameterId)); },

        __clampParameter(parameterIndex, value) {
            return clamp(value,
                this.__parameters.minimumValues[parameterIndex],
                this.__parameters.maximumValues[parameterIndex]);
        },
        __setParameterValueByIndex(parameterIndex, value, weight) {
            if (weight == undefined || weight == 1) {
                this.__parameters.values[parameterIndex] = value;
            } else {
                this.__parameters.values[parameterIndex] =
                    lerp(this.__parameters.values[parameterIndex],
                        this.__clampParameter(parameterIndex, value), weight);
            }
        },
        __setParameterValueById(parameterId, value, weight) {
            this.__setParameterValueByIndex(this.__getParameterIndex(parameterId), value, weight);
        },
        __addParameterValueByIndex(parameterIndex, value, weight) {
            if (weight == undefined) { weight = 1; }
            this.__parameters.values[parameterIndex] += value * weight;
        },
        __addParameterValueById(parameterId, value, weight) {
            if (weight == undefined) { weight = 1; }
            this.__parameters.values[this.__getParameterIndex(parameterId)] += value * weight;
        },
        __multiplyParameterValueByIndex(parameterIndex, value, weight) {
            if (weight == undefined) { weight = 1; }
            this.__parameters.values[parameterIndex] *= (1 + (value - 1) * weight);
        },
        __multiplyParameterValueById(parameterId, value, weight) {
            if (weight == undefined) { weight = 1; }
            this.__parameters.values[this.__getParameterIndex(parameterId)] *= (1 + (value - 1) * weight);
        },
        __saveParameters() { cloneArray(this.__parameters.values, this.__savedParameters); },
        __loadParameters() { cloneArray(this.__savedParameters, this.__parameters.values); },

        __loadModel(mocBytes) {
            var t = this;
            t.__moc = LCC.Moc.fromArrayBuffer(mocBytes);
            var m = LCC.Model.fromMoc(t.__moc);
            t.__model = m;

            t.__color = 0xffffffff;
            t.__sortedDrawableIndexList = new Uint16Array(m.drawables.count);

            t.__savedParameters = [];

            t.__partOpacities = m.parts.opacities;
            t.__parameters = m.parameters;
            t.__parametersIds = {};
            $each(t.__parameters.ids, (id, i) => { t.__parametersIds[id] = i; });

            t.__partIds = {};
            $each(m.parts.ids, (id, i) => { t.__partIds[id] = i; });

            t.__drawableIds = {};
            $each(m.drawables.ids, (id, i) => { t.__drawableIds[id] = i; });

            t.__saveParameters();
            // this._modelMatrix = new cubismmodelmatrix_1.CubismModelMatrix(this._model.getCanvasWidth(), this._model.getCanvasHeight());
        },


        __onDataReady() {
            try {
                var t = this
                    , d = t.__data
                    , DisplayInfo = d.__DisplayInfo
                    , Textures = d.__Textures;

                t.__loadModel(d.__Moc);

                t.__groups = {};
                $each(d.__data.Groups, g => {
                    t.__groups[g.Name] = g;
                    g.__idsObj = {};
                    $each(g.Ids, v => g.__idsObj[v] = {});
                });

                t.__userData = deepclone(d.__UserData);
                t.__motions = $map(d.__Motions, arr => $map(arr, a => new CubismMotion(t, a)));
                t.__expressions = $map(d.__Expressions, v => new CubismExpressionMotion(this, v));

                t.__addComponent(d.__Physics ? new CubismPhysics(t, d.__Physics) : 0)
                    .__addComponent(d.__Pose ? new CubismPose(t, d.__Pose) : 0)
                    .__addComponent(new CubismTargetPoint());

                /*
                var setupEyeBlink = function () {
                    if (data.getEyeBlinkParameterCount() > 0) {
                        t._eyeBlink = cubismeyeblink_1.CubismEyeBlink.create(data);
                        t._state = LoadStep.SetupBreath;
                    }
                    setupBreath();
                };
                var setupBreath = function () {
                    t._breath = cubismbreath_1.CubismBreath.create();
                    var breathParameters = new csmvector_1.csmVector();
                    breathParameters.pushBack(new cubismbreath_1.BreathParameterData(t._idParamAngleX, 0, 15, 6.5345, 0.5));
                    breathParameters.pushBack(new cubismbreath_1.BreathParameterData(t._idParamAngleY, 0, 8, 3.5345, 0.5));
                    breathParameters.pushBack(new cubismbreath_1.BreathParameterData(t._idParamAngleZ, 0, 10, 5.5345, 0.5));
                    breathParameters.pushBack(new cubismbreath_1.BreathParameterData(t._idParamBodyAngleX, 0, 4, 15.5345, 0.5));
                    breathParameters.pushBack(new cubismbreath_1.BreathParameterData(getIdManager().getId(cubismdefaultparameterid_1.CubismDefaultParameterId.ParamBreath), 0.5, 0.5, 3.2345, 1));
                    t._breath.setParameters(breathParameters);
                };
                
                */


                // prepare model for drawing
                var model = t.__model
                    , drawables = model.drawables;
                t.__drawables = [];
                drawables.resetDynamicFlags();

                for (var i = 0; i < drawables.count; ++i) {
                    t.__drawables.push({
                        __verticesBuffer: new MyBufferAttribute('position', Float32Array, 2, GL_ARRAY_BUFFER, drawables.vertexPositions[i], 1),
                        __uvsBuffer: new MyBufferAttribute('uv', Float32Array, 2, GL_ARRAY_BUFFER, drawables.vertexUvs[i], 1),
                        __indecesBuffer: new MyBufferAttribute('', Uint16Array, 1, GL_ELEMENT_ARRAY_BUFFER, drawables.indices[i]),
                        ic: drawables.indexCounts[i],
                        map: Textures[drawables.textureIndices[i]].tex
                    });
                }


                t.__idParamAngleX = t.__getParameterIndex('ParamAngleX');
                t.__idParamAngleY = t.__getParameterIndex('ParamAngleY');
                t.__idParamAngleZ = t.__getParameterIndex('ParamAngleZ');
                t.__idParamBodyAngleX = t.__getParameterIndex('ParamBodyAngleX');
                t.__idParamEyeBallX = t.__getParameterIndex('ParamEyeBallX');
                t.__idParamEyeBallY = t.__getParameterIndex('ParamEyeBallY');



                if (t.__parent.__oncubismReady) {
                    t.__parent.__oncubismReady();
                }


                // ready

                // t._motionManager.stopAllMotions();
                // t._updating = false;
                // t._initialized = true;
                // t.createRenderer();
                // t.setupTextures();
                // t.getRenderer().startUp(lappdelegate_1.gl);
                
                this.__parent.__addChildBox(this);

            } catch (e) {
                consoleError(e);
            }

        },

        clone() {
            return this.toJson();
        },

        toJson() {
            var t = this;
            return $filterObject({
                __name: t.____name
            }, a => a);
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

                var loadD = cubismFactory.__cubismDataMap[bv];
                if (loadD) {
                    if (loadD.__loading) { loadD.__loading.push(t); return; }
                    if (loadD.__bad) return;
                    t.__data = loadD;
                    t.__onDataReady();
                } else {
                    loadD = cubismFactory.__cubismDataMap[bv] = { __loading: [t] };
                    TASKS_RUN([[TASKS_LIVE2D, t.__opts || v]], () => {

                    }, () => {
                        cubismFactory.__cubismDataMap[bv] = { __bad: 1 };
                    });
                    return;
                }
            }
        )/*,

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
                return this.____shader || defcubismShader;
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
        )*/


    }, Node);


    var ExpressionDefaultFadeTime = 1
        , __PMMEXP = {
            Add: COP.prototype.__addParameterValueByIndex,
            Multiply: COP.prototype.__multiplyParameterValueByIndex,
            Overwrite: COP.prototype.__setParameterValueByIndex
        };

    var CubismExpressionMotion = makeClass(function (obj, json) {
        var t = this;
        t.__fadeInSeconds = json.FadeInTime == undefined ? ExpressionDefaultFadeTime : json.FadeInTime;
        t.__fadeOutSeconds = json.FadeOutTime == undefined ? ExpressionDefaultFadeTime : json.FadeOutTime;
        t.__parameters = $map(json["Parameters"], v => {
            return __PMMEXP[v.Blend || "Add"].bind(obj.__getParameterIndex(v.Id), v.Value) /* (Add by default) */
        });
    }, {
        __doUpdateParameters(model, userTimeSeconds, weight, motionQueueEntry) {
            $each(t.__parameters, v => v.call(model, weight));
        }
    }, 0, ACubismMotion);


    return COP;

})();








// var MotionGroupIdle = 'Idle';
// var MotionGroupTapBody = 'TapBody';

globalConfigsData[options.__baseShadersFolder + 'vertexShaderSrcSetupMask.v'] =
    'attribute vec4 a_position;' +
    'attribute vec2 a_texCoord;' +
    'varying vec2 v_texCoord;' +
    'varying vec4 v_myPos;' +
    'uniform mat4 u_clipMatrix;' +
    'void main()' + '{' +
    ' gl_Position = u_clipMatrix * a_position;' +
    ' v_myPos = u_clipMatrix * a_position;' +
    ' v_texCoord = a_texCoord;' +
    ' v_texCoord.y = 1.0 - v_texCoord.y;' + '}';

globalConfigsData[options.__baseShadersFolder + 'fragmentShaderSrcsetupMask.f'] = 'precision mediump float;' + 'varying vec2       v_texCoord;' + 'varying vec4       v_myPos;' + 'uniform vec4       u_baseColor;' + 'uniform vec4       u_channelFlag;' + 'uniform sampler2D  s_texture0;' + 'void main()' + '{' + '   float isInside = ' + '       step(u_baseColor.x, v_myPos.x/v_myPos.w)' + '       * step(u_baseColor.y, v_myPos.y/v_myPos.w)' + '       * step(v_myPos.x/v_myPos.w, u_baseColor.z)' + '       * step(v_myPos.y/v_myPos.w, u_baseColor.w);' + '   gl_FragColor = u_channelFlag * texture2D(s_texture0, v_texCoord).a * isInside;' + '}';
globalConfigsData[options.__baseShadersFolder + 'vertexShaderSrc.v'] = 'attribute vec4     a_position;' + 'attribute vec2     a_texCoord;' + 'varying vec2       v_texCoord;' + 'uniform mat4       u_matrix;' + 'void main()' + '{' + '   gl_Position = u_matrix * a_position;' + '   v_texCoord = a_texCoord;' + '   v_texCoord.y = 1.0 - v_texCoord.y;' + '}';
globalConfigsData[options.__baseShadersFolder + 'vertexShaderSrcMasked.v'] = 'attribute vec4     a_position;' + 'attribute vec2     a_texCoord;' + 'varying vec2       v_texCoord;' + 'varying vec4       v_clipPos;' + 'uniform mat4       u_matrix;' + 'uniform mat4       u_clipMatrix;' + 'void main()' + '{' + '   gl_Position = u_matrix * a_position;' + '   v_clipPos = u_clipMatrix * a_position;' + '   v_texCoord = a_texCoord;' + '   v_texCoord.y = 1.0 - v_texCoord.y;' + '}';
globalConfigsData[options.__baseShadersFolder + 'fragmentShaderSrcPremultipliedAlpha.f'] = 'precision mediump float;' + 'varying vec2       v_texCoord;' + 'uniform vec4       u_baseColor;' + 'uniform sampler2D  s_texture0;' + 'void main()' + '{' + '   gl_FragColor = texture2D(s_texture0 , v_texCoord) * u_baseColor;' + '}';
globalConfigsData[options.__baseShadersFolder + 'fragmentShaderSrcMaskPremultipliedAlpha.f'] = 'precision mediump float;' + 'varying vec2       v_texCoord;' + 'varying vec4       v_clipPos;' + 'uniform vec4       u_baseColor;' + 'uniform vec4       u_channelFlag;' + 'uniform sampler2D  s_texture0;' + 'uniform sampler2D  s_texture1;' + 'void main()' + '{' + '   vec4 col_formask = texture2D(s_texture0 , v_texCoord) * u_baseColor;' + '   vec4 clipMask = (1.0 - texture2D(s_texture1, v_clipPos.xy / v_clipPos.w)) * u_channelFlag;' + '   float maskVal = clipMask.r + clipMask.g + clipMask.b + clipMask.a;' + '   col_formask = col_formask * maskVal;' + '   gl_FragColor = col_formask;' + '}';
globalConfigsData[options.__baseShadersFolder + 'fragmentShaderSrcMaskInvertedPremultipliedAlpha.f'] = 'precision mediump float;' + 'varying vec2 v_texCoord;' + 'varying vec4 v_clipPos;' + 'uniform sampler2D s_texture0;' + 'uniform sampler2D s_texture1;' + 'uniform vec4 u_channelFlag;' + 'uniform vec4 u_baseColor;' + 'void main()' + '{' + 'vec4 col_formask = texture2D(s_texture0, v_texCoord) * u_baseColor;' + 'vec4 clipMask = (1.0 - texture2D(s_texture1, v_clipPos.xy / v_clipPos.w)) * u_channelFlag;' + 'float maskVal = clipMask.r + clipMask.g + clipMask.b + clipMask.a;' + 'col_formask = col_formask * (1.0 - maskVal);' + 'gl_FragColor = col_formask;' + '}';

LCC.Logging.csmSetLogFunction(consoleLog);

//cheats
function printVersion() {
    var version = LCC.Version.csmGetVersion();
    var major = (version & 0xff000000) >> 24;
    var minor = (version & 0x00ff0000) >> 16;
    var patch = version & 0x0000ffff;
    var versionNumber = version;
    consoleLog("Live2D Cubism Core version: ", ('00' + major).slice(-2), ('00' + minor).slice(-2), ('0000' + patch).slice(-4), versionNumber);
}

printVersion();
//endcheats


BUS.__addEventListener(__ON_GAME_LOADED, () => {
    cubismFactory.__init();
    return 1;
});