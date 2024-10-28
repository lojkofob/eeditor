


function NodeEditWithKitten(layout) {

    this.layout = layout;

}

var selectedWireframesCount = 0;

NodeEditWithKitten.prototype = {

    constructor: NodeEditWithKitten,

    activate: function () {
        BUS.__addEventListener([
            __ON_NODE_SELECTED,
            __ON_NODE_UNSELECTED,
            __OBJECT_CHANGED
        ], this);

        BUS.__addEventListener([__ON_KEY_DOWN, __ON_KEY_UP], function () {
            eachSelected(sn => {
                if (sn.wireframed) {
                    if (sn.wireframed.n_0_0)
                        sn.wireframed.n_0_0.__visible = isShiftPressed;
                }
            });
        });
    },

    deactivate: function () {
        BUS.__removeEventListener(this);
    },

    createView: function () {
        return this.view = new Node({ __isScene: 1, __validToSave: 0, __selectable: 0 });
    },

    __on: function (t, e) {

        switch (t) {

            case __OBJECT_CHANGED:
                for (var i in e) {
                    var change = e[i];
                    if (change.node) {
                        var wf = change.node.wireframed;
                        if (wf) {
                            looperPost(function () { this.update(1); }.bind(wf));
                        }
                    }
                }
                break;

            case __ON_NODE_SELECTED:

                var node = e;
                if (node.disableEdit)
                    return;


                var cam =
                    // getDeepFieldFromObject(Editor.currentLayout, 'camera') ||
                    // getDeepFieldFromObject(Editor.currentLayout, 'layoutView', 'camera') ||
                    (node.__root || 0).camera ||
                    camera;

                node.__camera = cam;

                var v = node.__deepVisible();
                if (!v) {
                    node.__traverseParents(p => {
                        p.__tmpvis = p.__visible;
                        p.__visible = 1;
                    });
                    node.__tmpvis = node.__visible;
                    node.__visible = 1;
                    if (node.__root) {
                        node.__root.update(1).__updateMatrixWorld(1);
                    }
                    node.__traverseParents(p => {
                        p.__visible = p.__tmpvis;
                    });
                    node.__visible = node.__tmpvis;
                }

                selectedWireframesCount++;
                
                var helper = node.wireframed = this.view.__addChildBox({
                    //                     update : function(d)
                    //                     {
                    //                         
                    //                         NodePrototype.update.call(this,d );
                    //                         
                    //                     },
                    __updateMatrix: function () { },
                    __onDestruct: function(){
                        selectedWireframesCount--;
                    },
                    __updateMatrixWorld: function () {
                        var t = this;
                        t.__matrixWorldNeedsUpdate = t.__matrixScrollNeedsUpdate = t.__matrixNeedsUpdate = 0;
                        var __childs = t.__childs;
                        for (var i = 0, l = __childs.length; i < l; i++) {
                            __childs[i].__updateMatrixWorld(1, 1);
                        }
                    },
                    __node: node,
                    __camera: cam,

                    __color: randomInt(0, 0xffffff),

                    __hitTest: function (p) {
                        node.__visibleForTap = function () { return 1; }
                        var ht = node.__hitTest(p);
                        node.__visibleForTap = NodePrototype.__visibleForTap;
                        return ht;
                    },

                    __canDrag: function () {
                        return mouseButtons[0];
                    },

                    __drag: function (x, y, dx, dy) {
                        invokeEventWithKitten('set', offsetChanger(dx, dy), {
                            withHistoryStack: 1,
                            eachSelectedParent: 1
                        });
                    },

                    __dragEnd: function () {
                        BUS.__post('FLUSH_HISTORY_STACK');
                    },

                    __childs: {
                        __border: {
                            __isBorder: 1,
                            __blending: 1,
                            __alpha: 1,
                            __drawMode: 3,
                            __color: randomInt(0, 0xffffff),

                            __updateVertices: updateVerticesCustomFunction(function () {
                                var s = node.__size.__clone().__multiplyScalar(0.5);
                                return [
                                    -s.x, s.y,
                                    -s.x, -s.y,
                                    s.x, -s.y,
                                    s.x, s.y,
                                    -s.x, s.y
                                ]
                            }),
                            __render: function () {
                                this.__projectionMatrix = node.__projectionMatrix;
                                NodePrototype.__render.call(this);
                            },

                            update: overloadMethod(NodePrototype.update, function () {
                                if (node.__geometryOffset) {
                                    this.__offsetByParent.add(node.__geometryOffset);
                                }
                                return this;
                            })
                        },

                        __paddingBorder: {
                            __isBorder: 1,
                            __blending: 2,
                            __alpha: 1,
                            __drawMode: 3,
                            __color: 0x6666ff,
                            __padding: node.__padding ? node.__padding.slice() : [0, 0, 0, 0],
                            __updateVertices: updateVerticesCustomFunction(function () {
                                var s = node.__size.__clone().__multiplyScalar(0.5);
                                var p = node.__padding || 0;

                                if (p) {
                                    return [
                                        -s.x + p[1], s.y - p[0],
                                        -s.x + p[1], -s.y + p[2],
                                        s.x - p[3], -s.y + p[2],
                                        s.x - p[3], s.y - p[0],
                                        -s.x + p[1], s.y - p[0],
                                    ]
                                }
                            }),
                            __render: function () {

                                var p = node.__padding || 0;

                                if (p) {
                                    var pp = this.____padding || [0, 0, 0, 0];
                                    for (var i = 0; i < 4; i++) {
                                        if (p[i] != pp[i]) {
                                            this.sss = 100;
                                            pp[i] = p[i];
                                            break;
                                        }
                                    }
                                    this.____padding = pp;
                                }

                                if (this.sss) {
                                    this.__projectionMatrix = node.__projectionMatrix;
                                    NodePrototype.__render.call(this);
                                    this.sss--;
                                }
                            },

                            update: overloadMethod(NodePrototype.update, function () {
                                if (node.__geometryOffset) {
                                    this.__offsetByParent.add(node.__geometryOffset);
                                }
                                return this;
                            })
                        }
                    },

                    sss: 100,
                    wpppp: new Vector2(),

                    __render: function () {

                        __propertiesAppliedByClass = 1;

                        node.__projectionMatrix = node.__projectionMatrix || cam.__projectionMatrix;

                        var s = node.__size
                            , sizeSq = clamp(mmin(s.x, s.y), 1.0000001, 300)
                            , csz = clamp(8 / cam.__zoom, 1.0000001, sizeSq);
 
                        if (selectedWireframesCount == 1 || node.__worldPosition.x != this.wpppp.x || node.__worldPosition.y != this.wpppp.y) {
                            this.__needUpdate = 1;
                            this.wpppp.__copy(node.__worldPosition);
                        }


                        if (this.__csz != csz) {
                            this.__needUpdateDeep = 1;
                            this.__eachChild(function (c) {
                                if (!c.__isBorder) {
                                    c.__size = [csz, csz, 0, 0];
                                    c.__ofs = [c.x * csz, c.y * csz, 0];
                                }
                            });
                            //                             this.__childs[0].__debugUpdate = 1;
                            this.__csz = csz;
                        }


                        if (this.___sssx != s.x) {
                            this.__needUpdateDeep = 1;
                            this.___sssx = s.x;
                        }

                        if (this.___sssy != s.y) {
                            this.__needUpdateDeep = 1;
                            this.___sssy = s.y;
                        }

                        if (this.__needUpdate || this.__needUpdateDeep) {
                            this.update(this.__needUpdateDeep);
                            this.__updateMatrixWorld();
                        }


                        if (node.__corner && node.__indecesBuffer) {

                            var p = node.__corner;
                            if (p) {
                                var pp = this.crn || [0, 0, 0, 0];
                                for (var i = 0; i < 4; i++) {
                                    if (p[i] != pp[i]) {
                                        this.sss = 100;
                                        pp[i] = p[i];
                                        break;
                                    }
                                }
                                this.crn = pp;
                            }

                            if (this.sss) {


                                this.sss--;

                                var dm = node.__drawMode
                                    , p = node.__program
                                    , c = node.color
                                    , a = node.__alpha
                                    , dv = node.__deepVisible();

                                node.__alpha = 0.4;
                                if (!dv) {

                                    if (node.__dirty) {
                                        v = node.__visible;
                                        if (!v) node.__visible = 1;
                                        node.update();
                                        node.__updateMatrixWorld(1);
                                        if (!v) node.__visible = 0;
                                    }

                                    renderer.__draw(node, node.__indecesBuffer.__realsize);
                                }

                                if (p) {
                                    node.__program = renderer.__getWebGLProgram({ v: p.v, f: 'c' });
                                }

                                node.__drawMode = 3;
                                node.color = this.color;

                                renderer.__draw(node, node.__indecesBuffer.__realsize, 'c');

                                node.__drawMode = dm;
                                node.__program = p;
                                node.__alpha = a;
                                node.color = c;
                            }
                        }

                        __propertiesAppliedByClass = 0;

                        return 1;
                    }

                });


                ObjectDefineProperties(helper, {

                    __viewable: createSomePropertyWithGetterAndSetter(function () {
                        return node.__viewable && node.__lastRenderTime > TIME_NOW - __currentFrameDeltaTime / 100;
                    }),

                    mw: createSomePropertyWithGetterAndSetter(function () { return node.mw }),
                    //                     __transformAnchor:{ get: function() { return node.__transformAnchor } },
                    //                     __geometryOffset:{ get: function() { return node.__geometryOffset } },
                    __size: createSomePropertyWithGetterAndSetter(function () {

                        if (node.__needUpdateDeep) {
                            node.update(1);
                        }
                        else
                            if (node.__needUpdate) {
                                node.update();
                            }

                        if (this.____szzz) {
                            this.____szzz.__copy(node.__size);
                        }
                        else {
                            this.____szzz = node.__size.__clone();
                        }
                        this.____szzz.x = abs(this.____szzz.x);
                        this.____szzz.y = abs(this.____szzz.y);
                        return this.____szzz;

                    })
                });

                function canShade(node) {
                    return node.__program && (
                        $find(node.__program.uniforms, (u, i) => i.startsWith('u_')) ? false : true);
                }

                function nodeshader(node) {
                    return node.__is3D ? 'base' : canShade(node) ? { v: 
                        node.__program.v.id == 'c' ? 'base' : node.__program.v, 
                        f: 'base' } : 'base';
                }


                function addhh_(x, y) {
                    if (x == 0 && y == 0) {
                        var anchor = node.__anchor;
                        if (anchor)
                            helper.__addChildBox({
                                sva: ALIGN_CENTER, sha: ALIGN_CENTER,
                                __camera: cam,
                                __color: 0x9999ff,
                                __visible: false,
                                x: 0, y: 0,
                                __minimalTapArea: 0.01,
                                __size: [8, 8],
                                __img: 'rbord_8_w',
                                __canDrag: function () {
                                    return mouseButtons[0];
                                },
                                update: overloadMethod(NodePrototype.update, function () {
                                    var a = node.__anchor.__clone();

                                    if (this.useTransformAnchor) {
                                        a.__multiply(node.__size);
                                        a.add(node.__geometryOffset);
                                    }

                                    this.__ofs = [-a.x, a.y, 0];

                                    return this;
                                }),

                                __dragStart: function (x, y) {
                                    this.ds = new Vector2(x, y);
                                },
                                __drag: function (_x, _y, _dx, _dy) {

                                    this.useTransformAnchor = node.__transformAnchor && node.__geometryOffset;

                                    //                                     if (this.useTransformAnchor) {
                                    //                                         this.ds.x -= _dx;
                                    //                                         this.ds.y += _dy;
                                    //                                     } else {
                                    this.ds.x = _x;
                                    this.ds.y = -_y;
                                    //                                     }

                                    var v = this.ds.__clone();

                                    if (this.useTransformAnchor) {
                                        v.sub(node.__geometryOffset);
                                    }

                                    v.__applyMatrix4(node.__matrixWorld.__getInverseMatrix());
                                    v.x = -Number(v.x.toFixed(2));
                                    v.y = -Number(v.y.toFixed(2));

                                    if (this.useTransformAnchor) {
                                        v.__divide(node.__size);
                                    }

                                    invokeEventWithKitten('set', { __anchor: v }, {
                                        withHistory: 1,
                                        withHistoryStack: 1,
                                        object: node
                                    });


                                    this.update();

                                },

                                __dragEnd: function () {
                                    BUS.__post('FLUSH_HISTORY_STACK')
                                },

                                __shader: nodeshader(node)

                            }, "n_" + x + '_' + y)
                    }
                    else
                        helper.__addChildBox(
                            {
                                __shader: nodeshader(node),
                                __camera: cam,
                                x: x,
                                y: y,
                                sva: y + 1,
                                sha: x + 1,
                                __onTapHighlight: 1,
                                update: overloadMethod(NodePrototype.update, function () {
                                    if (node.__geometryOffset) {
                                        this.__offsetByParent.add(node.__geometryOffset);
                                    }
                                    this.__updateUniforms();
                                    return this;
                                }),

                                __render: function () {
                                    this.__projectionMatrix = node.__projectionMatrix;
                                    NodePrototype.__render.call(this);
                                },

                                __updateUniforms() {
                                    this.__uniforms = node.__uniforms;
                                },

                                __minimalTapArea: 0.01,
                                __ofs: [x * 8, y * 8, 0],
                                __size: [8, 8],

                                __img: 'qbord_8_w',

                                __dragStart: function () {
                                    beginDragSize = node.__size;
                                    beginDragRotate = node.__rotate;
                                    beginDragSizeChanged = beginDragRotateChanged = 0;
                                },
                                __dragDist: 1,
                                __dragEnd: function () {
                                    var changes = [];
                                    if (beginDragSizeChanged) {
                                        changes.push({ type: 'set', node: node, prop: '__eSize', prev: beginDragSize, next: node.__eSize });
                                    }

                                    if (beginDragRotateChanged)
                                        changes.push({ type: 'set', node: node, prop: '__rotate', prev: beginDragRotate, next: node.__rotate });

                                    objectChanged(changes);

                                    delete node.ctrlBY;
                                    delete node.ratioBY;
                                    this.angle = undefined;
                                },

                                __canDrag: function () {
                                    return mouseButtons[0];
                                },

                                __drag: function (_x, _y, _dx, _dy) {

                                    blurOther();
                                    var parent = node.__parent;

                                    if (parent) {
                                        if (parent.ha == undefined || parent.ha == ALIGN_CENTER) _dx *= 2;
                                        if (parent.va == undefined || parent.va == ALIGN_CENTER) _dy *= 2;
                                    }


                                    if (isShiftPressed) {

                                        // TODO: multiply selection

                                        if (this.angle == undefined) {
                                            var pos = node.__screenPosition();
                                            var a = node.__rotate * DEG2RAD;
                                            pos.x -= cos(a) * node.__anchor.x - sin(a) * node.__anchor.y;
                                            pos.y += cos(a) * node.__anchor.y - sin(a) * node.__anchor.x;

                                            this.pos = pos;
                                            this.angle = (atan2(mouse.x - pos.x, mouse.y - pos.y) - a) * RAD2DEG;
                                            var da = this.angle - node.__rotate;
                                            while (da > 300) { da -= 360; this.angle += 360; }
                                            while (da < -300) { da += 360; this.angle -= 360; }

                                        } else {
                                            beginDragRotateChanged = 1;
                                            var pos = this.pos;
                                            var nexta = atan2(mouse.x - pos.x, mouse.y - pos.y) * RAD2DEG - this.angle;
                                            var da = nexta - node.__rotate;
                                            while (da > 300) { da -= 360; nexta -= 360; this.angle += 360; }
                                            while (da < -300) { da += 360; nexta += 360; this.angle -= 360; }

                                            node.__rotate = nexta;

                                        }

                                        helper.__matrixWorldNeedsUpdate = 1;
                                        EditFieldsWithKitten.updatePropertyData('__rotate', 0, node);


                                    }
                                    else {

                                        beginDragSizeChanged = 1;
                                        this.angle = undefined;

                                        var v = new Vector2(_x, -_y);
                                        var xxx = x;
                                        var yyy = y;
                                        var xmult = 2;
                                        var ymult = 2;

                                        if (node.sha == undefined) {
                                            if (node.__parent.ha != undefined && node.__parent.ha != ALIGN_CENTER) {
                                                xmult = 1;

                                                if (node.__parent.ha == ALIGN_START || node.__parent.ha == ALIGN_FROM_START_TO_END) if (x == -1) xxx = 0;
                                                if (node.__parent.ha == ALIGN_END || node.__parent.ha == ALIGN_FROM_END_TO_START) if (x == 1) xxx = 0;

                                            }
                                        } else
                                            if (node.sha != ALIGN_CENTER) {
                                                xmult = 1;

                                                if (node.sha == ALIGN_START) if (x == -1) xxx = 0;
                                                if (node.sha == ALIGN_END) if (x == 1) xxx = 0;

                                            }

                                        if (node.sva == undefined) {
                                            if (node.__parent.va != undefined && node.__parent.va != ALIGN_CENTER) {
                                                ymult = 1;

                                                if (node.__parent.va == ALIGN_START || node.__parent.va == ALIGN_FROM_START_TO_END) if (y == -1) yyy = 0;
                                                if (node.__parent.va == ALIGN_END || node.__parent.va == ALIGN_FROM_END_TO_START) if (y == 1) yyy = 0;
                                            }

                                        } else
                                            if (node.sva != ALIGN_CENTER) {
                                                ymult = 1;

                                                if (node.sva == ALIGN_START) if (y == -1) yyy = 0;
                                                if (node.sva == ALIGN_END) if (y == 1) yyy = 0;


                                            }

                                        if (xxx == 0 && yyy == 0) return 1;

                                        var im = node.__matrixWorld.__getInverseMatrix();
                                        var size = node.__layoutSize || node.__size;

                                        if (!isCtrlPressed && node.ctrlBY) {
                                            size.y = node.ctrlBY;
                                            delete node.ratioBY;
                                            delete node.ctrlBY;
                                        }

                                        if (node.__geometryOffset) {
                                            v.sub(node.__geometryOffset);
                                        }
                                        v.__applyMatrix4(im);

                                        var newsz = {
                                            px: false, py: false,
                                            x: round(xxx ? mmax(0, abs(v.x * 2)) : size.x),
                                            y: round(yyy ? mmax(0, abs(v.y * 2)) : size.y)
                                        };

                                        if (xmult == 1) newsz.x = (newsz.x + size.x) / 2;
                                        if (ymult == 1) newsz.y = (newsz.y + size.y) / 2;

                                        newsz.x = sign(size.x) * abs(newsz.x);
                                        if (isCtrlPressed) {
                                            if (!node.ratioBY)
                                                node.ratioBY = size.y / size.x;
                                            node.ctrlBY = sign(size.y) * abs(newsz.y);;
                                            newsz.y = node.ratioBY * newsz.x;
                                        }
                                        else {
                                            newsz.y = sign(size.y) * abs(newsz.y);
                                        }

                                        node.__size = newsz;
                                        helper.__needUpdate = helper.__needUpdateDeep = 1;

                                        EditFieldsWithKitten.updatePropertyData('__eSize', 0, node);
                                        helper.update(1);

                                        node.update();
                                        node.__updateMatrixWorld(1);

                                    }

                                }
                            }, "n_" + x + '_' + y);
                }


                addhh_(-1, -1);
                addhh_(-1, 0);
                addhh_(-1, 1);
                addhh_(1, -1);
                addhh_(1, 0);
                addhh_(1, 1);
                addhh_(0, -1);
                addhh_(0, 1);


                addhh_(0, 0);

                if (window.specialFocuser) {
                    helper.__addChildBox({
                        __img: 'qbord_8_w',
                        __scaleF: 20
                    }).__anim({ __scaleF: [50, 20], __alpha: [1, 0] }, 0.3, 0, easeSineO).__removeAfter(0.3);
                }

                helper.update(1);

                break;

            case __ON_NODE_UNSELECTED:
                var node = e;

                if (node.wireframed)
                    node.wireframed = node.wireframed.__removeFromParent();

                break;
        }


    }
} 
