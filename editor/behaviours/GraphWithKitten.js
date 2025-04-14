var GraphWithKitten = (function () {

    //TODO history!!

    function LineGraphNode(opts) {



        mergeObjExclude(opts, {
            __color: __defaultTextProperties.__color,
            sva: 2,
            sha: 0
        });

        consoleLog('new LineGraphNode', opts);

        ENode.call(this, opts);

    }

    LineGraphNode.prototype = Object.create(NodePrototype);

    mergeObj(LineGraphNode.prototype, {

        constructor: LineGraphNode,

        __drawMode: 3,

        __updateVertices: function () {

            var t = this;
            var curveData = t.curveData;

            if (t.__curveChanged) {
                if (curveData) {
                    var arr = makeCurveValues(curveData);

                    var len = arr.length;

                    if (!t.__geomSize) {
                        t.__geomSize = new Vector2(0, 0);
                    }

                    if (!t.__verticesBuffer) {
                        t.__verticesBuffer = t.__addAttributeBuffer('position', 2);
                    }

                    setLineIndecesBuffer(t, len * 2);

                    var verts = t.__verticesBuffer.__getArrayOfSize(len * 2);
                    for (var i in arr) {
                        verts[i * 2] = i;
                        verts[i * 2 + 1] = arr[i];
                    }
                    this.__curveArray = arr;
                }

                this.__curveChanged = 0;
            }


            return this;

        },

        update: function (deep) {

            var t = this, graphProxyObject = t.graphProxyObject;
            t.__offset.y = graphProxyObject.minValue * graphProxyObject.yscale;
            t.____scale.set(graphProxyObject.xscale, graphProxyObject.yscale, 1);
            t.length = graphProxyObject.length;

            if (t.__newCurve) {
                t.__clearChildNodes();
                t.addPointsNodes();
                t.__newCurve = 0;
            }

            return NodePrototype.update.apply(t, arguments);

        },

        addPointsNodes: function () {
            var curveData = this.curveData;
            for (var i in curveData) {
                this.addNodeForPoint(Number(i));
            }
        },

        addNodeForPoint: function (i) {
            consoleLog('addNodeForPoint', i);

            // TODO:
            var t = this;

            var n = this.__addChildBox({
                index: i,
                __size: { x: 7, y: 7 },
                __color: 0xffffff,
                //             __ofs:{ x:x, y:y, z:-1 },
                __dragDist: 20,
                __onTap: function () { this.__select(); return 1; },
                __img: 'qbord_8_w',

                __select: function () {
                    if (!isShiftPressed)
                        this.__parent.__parent.$({ __selected: 1 }).__unselect();
                    this.__selected = 1;
                    this.__color = 0x7777ff;
                    this.__parent.graphProxyObject.updateInputs();
                    return 1;
                },

                __unselect: function () {
                    this.__color = 0xffffff;
                    this.__selected = 0;
                    if (this.__parent)
                        this.__parent.graphProxyObject.updateInputs();
                },

                __updateMatrix: function () {
                    var t = this,
                        p = t.__parent,
                        j = t.index,
                        point = p.curveData[j],
                        x = point[0],
                        y = point[1],
                        s = p.__scale,
                        ae = this.__matrix.e;

                    ae[0] = 1 / s.x;
                    //                 ae[ 4 ] = 0;
                    //                 ae[ 8 ] = 0;
                    ae[12] = p.length * x;

                    //                 ae[ 1 ] = 0;
                    ae[5] = 1 / s.y;
                    //                 ae[ 9 ] = 0;
                    ae[13] = y;

                    //                 ae[ 2 ] = 0;
                    //                 ae[ 6 ] = 0;
                    ae[10] = 1;
                    ae[14] = 1;

                    //                 ae[ 3 ] = 0;
                    //                 ae[ 7 ] = 0;
                    //                 ae[ 11 ] = 0;
                    ae[15] = 1;

                    t.__matrixWorldNeedsUpdate = 1;
                    t.__matrixNeedsUpdate = 0;
                    return t;
                },

                __canDrag: function () {

                    if (!this.__selected)
                        this.__select();

                    return mouseButtons[0] ? 1 : 0;
                },

                __drag: function (x, y, dx, dy) {

                    var t = this,
                        p = t.__parent,
                        s = p.__scale;

                    // TODO: shift and ctrl mod?
                    dx = dx / s.x;
                    dy = dy * numericInputStepMult() / s.y;

                    p.graphProxyObject.translatePoints(dx, dy, t.__parent);

                }
            });

            if (t.__lastPoint && n.__parent.curveData[n.index][0] == t.__lastPoint[0] && n.__parent.curveData[n.index][1] == t.__lastPoint[1]) {
                t.__lastPoint = 0;
                n.__select();
            }

            return n;

        },

    });

    ObjectDefineProperties(LineGraphNode.prototype, {
        curveData: {

            set: function (v) {
                if (!this.__curveData) {
                    this.__newCurve = 1;
                } else if (v && this.__curveData && v.length != this.__curveData.length) {
                    this.__newCurve = 1;
                }
                this.__curveChanged = 1;
                this.__curveData = v;
                this.update(1);
            },

            get: function () {
                return this.__curveData;
            }

        }
    });


    function GraphProxyObject(opts) {

        this.__lines = [];
        mergeObj(this, opts);
        var range = this.standartRange;
        this.__minValue = range[0];
        this.__maxValue = range[1];

    }

    GraphProxyObject.prototype = {

        constructor: GraphProxyObject,

        __destruct: function () {

        },

        makeCurve: function (curveIndex, curveData) {

            consoleLog('makeCurve', curveIndex, curveData);

            if (!this.__lines[curveIndex]) {

                var line = this.__lines[curveIndex] = new LineGraphNode({
                    graphProxyObject: this,
                    curveData: curveData,
                    curveIndex: curveIndex
                });

                this.node.__addChildBox(line);

            } else {
                this.__lines[curveIndex].curveData = curveData;
            }

        },

        updateInputs: function () {

            EditFieldsWithKitten.updateAllPropsIn(this.node.__parent.__parent)
        },


        updateMiniMax: function (val) {

            var arr1, arr2;

            if (val && isArray(val)) {
                if (isArray(val[0])) arr1 = makeCurveValues(val[0]);
                if (isArray(val[1])) arr2 = makeCurveValues(val[1]);
            }

            if (!arr1) return;

            var min1 = 10000000;
            for (var i in arr1) if (arr1[i] < min1) min1 = arr1[i];
            for (var i in arr2) if (arr2[i] < min1) min1 = arr2[i];

            var max1 = -10000000;
            for (var i in arr1) if (arr1[i] > max1) max1 = arr1[i];
            for (var i in arr2) if (arr2[i] > max1) max1 = arr2[i];

            this.__maxValue = mmax(this.__maxValue || -1000000, max1);
            this.__minValue = mmin(this.__minValue || 1000000, min1);

            max1 = this.__maxValue;
            min1 = this.__minValue;

            while (max1 == min1) {
                if (max1 == 0) {
                    this.__maxValue = 1;
                } else {
                    this.__maxValue *= 1.1;
                    this.__minValue /= 1.1;
                }
                max1 = this.__maxValue;
                min1 = this.__minValue;
            }

            mergeObj(this, {
                __maxValue: max1,
                __minValue: min1,
                length: mmax(arr1 ? arr1.length : 0, arr2 ? arr2.length : 0)
            });

        },

        updateLinesCurveData: function (line) {
            var l1 = this.__lines[0];
            var l2 = this.__lines[1];
            var v = this.value;
            if (!isArray(v)) {
                //TODO: ???
                v = [v || 0, 0];
            }
            if (l1) v[0] = l1.curveData;
            if (l2) v[1] = l2.curveData;
            this.value = v;
        },

        updateLineCurveData: function (line) {
            var v = this.value;
            if (!isArray(v)) {
                //TODO: ???
                v = [v || 0, 0];
            }
            v[line.curveIndex] = line.curveData;
            this.value = v;
        },

        makeGraph: function () {

            var canvas = this.canvas;

            var val = this.value;

            this.updateMiniMax(val);

            if (!this.node) {

                this.node = canvas.__addChildBox({
                    __size: { x: 1, y: 1 },
                    __color: 0x888888,
                    __alpha: 0.2,
                    __margin: [50, 10, 10, 10],
                    __z: -1,
                    graphProxyObject: this,
                    __onTap: function () {

                        var position = toNodeCoords(mouse, 1, -40).sub(this.__worldPosition);
                        position.y *= -1;
                        var sz = this.__size;

                        position.__divide(sz).add(new Vector2(0.5, 0.5));

                        // position normalized now. from 0 to 1

                        position.y = this.graphProxyObject.minValue + this.graphProxyObject.diff * position.y;

                        invokeEventWithKitten('Graph.addPoint', {
                            point: position,
                            graphProxyObject: this.graphProxyObject
                        });
                        return 1;
                    },

                    update: overloadMethod(NodePrototype.update, function () {

                        var sz = this.__size;
                        var width = sz.x;
                        var height = sz.y;

                        var maxValue = this.graphProxyObject.maxValue;
                        var minValue = this.graphProxyObject.minValue;
                        var length = this.graphProxyObject.length;
                        var diff = this.graphProxyObject.diff;

                        mergeObj(this.graphProxyObject, {
                            yscale: height / (diff || 1),
                            xscale: width / (length || 1),
                            width: width,
                            height: height
                        });
                        return this;
                    })

                });

            }

            if (val && isArray(val) && isArray(val[0])) {
                if (val[0].length == 0) {
                    //TODO
                    //                 return;
                } else {
                    this.makeCurve(0, val[0]);
                }
            }
            else {
                if (this.__lines && this.__lines[0]) {
                    this.__lines[0].__removeFromParent();
                    this.__lines[0] = undefined;
                    //                 return;
                }
            }

            if (val && isArray(val) && isArray(val[1])) {
                if (val[1].length == 0) {
                    //TODO
                    //                 return;
                } else {
                    this.makeCurve(1, val[1]);
                }
            }
            else {
                if (this.__lines && this.__lines[1]) {
                    this.__lines[1].__removeFromParent();
                    this.__lines[1] = undefined;
                    //                 return;
                }
            }

            this.node.update(1);
            this.updateInputs();

        },

        translatePoints: function (dx, dy, line) {
            dx = isNumeric(dx) ? dx : 0;
            dy = isNumeric(dy) ? dy : 0;
            if (dx == 0 && dy == 0) return;
            dx /= this.length;
            this.node.__traverse(function (t) {
                if (t.__selected) {
                    if (!line || (line == t.__parent)) {

                        var p = t.__parent, j = t.index,
                            point = p.curveData[j];

                        point[0] = clamp(point[0] + dx, 0, 1);
                        point[1] -= dy;
                    }
                }
            });

            if (line) {
                this.updateLineCurveData(line);
            } else {
                this.updateLinesCurveData();
            }

        },

        removePoints: function () {
            var lns = {}, l = 0;
            this.node.$(function (t) {
                if (t.__selected) {
                    var p = t.__parent, j = t.index;
                    p.curveData[j] = undefined;
                    lns[p.curveIndex] = p;
                    l++;
                    return 1;
                }
            }).__removeFromParent();

            if (l) {
                for (var i in lns) {
                    line = lns[i];
                    line.curveData = line.curveData.filter(function (p) { return p != undefined });
                }

                this.updateLinesCurveData();
            }

        }
    }

    ObjectDefineProperties(GraphProxyObject.prototype, {

        standartRange: {
            get: function () {
                return this.prop.standartRange || [0, 100];
            }
        },

        value: {
            set: function (v) {
                this.objectToChange[this.prop.__name] = v;
                this.makeGraph();
            },

            get: function () {
                //             consoleLog(this.objectToChange, this.prop);
                return this.objectToChange[this.prop.__name];
            }
        },

        maxValue: {
            set: function (v) {
                this.diff = (v || 0) - (this.__minValue || 0);
                this.__maxValue = isNumeric(v) ? v : undefined;
                if (this.node) this.node.__needUpdateDeep = 1;
            },
            get: function () {
                if (this.__maxValue == undefined) this.updateMiniMax(this.value);
                this.diff = (this.__maxValue || 0) - (this.__minValue || 0);
                return Number(this.__maxValue.toFixed(2));
            }
        },

        minValue: {
            set: function (v) {
                this.diff = (this.__maxValue || 0) - (v || 0);
                this.__minValue = isNumeric(v) ? v : undefined;
                if (this.node) this.node.__needUpdateDeep = 1;
            },
            get: function () {
                if (this.__minValue == undefined)
                    this.updateMiniMax(this.value);
                this.diff = (this.__maxValue || 0) - (this.__minValue || 0);
                return Number(this.__minValue.toFixed(2));
            }
        },

        selectedx: {
            set: function (v) {
                if (!isNumeric(v)) return;
                this.translatePoints(v - this.selectedx, 0);
            },
            get: function () {
                var x = this.node.__traverse(function (n) {
                    if (n.__selected) {
                        return n.__parent.curveData[n.index][0] * n.__parent.length;
                    }
                })
                return x;
            }
        },

        selectedy: {
            set: function (v) {
                if (!isNumeric(v)) return;
                consoleLog(this.selectedy, '->', v);
                this.translatePoints(0, this.selectedy - v);
            },
            get: function () {
                return this.node.__traverse(function (n) {
                    if (n.__selected) {
                        return n.__parent.curveData[n.index][1]
                    }
                })
            }
        },

        __easing: {
            set: function (v) {

                consoleLog(this.__easing, '->', v);

                this.node.__traverse(function (t) {
                    if (t.__selected) {
                        var p = t.__parent, j = t.index,
                            point = p.curveData[j];
                        if (v == undefined) {
                            delete point[2];
                        }
                        else if (isNumeric(v)) {
                            point[2] = v;
                        }
                    }
                });

                this.updateLinesCurveData();


            },
            get: function () {
                return this.node.__traverse(function (n) {
                    if (n.__selected) {
                        return n.__parent.curveData[n.index][2] || 0
                    }
                })
            }
        }

    });

    var graphPanels = [],

        graphWithKitten = {

            graphPanels: graphPanels,

            openGraph: function (srcCell, objectToChange, prop) {

                var proxyObject = new GraphProxyObject({
                    srcCell: srcCell,
                    objectToChange: objectToChange,
                    prop: prop
                });

                var graphPanel = PanelsWithKitten.addPanelFromTemplate(
                    graphWithKitten.graphTemplate, 0, proxyObject
                );

                graphPanel.__visible = 1;

                graphPanel.__needRemoveOnClose = 1;

                graphPanel.__onDestruct = function () {

                    removeFromArray(graphPanel, graphPanels);
                    proxyObject.__destruct();

                }

                graphPanels.push(graphPanel);

                graphPanel.proxyObject = proxyObject;

                proxyObject.canvas = graphPanel.panel;

                proxyObject.makeGraph();

            }

        };


    BUS.__addEventListener({

        EDITOR_LOADED: function (t, editor) {

            graphWithKitten.graphTemplate = extractLayoutFromLayout('graph_template', Editor.uiLayout);

        }

    });

    addEditorBehaviours({

        graphPanel: function (n) {
            // wtf?

        }

    });

    addEditorEvents('Graph', {

        addPoint: function (d) {

            if (d) {
                graphProxyObject = d.graphProxyObject;

                if (!graphProxyObject)
                    return;

                if (d.point) {

                    var point = d.point;

                    if (isObject(point)) {
                        point = [Number(point.x), Number(point.y)];
                    }

                    consoleLog('Graph.addPoint', point);

                    var lines = graphProxyObject.__lines;
                    var exist;
                    for (var i in lines) {
                        if (lines[i]) {
                            exist = 1;
                            break;
                        }
                    }

                    if (exist) {

                        var minDist = +Infinity;
                        var minLine;

                        for (var i in lines) {

                            var line = lines[i];
                            if (!line)
                                continue;
                            var arr = line.__curveArray;
                            if (!arr)
                                continue;

                            var x = 0, y = 0, dst = 0;

                            for (var i = 0; i < arr.length; i++) {
                                x = point[0] * arr.length - i;
                                y = (point[1] - arr[i]) / graphProxyObject.diff;
                                dst = sqrt(y * y + x * x);
                                if (dst < minDist) {
                                    minDist = dst;
                                    minLine = line;
                                }
                            }

                        }

                        graphProxyObject.node.$({ __selected: 1 }).__unselect();

                        if (minLine && (minDist < 0.3 || isCtrlPressed)) {
                            minLine.curveData.push(point);
                            minLine.__lastPoint = point;
                            minLine.__newCurve = 1;
                            graphProxyObject.updateLineCurveData(minLine);
                        }


                    } else {

                        graphProxyObject.value = [[point]];

                    }

                }
            }
        },

        clear: function (d) {

            if (!d) return;
            var but = d.caller;
            if (!but) return;

            but.__traverseParents(function (n) { return n.proxyObject }).value = undefined;

        },

        clearEasing: function (d) {

            if (!d) return;
            var but = d.caller;
            if (!but) return;

            but.__traverseParents(function (n) { return n.proxyObject }).__easing = undefined;

        },

        removePoints: function (d) {

            if (!d) return;
            var but = d.caller;
            if (!but) return;

            but.__traverseParents(function (n) { return n.proxyObject }).removePoints();

        }

    })('Editor', {

        openGraph: function (d) {

            if (!d) return;
            var but = d.caller;
            if (!but) return;

            var objectToChange = but.__traverseParents(function (n) {
                if (n.objectToChange && n.prop) {
                    return n;
                }
            });

            if (objectToChange) {
                GraphWithKitten.openGraph(but.__parent, objectToChange.objectToChange, objectToChange.prop);
            }

        }
    });

    return graphWithKitten;


})();
