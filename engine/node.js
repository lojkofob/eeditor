//debug
var __propertiesAppliedByClass;
//undebug

var __nodeScrolledByY;
var __nodeScrolledByX;

function genMap(w, h) {
    return {
        __image: { width: w, height: h },
        __setWrapS() { },
        __setWrapT() { },
        f: {
            __uvsBuffers: [],
            r: [0, 0, w, h],
            v: [0, 1, 0, 1],
            c: new Vector2(w / 2, h / 2),
            s: new Vector2(w, h)
        },
        s: new Vector2(w, h)
    }
}

function getFrameName(filename) {
    if (filename != undefined) {
        if (filename.replace) {
            if (filename.indexOf && (filename.indexOf('?') > 0)) { return filename; }
            var fn1 = filename.replace(/\.\w+$/, '');
            if (globalConfigsData.__frames.hasOwnProperty(fn1)) { return fn1; }
            fn1 = fn1.replace(/.*\//, '');
            if (globalConfigsData.__frames.hasOwnProperty(fn1)) { return fn1; }
        }

        if (globalConfigsData.__frames.hasOwnProperty(options.__atlasFramesPrefix + filename)) {
            return options.__atlasFramesPrefix + filename;
        }
    }
    return filename;
}


function ShadowPropertyPrototype(useParentUpdate) {
    return {
        set: function (v) {
            var t = this;
            if (!v) {
                if (t.____shadow) {
                    t.____shadow.__destruct();
                    t.____shadow = undefined;
                }
            }
            else {
                if (!t.____shadow) {
                    t.____shadow = new Shadow(useParentUpdate ? this : 0, this);
                }
                t.____shadow.__init(v);
            }
        },
        get: function () { return this.____shadow; }
    };
}

//DEPRECATED!!
// use __worldPosition
function toNodeCoords(c, ymult, z) {
    ymult = ymult || -1;
    //debug
    c.x = (c.x - __realScreenCenter.x) / camera.__zoom + __realScreenCenter.x + camera.__x;
    c.y = (c.y - __realScreenCenter.y) / camera.__zoom + __realScreenCenter.y - camera.__y;
    //undebug
    return new Vector3(c.x / layoutsResolutionMult - __screenCenter.x, ymult * (c.y / layoutsResolutionMult - __screenCenter.y), z || 0);
}
function __getFour__(v) {
    if (isNumeric(v)) return [v, v, v, v];
    if (v) {
        if (!v.length) return [0, 0, 0, 0];
        for (var i = 0; i < 4; i++)
            v[i] = v[i] || 0;
        return v;
    }
}

function plainForm(p1, p2, p3) { // общее уравнение плоскости по 3м точкам
    var a = p2.x - p1.x
        , b = p2.y - p1.y
        , c = p2.z - p1.z

        , d = p3.x - p1.x
        , e = p3.y - p1.y
        , f = p3.z - p1.z

        , pA = b * f - e * c
        , pB = d * c - a * f
        , pC = a * e - d * b

        , pD = -p1.x * pA - p1.y * pB - p1.z * pC;

    return new Vector4(pA, pB, pC, pD);
}


function Node(j) {
    j = j || {};

    var t = this;

    t.____uvsTransform = 0;

    Object3D.call(t);

    //cheats
    renderInfo.nodes++;
    //endcheats

    //debug
    var tmpClass = __propertiesAppliedByClass;
    if (__propertiesAppliedByClass) {
        t.__nestedByClass = __propertiesAppliedByClass;
        __propertiesAppliedByClass = 0;
    }
    //undebug

    t.__init(j, 0);

    //debug
    if (tmpClass) {
        __propertiesAppliedByClass = tmpClass;
    }
    //undebug

}

var NodePrototype = Node.prototype = Object.create(Object3DPrototype);


function setupVertexAttributes(t, program) {
    // передаем параметры в шейдер
    renderer.__initAttributes();

    //debug

    (t.__verticesBuffer || 0).__debugDrawing =
        (t.__uvsBuffer || 0).__debugDrawing =
        (t.__colorsBuffer || 0).__debugDrawing =
        (t.__indecesBuffer || 0).__debugDrawing = t.__debugDrawing;

    //undebug
    var programAttributes = program.attributes;

    if (t.__verticesBuffer)
        t.__verticesBuffer.__passToGL(programAttributes);

    if (t.__uvsBuffer)
        t.__uvsBuffer.__passToGL(programAttributes);

    if (t.__colorsBuffer)
        t.__colorsBuffer.__passToGL(programAttributes);

    if (t.__indecesBuffer)
        t.__indecesBuffer.__passToGL(programAttributes);

    renderer.__disableUnusedAttributes();

}

mergeObj(NodePrototype, {

    constructor: Node,

    isNode: 1,

    __updateMatrixWorld: function (force, scrollUpdate) {

        var t = this;
        // cached inverse matrix

        if (t.__matrixNeedsUpdate) {
            //cheats
            renderInfo.matrixUpdates++;
            //endcheats
            t.__updateMatrix();
            t.__matrixNeedsUpdate = 0;
        }

        if (t.__matrixWorldNeedsUpdate || force) {
            //cheats
            renderInfo.matrixWorldUpdates++;
            //endcheats
            if (t.parent) {
                t.mw.__multiplyMatrices(t.parent.mw, t.__matrix);
            } else {
                t.mw.copy(t.__matrix);
            }
            t.__matrixWorldNeedsUpdate = 0;
            t.mw.im = 0;
            force = 1;
        }

        if (t.____animatronix) {
            t.____animatronix();
        }

        if (force || scrollUpdate) {

            //cheats
            if (scrollUpdate) renderInfo.matrixScrollUpdates++;
            //endcheats
            var e = t.mw.e
                , pe = t.__parentScrollVector
                , x = e[12] + pe.x
                , y = -e[13] - pe.y;

            t.__worldPosition.set(x, y);

            if (t.__canBeFrustummed) {
                t.__viewable = t.__isInParentScissor(x, y, t.__size);
            } else {
                t.__viewable = t.parent ? t.parent.__viewable : 1;
            }

        }

        // update __childs

        scrollUpdate |= t.__scrollVectorNeedsUpdate;
        var scrollVector = t.__scrollVector || t.__parentScrollVector,
            sciss = t.__parentSciss;

        if (t.__needScissor) {
            //scissor updates here
            sciss = t.__getScissor();
        }

        t.__childs.e$(function (n) {
            if (n.____visible) {
                n.__parentScrollVector = scrollVector;
                if (sciss) n.__parentSciss = sciss;
                n.__updateMatrixWorld(force, scrollUpdate);
            }
        });
        this.__scrollVectorNeedsUpdate = 0;
    },

    __setPropertyOnSeconds: function (prop, val, sec) {
        var t = this;
        if (!t.____setPropertyOnSecondsMap) t.____setPropertyOnSecondsMap = {};
        var v = t[prop], last = t.____setPropertyOnSecondsMap[prop];
        t[prop] = val;
        if (last) {
            _clearTimeout(last.t);
            v = last.v;
        }
        t.____setPropertyOnSecondsMap[prop] = { v: v, t: _setTimeout(function () { t[prop] = v; delete t.____setPropertyOnSecondsMap[prop]; }, sec) };
    },

    __scrollToEnd: function (animTime) {
        return this.__scrollToPart(1, animTime);
    },

    __scrollToPart: function (part, animTime) {
        var t = this;
        return t.__scrollTo(
            part * (t.__needScrollX ? t.__scrollMin.x : (t.__needScrollY ? t.__scrollMin.y : 0)),
            animTime
        )
    },

    __scrollToBegin: function (animTime) {
        return this.__scrollTo(0, animTime);
    },

    __updateScroll: function (animTime) {

        var t = this;
        if (!t.__dragStart) return;
        t.__dragStart();

        if (!t.__needScrollX && !t.__needScrollY) {
            t.__scrollX = t.__scrollY = 0;
            t.__updateSlider(0, 0, animTime);
        } else
            if (!t.__needScrollX) {
                t.__scrollX = 0;
                t.__updateSlider(0, t.__scrollY / t.__scrollMin.y, animTime);
            } else
                if (!t.__needScrollY) {
                    t.__scrollY = 0;
                    t.__updateSlider(t.__scrollX / t.__scrollMin.x, 0, animTime);
                } else {
                    t.__updateSliderVisibility();
                    if ((t.__scrollX > t.__scrollMin.x) || (t.__scrollY > t.__scrollMin.y))
                        t.__scrollBy(new Vector2(0, 0), animTime);
                }

        if (t.__onScroll)
            t.__onScroll();
    },

    __updateScrollX: function (animTime) {

        var t = this;
        if (!t.__dragStart) return;
        t.__dragStart();

        if (!t.__needScrollX) {
            t.__scrollX = 0;
            t.__updateSlider(0, 0, animTime);
        } else {
            t.__updateSliderVisibility();
            if (t.__scrollX > t.__scrollMin.x)
                t.__scrollBy(0, animTime);
        }

        if (t.__onScroll)
            t.__onScroll();
    },

    __updateScrollY: function (animTime) {

        var t = this;
        if (!t.__dragStart) return;
        t.__dragStart();


        if (!t.__needScrollY) {
            t.__scrollY = 0;
            t.__updateSlider(0, 0, animTime);
        } else {
            t.__updateSliderVisibility();
            if (t.__scrollY > t.__scrollMin.y) // TODO : __needScrollX
                t.__scrollBy(0, animTime);
        }

        if (t.__onScroll)
            t.__onScroll();
    },

    __scrollIntoView: function (animTime, percent, dontUsePadding, padding) {
        var t = this, p = t.parent;
        while (p && !p.__scroll) p = p.parent;
        __nodeScrolledByY = 0;
        __nodeScrolledByX = 0;
        if (p) {
            padding = padding || 0;
            p.__dragStart();
            if (p.__scrollVector) {
                t.__parentScrollVector = p.__scrollVector;
            }

            if (t.__dirty) {
                t.update();
                t.__updateMatrixWorld(1, 1);
            } else {
                t.__updateMatrixWorld(0, 1);
            }

            if (p.__needScrollY && p.__needScrollX) {

                var wp = p.__worldPosition
                    , sz = p.__size
                    , b = t.__getBoundingBox()
                    , x = wp.x
                    , cx = p.__size.x
                    , y = wp.y
                    , cy = sz.y
                    , maxy = b.max.y + padding
                    , miny = b.min.y - padding
                    , maxx = b.max.x + padding
                    , minx = b.min.x - padding
                    , pad = (dontUsePadding ? 0 : p.____padding) || [0, 0, 0, 0]
                    , bottom = y + cy / 2 - pad[2]
                    , top = y - cy / 2 + pad[0]
                    , right = x + cx / 2 - pad[3]
                    , left = x - cx / 2 + pad[1]
                    , s = p.__scrollVector ? p.__scrollVector.clone() : new Vector2()
                    , py = percent == undefined ? (maxy > bottom ? 1 : miny < top ? 0 : percent) : percent
                    , px = percent == undefined ? (maxx > right ? 1 : minx < left ? 0 : percent) : percent;

                if (py != undefined) {
                    __nodeScrolledByY = (maxy - bottom) * py;
                    s.y += __nodeScrolledByY + (miny - top) * (1 - py);
                }

                if (px != undefined) {
                    __nodeScrolledByX = (maxx - right) * px;
                    s.x -= __nodeScrolledByX + (minx - left) * (1 - px);
                }

                p.__scrollTo(s, animTime);

            } else
                if (p.__needScrollY) {

                    var b = t.__getBoundingBox()
                        , maxy = b.max.y + padding
                        , miny = b.min.y - padding
                        , y = p.__worldPosition.y
                        , cy = p.__size.y
                        , pad = (dontUsePadding ? 0 : p.____padding) || [0, 0, 0, 0]
                        , bottom = y + cy / 2 - pad[2]
                        , top = y - cy / 2 + pad[0];


                    if (percent == undefined)
                        percent = maxy > bottom ? 1 : miny < top ? 0 : percent;

                    if (percent != undefined) {
                        __nodeScrolledByY = (maxy - bottom) * percent;
                        return p.__scrollBy(__nodeScrolledByY + (miny - top) * (1 - percent), animTime);
                    }

                }
                else
                    if (p.__needScrollX) {

                        var b = t.__getBoundingBox()
                            , maxx = b.max.x + padding
                            , minx = b.min.x - padding
                            , x = p.__worldPosition.x
                            , cx = p.__size.x
                            , pad = (dontUsePadding ? 0 : p.____padding) || [0, 0, 0, 0]
                            , right = x + cx / 2 - pad[3]
                            , left = x - cx / 2 + pad[1];

                        if (percent == undefined)
                            percent = maxx > right ? 1 : minx < left ? 0 : percent;

                        if (percent != undefined) {
                            return p.__scrollBy(-((maxx - right) * percent + (minx - left) * (1 - percent)), animTime);
                        }

                    }
                    else {
                        p.__updateScrollY(animTime);
                        p.__updateScrollX(animTime);
                    }

            return 1;

        }
    },

    __getScrollPosition: function () {
        var t = this;
        return t.__needScrollX ? t.__scrollX : (t.__needScrollY ? t.__scrollY : 0)
    },

    __scrollTo: function (pos, animTime) {
        var t = this;
        if (t.__scroll) {

            t.__dragStart();
            var nsx = t.__needScrollX, nsy = t.__needScrollY;
            if (!nsx && !nsy)
                return t;

            var px = pos.__isVector2 ? pos.x : pos
                , py = pos.__isVector2 ? pos.y : pos
                , x = nsx ? mmax(t.__scrollMin.x, mmin(0, px)) : t.__scrollX
                , y = nsy ? mmax(0, mmin(t.__scrollMin.y, py)) : t.__scrollY;

            if (t.__a) {
                killAnim(t.__a);
                t.__a = 0;
            }
            x = t.__scroll.__stepx ? roundByStep(x, t.__scroll.__stepx) : x;
            y = t.__scroll.__stepy ? roundByStep(y, t.__scroll.__stepy) : y;
            if (animTime) {
                if (nsy && nsx) {
                    t.__a = anim(t, { __scrollY: y, __scrollX: x }, animTime);
                } else
                    if (nsy) {
                        t.__a = anim(t, { __scrollY: y }, animTime);
                    } else if (nsx) {
                        t.__a = anim(t, { __scrollX: x }, animTime);
                    }
            } else {
                t.__scrollX = x;
                t.__scrollY = y;
            }

            t.__updateSlider(x / t.__scrollMin.x, y / t.__scrollMin.y, 0.1);


        }

        return t;
    },

    __scrollBy: function (delta, animTime) {
        if (delta && delta.__isVector2) {
            return this.__scrollTo(new Vector2(this.__scrollX, this.__scrollY).add(delta), animTime);
        }
        return this.__scrollTo(this.__getScrollPosition() + delta, animTime);
    },

    __addChildBox: function (j, name) {
        if (!j) return;

        var t = this;

        if (isArray(j)) {
            for (var i = 0; i < j.length; i++) {
                t.__addChildBox(j[i]);
            }

        } else {

            var child = j.isObject3D ? j : new Node();

            if (name) {
                child.name = name;
            }

            child.__index = t.__childs.length;
            t.add(child);

            if (j && !j.isObject3D) {
                child.__init(j);
            }

            if (child.name) {
                t[child.name] = child;
            }

            t.__dirty = 3;

            return child;
        }

    },

    __apply: function (j) { return this.__init(j, 1); },
    init: function (j, s) { return this.__init(j, s); },

    __removeAlias: function (alias, name) {
        if (this.__aliases && alias && this.__aliases[name]) {
            removeFromArray(alias, this.__aliases[name]);
        }
    },

    __aliased: function (name, parent) {
        var t = this;
        if (!t.____aliasedBy) {
            t.____aliasedBy = {};
            t.__addOnDestruct(function () {
                $each(t.____aliasedBy, function (a, nm) {
                    $mcall(a, '__removeAlias', [t, nm]);
                });
            });
        }
        if (!t.____aliasedBy[name]) {
            t.____aliasedBy[name] = [];
        }

        if (!inArray(parent, t.____aliasedBy[name])) {
            t.____aliasedBy[name].push(parent);
        }
    },

    __alias: function (name, multi) {
        var t = this;
        if (!t.__aliases) t.__aliases = {};
        var all = t.__aliases[name];
        if (all && all.length) {
            return multi ? all : all[0];
        }
        var n = t.$(name);
        if (n) {
            t.__aliases[name] = n;
            $each(n, function (nod) {
                nod.__aliased(name, t);
            });
            return multi ? n : n[0];
        }
    },

    __setAliasesData: function (obj, soft, notMulti) {
        var t = this;
        if (notMulti) {
            $each(obj, function (d, k) {
                var a = t.__alias(k);
                if (a) {
                    if (isFunction(d)) {
                        d.call(a, a);
                    }
                    else {
                        a.__init(d, soft);
                    }
                }
            });
        } else {
            $each(obj, function (d, k) {
                var a = t.__alias(k, 1);
                if (a && a.length) {
                    if (isFunction(d)) {
                        $each(a, function (n) {
                            d.call(n, n);
                        });
                    }
                    else {
                        a.__init(d, soft);
                    }
                }
            });
        }
        return t;
    },

    __mergeUserData: function (v) {
        this.__userData = mergeObjectDeep(this.__userData || {}, v);
    },

    __init: function (j, soft) {
        var t = this;
        if (j) {

            if (isString(j)) {
                j = getLayoutByName(j);
                if (j && isArray(j) && j.length == 1)
                    j = j[0];
            } else
                if (isFunction(j)) {
                    j = j.call(t);
                    if (!j) return t;
            }

            var c = j.__childs, cl = j.__class;

            if (cl) {
                t.__class = cl;
                delete j.__class;
            }
            if (c) {
                delete j.__childs;
            }

            if (isArray(j)) { c = j; j = 0; }

            mergeObj(t, j);

            if (cl) j.__class = cl;
            if (c) j.__childs = c;

            if (isObject(c)) {
                for (var i in c) {
                    if (soft && t[i]) {
                        t[i].__init(c[i], soft);
                    }
                    else if (soft != 2) {
                        t.__addChildBox(c[i], i);
                    }
                }
            } else if (isArray(c)) {
                for (var i = 0; i < c.length; i++) {
                    if (soft && t.__childs[i]) {
                        t.__childs[i].__init(c[i], soft);
                    }
                    else if (soft != 2) {
                        t.__addChildBox(c[i]);
                    }
                }
            }
        }
        return t;
    },

    __clone: function () {
        var c = new Node(), v;
        for (var i = 0; i < NodeCloneProperties.length; i++) {
            v = this[NodeCloneProperties[i]];
            if (v !== undefined)
                c[NodeCloneProperties[i]] = v;
        }
        this.__eachChild(function (cc) {
            if (cc.__validToSave) {
                c.add(cc.__clone());
            }
        });
        return c;
    },

    __removeClass: function (c) {
        if (c && this.__hasClass(c)) {
            removeFromArray(c, this.____classes);
            this.__classes = this.____classes;
        }
    },

    __addClass: function (c) {
        if (c) {
            if (!this.____classes) { this.__classes = [c]; } else
                if (this.____classes.indexOf(c) < 0) {
                    this.____classes.push(c);
                    this.__classes = this.____classes;
                }
        }
    },

    __toggleClass: function (c) {
        if (c) {
            if (this.__hasClass(c)) this.__removeClass(c); else this.__addClass(c);
        }
    },

    __hasClass: function (c) {
        return this.____classes && this.____classes.indexOf(c) >= 0;
    },

    __screenPosition: function () {
        return this.__getUIWorldPosition().__multiplyScalar(layoutsResolutionMult).add(__realScreenCenter);
    },

    __getUIWorldPosition: function () {
        var wp = this.__worldPosition, pm = this.__projectionMatrix;

        if (
            //debug
            (this.__root || 0).camera ||
            //undebug
            pm.__is3D) {
            wp = new Vector3(wp.x, wp.y, this.mw.e[14]).__applyMatrix4(pm).__toVector2().__multiply(__screenCenter);
        } else {
            wp = wp.clone();
        }
        return wp;
    },

    __getScreenBoundingBox: function (needMirror) {
        var bb = this.__getUIWorldBoundingBox(needMirror ? -1 : 1);
        bb[0].__multiplyScalar(layoutsResolutionMult).add(__realScreenCenter);
        bb[1].__multiplyScalar(layoutsResolutionMult).add(__realScreenCenter);
        if (needMirror) {
            bb[0].y = __realScreenSize.y - bb[0].y;
            bb[1].y = __realScreenSize.y - bb[1].y;
        }
        return bb;
    },

    __getUIWorldBoundingBox: function (ymult) {
        var wp = this.__worldPosition, sz = this.__size, pm = this.__projectionMatrix;
        ymult = ymult || 1;
        sz.__multiply(this.__getWorldScale());
        sz.x = abs(sz.x / 2);
        sz.y = abs(sz.y / 2);
        if (
            //debug
            (this.__root || 0).camera ||
            //undebug
            pm.__is3D) {
            return [
                new Vector3(wp.x - sz.x, wp.y * ymult - sz.y, this.mw.e[14]).__applyMatrix4(pm).__toVector2().__multiply(__screenCenter),
                new Vector3(wp.x + sz.x, wp.y * ymult + sz.y, this.mw.e[14]).__applyMatrix4(pm).__toVector2().__multiply(__screenCenter)
            ]
        } else {
            return [
                new Vector2(wp.x - sz.x, wp.y * ymult - sz.y),
                new Vector2(wp.x + sz.x, wp.y * ymult + sz.y)
            ]
        }
    },

    __getUIWorldScale: function () {
        var w = this.__getUIWorldBoundingBox()
            , sz = this.__size
            , dx = w[1].x - w[0].x
            , dy = w[1].y - w[0].y;
        return new Vector2(dx / sz.x, dy / sz.y);
    },

    __getUIWorldTransformations: function () {
        //returns [ world position, world scale ] with using projectionMatrix
        var w = this.__getUIWorldBoundingBox()
            , sz = this.__size
            , dx = w[1].x - w[0].x
            , dy = w[1].y - w[0].y;
        return [new Vector2((w[1].x + w[0].x) / 2, (w[1].y + w[0].y) / 2), new Vector2(dx / sz.x, dy / sz.y)];
    },

    __updateGeometry: function (forcesz) {
        return this.__updateVertices(forcesz).__updateUVS();
    },

    __removeAttributeBuffer: function (name) {
        var t = this;
        if (t.__buffers) {
            var b = t.__buffers[name];
            if (b) {
                if (!b.__notDestruct)
                    b.__destruct();
                delete t.__buffers[name];
            }
        }
        return t;
    },

    __addAttributeBuffer: function (name, itemSize, data) {
        var t = this;
        if (!t.__buffers) t.__buffers = {};
        var b = new MyBufferAttribute(name, Float32Array, itemSize, GL_ARRAY_BUFFER, data);
        t.__buffers[name] = b;
        return b;
    },

    __updateVertices: function (forcesz, dontTouchGeomSz) {

        // TODO: flags to need verts update

        var t = this
            , x = 0, y = 0, cx1 = 0, cx2 = 0, cy1 = 0, cy2 = 0
            , parentSize
            , margin = t.____sizeMargin
            , imgSize = t.__imgSize
            , size
            , corner = t.____corner || 0

        if (t.__selfImgSize && !imgSize && corner) {
            imgSize = new Vector2(corner[0] * 2, corner[1] * 2);
        }

        if (forcesz) {
            size = forcesz;
        }
        else if (t.____size) {
            if (!parentSize) {
                parentSize = t.parent ? t.parent.__contentSize : __screenSize;
            }
            size = t.__adjustSmartSize(t.____size, parentSize); 
        } else if (imgSize) {
            size = imgSize.clone();
        }

        if (!size) { // wtf?
            return t;
        }

        if (margin) {
            size.x -= margin[1] + margin[3];
            size.y -= margin[0] + margin[2];
        }

        if (t.____maxsize) {
            if (!parentSize) parentSize = t.parent ? t.parent.__contentSize : __screenSize;
            size.min(t.__adjustSmartSize(t.____maxsize, parentSize));
        }

        if (t.____minsize) {
            if (!parentSize) parentSize = t.parent ? t.parent.__contentSize : __screenSize;
            size.max(t.__adjustSmartSize(t.____minsize, parentSize));
        }

        x = size.x / 2;
        y = size.y / 2;

        var type = 0;

        if (imgSize) {

            if (t.____maxImageSize) {

                if (!parentSize)
                    parentSize = t.parent ? t.parent.__contentSize : __screenSize;

                var maxImageSize = t.__adjustSmartSize(t.____maxImageSize, parentSize)
                    , maxsizex = maxImageSize.x / imgSize.x
                    , maxsizey = maxImageSize.y / imgSize.y
                    , s = mmin(maxsizex, maxsizey);

                if (s < 1) {
                    if (t.__useMaxSizeForScale) {
                        t.__scaleF = s;
                        s = 1;
                    }

                    x = s * imgSize.x / 2;
                    y = s * imgSize.y / 2;

                }
            }

            if (t.____centerFill) {
                if (imgSize) {
                    var scx = corner[2] || 1
                        , scy = corner[3] || scx;
                    type = 1;
                    cx1 = cx2 = imgSize.x / 2 * scx;
                    cy1 = cy2 = -imgSize.y / 2 * scy;
                    y = -y;
                }
            } else
                if (corner) {
                    type = 1;

                    var k = 1
                        , cx = corner[0] || 0
                        , cy = corner[1] || 0
                        , scx = corner[2] || 1
                        , scy = corner[3] || scx
                        , isz = imgSize || { x: 2 * x, y: 2 * y };


                    if (cx >= 0) {
                        k = mmin(1, 2 * x / isz.x) * scx;
                        cx1 = x - cx * k;
                        cx2 = x - (isz.x - cx) * k;
                    } else {
                        cx1 = mmax(0, x + cx * scx);
                        cx2 = cx1;
                    }

                    if (cy >= 0) {
                        k = mmin(1, 2 * y / isz.y) * scy;
                        cy1 = y - cy * k;
                        cy2 = y - (isz.y - cy) * k;
                    } else {
                        cy1 = mmax(0, y + cy * scy);
                        cy2 = cy1;
                    }

                }
        }

        if (!t.__verticesBuffer) {
            t.__verticesBuffer = t.__addAttributeBuffer(t.__verticesBufferName || 'position', 2);
        }

        if (!type) {

            t.__verticesBuffer.__getArrayOfSize(8, 1).set([-x, y, x, y, -x, -y, x, -y]);
            t.__indecesBuffer = defaultIndecesBuffer1;

        } else {

            t.__verticesBuffer.__getArrayOfSize(32, 1).set(
                [-x, y,
                -cx1, y,
                    cx2, y,
                    x, y,
                -x, cy1,
                -cx1, cy1,
                    cx2, cy1,
                    x, cy1,
                -x, -cy2,
                -cx1, -cy2,
                    cx2, -cy2,
                    x, -cy2,
                -x, -y,
                -cx1, -y,
                    cx2, -y,
                    x, -y]);

            t.__indecesBuffer = defaultIndecesBuffer2;
        }

        if (!t.__geomSize) {
            t.__geomSize = new Vector2(size.x, size.y);
        }
        else {
            if (!dontTouchGeomSz) {
                var gsz = t.__geomSize;
                if ((gsz.x != size.x) || (gsz.y != size.y)) {
                    gsz.set(size.x, size.y);
                    t.__dirty = 3;
                }
            }
        }

        if (t.__transformAnchor) {
            t.__geometryOffset = new Vector2(-t.__geomSize.x * t.____anchor.x, -t.__geomSize.y * t.____anchor.y);

        } else {
            //             t.__geometryOffset = 0;
        }

        if (t.__geometryOffset) {
            for (var i = 0, l = type ? 32 : 8; i < l; i += 2) {
                t.__verticesBuffer.__array[i] += t.__geometryOffset.x;
                t.__verticesBuffer.__array[i + 1] += t.__geometryOffset.y;
            }
        }

        return t;

    },

    __updateUVS: function () {

        var t = this, map = t.map;

        if (t.__selfImgSize && !map && t.____corner) {
            map = genMap(t.____corner[0] * 2, t.____corner[1] * 2);
        }

        if (map) {
            var image = map.__image;

            if (image) {

                var type = (t.____corner || t.____centerFill)
                    , imgSize = t.__imgSize || map.s || { x: 2048, y: 2048 }
                    , x1 = 0
                    , x2 = 1
                    , y1 = 1
                    , y2 = 0
                    , frame = t.__frame || map.f
                    , fitx = t.____fitImgX
                    , fity = t.____fitImgY
                    , hasFit = isNumeric(fitx) || isNumeric(fity)
                    , sz = t.__geomSize || t.__layoutSize
                    , szy = abs(sz.y)
                    , szx = abs(sz.x)
                    , kx = szx / imgSize.x
                    , ky = szy / imgSize.y;

                map.__setWrapS(t.__imgRepeatX);
                map.__setWrapT(t.__imgRepeatY);

                if (frame) {

                    if (!hasFit && !type && frame.__uvsBuffers[t.____uvsTransform]) {
                        if (t.__uvsBuffer != frame.__uvsBuffers[t.____uvsTransform]) {
                            t.__removeAttributeBuffer('uv');
                            t.__uvsBuffer = frame.__uvsBuffers[t.____uvsTransform];
                        }
                        return this;
                    }

                    x1 = frame.v[0];
                    x2 = frame.v[1];
                    y1 = frame.v[2];
                    y2 = frame.v[3];
                }


                if (hasFit) {

                    if (!fity && fitx && kx > ky) {

                        if (frame && frame.R) {
                            var k = fitx / 2 * (1 - ky / kx) * (x1 - x2);
                            x1 -= k;
                            x2 += k;
                        } else {
                            var k = fitx / 2 * (1 - ky / kx) * (y1 - y2);
                            y1 -= k;
                            y2 += k;
                        }

                    }

                    if (!fitx && fity && ky > kx) {
                        if (frame && frame.R) {
                            var k = fity / 2 * (1 - kx / ky) * (y1 - y2);
                            y1 -= k;
                            y2 += k;
                        }
                        else {
                            var k = fity / 2 * (1 - kx / ky) * (x1 - x2);
                            x1 -= k;
                            x2 += k;
                        }
                    }
                    
                
                    if (fitx && (!t.____size || !t.____size.py)) szy = mmin(szy, fitx * kx * imgSize.y);
                    if (fity && (!t.____size || !t.____size.px)) szx = mmin(szx, fity * ky * imgSize.x);
                    t.__updateVertices(new Vector2(szx, szy), 1);

                }

                t.__removeAttributeBuffer('uv');

                if (type) {

                    var sx = image.width
                        , sy = image.height
                        , scld = image.__scaled ? image.__scaled : 0.5
                        , halfpixel_x = scld / sx
                        , halfpixel_y = scld / sy
                        , sgnx = 0
                        , sgny = 0
                        , xm = 0
                        , ym = 0;


                    x1 += halfpixel_x;
                    x2 -= halfpixel_x;

                    if (t.____centerFill)
                        y1 -= halfpixel_y;

                    y2 += halfpixel_y;

                    if (frame) {

                        if (frame.R) {

                            switch (t.____uvsTransform) {
                                case 2: var tmp = x1; x1 = x2; x2 = tmp; break; // mirrored x
                                case 1: var tmp = y1; y1 = y2; y2 = tmp; break; // mirrored y
                            }

                            if (t.____corner) {
                                sgny = sign(t.____corner[0] || 0);
                                sgnx = sign(t.____corner[1] || 0);
                                ym = abs((t.____corner[0] || 0) / imgSize.x);
                                xm = abs((t.____corner[1] || 0) / imgSize.y);
                            }

                            var mx0 = x2, mx1 = x2 + xm * (x1 - x2), mx2 = mx1, mx3 = sgnx < 0 ? x2 : x1,
                                my0 = y1, my1 = y1 + ym * (y2 - y1), my2 = my1, my3 = sgny < 0 ? y1 : y2;

                            if (t.____centerFill) {
                                var tmp = mx0;
                                mx0 = mx3;
                                mx3 = tmp;
                                mx2 = mx1;
                                mx1 = x1;
                                my2 = y2;
                            }

                            t.__uvsBuffer = t.__addAttributeBuffer(t.__uvsBufferName || 'uv', 2, [
                                mx0, my0, mx0, my1, mx0, my2, mx0, my3,
                                mx1, my0, mx1, my1, mx1, my2, mx1, my3,
                                mx2, my0, mx2, my1, mx2, my2, mx2, my3,
                                mx3, my0, mx3, my1, mx3, my2, mx3, my3]);

                        }
                        else {


                            switch (t.____uvsTransform) {
                                case 1: var tmp = x1; x1 = x2; x2 = tmp; break; // mirrored x
                                case 2: var tmp = y1; y1 = y2; y2 = tmp; break; // mirrored y
                            }

                            if (t.____corner) {
                                sgnx = sign(t.____corner[0] || 0);
                                sgny = sign(t.____corner[1] || 0);
                                xm = abs((t.____corner[0] || 0) / imgSize.x);
                                ym = abs((t.____corner[1] || 0) / imgSize.y);
                            }

                            var mx0 = x1, mx1 = x1 + xm * (x2 - x1), mx2 = mx1, mx3 = sgnx < 0 ? x1 : x2,
                                my0 = y1, my1 = y1 + ym * (y2 - y1), my2 = my1, my3 = sgny < 0 ? y1 : y2;

                            if (t.____centerFill) {
                                mx2 = x2;

                                my0 = my3;
                                my2 = my1;
                                my1 = y2;
                                my3 = y1;

                            }

                            t.__uvsBuffer = t.__addAttributeBuffer(t.__uvsBufferName || 'uv', 2, [
                                mx0, my0, mx1, my0, mx2, my0, mx3, my0,
                                mx0, my1, mx1, my1, mx2, my1, mx3, my1,
                                mx0, my2, mx1, my2, mx2, my2, mx3, my2,
                                mx0, my3, mx1, my3, mx2, my3, mx3, my3]);
                        }
                    }

                }
                else {
  
                    var getVertsArray = function () {
                        return getFrameUv(x1, x2, y1, y2, frame && frame.R, t.____uvsTransform)
                    };

                    if (hasFit) {
                        t.__uvsBuffer = t.__addAttributeBuffer(t.__uvsBufferName || 'uv', 2, getVertsArray());
                    }
                    else if (frame && !frame.__isSimpleImage) {

                        if (t.__uvsBufferName && t.__uvsBufferName != 'uv') {
                            t.__uvsBuffer = t.__addAttributeBuffer(t.__uvsBufferName, 2, getVertsArray());
                        } else {
                            var framebuf = frame.__uvsBuffers[t.____uvsTransform];
                            if (!framebuf) {
                                framebuf = frame.__uvsBuffers[t.____uvsTransform] = new MyBufferAttribute('uv', Float32Array, 2, GL_ARRAY_BUFFER, getVertsArray(), 1);
                            }
                            t.__uvsBuffer = framebuf;
                        }

                    } else {

                        // simple img
                        if (t.__uvsBufferName && t.__uvsBufferName != 'uv') {
                            t.__uvsBuffer = t.__addAttributeBuffer(t.__uvsBufferName, 2, getVertsArray());
                        } else if (t.____uvsTransform) {
                            t.__uvsBuffer = t.__addAttributeBuffer('uv', 2, getVertsArray());
                        } else {
                            t.__uvsBuffer = defaultUVSBuffer; // TODO: ____uvsTransform ?
                        }
                    }
                }

            }

        } else {
            t.__uvsBuffer = defaultUVSBuffer;
        }

        return this;

    },

    __render() {
        var t = this;

        if (t.parent) { t.__opacityDeep = t.__alphaDeep * t.parent.__opacityDeep; }
        //debug
        if (t.__needClassUpdate) {
            consoleLog('class update');
            t.__classes = t.__classes;
            t.__needClassUpdate = 0;
        }
        //undebug

        if (t.__checkAppear && (t.__lastRenderTime < TIME_NOW - 0.2)) {
            resortEventsObjects();
        }

        if (t.__particleEffect) {
            t.__particleEffect.__update();
        }

        t.__lastRenderTime = TIME_NOW;

        if (t.__indecesBuffer) {

            if (t.map || t.____shader) {

                //cheats
                renderInfo.nodesRendered++;
                //endcheats
                renderer.__draw(t, t.__verticesCount || t.__indecesBuffer.__realsize);

            }
        }

        return 1;
    },


    update: function (deep, updatusObject) {

        var t = this;

        //debug
        if (t.__debugUpdate)
            debugger;
        //undebug

        //cheats
        renderInfo.nodesUpdated++;
        //endcheats

        if (!t.__visible) return t;

        //cheats
        renderInfo.nodesRealUpdated++;

        if (deep) {
            renderInfo.nodesUpdatedDeep++;
        }
        //endcheats

        //         if (t.__inUpdate) return t;
        //         t.__inUpdate = 1; 
        if (t.__disableAlign) {
            t.__updateGeometry()
        } else {

            deep = deep || t.__needUpdateDeep;

            if (deep) {
                delete t.__autoWidthBatch;
                delete t.__autoHeightBatch;
            }

            t.__sizeWithFirstAndLastChild = 0;
            updatusObject = updatusObject || 0;
            var parent = t.parent
                , realParentSize = parent ? parent.__size : __screenSize
                , parentPadding = parent ? parent.__padding || [0, 0, 0, 0] : [0, 0, 0, 0]
                , size = t.__updateGeometry().__size
                , sva = t.____sva
                , sha = t.____sha
                , va = sva == undefined ? parent ? parent.____va : ALIGN_CENTER : sva
                , ha = sha == undefined ? parent ? parent.____ha : ALIGN_CENTER : sha
                , margin = t.____sizeMargin || [0, 0, 0, 0]
                , offsetByParent = t.__offsetByParent
                , spacing = t.____spacing || [0, 0, 0, 0]
                , updatusObjectTable = updatusObject.__table || 0;

            switch (ha) {

                case ALIGN_FROM_START_TO_END:

                    if (updatusObject) {
                        var sx = (updatusObject.sx ? spacing[1] : 0);
                        var addedx = updatusObjectTable.__columnWidth || (size.x + margin[1] + margin[3] + spacing[3] + sx);

                        offsetByParent.x = updatusObject.x + (size.x - realParentSize.x) / 2 + parentPadding[1] + margin[1] + sx;
                        updatusObject.sx = 1;

                        if (updatusObjectTable) {

                            if (updatusObjectTable.__rows) {
                                var row = updatusObjectTable.r;
                                updatusObjectTable.x[row] = (updatusObjectTable.x[row] || 0) + addedx;
                                // row = updatusObjectTable.r = (updatusObjectTable.r+1) % updatusObjectTable.__rows;
                                updatusObject.x = updatusObjectTable.x[(row + 1) % updatusObjectTable.__rows] || 0;
                                break;
                            }

                            if (updatusObjectTable.__columns) {
                                if (updatusObjectTable.c >= updatusObjectTable.__columns - 1) {
                                    updatusObject.x = 0;
                                } else {
                                    updatusObject.x += addedx;
                                }
                                break;
                            }
                        }

                        updatusObject.x += addedx;
                    }

                    break;

                case ALIGN_START:
                    offsetByParent.x = (size.x - realParentSize.x) / 2 + parentPadding[1] + margin[1];
                    break;

                case ALIGN_FROM_END_TO_START:

                    if (updatusObject) {
                        var sx = (updatusObject.sx ? spacing[3] : 0);
                        var addedx = updatusObjectTable.__columnWidth || (size.x + margin[1] + margin[3] + spacing[1] + sx);

                        offsetByParent.x = updatusObject.x - (size.x - realParentSize.x) / 2 - parentPadding[3] - margin[3] - sx;
                        updatusObject.sx = 1;

                        if (updatusObjectTable) {

                            if (updatusObjectTable.__rows) {
                                var row = updatusObjectTable.r;
                                updatusObjectTable.x[row] = (updatusObjectTable.x[row] || 0) - addedx;
                                // row = updatusObjectTable.r = (updatusObjectTable.r+1) % updatusObjectTable.__rows;
                                updatusObject.x = updatusObjectTable.x[(row + 1) % updatusObjectTable.__rows] || 0;
                                break;
                            }

                            if (updatusObjectTable.__columns) {
                                if (updatusObjectTable.c >= updatusObjectTable.__columns - 1) {
                                    updatusObject.x = 0;
                                } else {
                                    updatusObject.x -= addedx;
                                }
                                break;
                            }
                        }

                        updatusObject.x -= addedx;
                    }

                    break;


                case ALIGN_END:
                    offsetByParent.x = -(size.x - realParentSize.x) / 2 - parentPadding[3] - margin[3];
                    break;

                default:
                case ALIGN_CENTER:
                    offsetByParent.x = (parentPadding[1] + margin[1] - parentPadding[3] - margin[3]) / 2;
                    break;

            }

            switch (va) {
                case ALIGN_FROM_START_TO_END:

                    if (updatusObject) {
                        var sy = (updatusObject.sy ? spacing[0] : 0);
                        var addedy = updatusObjectTable.__rowHeight || (size.y + margin[0] + margin[2] + spacing[2] + sy);

                        offsetByParent.y = updatusObject.y - (size.y - realParentSize.y) / 2 - parentPadding[0] - margin[0] - sy;
                        updatusObject.sy = 1;

                        if (updatusObjectTable) {

                            if (updatusObjectTable.__rows) {

                                if (updatusObjectTable.r >= updatusObjectTable.__rows - 1) {
                                    updatusObject.y = 0;
                                    updatusObjectTable.r = 0;
                                } else {
                                    updatusObject.y -= addedy;
                                    updatusObjectTable.r++;
                                }

                                break;
                            }

                            if (updatusObjectTable.__columns) {

                                var column = updatusObjectTable.c;
                                updatusObjectTable.y[column] = (updatusObjectTable.y[column] || 0) - addedy;
                                column = updatusObjectTable.c = (updatusObjectTable.c + 1) % updatusObjectTable.__columns;
                                updatusObject.y = updatusObjectTable.y[column] || 0;

                                break;
                            }

                        }

                        updatusObject.y -= addedy;

                    }
                    break;

                case ALIGN_START:
                    offsetByParent.y = -(size.y - realParentSize.y) / 2 - parentPadding[0] - margin[0];
                    break;

                case ALIGN_FROM_END_TO_START:

                    if (updatusObject) {
                        var sy = (updatusObject.sy ? spacing[2] : 0);
                        var addedy = updatusObjectTable.__rowHeight || (size.y + margin[2] + margin[0] + spacing[0] + sy);

                        offsetByParent.y = updatusObject.y + (size.y - realParentSize.y) / 2 + parentPadding[2] + margin[2] + sy;
                        updatusObject.sy = 1;

                        if (updatusObjectTable) {

                            if (updatusObjectTable.__rows) {
                                if (updatusObjectTable.r >= updatusObjectTable.__rows - 1) {
                                    updatusObject.y = 0;
                                    updatusObjectTable.r = 0;
                                } else {
                                    updatusObject.y += addedy;
                                    updatusObjectTable.r++;
                                }
                                break;
                            }

                            if (updatusObjectTable.__columns) {
                                var column = updatusObjectTable.c;
                                updatusObjectTable.y[column] = (updatusObjectTable.y[column] || 0) + addedy;
                                column = updatusObjectTable.c = (updatusObjectTable.c + 1) % updatusObjectTable.__columns;
                                updatusObject.y = updatusObjectTable.y[column] || 0;
                                break;
                            }

                        }

                        updatusObject.y += addedy;

                    }
                    break;

                case ALIGN_END:
                    offsetByParent.y = (size.y - realParentSize.y) / 2 + parentPadding[2] + margin[2];
                    break;

                default:
                case ALIGN_CENTER:
                    offsetByParent.y = (- parentPadding[0] - margin[0] + parentPadding[2] + margin[2]) / 2;
                    break;
            }

        }



        if (t.__transformAnchor) {

            var go = t.__geometryOffset || defaultZeroVector2;
            var pgo = parent ? parent.__geometryOffset || defaultZeroVector2 : defaultZeroVector2;
            offsetByParent.sub(go).add(pgo);

        }


        //debug
        var f = t.__frame;

        if (f && f.of && f.or) {

            switch (ha) {

                case ALIGN_FROM_START_TO_END:
                case ALIGN_START:
                    offsetByParent.x += f.of[0] /*+ f.or[0] - t.__imgSize.x*/;
                    break;

                case ALIGN_FROM_END_TO_START:
                case ALIGN_END:
                    offsetByParent.x += f.of[0] - f.or[0] + t.__imgSize.x;
                    break;

                default:
                case ALIGN_CENTER:
                    offsetByParent.x += f.of[0] + (-f.or[0] + t.__imgSize.x) / 2;
                    break;

            }

            switch (va) {
                case ALIGN_FROM_START_TO_END:
                case ALIGN_START:
                    offsetByParent.y -= f.of[1];
                    break;

                case ALIGN_FROM_END_TO_START:
                case ALIGN_END:
                    offsetByParent.y -= f.of[1] - f.or[1] + t.__imgSize.y;
                    break;

                default:
                case ALIGN_CENTER:
                    offsetByParent.y -= f.of[1] + (- f.or[1] + t.__imgSize.y) / 2;
                    break;
            }

        }
        //undebug

        var scrollVector = t.__scrollVector, child;

        t.__dirty = 0;

        if (deep) {
            var sz = (t.____size || 0);
            var newUpdatusObject = { x: 0, y: 0, sx: sz.px == 'o', sy: sz.py == 'o' };
            if (t.____va > 2 || t.____ha > 2) {
                if (t.__tableAlignRows || t.__tableAlignColumns || t.__tableAlignColumnWidth || t.__tableAlignRowHeight) {
                    newUpdatusObject.__table = {
                        x: [], y: [],
                        r: 0, c: 0,
                        __rows: mmax(0, t.__tableAlignRows),
                        __columns: mmax(0, t.__tableAlignColumns),
                        __rowHeight: t.__tableAlignRowHeight,
                        __columnWidth: t.__tableAlignColumnWidth
                    }
                }
            }

            if (!scrollVector) scrollVector = t.__parentScrollVector;
            var sciss = t.__selfScissor || t.__parentSciss;

            for (var i = 0; i < t.__childs.length; i++) {
                child = t.__childs[i];
                if (child.update) {
                    child.__index = i;
                    child.__parentScrollVector = scrollVector;
                    child.__parentSciss = sciss;
                    child.update(1, newUpdatusObject);
                }
            }
        }

        t.__matrixNeedsUpdate = 1;

        return t;
    },


    __hitTest: function (pos) {

        //         return;

        // if (__window.__onTapHitTestDebug) {
        //     consoleLog(this.__fullname);
        // }

        //debug
        if (__window.__onTapHitTestDebug && this.__debugHitTest)
            debugger;
        //undebug

        var t = this, pm = t.__projectionMatrix;
        if (!t.__viewable || t.__disabled || !t.__visibleForTap() || !pm)
            return false;

        var ipm = pm.im;
        var pe = t.__parentScrollVector;

        if (!ipm) {
            ipm = pm.im = pm.__getInverseMatrix();
        }


        // переворот камеры по y
        if (!pm.__isScrollMatrix)
            ipm.e[13] *= -1;

        var poswp, mw = t.__matrixWorld, te = mw.e, htc = pm.htc || {}, pid = pos.t;
        if (!pid || (pid != htc.t)) {
            htc.t = randomInt(0, 0xffffff);
            pos.t = htc.t;
            htc.p = 0;
        }

        var intersect;

        if (pm.__is3D) {

            var a = htc.a, b = htc.b, d = htc.d, p = htc.p || new Vector3(pos.x / layoutsResolutionMult / __screenCenter.x - 1, 1 - pos.y / layoutsResolutionMult / __screenCenter.y, 0);

            if (!a) {
                a = htc.a = new Vector4(p.x, p.y, 0, 1).__applyMatrix4(ipm);
                b = htc.b = new Vector4(p.x, p.y, 1, 1).__applyMatrix4(ipm);
                a.__divideScalar(a.w);
                b.__divideScalar(b.w);
                d = htc.d = a.clone().sub(b).normalize();
                htc.p = p;
            }

            var plain = plainForm(new Vector3(0, 0, 0).__applyMatrix4(mw), new Vector3(1, 0, 0).__applyMatrix4(mw), new Vector3(0, 1, 0).__applyMatrix4(mw))
                , l = -(plain.x * a.x + plain.y * a.y + plain.z * a.z + plain.w) / (plain.x * d.x + plain.y * d.y + plain.z * d.z);

            poswp = new Vector3(a.x + d.x * l, -(a.y + d.y * l), a.z + d.z * l);

        }
        else {
            if (!htc.p) {
                htc.p = new Vector3(pos.x / layoutsResolutionMult / __screenCenter.x - 1, pos.y / layoutsResolutionMult / __screenCenter.y - 1, 0).__applyMatrix4(ipm);
                htc.p.x += pe.x;
                htc.p.y += pe.y;
                // consoleLog(floor(htc.p.x), floor(htc.p.y));
            }
            poswp = htc.p.clone();
            intersect = 1;
        }

        // переворот камеры по y обратно
        if (!pm.__isScrollMatrix)
            ipm.e[13] *= -1;

        pm.htc = htc;

        var wp = t.__worldPosition
            , o = t.__geometryOffset;

        var dx = wp.x - poswp.x, dy = wp.y - poswp.y;
        var s = t.__size, dsx = abs(s.x) / 2, dsy = abs(s.y) / 2;
        if (intersect) {
            if (o) {
                dx += o.x * te[0];
                dy -= o.y * te[5];
            }
            var mta = mmax(mmin(dsx, dsy), (t.__minimalTapArea || options.__minimalTapArea) * layoutsResolutionMult);
            intersect = dx * dx + dy * dy < mta * mta;
        }

        if (!intersect) {

            if (te[0] != 1 || te[5] != 1 || te[6]) {
                var im = mw.im;
                if (!im) {
                    im = mw.im = mw.__getInverseMatrix();
                }
                var pwp = poswp.clone();
                pwp.y *= -1;
                pwp.__applyMatrix4(im);
                intersect = o ? pwp.x > -dsx + o.x && pwp.x < dsx + o.x && pwp.y > -dsy + o.y && pwp.y < dsy + o.y
                    : pwp.x > -dsx && pwp.x < dsx && pwp.y > -dsy && pwp.y < dsy;
            }
            else {
                // no transforms, simple quad test
                intersect = abs(dx) < dsx && abs(dy) < dsy;

            }

        }

        if (intersect) {
            // parent scissor test
            return t.__isInParentScissor(poswp.x, poswp.y);
        }

    },

    __isInParentScissor: function (x, y, sz) {

        var t = this;
        if (sz) {
            if (t.__parentSciss) {
                var sciss = t.__parentSciss,
                    p = t.__parentSciss.__node,
                    sy = p.__selfScissorY;

                return x + sz.x / 2 > sciss.x &&
                    x - sz.x / 2 < sciss.x + sciss.z &&
                    y + sz.y / 2 > sy &&
                    y - sz.y / 2 < sy + sciss.w;

            }

            return x + sz.x / 2 > -__screenCenter.x &&
                x - sz.x / 2 < __screenCenter.x &&
                y + sz.y / 2 > -__screenCenter.y &&
                y - sz.y / 2 < __screenCenter.y;

        } else {

            if (t.__parentSciss) {
                var sciss = t.__parentSciss,
                    p = t.__parentSciss.__node,
                    sy = p.__selfScissorY;

                return x > sciss.x &&
                    x < sciss.x + sciss.z &&
                    y > sy &&
                    y < sy + sciss.w;

            }

            //WARNING: когда используется для hitTest это верно
            // не для hitTest нужно выражение ниже, но там везде передается sz
            return 1;

            /* x > -__screenCenter.x &&
                    x <  __screenCenter.x &&
                    y > -__screenCenter.y &&
                    y <  __screenCenter.y; */


        }

    },

    __onTextureLoaded: function (tex) {
        if ((this.__img == tex.__src) || (tex.__src && tex.__src.indexOf('_b64i_') == 0)) {
            //debug
            var tmpClass = __propertiesAppliedByClass;
            if (this.__imgPropertiesAppliedByClass) {
                __propertiesAppliedByClass = this.__imgPropertiesAppliedByClass;
            }

            //undebug
            this.__img = tex.__src;
            //debug
            delete this.__imgPropertiesAppliedByClass;
            __propertiesAppliedByClass = tmpClass;
            //undebug
        }
    },

    __onScreen: function () {
        var t = this;
        return t.__viewable && t.__isInParentScissor(t.__worldPosition.x, t.__worldPosition.y, t.__size) && t.__deepVisible();
    },

    __destruct: function () {
        var t = this;
        //debug
        t.__unselect();
        //undebug
        for (var i in t.__buffers) {
            t.__buffers[i].__destruct();
        }

        delete t.__buffers;

        t.__killAllAnimations();

        t.__onKey = t.__onTap = t.__drag = 0;
        t.__effect = t.__dragonBones = t.__spine = t.__cubism = t.__shadow = t.__lottie = undefined;

        //debug
        t.__wheel = t.__contextMenu = 0;
        //undebug

        if (t.__bufferTexture) {
            t.__bufferTexture.__destruct();
            delete t.__bufferTexture;
        }

        t.__verticesBuffer = t.__uvsBuffer = t.__colorsBuffer = t.__indecesBuffer = undefined;

        //cheats
        renderInfo.nodes--;
        //endcheats
        return Object3DPrototype.__destruct.call(t.__clearChildNodes());
    },


    __removeFromParent: function () {

        Object3DPrototype.__removeFromParent.call(this);
        this.__destruct();
    },

    __clearChildNodes: function () {
        var t = this;
        for (var i = 0; i < t.__childs.length; i++)
            t.__childs[i].__destruct();
        t.__childs = [];
        return t;
    },

    __applyDac: function (dacId) {
        var t = this, dac = (t.__dac || 0)[dacId];
        if (dac) {
            t.__init(dac);
        }
    },

    __finishAllAnimations: function () {
        finishAnim(this.__color);
        return Object3DPrototype.__finishAllAnimations.call(this);
    },

    __killAllAnimations: function () {
        killAnim(this.__color);
        delete this.____animatronix;
        return Object3DPrototype.__killAllAnimations.call(this);
    },

    __killKeyframesAnimations: function (properties) {
        var t = this;
        if (t.____keyframesAnimations) {
            if (isArray(properties) || isObject(properties)) {
                $each(properties, t.__killKeyframesAnimations.bind(t));
            } else
                if (isString(properties)) {
                    if (t.____keyframesAnimations[properties]) {
                        killAnim(t.____keyframesAnimations[properties]);
                        delete t.____keyframesAnimations[properties]
                    }
                } else {
                    $each(t.____keyframesAnimations, killAnim);
                    delete t.____keyframesAnimations;
                }
        }
        return t;
    },

    __animText: function (to, time, withscaling, withcolor, easing, delay, dontkill, from, force) {
        var t = this, txt = t.__text;
        if (time === 0) {
            t.__animatedText = to;
            return;
        }
        time = time || 1;
        easing = easing || 0;
        from = from || t.____animatedText;
        if (from != undefined && txt && (from != to || force)) {
            if (!dontkill) killAnim(t);
            var d = abs(from - to), mul = 1;
            while (d > 1) { d = d / 10; mul++; }
            t.____animTextAction = anim(t, { __animatedText: [from, to] }, time, 0, easing, delay);

            if (withscaling) {
                tween.__push(mergeObj(new TweenAction(t, {}, time, 0, easing, delay), {
                    __update: function (tm, dt) {
                        tm -= this.s + this.d;
                        if (tm > 0) {
                            var k = 2.0 * tm * (1 - tm) * sin(tm * PI2 * (2 + mul * 3));
                            t.____animatedTextBlocked = floor(11 * tm * (mul + 1)) % 2;
                            txt.__scaleF = 1 + k * k;
                            if (withcolor) {
                                txt.__selfColor.__multiplyScalar(1 + 10 * k * k);
                            }
                            if (tm > this.t) {
                                t.____animatedTextBlocked = 0;
                                txt.__scaleF = 1;
                                txt.__selfColor.__setRGB(1, 1, 1);
                                return 1;
                            }
                        }
                    }
                }));
            }
        } else {
            t.__animatedText = to;
        }
        return t;
    },
    /*
        __updateShadows : function(){
            var t = this, c = t.__childs;
            if (t.____shadow){
                t.____shadow.__update();
            }
            for (var i=0;i<c.length;i++) {
                if (c[i].__updateShadows)
                c[i].__updateShadows();
            }
            return t;
        },
        */

    __calculateAbsoluteWidth: function (parentWidth) {

        var t = this, sz = t.____size, w = 0;
        if (!sz || (sz.x == 0 && !sz.px && t.__geomSize)) {
            sz = t.__geomSize;
        }
        if (sz) {
            w = t.__adjustSmartVal(sz.x, sz.px, parentWidth);
            if (t.____maxsize) w = mmin(w, t.__adjustSmartVal(t.____maxsize.x, t.____maxsize.px, parentWidth, 0));
            if (t.____minsize) w = mmax(w, t.__adjustSmartVal(t.____minsize.x, t.____minsize.px, parentWidth, 0));
        }
        return w;

    },

    __calculateAbsoluteHeight: function (parentHeight) {

        var t = this, sz = t.____size, h = 0;
        if (!sz || (sz.y == 0 && !sz.py && t.__geomSize)) {
            sz = t.__geomSize;
        }
        if (sz) {
            h = t.__adjustSmartVal(sz.y, sz.py, parentHeight);
            if (t.____maxsize) h = mmin(h, t.__adjustSmartVal(t.____maxsize.y, t.____maxsize.py, parentHeight, 1));
            if (t.____minsize) h = mmax(h, t.__adjustSmartVal(t.____minsize.y, t.____minsize.py, parentHeight, 1));
        }
        return h;

    },

    __calculateAutoHeightFor: function (n, w, totalHeight) {

        var t = this;
        if (t.__autoHeightBatch) {
            if (t.__totalAutoHeightBatch == totalHeight) {
                if (n.__autoHeight != undefined) {
                    if (t.__autoHeightBatch.indexOf(n) >= 0) {
                        return n.__autoHeight;
                    }
                }
            }
        }

        t.__autoHeightBatch = [];
        t.__totalAutoHeightBatch = totalHeight;

        var availableHeight = totalHeight;
        var nodesWithAutoHeight = t.__autoHeightBatch;
        var totalAutoHeightParts = 0;

        for (var i = 0; i < t.__childs.length; i++) {
            var child = t.__childs[i];
            if (child.__notNormalNode || !child.____visible) continue;
            var sz = child.____size;
            if (!sz) {
                availableHeight -= child.__calculateAbsoluteHeight(totalHeight);
            } else
                if (sz.py == 'a') {
                    nodesWithAutoHeight.push(child);
                    child.__autoHeightPart = sz.y;
                    totalAutoHeightParts += child.__autoHeightPart;
                } else
                    if (sz.py != 's') {
                        availableHeight -= child.__calculateAbsoluteHeight(totalHeight);
                    }

        }

        availableHeight = mmax(0, availableHeight);

        var totalNodesWithAutoHeight = nodesWithAutoHeight.length;
        for (var i = 0; i < totalNodesWithAutoHeight; i++) {
            var node = nodesWithAutoHeight[i];
            node.__autoHeight = availableHeight * node.__autoHeightPart / totalAutoHeightParts;
            if (node.____maxsize) node.__autoHeight = mmin(node.__autoHeight, node.__adjustSmartVal(node.____maxsize.y, node.____maxsize.py, totalHeight, 1));
            if (node.____minsize) node.__autoHeight = mmax(node.__autoHeight, node.__adjustSmartVal(node.____minsize.y, node.____minsize.py, totalHeight, 1));
            availableHeight -= node.__autoHeight;
            totalAutoHeightParts -= node.__autoHeightPart;
        }

        this.__hasAutoChilds = 1;
        this.__availableHeight = availableHeight;
        return n.__autoHeight;
    },


    __calculateAutoWidthFor: function (n, w, totalWidth) {

        var t = this;
        if (t.__autoWidthBatch) {
            if (t.__totalAutoWidthBatch == totalWidth) {
                if (n.__autoWidth != undefined) {
                    if (t.__autoWidthBatch.indexOf(n) >= 0) {
                        return n.__autoWidth;
                    }
                }
            }
        }

        t.__autoWidthBatch = [];
        t.__totalAutoWidthBatch = totalWidth;

        var availableWidth = totalWidth;
        var nodesWithAutoWidth = t.__autoWidthBatch;
        var totalAutoWidthParts = 0;

        for (var i = 0; i < this.__childs.length; i++) {
            var child = this.__childs[i];
            if (child.__notNormalNode || !child.____visible) continue;

            var sz = child.____size;
            if (!sz) {
                availableWidth -= child.__calculateAbsoluteWidth(totalWidth);
            } else
                if (sz.px == 'a') {
                    nodesWithAutoWidth.push(child);
                    child.__autoWidthPart = sz.x;
                    totalAutoWidthParts += child.__autoWidthPart;
                } else
                    if (sz.px != 's') {
                        availableWidth -= child.__calculateAbsoluteWidth(totalWidth);
                    }
        }

        availableWidth = mmax(0, availableWidth);


        var totalNodesWithAutoWidth = nodesWithAutoWidth.length;

        for (var i = 0; i < totalNodesWithAutoWidth; i++) {
            var node = nodesWithAutoWidth[i];
            node.__autoWidth = availableWidth * node.__autoWidthPart / totalAutoWidthParts;
            if (node.____maxsize) node.__autoWidth = mmin(node.__autoWidth, node.__adjustSmartVal(node.____maxsize.x, node.____maxsize.px, totalWidth, 0));
            if (node.____minsize) node.__autoWidth = mmax(node.__autoWidth, node.__adjustSmartVal(node.____minsize.x, node.____minsize.px, totalWidth, 0));
            availableWidth -= node.__autoWidth;
            totalAutoWidthParts -= node.__autoWidthPart;
        }

        this.__hasAutoChilds = 1;
        this.__availableWidth = availableWidth;
        return n.__autoWidth;
    },

    __adjustSmartVal: function (val, pval, parentSizeVal, yflag) {

        if (val != undefined) {
            if (pval == undefined) {
                if (abs(val) <= 1) {
                    return parentSizeVal * val;
                }
            } else {
                if (pval == 'a') {
                    if (this.parent) {
                        return yflag ?
                            this.parent.__calculateAutoHeightFor(this, val, parentSizeVal) :
                            this.parent.__calculateAutoWidthFor(this, val, parentSizeVal);
                    }
                    else {
                        return parentSizeVal;
                    }
                } else
                    if (pval == 'o') {

                        if (yflag) {

                            var changed = 0, min = +Infinity, max = -Infinity, expander = function (node) {

                                if ((node.__notNormalNode && !node.__isText) || node == this || !node.__visible || !(node.____size ? (!node.____size.py || (node.____size.py == 'o')) : 1))
                                    return;


                                //                             if (node.__dirty) {
                                //                                 var u = node.update;
                                //                                 node.update = function(){};
                                //                                 u.call(node, node.__needUpdateDeep);
                                //                                 node.update = u;
                                //                             }

                                //                             if (node.__matrixWorldNeedsUpdate || node.__matrixNeedsUpdate)
                                //                                 node.__updateMatrixWorld(1);

                                var gsz = node.__geomSize;
                                if (gsz) {
                                    var y = node.__layoutPositionY;
                                    changed = 1;
                                    min = mmin(min, y - gsz.y / 2 - ((node.____spacing || 0)[0] || 0));
                                    max = mmax(max, y + gsz.y / 2 + ((node.____spacing || 0)[2] || 0));
                                    return 1;
                                }

                            }, __childs = this.__childs, l = __childs.length, l1 = l - 1;

                            if (l) {
                                for (var i = 0; i < l; i++) if (expander(__childs[i])) break;
                                for (var i = l - 1; i > 0; i--) if (expander(__childs[i])) break;
                            }

                            var p = this.____padding || [0, 0, 0, 0];

                            return changed ? abs(max - min + p[0] + p[2]) : val;

                        } else {

                            var changed = 0, min = +Infinity, max = -Infinity, expander = function (node) {

                                if ((node.__notNormalNode && !node.__isText) || node == this || !node.__visible || !(node.____size ? (!node.____size.px || (node.____size.px == 'o')) : 1))
                                    return;
                                /*
                                if (node.__dirty) {
                                    var u = node.update;
                                    node.update = function(){};
                                    u.call(node, node.__needUpdateDeep);
                                    node.update = u;
                                }                            */

                                //                             if (node.__matrixWorldNeedsUpdate || node.__matrixNeedsUpdate)
                                //                                 node.__updateMatrixWorld();

                                var gsz = node.__geomSize;
                                if (gsz) {
                                    var x = node.__layoutPositionX;
                                    changed = 1;
                                    min = mmin(min, x - gsz.x / 2 - ((node.____spacing || 0)[1] || 0));
                                    max = mmax(max, x + gsz.x / 2 - ((node.____spacing || 0)[3] || 0));
                                    return 1;
                                }

                            }, __childs = this.__childs, l = __childs.length, l1 = l - 1;

                            if (l) {
                                for (var i = 0; i < l; i++) if (expander(__childs[i])) break;
                                for (var i = l - 1; i > 0; i--) if (expander(__childs[i])) break;
                            }

                            var p = this.____padding || [0, 0, 0, 0];

                            return changed ? abs(max - min + p[1] + p[3]) : val;

                        }

                    }
                    else
                        if (pval == 's') {
                            var p = this.parent;
                            if (p) {
                                //TODO: bug MICROM-1481
                                var s = (yflag ? p.__availableHeight : p.__availableWidth);
                                return (s == undefined ? parentSizeVal : s) * val;
                            }
                        }
                        else {
                            if (pval != 0) {
                                return parentSizeVal * val;
                            }
                        }
            }

            return val;
        }

        return 0;

    },

    __adjustSmartSize: function (size, parentSize) {
        return new Vector2(
            this.__adjustSmartVal(size.x, size.px, parentSize.x, 0),
            this.__adjustSmartVal(size.y, size.py, parentSize.y, 1)
        );
    },

    __getScissor: function () {
        var t = this;
        if (t.__needScissor && t.__verticesBuffer) {
            // TODO: may be cache ?
            var wp = t.__worldPosition,
                arr = t.__verticesBuffer.__array,
                szx = -arr[0],
                szy = arr[1],
                xmult = t.mw.e[0],
                ymult = t.mw.e[5],
                width = (t.____cropx == undefined ? szx * 2 : t.____cropx) * xmult,
                height = (t.____cropy == undefined ? szy * 2 : t.____cropy) * ymult,
                x = width < 0 ? wp.x + width + szx * xmult : wp.x - szx * xmult,
                y = height < 0 ? wp.y - height - szy * ymult : wp.y + szy * ymult;

            t.__selfScissorY = wp.y - szy * ymult;

            if (t.__selfScissor) {
                t.__selfScissor.set(x, y, abs(width), abs(height));
            } else {
                t.__selfScissor = new Vector4(x, y, abs(width), abs(height));
                t.__selfScissor.__node = t;
                t.__dirty = 2;
            }

        } else {
            t.__selfScissor = 0;
        }

        return t.__selfScissor;
    },



    __getBoundingBox: function (onlyChilds, firstAndLastChildBounding, filter) {

        // slow function. don't use

        var t = this;

        if (!t.__visible)
            return { min: new Vector2(0, 0), max: new Vector2(0, 0) };

        var b = { min: new Vector2(+Infinity, +Infinity), max: new Vector2(-Infinity, -Infinity) };

        filter = filter || function (node) {
            return !(node.__notNormalNode || (onlyChilds && node == t))
        };

        var expander = function (node, iklmn) {

            if (!filter(node)) return;
            if (node.__matrixWorldNeedsUpdate || node.__matrixNeedsUpdate)
                node.__updateMatrixWorld();


            var gsz = node.__geomSize;
            if (gsz) {

                var wp = node.__worldPosition,
                    p1 = { x: wp.x - gsz.x / 2, y: wp.y - gsz.y / 2 },
                    p2 = { x: wp.x + gsz.x / 2, y: wp.y + gsz.y / 2 };

                b.min.min(p1);
                b.max.max(p2);
                return iklmn;
            }

        };

        if (t.__simpleBounding && !onlyChilds) {
            expander(this);
        }
        else {
            if (firstAndLastChildBounding) {
                var __childs = t.__childs, l = __childs.length;
                if (t.__dontUseChildsVisibilityForBoundingBox) {
                    for (var i = 0; i < l; i++) if (expander(__childs[i], 1)) break;
                    for (var i = l - 1; i > 0; i--) if (expander(__childs[i], 1)) break;
                } else {
                    for (var i = 0; i < l; i++) if (__childs[i].____visible && expander(__childs[i], 1)) break;
                    for (var i = l - 1; i > 0; i--) if (__childs[i].____visible && expander(__childs[i], 1)) break;
                }
            } else {
                t.__traverseVisible(expander);
            }
        }

        return b;
    },

    __autoUpdateMatrix: function () { ObjectDefineProperty(this, '__matrixNeedsUpdate', { get: function () { return 1 } }); },


    __getTextureProperty: function (property) { return this['m_' + property] || this['t_' + property]; },
    __setTextureProperty: function (property, filename) {
        var t = this;
        if (filename == undefined || isString(filename) || isNumeric(filename)) {
            t['t_' + property] = filename;
            filename = getFrameName(filename);
            if (filename) {
                var frame = globalConfigsData.__frames[filename];
                if (frame) // загружено из атласа или просто кэш картинок
                {
                    // TODO: normal fix multiply loading errors!
                    if (frame.__loading) {
                        _setTimeout(function () {
                            t.__setTextureProperty(property, filename);
                        }, 1);
                    }

                    var map = t['m_' + property] = frame.tex;
                    if (map) {
                        map.__setWrapS(t.__imgRepeatX);
                        map.__setWrapT(t.__imgRepeatY);
                    }

                } else {
                    //                     __window.__loadImageStack = 's';
                    loadImage(filename, function () { t.__setTextureProperty(property, filename) });
                }
            }
        }
    }

    , __setFrame: function (frame) {

        var t = this, map = frame.tex, image = map ? map.__image : 0;

        if (image) {
            t.map = map;
            t.__frame = frame;
            t.____atlasSize = new Vector2(image.width, image.height);
            if (frame.__isSimpleImage) {
                t.____imgSize = t.____atlasSize;
            }
            else {
                t.____imgSize = frame.s;
            }
            t.__needUpdate = 1;
        }

    }

    //debug     
    , __selectable: 1,

    __select: function () {
        if (!this.selected && this.__selectable) {
            this.selected = true;
            BUS.__post(__ON_NODE_SELECTED, this)
        }
    },

    __unselect: function () {
        if (this.selected) {
            this.selected = false;
            BUS.__post(__ON_NODE_UNSELECTED, this);
        }
    },


    __someParentSelected: function () {
        return this.__traverseParents(function (n) { return n.selected });
    },

    toJsString: function () {
        return JSON.stringify(this.toJson(), 1, 4).replace(/    "(\w*)":/g, function (a, b) { return '   ' + b + ':' });
    },

    __nodeToJsonPropertiesList__: (function () {

        function saveBounds(v) {
            var pp = deepclone(v);
            if (pp[0] == pp[1] && pp[1] == pp[2] && pp[2] == pp[3])
                return pp[0];
            return pp;
        }

        return {

            __onLoad: undefined,
            __propertyBinding: [''],
            __behaviour: [''],
            __tooltip: [''],
            __numericInputStep: ['', 0],
            __userData: ['', 0],
            __animatronix: [0],
            __physics: [0],
            __classesObj: [0],
            __description: [0],
            __uvsTransform: [0],
            __extract: [0],
            __selectable: [1],
            __drawMode: [0, 4],

            f1: function (v) { return Number(v.toFixed(2)) },
            f2: function (v) { return Number(v.toFixed(2)) },
            f3: function (v) { return Number(v.toFixed(2)) },
            f4: function (v) { return Number(v.toFixed(2)) },
            f5: function (v) { return Number(v.toFixed(2)) },
            f6: function (v) { return Number(v.toFixed(2)) },
            f7: function (v) { return Number(v.toFixed(2)) },
            f8: function (v) { return Number(v.toFixed(2)) },

            __imgRepeatX: [0],
            __imgRepeatY: [0],

            __uniforms: undefined,

            __spacing: saveBounds,
            __margin: saveBounds,
            __padding: saveBounds,

            __alpha: function (v) { if (v != 1) return Number(v.toFixed(2)) },
            __alphaDeep: function (v) { if (v != 1) return Number(v.toFixed(2)) },
            __rotate: function (v) { if (v != 0) return Number(v.toFixed(2)) },
            __img: [''],
            ha: undefined,
            va: undefined,
            sha: undefined,
            sva: undefined,

            __tableAlignRows: [0],
            __tableAlignColumns: [0],
            __tableAlignColumnWidth: [0],
            __tableAlignRowHeight: [0],

            cropx: function (v) { return round(v) },
            cropy: function (v) { return round(v) },
            __centerFill: function (v) { if (v) return 1 },
            __corner: function (v) {
                if (v) {
                    v[0] = Number((v[0] || 0).toFixed(1));
                    v[1] = Number((v[1] || 0).toFixed(1));
                    /*
                    v[0] = round(v[0]||0);
                    v[1] = round(v[1]||0);
                    */
                    if (v[2]) {
                        v[2] = Number(v[2].toFixed(2));
                    }
                    if (v[3]) {
                        v[3] = Number(v[3].toFixed(2));
                    }
                    if ((!v[3] || (v[3] == 1))) {
                        if ((!v[2] || (v[2] == 1))) {
                            return [v[0], v[1]];
                        }
                        return [v[0], v[1], v[2]];
                    }
                    return v;
                }
            },
            __visible: function (v) { if (!v) return 0 },
            __blending: [1],

            __maxImageSize: undefined,

            __minsize: undefined,
            __maxsize: undefined,
 
            __onTap: undefined,

            __onKey: undefined,
            __disabled: undefined,

            __notNormalNode: undefined,

            __dragonBones(v) { if (v) return v.__name },
            __spine(v) { if (v) { var vv = v.toJson(); return vv ? vv : v.__name } },
            __cubism(v) { if (v) { var vv = v.toJson(); return vv ? vv : v.__name } },
            __lottie(v) { if (v) { var vv = v.toJson(); return vv ? vv : v.__name } },

            __needScissor: [0, false, undefined],

            __size: function (ss) {
                if (ss) {
                    var s = {};
                    var x = abs(ss.x);
                    var px, py;
                    if (x > 1) {
                        if (ss.px) {
                            if (ss.px == 'a' || ss.px == 'o') {
                                s.px = ss.px;
                            } else {
                                s.px = 1;
                            }
                        }

                    } else if (x <= 1 && x > 0) {
                        if (ss.px != undefined)
                            s.px = ss.px;
                        else
                            px = 1;
                    }

                    var y = abs(ss.y);
                    if (y > 1) {
                        if (ss.py) {
                            if (ss.py == 'a' || ss.py == 'o') {
                                s.py = ss.py;
                            } else {
                                s.py = 1;
                            }
                        }
                    } else if (y <= 1 && y > 0) {
                        if (ss.py != undefined) {
                            s.py = ss.py;
                        }
                        else {
                            py = 1;
                        }
                    }

                    if (ss.y != 0 && ss.y != undefined) s.y = py || s.py ? Number(ss.y.toFixed(3)) : round(ss.y);
                    if (ss.x != 0 && ss.x != undefined) s.x = px || s.px ? Number(ss.x.toFixed(3)) : round(ss.x);

                    if (s.px === true) s.px = 1; else
                        if (s.px === '%') s.px = 1;
                    if (s.py === true) s.py = 1; else
                        if (s.py === '%') s.py = 1;

                    var sz = [s.x || 0, s.y || 0, s.px || 0, s.py || 0];
                    while (sz.length && !sz[sz.length - 1]) sz.pop();
                    if (sz.length) {
                        return sz;
                    }
                }
            },

            __eWidth: function (ss) {
                if (ss) {
                    var s = {};
                    var x = abs(ss.x);
                    var px;
                    if (x > 1) {
                        if (ss.px) {
                            if (ss.px == 'a' || ss.px == 'o') {
                                s.px = ss.px;
                            } else {
                                s.px = 1;
                            }
                        }

                    } else if (x <= 1 && x > 0) {
                        if (ss.px != undefined)
                            s.px = ss.px;
                        else
                            px = 1;
                    }
                    if (ss.x != 0 && ss.x != undefined) s.x = px || s.px ? Number(ss.x.toFixed(3)) : round(ss.x);

                    if (s.px === true) s.px = 1; else
                        if (s.px === '%') s.px = 1;

                    return s;
                }

            },

            __eHeight: function (ss) {
                if (ss) {
                    var s = {};
                    var py;
                    var y = abs(ss.y);
                    if (y > 1) {
                        if (ss.py) {
                            if (ss.py == 'a' || ss.py == 'o') {
                                s.py = ss.py;
                            } else {
                                s.py = 1;
                            }
                        }
                    } else if (y <= 1 && y > 0) {
                        if (ss.py != undefined) {
                            s.py = ss.py;
                        }
                        else {
                            py = 1;
                        }
                    }

                    if (ss.y != 0 && ss.y != undefined) s.y = py || s.py ? Number(ss.y.toFixed(3)) : round(ss.y);

                    if (s.py === true) s.py = 1; else
                        if (s.py === '%') s.py = 1;

                    return s;
                }
            },

            __selfImgSize: undefined,

            __scale: function (scale, o) {

                if (scale) {
                    var sx = Number(scale.x.toFixed(3)),
                        sy = Number(scale.y.toFixed(3));

                    if (sx != 1 || sy != 1) {
                        if (sx == sy) {
                            o.__scaleF = sx;
                        } else if (sx != 1 && sy != 1) {
                            o.__scale = [sx, sy];
                        } else if (sx != 1) {
                            o.__scalex = sx;
                        } else if (sy != 1) {
                            o.__scaley = sy;
                        }
                    }
                }
            },
 
            __transformAnchor: undefined
        }
    })(),

    toJson: (function () {

        function saveShadow(o, shadow) {
            if (o)
                if (isObject(o))
                    if (shadow) {
                        var shadowX = shadow.x;
                        var shadowY = shadow.y;
                        var shadowBlur = shadow.__blur;
                        var shadowColor = colorToJson(shadow.__color);
                        var shadowAlpha = shadow.__alpha;
                        var sh = {};
                        if (shadowX) sh.x = shadowX;
                        if (shadowY) sh.y = shadowY;
                        if (shadowBlur) sh.__blur = shadowBlur;
                        if (shadowColor) sh.__color = shadowColor;
                        if (shadowAlpha != undefined && shadowAlpha != 1) sh.__alpha = shadowAlpha;

                        if (objectSize(sh) > 0) {
                            if (sh.__alpha != undefined || shadowColor) {
                                o.__shadow = sh;
                            } else {
                                o.__shadow = [shadowX || 0, shadowY || 0, shadowBlur || 0];
                                if (!o.__shadow[2]) {
                                    o.__shadow.splice(-1, 1);
                                    if (!o.__shadow[1]) o.__shadow.splice(-1, 1);
                                }
                            }
                        }
                        else {
                            delete o.__shadow;
                        }
                    }
        }


        return function () {

            var t = this, o = {}, selfProperties = t.__selfProperties;
            //     console.log('tojson ', t);

            if (selfProperties.__eWidth || selfProperties.__eHeight) {
                selfProperties.__size = undefined;
            }

            // TODO: move operations to __nodeToJsonPropertiesList__ !

            if (t.__tooltip) o.__tooltip = t.__tooltip;

            var fitx = selfProperties.__fitImgX;
            var fity = selfProperties.__fitImgY;
            if (fitx || fity) {
                if (fitx == undefined) o.__fitImgY = fity;
                else if (fity == undefined) o.__fitImgX = fitx;
                else if (fitx == fity) o.__fitImg = fitx;
                else {
                    o.__fitImg = { x: fitx, y: fity };
                }
            }

            var anchor = selfProperties.__anchor;

            if (anchor && (anchor.x != 0 || anchor.y != 0)) {
                o.__anchor = {};
                if (t.__transformAnchor) {
                    if (anchor.x) o.__anchor.x = anchor.x;
                    if (anchor.y) o.__anchor.y = anchor.y;
                } else {
                    if (anchor.x) o.__anchor.x = round(anchor.x);
                    if (anchor.y) o.__anchor.y = round(anchor.y);
                }
            }

            var skew = t.__skew;
            if (skew.x != 0 && skew.y != 0) { o.__skew = { x: skew.x, y: skew.y }; } else
                if (skew.x != 0) { o.__skewX = skew.x; } else
                    if (skew.y != 0) { o.__skewY = skew.y; }

            var color = selfProperties.__color;

            if (color) {
                color = colorToJson(color);
                if (color !== undefined) o.__color = color;
            }


            var name = selfProperties.name;

            if (name && (!isString(name) || !name.match(/^_\d+$/))) {
                o.name = name;
            }

            var needSave, val, defVal;

            function saveProp(val, defVal) {
                needSave = 0;
                if (!isFunction(val)) {

                    if (val == undefined || val == defVal || $find(defVal, function (vv, i) { return val === vv })) {
                        return;
                    }
                    else
                        if (isFunction(defVal)) {
                            val = defVal(val, o, t);
                            if (val == undefined) {
                                return;
                            }
                        }
                    needSave = 1;
                    return val;
                }

            }

            $each(t.__nodeToJsonPropertiesList__, function (defVal, i) {

                if (selfProperties.hasOwnProperty(i)) {

                    val = saveProp(selfProperties[i], defVal);
                    if (!needSave && selfProperties[i] != undefined) {
                        if (!isValuesEquals(selfProperties[i], t[i])) {
                            val = saveProp(selfProperties[i], defVal);
                            needSave = 1;
                        }
                    }

                } else {
                    val = saveProp(t[i], defVal);
                    if (val == undefined) {
                        needSave = 0;
                    }
                }

                if (needSave) {
                    o[i] = val;
                }

            });

            var cl = t.__classes;
            if (cl && cl.length)
                o.__class = cl.join(',');

            var tm = selfProperties.__text;
            if (tm) {
                o.__text = tm;
                if (o.__text) {

                    if (t.name != 'e-__defaultTextProperties')
                        $each(o.__text, function (v, i) {
                            if (v == __defaultTextProperties[i]) {
                                delete o.__text[i];
                            }
                        });

                    if (o.__text.__italic) o.__text.__italic = 1; else delete o.__text.__italic;
                    if (o.__text.__smallCaps) o.__text.__smallCaps = 1; else delete o.__text.__smallCaps;

                    var tc = o.__text.__color;
                    if (tc != undefined) {
                        tc = colorToJson(tc);
                        if (tc !== undefined) {
                            o.__text.__color = tc;
                        }
                        else {
                            delete o.__text.__color;
                        }
                    }

                    if (o.__text.__text === '')
                        delete o.__text.__text;

                    var numerics = {
                        __fontsize: 24,
                        __lineWidth: 0,
                        __lineSpacing: 0,
                        __addedLineSpacingMultiplier: 1,
                        __fontspacing: 0,
                        __charw: 0
                    };


                    if (o.__text.__shader)
                        if (o.__text.__shader == 'base' || isObject(o.__text.__shader)) {
                            delete o.__text.__shader;
                        }

                    if (o.__text.__lineColor) {
                        var tlc = colorToJson(o.__text.__lineColor);
                        if (tlc) o.__text.__lineColor = tlc;
                    }

                    for (var i in numerics)
                        if (!isNumeric(o.__text[i]))
                            delete o.__text[i];


                    for (var i in o.__text)
                        if (o.__text[i] == undefined)
                            delete o.__text[i];

                    if (o.__text.__autoscale) o.__text.__autoscale = 1;
                    if (o.__text.__autowrap) o.__text.__autowrap = 1;

                    saveShadow(o.__text, t.__textMesh.__shadow);
                }
            }

            var shader = selfProperties.__shader;
            if (shader) {
                o.__shader = shader;
            }


            var ofs = selfProperties.__ofs;
            if (ofs) {
                var x = round(ofs.x),
                    y = round(ofs.y),
                    z = round(ofs.z);

                if (x || y || z) {
                    if (x && !y && !z) o.__x = x; else
                        if (!x && y && !z) o.__y = y; else
                            if (!x && !y && z) o.__z = z; else {
                                o.__ofs = [x, y, z];
                                while (o.__ofs.length && !o.__ofs[o.__ofs.length - 1])
                                    o.__ofs.pop();
                            }
                }
            }

            //         saveShadow(o, t.__shadow);

            if (isString(t.__animation)) {
                o.__animation = t.__animation;
            } else
                if (isArray(t.__animation)) {
                    o.__simpleAnimation = t.__animation;
                }


            var effect = t.__effect;
            if (effect && objectKeys(effect).length) {
                o.__effect = effect.toJson();
            }

            var keyframes = t.__keyframes;
            if (keyframes && objectSize(keyframes)) {
                if (keyframes.__lerp === 0)
                    delete keyframes.__lerp;

                o.__keyframes = toFixedDeep(deepclone(keyframes), 3);
                if (o.__keyframes.__keyframes) {
                    // track format
                    if (!$find(o.__keyframes.__keyframes, function (frames) {
                        return $find(frames, function (f) {
                            return f.hasOwnProperty('va') && objectSize(f) > 1;
                        });
                    })) {
                        o.__keyframes.__track = $map(o.__keyframes.__keyframes, function (frames) {
                            return $map(frames, function (f) { return f.va; });
                        });
                        delete o.__keyframes.__keyframes;
                    }
                }
            }

            var toDelete = [];

            if (o.__shader == 'c') toDelete.push('__shader');

            if (o.__needScissor && (o.cropx || o.cropy))
                toDelete.push('__needScissor');


            if (typeof traversingWithoutLoops != undefinedType)
                traversingWithoutLoops(o, function (obj, key, depth, parent) {
                    if (obj && isObject(obj) && obj.constructor != Object) {
                        if (obj.toJson) {
                            var j = obj.toJson();
                            if (j != undefined) {
                                parent[key] = j;
                            }
                            return -1;
                        } else {
                            delete parent[key];
                            debugger;
                        }
                    }
                });

            t.__eachChild(function (child, i) {
                var jjj = child.__validToSave && child.toJson && child.toJson();
                if (jjj) {
                    if (options.__storeChildsAsObject) {
                        if (!o.__childs) o.__childs = {};
                        o.__childs[jjj.name || ('_' + i)] = jjj;
                        if (jjj.name) delete jjj.name;
                    } else {
                        if (!o.__childs) o.__childs = [];
                        o.__childs.push(jjj);
                    }
                }
            });



            for (var i in o) if (isFunction(o[i])) toDelete.push(i);
            for (var i in toDelete) delete o[toDelete[i]];



            return o;
        }
    })()
    //undebug

});



var NODE_ANIM_PROPS = [
    '__rotate', // 0
    '__scaleF', // 1
    '__scalex', // 2
    '__scaley', // 3
    '__x',      // 4
    '__y',      // 5
    '__width',  // 6
    '__height', // 7
    '__alpha'   // 8
];

function returnsOneFunction() {
    return 1;
}

function evalFunction(str) {
    return function () { eval(str); }
}
//cheats 
function spehFunction(node, fname, name) {
    var original = node[fname];
    return function () {
        if (specialEventHandler) specialEventHandler.eventHandler(node, name);
        if ((__window.__debugEvents || 0)[name] && isCtrlPressed)
            debugger;
        return isFunction(original) ? original.apply(this, arguments) : original;
    }
}
//endcheats

function pushNodeHandlerTo(node, v, name, fname) {
    node[name] = v;
    //debug
    if ((node.__root || node).__eventsDisabled) return;
    //undebug
    fname = fname || name;

    node[fname] = (v == 1) ? returnsOneFunction : isString(v) ? evalFunction(v) : v;

    node.__checkAppear = v ? (node.__checkAppear || 0) + 1 : (node.__checkAppear || 1) - 1;

    //cheats
    if (isFunction(v)) {
        node[fname] = spehFunction(node, fname, name);
    }
    //endcheats
    resortEventsObjects();
}

 
//сомнительный эксперимент, но пусть пока поживет
var NodeCloneProperties = [
    '__margin', '__spacing', '__padding', '__alpha', '__size', '__img', '__fitImgX', '__fitImgY', '__imgRepeatX', '__imgRepeatY',
    'ha', 'va', 'sha', 'sva', 'cropx', 'cropy', '__scale', '__anchor', '__rotate', '__centerFill', '__transformAnchor',
    '__corner', '__visible', '__blending', '__maxImageSize', '__maxsize', '__minsize', '__color',
    '__shader', '__userData', '__animatronix',
    '__text', '__uvsTransform', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', '__dragonBones', '__spine', '__disabled',
    '__onTap', '__uniforms', '__tableAlignRows', '__tableAlignColumns', '__tableAlignColumnWidth', '__tableAlignRowHeight',
    '__drag', '__useMaxSizeForScale'
    //debug
    , '__description', '__selectable', '__onKey', '__onLoad', '__propertyBinding',
    '__behaviour', '__classesObj', '__physics', '__numericInputStep', '__contextMenu', '__wheel'
    //undebug
],

    NodePropertiesObject = {

        __onTap: createSomePropertyWithGetterAndSetter(
            function () { return this.____onTap; },
            function (v) { pushNodeHandlerTo(this, v, EDM.____onTap, EDM.____onTapFunc); }
        ),

        __drag: createSomePropertyWithGetterAndSetter(
            function () { return this.____drag; },
            function (v) { pushNodeHandlerTo(this, v, EDM.____drag, EDM.____onDragFunc); }
        ),

        //debug
        __contextMenu: createSomePropertyWithGetterAndSetter(
            function () { return this.____contextMenu; },
            function (v) { pushNodeHandlerTo(this, v, EDM.____contextMenu); }
        ),
        __wheel: createSomePropertyWithGetterAndSetter(
            function () { return this.____wheel; },
            function (v) { pushNodeHandlerTo(this, v, EDM.____wheel); }
        ),
        //undebug

        __sizeWithFirstAndLastChild: {
            set: function () {
                delete this.____sizeWithFirstAndLastChild
            },

            get: function () {
                var t = this;
                if (!t.____sizeWithFirstAndLastChild) {
                    t.____sizeWithFirstAndLastChild = t.__getBoundingBox(1, 1);
                    t.____sizeWithFirstAndLastChild = t.____sizeWithFirstAndLastChild.max.sub(t.____sizeWithFirstAndLastChild.min);
                }
                return t.____sizeWithFirstAndLastChild;
            }
        },

        __sizeWithChildrens: {
            get: function () {
                // slow!
                var b = this.__getBoundingBox();
                return b.max.sub(b.min);
            }
        },

        __maxImageSize: {
            get: function () { return this.____maxImageSize; },
            set: function (v) {
                this.____maxImageSize = v; this.__dirty = 1;
                //debug
                if (!__propertiesAppliedByClass) this.__selfProperties.__maxImageSize = v;
                //undebug
            }
        },

        __maxsize: {
            get: function () { return this.____maxsize; },
            set: function (v) {
                this.____maxsize = v; this.__dirty = 2;
                //debug
                if (!__propertiesAppliedByClass) this.__selfProperties.__maxsize = v;
                //undebug
            }
        },

        __minsize: {
            get: function () { return this.____minsize; },
            set: function (v) {
                this.____minsize = v; this.__dirty = 2;
                //debug
                if (!__propertiesAppliedByClass) this.__selfProperties.__minsize = v;
                //undebug
            }
        },

        __width: {
            get: function () {

                return this.____size ? !this.____size.px ? this.____size.x : this.__size.x : this.__size.x

            },
            set: function (v) {
                var t = this;
                if (t.____size) {
                    t.____size.x = v;
                    delete t.____size.px;
                    t.__dirty = 3;
                }
                else {
                    t.__size = { x: v, y: t.__height, py: 0, px: 0 };
                }


            }
        },

        __height: {
            get: function () {

                return this.____size ? !this.____size.py ? this.____size.y : this.__size.y : this.__size.y

            },

            set: function (v) {
                var t = this;
                if (t.____size) {
                    t.____size.y = v;
                    delete t.____size.py;
                    t.__dirty = 3;
                }
                else {
                    t.__size = { x: t.__width, y: v, py: 0, px: 0 };
                }

            }
        },

        __contentSize: {
            get: function () {
                var t = this, s = t.__size, p = t.____padding;
                if (p) { s.x -= p[1] + p[3]; s.y -= p[0] + p[2]; }
                return s;
            }
        },

        __layoutSize: {
            get: function () {
                var t = this;
                if (t.____size) {
                    return t.__adjustSmartSize(t.____size, t.parent ? t.parent.__contentSize : __screenSize);
                }
                // if (t.__childs.length == 0) {
                var imgSize = t.__imgSize;
                if (imgSize) return imgSize;
                // }
                return new Vector2(0, 0);
            }
        },
        //debug

        __debugMatricesUpdates: {

            get: function () { return this.____debugMatricesUpdates },
            set: function (v) {

                this.____debugMatricesUpdates = v;

                if (!this.___dmuprset) {

                    this.___dmuprset = 1;

                    ObjectDefineProperty(this, '__matrixNeedsUpdate', {
                        get: function () { return this.__d_matrixNeedsUpdate },
                        set: function (vv) {
                            if (vv) {
                                if (this.__ld_mw_fu > __currentFrame - 2) {
                                    //handles multiply updates
                                    if (this.____debugMatricesUpdates)
                                        debugger;
                                }

                                this.__ld_mw_fu = __currentFrame;

                            }

                            this.__d_matrixNeedsUpdate = vv;
                        }
                    });

                    ObjectDefineProperty(this, '__matrixWorldNeedsUpdate', {
                        get: function () { return this.__d_matrixWorldNeedsUpdate },
                        set: function (vv) {
                            if (vv) {
                                if (this.__ld_mww_fu > __currentFrame - 2) {
                                    //handles multiply updates
                                    if (this.____debugMatricesUpdates)
                                        debugger;
                                }

                                this.__ld_mww_fu = __currentFrame;

                            }

                            this.__d_matrixWorldNeedsUpdate = vv;
                        }
                    });

                }

            }



        },

        //undebug


        __selfProperties: {
            set: function (v) { this.____selfProperties = v || {}; },
            get: function (v) {
                if (!this.____selfProperties) this.____selfProperties = {

                    __margin: undefined,

                    __spacing: undefined,

                    __padding: undefined,
                    __alpha: undefined,
                    __alphaDeep: undefined,
                    __size: undefined,
                    __eWidth: undefined,
                    __eHeight: undefined,
                    __img: undefined,
                    __fitImgX: undefined,
                    __fitImgY: undefined,

                    __imgRepeatX: undefined,
                    __imgRepeatY: undefined,

                    ha: undefined,
                    va: undefined,
                    sha: undefined,
                    sva: undefined,
                    cropx: undefined,
                    cropy: undefined,
                    __scale: undefined,
                    __anchor: undefined,

                    __rotate: undefined,
                    __centerFill: undefined,
                    __corner: undefined,
                    __visible: undefined,
                    __blending: undefined,
                    __maxImageSize: undefined,
                    __maxsize: undefined,
                    __minsize: undefined,

                    __color: undefined,

                    __text: undefined,
                    __shader: undefined,

                    __transformAnchor: undefined,
                    __userData: undefined,

                    //debug
                    __notNormalNode: undefined,
                    __behaviour: undefined,
                    __propertyBinding: undefined,
                    __tooltip: undefined
                    //undebug 
                };
                return this.____selfProperties;
            }
        },
        //undebug
        __size: {
            get: function () {
                var t = this;
                return (t.__geomSize ? t.__geomSize : t.__layoutSize).clone();
            },
            set: function (v) {
                var t = this, dirty, sz = t.____size;
                if (v) {
                    if (!sz) sz = t.____size = new Vector2();

                    if (isArray(v)) {
                        dirty = sz.x != v[0] || sz.y != v[1];
                        if (dirty) {
                            sz.set(v[0] || 0, v[1] || 0);
                        }
                        if (sz.px != v[2]) {
                            sz.px = v[2] || undefined;
                            dirty = 1;
                        }
                        if (sz.py != v[3]) {
                            sz.py = v[3] || undefined;
                            dirty = 1;
                        }
                    }
                    else {
                        dirty = sz.x != v.x || sz.y != v.y;
                        if (dirty) {
                            sz.set(v.x || 0, v.y || 0);
                        }
                        if (sz.px != v.px) {
                            sz.px = v.px;
                            dirty = 1;
                        }
                        if (sz.py != v.py) {
                            sz.py = v.py;
                            dirty = 1;
                        }
                    }
                } else {
                    if (sz) {
                        dirty = 1;
                        delete t.____size;
                        sz = 0;
                    }
                }

                t.__dirty = dirty ? 3 : 1;


                //debug
                if (!__propertiesAppliedByClass) {
                    this.__selfProperties.__size = sz ? { x: sz.x, y: sz.y, px: sz.px, py: sz.py } : undefined;
                    if (!this.__selfProperties.__size) {
                        this.__needClassUpdate = t.____classes ? 1 : 0;
                    }
                }
                //undebug

            }
        },

        __imgSize: {
            get: function () {
                return this.____imgSize;
            }
        },

        __totalZ: createSomePropertyWithGetterAndSetter(
            function () { return this.__matrixWorld.e[14]; },
            function (v) { this.__matrixWorld.e[14] = v; this.z = v; }
        ),

        __x: {
            get: function () { return this.__offset.x; }, set: function (v) {
                if (v != this.__offset.x) {
                    this.__offset.x = v;
                    this.__dirty = 3;
                    this.__needUpdateDeep = 0;
                    //debug
                    if (!__propertiesAppliedByClass) this.__selfProperties.__ofs = this.__offset.clone();
                    //undebug
                }
            }
        },
        __y: {
            get: function () { return this.__offset.y; }, set: function (v) {
                if (v != this.__offset.y) {
                    this.__offset.y = v;
                    this.__dirty = 3;
                    this.__needUpdateDeep = 0;
                    //debug
                    if (!__propertiesAppliedByClass) this.__selfProperties.__ofs = this.__offset.clone();
                    //undebug
                }
            }
        },

        __z: {
            get: function () { return this.__offset.z; }, set: function (v) {
                if (this.__offset.z != v) {
                    this.__offset.z = v;
                    this.__matrixNeedsUpdate = this.__matrixWorldNeedsUpdate = 1;
                    resortEventsObjects(this);
                    //debug
                    if (!__propertiesAppliedByClass) this.__selfProperties.__ofs = this.__offset.clone();
                    //undebug
                }
            }
        },

        __ofs: { // offset
            get: function () { return this.__offset; },
            set: function (v) {
                var tofs = this.__offset; v = v || 0;
                if (isArray(v)) { v = { x: v[0], y: v[1], z: v[2] }; }
                var zchanged = (tofs.z != v.z || 0);
                if ((tofs.x != v.x || 0) || (tofs.y != v.y || 0) || zchanged) {

                    tofs.set(v.x || 0, v.y || 0, v.z || 0);

                    if (zchanged) {
                        resortEventsObjects(this);
                    }

                    //debug
                    if (!__propertiesAppliedByClass) {
                        this.__selfProperties.__ofs = tofs.clone();
                    }
                    //undebug

                    this.__dirty = 3;
                    this.__needUpdateDeep = 0;
                }

            }
        },

        __scalex: {
            get: function () { return this.____scale.x; }, set: function (v) {
                this.____scale.x = v; this.__matrixNeedsUpdate = 1;
                //debug
                if (!__propertiesAppliedByClass) this.__selfProperties.__scale = this.____scale.clone();
                //undebug
            }
        },
        __scaley: {
            get: function () { return this.____scale.y; }, set: function (v) {
                this.____scale.y = v; this.__matrixNeedsUpdate = 1;
                //debug
                if (!__propertiesAppliedByClass) this.__selfProperties.__scale = this.____scale.clone();
                //undebug
            }
        },

        __skewGrad: {
            get: function () { return this.____skew.clone().__multiplyScalar(RAD2DEG); },
            set: function (v) {
                if (v) {
                    this.____skew.set(v.x * DEG2RAD, v.y * DEG2RAD);
                } else {
                    this.____skew.set(0, 0);
                }
                this.__matrixNeedsUpdate = 1;
            }
        },
        __skewGradX: {
            get: function () { return this.____skew.x * RAD2DEG; },
            set: function (v) { this.____skew.x = v * DEG2RAD; this.__matrixNeedsUpdate = 1; }
        },

        __layoutPosition: {
            get: function () {
                return this.__offset.clone().add(this.__offsetByParent);
            }
        },

        __layoutPositionX: {
            get: function () {
                return this.__offset.x + this.__offsetByParent.x;
            }
        },

        __layoutPositionY: {
            get: function () {
                return this.__offset.y + this.__offsetByParent.y;
            }
        },

        __skewGradY: {
            get: function () { return this.____skew.y * RAD2DEG; },
            set: function (v) { this.____skew.y = v * DEG2RAD; this.__matrixNeedsUpdate = 1; }
        },

        __skew: {
            get: function () { return this.____skew; },
            set: function (v) {
                if (v) {
                    this.____skew.set(v.x, v.y);
                } else {
                    this.____skew.set(0, 0);
                }
                this.__matrixNeedsUpdate = 1;
            }
        },

        __skewX: {
            get: function () { return this.____skew.x; },
            set: function (v) { this.____skew.x = v; this.__matrixNeedsUpdate = 1; }
        },

        __skewY: {
            get: function () { return this.____skew.y; },
            set: function (v) { this.____skew.y = v; this.__matrixNeedsUpdate = 1; }
        },

        __scaleF: {
            get: function () { return this.____scale.x; },
            set: function (v) {
                this.____scale.set(v, v, v); this.__matrixNeedsUpdate = 1;
                //debug
                if (!__propertiesAppliedByClass) this.__selfProperties.__scale = this.____scale.clone();
                //undebug
            }
        },

        __scale: {
            get: function () { return this.____scale.clone() },
            set: function (v) {
                var t = this;
                if (v == undefined) v = 1;
                if (isNumeric(v)) {
                    t.____scale.set(v, v);
                } else
                    if (isArray(v)) {
                        t.____scale.set(v[0] || 0, v[1] || 0);
                    } else {
                        if (v.x != undefined) t.____scale.x = v.x;
                        if (v.y != undefined) t.____scale.y = v.y;
                    }
                this.__matrixNeedsUpdate = 1;

                //debug
                if (!__propertiesAppliedByClass) this.__selfProperties.__scale = this.____scale.clone();
                //undebug
            }
        },

        __rotate: {
            get: function () { return this.____rotation * RAD2DEG; },
            set: function (v) {
                this.____rotation = (v || 0) * DEG2RAD;
                this.__matrixNeedsUpdate = 1;
                this.__realRotate = this.____rotation;
                //debug
                if (!__propertiesAppliedByClass) this.__selfProperties.__rotate = v || 0;
                //undebug
            }
        },

        __img: {
            get: function () { return this.____img; },
            set: function (filename) {
                var t = this;
                t.____img = filename;

                //debug
                function applyImgToSelfProperties() {
                    if (!__propertiesAppliedByClass && !t.__imgPropertiesAppliedByClass) {
                        t.__selfProperties.__img = t.____img;
                    }
                }
                //undebug

                if (globalConfigsData.__spriteSheetAnimations) {

                    if (t.__spriteSheetAnim) {
                        killAnim(t.__spriteSheetAnim);
                        delete t.__spriteSheetAnim;
                    }

                    var spriteSheetAnim = globalConfigsData.__spriteSheetAnimations[filename];
                    if (spriteSheetAnim) {

                        //                     consoleLog(spriteSheetAnim);
                        var frameCount = spriteSheetAnim[0]
                            , fps = spriteSheetAnim[1]
                            , frames = spriteSheetAnim[2]
                            , actions = spriteSheetAnim[3] // sample: { frame: { __wait: 10 } }
                            , padFormat = spriteSheetAnim[4]
                            , preparedFames = spriteSheetAnim[5]
                            , reverseLoop = spriteSheetAnim[6];

                        //preparing frames
                        if (!preparedFames) {
                            if (isString(frames)) {
                                var framesCollection = [];
                                for (var i = 1; i < frameCount + 1; i++) {
                                    if (padFormat) {
                                        var k = clamp(padFormat - (i > 99 ? 3 : i > 9 ? 2 : 1), 0, 3);
                                        framesCollection.push(frames.__format('0'.repeat(k) + i));
                                    } else {
                                        framesCollection.push(frames.__format(i));
                                    }
                                }
                                frames = framesCollection;
                            }

                            if (isArray(frames)) {

                                preparedFames = $map(frames, function (a) {
                                    var frame = globalConfigsData.__frames[a];
                                    if (!frame) {
                                        consoleError('no sprite frame ' + a);
                                        //                                     debugger;  
                                    }
                                    return frame;
                                }).f$(function (d) { return d });

                                if (!preparedFames.length) {
                                    consoleError('no frames prepared to sprite sheet anim', filename);
                                    debugger;

                                    //debug
                                    applyImgToSelfProperties();
                                    //undebug
                                    return;
                                }

                                spriteSheetAnim[5] = preparedFames;
                            }
                        }

                        if (preparedFames) {
                            frameCount = preparedFames.length;

                            t.__spriteSheetAnim = tween.__push(new CustomTweenAction(t,
                                {
                                    pf: preparedFames,
                                    fc: frameCount,
                                    t: ONE_SECOND * frameCount / fps,
                                    rl: reverseLoop,
                                    cf: -1,
                                    //debug
                                    editorSupportedUpdate: function (needReset) {
                                        if (needReset) this.s = 0.01;
                                        this.__update(__forceAnimTime, __forceAnimDt);
                                    },
                                    //undebug
                                    __onStart: reverseLoop ? function () {
                                        this.s -= this.t / this.fc;
                                    } : 0,
                                    __onUpdate: function (part) {
                                        var t = this;
                                        //debug
                                        if (t.o.__frame && !__forceAnimDt) return;
                                        //undebug
                                        var cf;
                                        part = clamp(part, 0.001, 0.999);
                                        if (t.rl) {
                                            cf = floor((t.r ? (1 - part) : part) * t.fc) % t.fc;
                                        } else {
                                            cf = floor(part * t.fc) % t.fc;
                                        }
                                        if (cf != t.cf) {
                                            t.cf = cf;
                                            t.o.__setFrame(t.pf[t.cf]);
                                        }
                                    }

                                    , __onCompleted: function () {
                                        //                                 consoleLog('completed', this.r);
                                        if (this.rl) {
                                            this.r = !this.r;
                                            this.s = 0;
                                        } else {
                                            this.s =
                                                this.cf = 0;
                                        }

                                    }
                                }));

                        }

                        //debug
                        applyImgToSelfProperties();
                        //undebug
                        return;
                    }

                }

                function clearSelfImage() {
                    //debug
                    if (t.__spriteSheetAnim) {

                    }
                    //undebug
                    if (t.__frame && t.__uvsBuffer == t.__frame.__uvsBuffers[t.____uvsTransform])
                        delete t.__uvsBuffer;
                    delete t.____imgSize;
                    delete t.__frame;
                    t.map = undefined;
                    delete t.map;
                }

                if (!t.__keepImage)
                    clearSelfImage();

                if (filename != undefined) {

                    //                 __window.__loadImageStack = 'i ' + filename;

                    filename = getFrameName(filename);

                    t.____img = filename;

                    if (globalConfigsData.__frames.hasOwnProperty(filename)) // загружено из атласа или просто кэш картинок
                    {
                        var frame = globalConfigsData.__frames[filename]
                            , map = frame.tex
                            , image = map ? map.__image : 0;

                        if (frame.__loading) {

                            //debug
                            t.__imgPropertiesAppliedByClass = __propertiesAppliedByClass;
                            //undebug

                            if (map.__nodesWaitingsForThis) {
                                map.__nodesWaitingsForThis.push(t);
                            }
                            else {
                                map.__nodesWaitingsForThis = [t];
                            }

                            t.__notReady = 1;

                            //debug
                            applyImgToSelfProperties();
                            //undebug

                            return;

                        } else {
                            delete t.__notReady;
                        }

                        if (t.__keepImage)
                            clearSelfImage();

                        t.__frame = frame;
                        t.map = map;

                        if (frame.__isSimpleImage) {

                            if (image) {
                                t.____atlasSize = new Vector2(image.width, image.height);
                                t.____imgSize = t.____atlasSize;
                            }
                            else {
                                if (map.__nodesWaitingsForThis) {
                                    map.__nodesWaitingsForThis.push(t);
                                }
                                else {
                                    map.__nodesWaitingsForThis = [t];
                                }
                                //debug
                                applyImgToSelfProperties();
                                //undebug
                                return;
                            }
                        }
                        else {

                            var ox = image.width, oy = image.height;
                            t.____atlasSize = new Vector2(ox, oy);
                            t.____imgSize = frame.s;


                        }

                        t.__dirty = 3;

                        if (t.__onImageLoaded)
                            t.__onImageLoaded()


                    } else {

                        if (isString(filename) && filename) {
                            t.__notReady = 1;

                            //debug
                            //                         if (t.__imgPropertiesAppliedByClass)
                            //                             debugger;

                            t.__imgPropertiesAppliedByClass = __propertiesAppliedByClass;

                            //undebug

                            loadImage(filename, function () {
                                delete t.__notReady;
                            }, t, 0, function () {
                                delete t.__notReady;
                                if (t.__onLoadImageError)
                                    t.__onLoadImageError();
                                //debug
                                delete t.__imgPropertiesAppliedByClass;
                                //undebug

                            });
                        }

                    }

                    if (t.__shader == 'c')
                        t.__shader = null;

                }

                //debug
                applyImgToSelfProperties();
                //undebug

            }
        },

        __centerFill: {
            get: function () { return this.____centerFill; },
            set: function (v) {
                this.____centerFill = v;
                this.__dirty = 1;
                //debug
                if (!__propertiesAppliedByClass) this.__selfProperties.__centerFill = v;
                //undebug
            }
        },

        __corner: {
            get: function () {
                return this.____corner;
            },
            set: function (v) {
                this.____corner = v;
                this.__dirty = 1;
                //debug
                if (!__propertiesAppliedByClass) this.__selfProperties.__corner = deepclone(v);
                //undebug
            }
        },

        __effect: {
            get: function () {
                return this.__particleEffect;
            },
            set: function (v) {
                var t = this;

                if (t.__particleEffect == v)
                    return;

                if (t.__particleEffect) {
                    t.__particleEffect.__removeFromParent();
                    delete t.__particleEffect;
                }

                if (v != undefined) {

                    if (t.__needUpdate) {
                        t.update();
                        t.__updateMatrixWorld();
                    }

                    if (v instanceof ParticleEffect) {
                        t.__particleEffect = v;
                        v.__node = this;
                    }
                    else {
                        t.__particleEffect = new ParticleEffect(this);
                        t.__particleEffect.__init(v);
                    }
                }
            }
        },

        __text: {
            get: function () {
                return this.__textMesh;
            },
            set: function (v) {
                var t = this;
                if (v === undefined && t.__textMesh) {
                    t.__textMesh.__removeFromParent();
                    delete t.__textMesh;

                } else {

                    if (t.__textMesh == undefined) {
                        t.__textMesh = new Text();
                        t.add(t.__textMesh);
                    }

                    if (isObject(v)) {
                        if (v.__isText) { v = v.__p; }
                        t.__textMesh.__init(v);
                    }
                    else {
                        t.__textMesh.__text = v;
                    }

                    //need for success call text update!
                    t.__textMesh.____visible = 1;

                }

                //debug
                if (!__propertiesAppliedByClass) {
                    if (t.__textMesh) {
                        if (isObject(v)) {
                            this.__selfProperties.__text = mergeObj({}, v);
                        } else {
                            this.__selfProperties.__text = mergeObj(this.__selfProperties.__text || {}, { __text: v });
                        }
                    }
                    else {
                        this.__selfProperties.__text = undefined;
                    }
                }
                //undebug
            }
        },

        __textString: {
            get: function () { return this.__textMesh ? this.__textMesh.__text.replace ? this.__textMesh.__text.replace(/\\([^;]+);/g, '') : this.__textMesh.__text : ''; },
            set: function (v) { this.__text = v }
        },

        __margin: {
            get: function () { return this.____sizeMargin; },
            set: function (v) { // [ top, left, right, bottom ]
                v = __getFour__(v);
                this.____sizeMargin = v;
                this.__dirty = 3;

                //debug
                if (!__propertiesAppliedByClass)
                    this.__selfProperties.__margin = deepclone(v);
                //undebug
            }
        },

        __spacing: {
            get: function () { return this.____spacing; },
            set: function (v) { // [ top, left, right, bottom ]

                if (isNumeric(v)) v = [v, v, v, v];
                this.____spacing = v;
                this.__dirty = 3;

                //debug
                if (!__propertiesAppliedByClass)
                    this.__selfProperties.__spacing = deepclone(v);
                //undebug
            }
        },

        __padding: {
            get: function () { return this.____padding; },
            set: function (v) { // [ top, left, right, bottom ]
                v = __getFour__(v);
                this.____padding = v;
                this.__dirty = 2;
                //debug
                if (!__propertiesAppliedByClass)
                    this.__selfProperties.__padding = deepclone(v);
                //undebug
            }
        },

        __dirty: {
            set: function (v) {
                var t = this, parent = t.parent;
                //debug
                if (t.__dirtyUpdateDebug && v)
                    debugger;
                //undebug
                if (v > 3) {

                    var psz = t.____size;

                    if (!(t.____ha > 2 || t.____va > 2 || t.__hasAutoChilds || (psz && (psz.px == 'o' || psz.px == 'a' || psz.py == 'o' || psz.py == 'a')))) {
                        if (v == 4 && parent) {
                            parent.__dirty = 5;
                        }
                        return;
                    }

                    if (parent) {
                        parent.__dirty = 4;
                    }

                } else
                    if (v == 3 && parent) {
                        parent.__dirty = 4;
                        t.__viewable = 2;
                        t.__matrixNeedsUpdate = t.__matrixWorldNeedsUpdate = 1;
                    }

                if (v >= 2) {
                    t.__needUpdate = t.__needUpdateDeep = 1;
                }
                else
                    if (v == 1) {
                        t.__needUpdate = 1;
                    } else {
                        t.__needUpdate = t.__needUpdateDeep = 0;
                    }

            },

            get: function () {
                return this.__needUpdate || this.__needUpdateDeep;
            }

        },

        __anchor: {
            get: function () { return this.____anchor; },
            set: function (v) {
                if (v) {
                    this.____anchor.set(v.x || 0, v.y || 0, v.z || 0);
                } else {
                    this.____anchor.set(0, 0, 0);
                }

                this.__dirty = 1;

                //debug
                if (!__propertiesAppliedByClass) this.__selfProperties.__anchor = v;
                //undebug
            }
        },

        __numbersAnimatedLocalizationTextFormat: {
            set: function (v) {

                if (isNumber(v)) {
                    switch (v) {
                        case 1: this.____animatedTextFormat = { __format: localizeNumberInt }; break;
                        case 2: this.____animatedTextFormat = { __format: localizeNumberFloat }; break;
                    }
                } else {
                    if (isObject(v)) {
                        var digitsAfterDot = v.__digitsAfterDot;
                        //numberAfterSlash = v.__numberAfterSlash;

                        if (digitsAfterDot)
                            this.____animatedTextFormat = { __format: function (value) { return localizeNumberFloat(value, digitsAfterDot) } };

                    }
                }


            }
        },

        __shader: {
            get: function () { return this.____shader; },
            set: function (v) {
                this.____shader = v;
                this.__program = 0;
                //debug
                if (!__propertiesAppliedByClass && v != 'c')
                    this.__selfProperties.__shader = v;
                //undebug
            }
        },

        __colorString: {
            get: function () {
                return color_to_string(this.__selfColor);

            },
            set: function (v) {
                this.__color = v;
            }
        },

        __color: {
            get: function () { return this.__selfColor; },
            set: function (v) {
                var t = this;

                if (v == undefined) {
                    t.__selfColor.__setRGB(1, 1, 1);
                    if (t.__shader == 'c') t.__shader = null;
                } else {
                    t.__selfColor.fromJson(v);
                    if (!t.map && !t.__shader) t.__shader = 'c';
                }
                t.__baseColor = t.__selfColor.clone();
                //debug
                if (!__propertiesAppliedByClass) {
                    this.__needClassUpdate = t.____classes ? v == undefined : 0;
                    this.__selfProperties.__color = v == undefined ? undefined : this.__selfColor.clone();
                }
                //undebug
            }
        },

        __colorF: {
            get: function () { return this.__selfColor.r; },
            set: function (v) {
                this.__selfColor.__setRGB(v, v, v);
                //debug
                if (!__propertiesAppliedByClass) this.__selfProperties.__color = this.__selfColor.clone();
                //undebug
            }
        },

        ha: {
            get: function () { return this.____ha; }, set: function (v) {
                var t = this; t.____ha = v; this.__dirty = 2;
                //debug
                if (!__propertiesAppliedByClass) {
                    this.__needClassUpdate = this.____classes ? v == undefined : 0;
                    this.__selfProperties.ha = v;
                }
                //undebug
            }
        },

        va: {
            get: function () { return this.____va; }, set: function (v) {
                this.____va = v; this.__dirty = 2;
                //debug
                if (!__propertiesAppliedByClass) {
                    this.__needClassUpdate = this.____classes ? v == undefined : 0;
                    this.__selfProperties.va = v;
                }
                //undebug
            }
        },

        sha: {
            get: function () { return this.____sha; }, set: function (v) {
                this.____sha = v; this.__dirty = 1;
                //debug
                if (!__propertiesAppliedByClass) {
                    this.__needClassUpdate = this.____classes ? v == undefined : 0;
                    this.__selfProperties.sha = v;
                }
                //undebug
            }
        },
        sva: {
            get: function () { return this.____sva; }, set: function (v) {
                this.____sva = v; this.__dirty = 1;
                //debug
                if (!__propertiesAppliedByClass) {
                    this.__needClassUpdate = this.____classes ? v == undefined : 0;
                    this.__selfProperties.sva = v;
                }
                //undebug
            }
        },


        __tableAlignRows: { get: function () { return this.____tableAlignRows; }, set: function (v) { this.____tableAlignRows = v; this.__dirty = 2; } },
        __tableAlignColumns: { get: function () { return this.____tableAlignColumns; }, set: function (v) { this.____tableAlignColumns = v; this.__dirty = 2; } },
        __tableAlignColumnWidth: { get: function () { return this.____tableAlignColumnWidth; }, set: function (v) { this.____tableAlignColumnWidth = v; this.__dirty = 2; } },
        __tableAlignRowHeight: { get: function () { return this.____tableAlignRowHeight; }, set: function (v) { this.____tableAlignRowHeight = v; this.__dirty = 2; } },

        __selfAlignment: {
            get: function () { return [this.____sha, this.____sva]; },
            set: function (v) { if (isArray(v)) { this.sha = v[0]; this.sva = v[1]; } else { this.sva = this.sha = v; } }
        },

        __alignment: {
            get: function () { return [this.____ha, this.____va]; },
            set: function (v) { if (isArray(v)) { this.ha = v[0]; this.va = v[1]; } else { this.va = this.ha = v; } }
        },

        cropx: {
            get: function () { return this.____cropx; }, set: function (v) {
                if (this.____cropx != v) {
                    this.____cropx = v;
                    this.__onlyScrollX = !this.____cropy;
                    this.__onlyScrollY = 0;
                    this.__needScissor = v != undefined;
                    this.__dirty = 1;

                    //debug
                    if (!__propertiesAppliedByClass) this.__selfProperties.cropx = v;
                    //undebug

                }
            }
        },

        cropy: {
            get: function () { return this.____cropy; }, set: function (v) {
                if (this.____cropy != v) {
                    this.____cropy = v;
                    this.__onlyScrollY = !this.____cropx;
                    this.__onlyScrollX = 0;
                    this.__needScissor = v != undefined;
                    this.__dirty = 1;

                    //debug
                    if (!__propertiesAppliedByClass) this.__selfProperties.cropy = v;
                    //undebug

                }
            }
        },

        __crop: {
            get: function () { return [this.____cropx, this.____cropy]; },
            set: function (v) { if (isArray(v)) { this.cropx = v[0]; this.cropy = v[1]; } else { this.cropx = this.cropy = v; } }
        },

        __visible: {
            get: function () { return this.____visible; },
            set: function (v) {
                if (this.____visible != v) {
                    this.____visible = v;
                    this.__dirty = 3;
                    //debug
                    if (!__propertiesAppliedByClass) this.__selfProperties.__visible = v;
                    //undebug

                }
            }
        },

        __glscissor: {
            get: function () {
                var t = this;
                if (t.__needScissor) {
                    var sciss = t.__getScissor();
                    if (t.__viewable && sciss) {
                        sciss = sciss.clone();
                        //debug
                        if (!t.__camera) {
                            t.__camera = (t.__root || 0).camera || camera;
                        }
                        var cam = t.__camera, zoom = cam.__zoom;
                        sciss.x = (sciss.x - cam.__x) * zoom;
                        sciss.y = (sciss.y + cam.__y) * zoom;
                        sciss.z *= zoom;
                        sciss.w *= zoom;
                        //undebug

                        var scy = -sciss.y + __screenCenter.y,
                            scx = sciss.x + __screenCenter.x;

                        sciss.x = mmax(0, scx);
                        sciss.y = mmax(0, scy);
                        sciss.z = mmax(0, sciss.z - sciss.x + scx);
                        sciss.w = mmax(0, sciss.w - sciss.y + scy);

                        if (t.__onlyScrollX) {
                            sciss.y = 0;
                            sciss.w = __screenSize.y;
                        }
                        else
                            if (t.__onlyScrollY) {
                                sciss.x = 0;
                                sciss.z = __screenSize.x;
                            }

                        return sciss.__multiplyScalar(layoutsResolutionMult);
                    }
                }
            }
        },

        __simpleAnimation: {
            get: function () { return this.____animation; },
            set: function (v) {
                var t = this; t.____animation = v;
                if (!options.__disableAutoanim) {
                    if (isArray(v)) {
                        for (var i in v) {
                            var a = v[i];
                            var prop = {};
                            prop[NODE_ANIM_PROPS[a[0]]] = a[1];
                            tween.action(t, prop, a[2], a[3], a[4], a[5], a[6]);
                        }
                    }
                }
            }
        },

        __transform: {
            get: function () {
                var t = this;
                return [
                    t.__offset.x,
                    t.__offset.y,
                    t.____scale.x,
                    t.____scale.y,
                    t.__rotate
                ]
            },
            set: function (a) {
                var t = this;
                t.__offset.x = a[0];
                t.__offset.y = a[1];
                t.____scale.x = a[2];
                t.____scale.y = a[3];
                t.__rotate = a[4];
            }
        },

        __keyframes: {
            get: function () {
                return this.____keyframes;
            },
            set: function (v) {
                var t = this;

                if (v && v.__track) {
                    v.__keyframes = $map(v.__track, function (frames) { return $map(frames, function (f) { return { va: f } }) });
                    delete v.__track;
                }

                for (var i in t.____keyframesAnimations)
                    killAnim(t.____keyframesAnimations[i]);

                t.____keyframesAnimations = {};

                var kf = t.____keyframes = v;

                if (options.__disableKeyframesAnimation)
                    return;

                if (t.__keyframesDisabled)
                    return;

                if (v) {

                    if (v.__keyframes) {
                        v = v.__keyframes;
                    }

                    if (kf.__relative && v.__transform) {
                        var ofs = t.__ofs, x = ofs.x, y = ofs.y,
                            scl = t.__scale, sx = scl.x, sy = scl.y,
                            r = t.__rotate;

                        $each(v.__transform, function (fr) {
                            fr.va[0] += x;
                            fr.va[1] += y;
                            fr.va[2] *= sx;
                            fr.va[3] *= sy;
                            fr.va[4] += r;
                        });
                    }

                    $each(v, function (vv, p) {
                        tween.__push(t.____keyframesAnimations[p] = new KeyframesAnimation(t, p, vv, kf.loop, kf.__easing, kf.__loopDisabled, kf.__lerp));
                    });
                }

            }
        },

        __animation: {
            get: function () { return this.____animation; },
            set: function (v) {
                var t = this;
                t.____animation = v;
                if (!options.__disableAutoanim) {
                    if (isString(v)) {
                        var a = v.split('\n');
                        for (var i in a) {
                            var s = a[i];
                            if (s.length > 0) {
                                // linear rotation
                                if (s[0] == 'r') {
                                    t.__rotate = t.__rotate % 360;
                                    var seconds = parseFloat(s.substr(1));
                                    if (seconds) {
                                        // simple linear rotation
                                        var beginRotation = this.____rotation;
                                        this.____animatronix = function () {
                                            this.____rotation = (beginRotation + 0.006283185307179587 * __gameTime / seconds);
                                            this.__matrixNeedsUpdate = 1;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        __fullname: {
            get: function () {
                var t = this, s = '', p;
                while (t) {
                    p = t.parent; s = (p ? '.' : '') + (t.name == undefined ? '[' + t.__realIndex + ']' : t.name) + s;
                    if (t.__isScene) break;
                    t = p;
                    if (!p) break;
                }
                return s;
            }
        },

        __classModificator: {
            set: function (v) {
                var t = this, c = t.____classes;

                if (v) {
                    var changed = 0;
                    if (c) {
                        for (var i = 0; i < c.length; i++) {
                            if (getUIClass(c[i] + ":" + v)) {
                                c[i] = c[i] + ":" + v;
                                changed = 1;
                            }
                        }
                    }
                    if (changed) {
                        t.__classes = t.__classes;
                    }

                } else {
                    if (t.____classModificator && c) {
                        t.__classes = c.m$(function (ci) { return ci.split(":")[0] });
                    }
                }
                t.____classModificator = v;
            },
            get: function () { return this.____classModificator }
        },

        __classes: {
            set: function (v) {
                //debug

                var tmpClass = __propertiesAppliedByClass;
                if (!__propertiesAppliedByClass) {
                    this.____classes = v;
                } else {
                    //                 debugger;
                }

                // removeClasses ?
                this.__removeChildsByFilter(function (n) { return n.__nestedByClass; });

                //undebug

                if (isArray(v)) {
                    for (var i = 0; i < v.length; i++) {
                        //debug
                        __propertiesAppliedByClass = v[i];
                        //undebug
                        this.__init(getUIClass(v[i]));
                    }
                }

                //debug
                __propertiesAppliedByClass = tmpClass;
                if (v) {
                    for (var i in this.__selfProperties) {
                        if (this.__selfProperties[i] !== undefined) {
                            this[i] = this.__selfProperties[i];
                        }
                    }
                } else {
                    this.__init(this.__selfProperties);
                }
                //undebug

            },
            get: function () { return this.____classes; }
        },

        __class: {
            set: function (v) {
                var t = this;
                if (!v) {
                    t.__classes = v;
                } else
                    if (isString(v)) {
                        t.__classes = explodeString(v);
                    } else
                        if (isArray(v)) {
                            t.__classes = v;
                        }
            },

            get: function () {
                var c = this.__classes;
                if (c) return c.join(', ');
            }
        },

        __animatedText: {
            set: function (v) {
                var t = this;
                t.____animatedText = v;
                v = floor(v);
                if (!t.____animatedTextBlocked) {
                    t.__text = t.____animatedTextFormat ? t.____animatedTextFormat.__format(v) : v;
                }
            },
            get: function (v) { return this.____animatedText; }
        },

        //     __shadow: ShadowPropertyPrototype(),

        __index: {
            set: function (v) { this.____index = Number(v) },
            get: function () {
                if (this.____index == undefined) {
                    this.____index = this.parent ? this.parent.__childs.indexOf(this) : 0;
                }
                return this.____index;
            }
        },

        __realIndex: {
            set: function (v) {
                v = Number(v);
                if (this.parent) {
                    var childs = this.parent.__childs;
                    this.____index = childs.indexOf(this);
                    v = clamp(v, 0, childs.length - 1);
                    if (v != this.____index) {
                        var c = childs[v];
                        c.____index = this.____index;
                        childs[v] = this;
                        childs[c.____index] = c;
                        this.____index = v;
                        this.__dirty = 3;
                    }
                }
            },
            get: function () {
                return this.____index = this.parent ? this.parent.__childs.indexOf(this) : 0;
            }
        },

        __fitImgX: {
            set: function (v) {
                if (this.____fitImgX != v) {
                    this.____fitImgX = v;
                    this.__dirty = 1;
                    //debug
                    if (!__propertiesAppliedByClass) {
                        this.__selfProperties.__fitImgX = v;
                        this.__needClassUpdate = this.____classes ? 1 : 0;
                    }
                    //undebug
                }
            },
            get: function () {
                return this.____fitImgX;
            }
        },

        __fitImgY: {
            set: function (v) {
                if (this.____fitImgY != v) {
                    this.____fitImgY = v;
                    this.__dirty = 1;
                    //debug
                    if (!__propertiesAppliedByClass) {
                        this.__selfProperties.__fitImgY = v;
                        this.__needClassUpdate = this.____classes ? 1 : 0;
                    }
                    //undebug
                }
            },
            get: function () {
                return this.____fitImgY;
            }
        },

        __fitImgFlag: {
            set: function (v) {
                this.__fitImg = v ? 1 : 0;
            },
            get: function () {
                return this.__fitImgX || this.__fitImgY;
            }
        },

        __fitImg: {
            set: function (v) {
                if (isNumeric(v)) {
                    this.__fitImgX = this.__fitImgY = v;
                }
                else {
                    this.__fitImgX = v == undefined ? undefined : v.x || 0;
                    this.__fitImgY = v == undefined ? undefined : v.y || 0;
                }
            },
            get: function () {
                return { x: this.____fitImgX, y: this.____fitImgY };
            }
        },

        __prevNode: createSomePropertyWithGetterAndSetter(function () { return this.parent.__childs[this.__realIndex - 1] }),
        __nextNode: createSomePropertyWithGetterAndSetter(function () { return this.parent.__childs[this.__realIndex + 1] }),


        __scrollX: createSomePropertyWithGetterAndSetter(
            function () { return (this.__scrollVector || 0).x || 0; },
            function (x) {
                var t = this;
                if (!t.__scrollVector) { t.__scrollVector = new Vector2(); }
                if (t.__scrollVector.x != x) {
                    t.__scrollVector.x = x;
                    t.__scrollVectorNeedsUpdate = t.__matrixWorldNeedsUpdate = 1;
                    if (t.__onScroll)
                        t.__onScroll();
                }
            }
        ),
        __scrollY: createSomePropertyWithGetterAndSetter(
            function () { return (this.__scrollVector || 0).y || 0; },
            function (y) {
                var t = this;
                if (!t.__scrollVector) { t.__scrollVector = new Vector2(); }
                if (t.__scrollVector.y != y) {
                    t.__scrollVector.y = y;
                    t.__scrollVectorNeedsUpdate = t.__matrixWorldNeedsUpdate = 1;
                    if (t.__onScroll)
                        t.__onScroll();
                }
            }
        ),

        __scroll: {
            set: function (v) {
                var t = this;

                if (v) {
                    t.__scrollable = 1;
                    t.__onScroll = v.__onScroll;
                }
                else {
                    t.__scrollable = 0;
                    t.__onScroll = 0;
                }

                t.__onlyScrollY = v.__onlyScrollY;
                t.__onlyScrollX = v.__onlyScrollX;
                t.____scroll = v;
                t.__needScissor = v ? v.__noScissor ? 0 : 1 : 0;

                t.__updateSlider = function () { };
                t.__updateSliderVisibility = function () { };

                var vslider = v ? v.__sliderY || v.__slider : 0;
                var hslider = v ? v.__sliderX : 0;

                function usv(slider, f) {
                    if (!slider)
                        return;

                    if (slider.__a) {
                        _clearTimeout(slider.__a);
                        slider.__a = 0;
                    }

                    if (f) {

                        slider.__visible = 1;

                        if (slider.__visibilityChecked) {
                            slider.__traverseVisible(function (n) { n.__anim({ __alpha: 1 }, 0.3); })
                        } else {
                            slider.__traverseVisible(function (n) { n.__alpha = 1; })
                        }

                    } else {

                        if (slider.__visibilityChecked) {
                            slider.__a = _setTimeout(function () { slider.__a = slider.__visible = 0 }, 0.3);
                            slider.__traverseVisible(function (n) { n.__anim({ __alpha: 0 }, 0.3); })
                        } else {
                            slider.__traverseVisible(function (n) { n.__alpha = 0; });
                            slider.__visible = 0;
                        }

                    }
                    slider.__visibilityChecked = 1;
                }


                t.__updateSliderVisibility = function () {
                    if (!t.____scroll.__dontHideSlider) {
                        usv(vslider, t.__needScrollY);
                        usv(hslider, t.__needScrollX);
                    }
                };


                function updSlY(slider, percent, time) {
                    if (!slider)
                        return;

                    if (slider.__needUpdate)
                        slider.update();

                    var thumb = slider.__thumb;
                    if (thumb) {
                        var thumbSize = thumb.__size.y;
                        var sliderSize = slider.__size.y - thumbSize;
                        var y = sliderSize * (mmin(1, mmax(0, percent)) - 0.5);
                        if (thumb.__a) {
                            killAnim(thumb.__a);
                            thumb.__a = 0;
                        }

                        if (time) {
                            thumb.__a = anim(thumb, { __y: y }, time, 0, easeSineO, 0);
                        } else {
                            thumb.__y = y;
                        }
                    }

                }

                function updSlX(slider, percent, time) {
                    if (!slider)
                        return;

                    if (slider.__needUpdate)
                        slider.update();

                    var thumb = slider.__thumb;
                    if (thumb) {
                        var thumbSize = thumb.__size.x;
                        var sliderSize = slider.__size.x - thumbSize;
                        var x = sliderSize * (mmin(1, mmax(0, percent)) - 0.5);
                        if (thumb.__a) {
                            killAnim(thumb.__a);
                            thumb.__a = 0;
                        }

                        if (time) {
                            thumb.__a = anim(thumb, { __x: x }, time, 0, easeSineO, 0);
                        } else {
                            thumb.__x = x;
                        }
                    }

                }

                t.__updateSlider = function (xpercent, ypercent, time) {
                    t.__updateSliderVisibility();
                    updSlY(vslider, ypercent, time);
                    updSlX(hslider, xpercent, time);
                };

                function prepareSliderY(slider) {
                    if (!slider)
                        return;

                    var thumb = slider.__thumb;

                    if (thumb) {

                        thumb.__ofs.copy(thumb.__offsetByParent);
                        thumb.__ofs.y *= -1;
                        thumb.__offsetByParent.set(0, 0, 0);
                        thumb.__disableAlign = 1;

                        onTapHighlight(slider, thumb);
                        slider.__init({

                            __canDrag: function () {
                                thumb.__y = mouse.y - slider.__screenPosition().y;
                                if (slider.__drag(0, 0, 0, 0)) {
                                    slider.__highlight(1);
                                    return 1;
                                }
                            },

                            __drag: function (x, y, dx, dy) {
                                if (!t.__scrollMin)
                                    t.__dragStart();

                                var sliderSize = slider.__size.y - thumb.__size.y;

                                if (thumb.__a) {
                                    killAnim(thumb.__a);
                                    thumb.__a = 0;
                                }

                                thumb.__y = mmax(-sliderSize / 2, mmin(sliderSize / 2, thumb.__y + dy));

                                var percent = thumb.__y / sliderSize + 0.5;

                                if (t.__needScrollY) {
                                    t.__scrollY = percent * t.__scrollMin.y;
                                }

                                return 1;
                            },

                            __dragEnd: function () {
                                slider.__highlight(0, 0.3)
                            }

                        });
                    }

                }

                function prepareSliderX(slider) {
                    if (!slider)
                        return;

                    var thumb = slider.__thumb;

                    if (thumb) {

                        thumb.__ofs.copy(thumb.__offsetByParent);
                        //thumb.__ofs.y *= -1;
                        thumb.__offsetByParent.set(0, 0, 0);
                        thumb.__disableAlign = 1;

                        onTapHighlight(slider, thumb);
                        slider.__init({

                            __canDrag: function () {
                                thumb.__x = mouse.x - slider.__screenPosition().x;
                                if (slider.__drag(0, 0, 0, 0)) {
                                    slider.__highlight(1);
                                    return 1;
                                }
                            },

                            __drag: function (x, y, dx, dy) {
                                if (!t.__scrollMin)
                                    t.__dragStart();

                                var sliderSize = slider.__size.x - thumb.__size.x;

                                if (thumb.__a) {
                                    killAnim(thumb.__a);
                                    thumb.__a = 0;
                                }

                                thumb.__x = mmax(-sliderSize / 2, mmin(sliderSize / 2, thumb.__x + dx));

                                var percent = thumb.__x / sliderSize + 0.5;

                                if (t.__needScrollX) {
                                    t.__scrollX = percent * t.__scrollMin.x;
                                }

                                return 1;
                            },

                            __dragEnd: function () {
                                slider.__highlight(0, 0.3)
                            }

                        });
                    }

                }

                prepareSliderX(hslider);
                prepareSliderY(vslider);


                t.__init({

                    __dragStart: v ? function () {
                        var t = this;
                        t.__cumulated = (t.__cumulated || new Vector2()).set(0, 0);

                        if (t.__a) {
                            killAnim(t.__a);
                            t.__a = 0;
                        }

                        var bb = t.__getBoundingBox(1, 1)
                            , swch = bb.max.sub(bb.min)
                            , sz = t.__size
                            , p = t.__padding || [0, 0, 0, 0];

                        t.__scrollMin = { x: sz.x - swch.x - (p[1] + p[3]), y: swch.y - sz.y + (p[0] + p[2]) };
                        t.__needScrollX = t.__onlyScrollY ? false : t.__scrollMin.x < -1;
                        t.__needScrollY = t.__onlyScrollX ? false : t.__scrollMin.y > 1;



                        return t;
                    } : undefined,

                    __drag: v ? function (x, y, dx, dy) {
                        var t = this;

                        t.__lastDrag = TIME_NOW;

                        if (t.__needScrollY) {
                            t.__cumulated.y = 0.3 * t.__cumulated.y - dy * 0.7;

                            y = t.__scrollY;
                            var mdy = y;
                            if (mdy < 0 && dy > 0) {
                                dy /= 1 + mdy * mdy / 200;
                                if (mdy < -100) dy = 0;
                            }
                            else {
                                mdy = y - t.__scrollMin.y;
                                if (mdy > 0 && dy < 0) {
                                    dy /= 1 + mdy * mdy / 200;
                                    if (mdy > 100) dy = 0;
                                }
                            }

                            if (dy != 0) {
                                t.__scrollY = y - dy;
                            }

                        }

                        if (t.__needScrollX) {

                            t.__cumulated.x = 0.3 * t.__cumulated.x + dx * 0.7;

                            var x = t.__scrollX;
                            var mdx = - x;

                            if (mdx <= 0 && dx > 0) {
                                dx /= 1 + mdx * mdx / 200;
                                if (mdx < -100) dx = 0;
                            }
                            else {
                                mdx = t.__scrollMin.x - x;
                                if (mdx > 0 && dx < 0) {
                                    dx /= 1 + mdx * mdx / 200;
                                    if (mdx > 100) dx = 0;
                                }
                            }

                            if (dx != 0) {
                                t.__scrollX = x + dx;
                            }

                        }

                        if (t.__needScrollX || t.__needScrollY) {
                            t.__updateSlider(t.__scrollX / t.__scrollMin.x, t.__scrollY / t.__scrollMin.y);
                        }

                    } : undefined,
                    __dragEnd: v ? function () {
                        var t = this;
                        if (t.__needScrollX || t.__needScrollY) {
                            var mult = 50 * (TIME_NOW - t.__lastDrag);
                            mult = mult * mult * mult * mult;
                            t.__cumulated.__divideScalar(1 + mult);
                            var curx = t.__scrollX, cury = t.__scrollY
                                , x = curx + t.__cumulated.x * 20
                                , y = cury + t.__cumulated.y * 20
                                , time = 0.2 + sqrt(mmax(abs(t.__cumulated.y), abs(t.__cumulated.x))) / 20
                                , e = easeSineO, sltime = time
                                , mss = t.__scroll.__maxSwipeScreens;

                            if (t.__needScrollY) {
                                if (y > t.__scrollMin.y) { e = easeBackO; y = t.__scrollMin.y; } else
                                    if (y < 0) { e = easeBackO; y = 0; }
                                var step = t.__scroll.__stepy;
                                if (step) {
                                    if (mss) {
                                        var mm = step * mss / 2;
                                        y = clamp(cury + clamp( t.__cumulated.y * 20, -mm, mm), 0, t.__scrollMin.y);
                                    }
                                    y = roundByStep(y, step);
                                    if (t.__scroll.__needSwipe && roundByStep(cury, step) == y) {
                                        y = clamp(roundByStep(y + sign(t.__cumulated.y || 1) * step, step), t.__scrollMin.y, 0);
                                        y = roundByStep(y, step);
                                    }
                                }
                                time *= t.__scroll.__autoScrollTimeMult || 1;
                                t.__a = anim(t, { __scrollY: y }, time, 0, e, 0);
                            }
                            else
                                if (t.__needScrollX) {
                                    if (x < t.__scrollMin.x) { e = easeBackO; x = t.__scrollMin.x; } else
                                        if (x > 0) { e = easeBackO; x = 0; }
                                    var step = t.__scroll.__stepx;
                                    if (step) {
                                        if (mss) {
                                            var mm = step * mss / 2;
                                            x = clamp(curx + clamp( t.__cumulated.x * 20, -mm, mm), t.__scrollMin.x, 0);
                                        }
                                        
                                        x = roundByStep(x, step);

                                        if (t.__scroll.__needSwipe && roundByStep(curx, step) == x) {
                                            x = clamp(roundByStep(x + sign(t.__cumulated.x || 1) * step, step), t.__scrollMin.x, 0);
                                            x = roundByStep(x, step);
                                        }
                                    }
                                    time *= t.__scroll.__autoScrollTimeMult || 1;
                                    t.__a = anim(t, { __scrollX: x }, time, 0, e, 0);
                                }

                            t.__updateSlider(x / t.__scrollMin.x, y / t.__scrollMin.y, sltime);

                        }
                    } : undefined
                }).update(1);

                if (v && v.__autoScroll) {
                    if (t.__dragStart) t.__dragStart();
                    if (t.__updateSlider) t.__updateSlider(v.x || 0, v.y || 0);
                }

            },
            get: function () { return this.____scroll; }
        },


        __blending: {
            get: function () { return this.____blending },
            set: function (v) {
                if (isObject(v)) {
                    this.____registeredBlending = registerBlending(v);
                } else {
                    this.____registeredBlending = v;
                }

                this.____blending = v;
                //debug
                if (!__propertiesAppliedByClass) this.__selfProperties.__blending = v;
                //undebug
            }
        },

        // properties for shaders
        frrot: createSomePropertyWithGetterAndSetter(function () { return (this.__frame || 0).R }),
        frcnt: createSomePropertyWithGetterAndSetter(function () { return (this.__frame || 0).c || defaultHalfVector2 }),

        scratio: createSomePropertyWithGetterAndSetter(function () { return __screenSize.x / __screenSize.y }),
        sc: createSomePropertyWithGetterAndSetter(function () { return __screenSize }),

        dt: createSomePropertyWithGetterAndSetter(function () { return __currentFrameDeltaTime / 1000; }),
        time: createSomePropertyWithGetterAndSetter(function () { return __lastOnFrameTime / 1000; }),
        size: createSomePropertyWithGetterAndSetter(function () { return this.__geomSize || this.__size }),
        width: createSomePropertyWithGetterAndSetter(function () { return this.__width }),
        height: createSomePropertyWithGetterAndSetter(function () { return this.__height }),

        imgsz: createSomePropertyWithGetterAndSetter(function () { return this.____imgSize }),
        imgw: createSomePropertyWithGetterAndSetter(function () { return this.____imgSize ? this.____imgSize.x : 0 }),
        imgh: createSomePropertyWithGetterAndSetter(function () { return this.____imgSize ? this.____imgSize.y : 0 }),

        atlassz: createSomePropertyWithGetterAndSetter(function () { return this.____atlasSize }),
        atlasw: createSomePropertyWithGetterAndSetter(function () { return this.____atlasSize ? this.____atlasSize.x : 0 }),
        atlash: createSomePropertyWithGetterAndSetter(function () { return this.____atlasSize ? this.____atlasSize.y : 0 }),

        uvrx: createSomePropertyWithGetterAndSetter(function () { return this.____imgSize ? this.____imgSize.x / this.____atlasSize.x : 0 }),
        uvry: createSomePropertyWithGetterAndSetter(function () { return this.____imgSize ? this.____imgSize.y / this.____atlasSize.y : 0 }),
        uvix: createSomePropertyWithGetterAndSetter(function () { return this.____imgSize ? this.____atlasSize.x / this.____imgSize.x : 0 }),
        uviy: createSomePropertyWithGetterAndSetter(function () { return this.____imgSize ? this.____atlasSize.y / this.____imgSize.y : 0 }),

        __imgRepeatY: createSomePropertyWithGetterAndSetter(
            function () { return this.____imgRepeatY },
            function (v) {
                this.____imgRepeatY = v; this.__updateUVS();
                if (!__propertiesAppliedByClass)
                    this.__selfProperties.__imgRepeatY = v;
            }
        ),

        __imgRepeatX: createSomePropertyWithGetterAndSetter(
            function () { return this.____imgRepeatX },
            function (v) {
                this.____imgRepeatX = v; this.__updateUVS();
                if (!__propertiesAppliedByClass)
                    this.__selfProperties.__imgRepeatX = v;
            }
        ),

        __uvsTransform: createSomePropertyWithGetterAndSetter(
            function () { return this.____uvsTransform || 0 },
            function (v) { this.____uvsTransform = v; this.__updateUVS(); }
        ),

        __validToSave: createSomePropertyWithGetterAndSetter(
            function () {
                return this.____validToSave != undefined ? this.____validToSave : !this.__nestedByClass;
            },
            function (v) {
                this.____validToSave = v;
            }
        ),

        //debug
 
        __classesObj: createSomePropertyWithGetterAndSetter(
            function () {
                return this.____classesObj;
            },
            function (v) {
                registerClasses(v);
                this.____classesObj = v;
            }
        ),

        __eSize: createSomePropertyWithGetterAndSetter(
            function () {
                if (this.____size) {
                    var v = this.____size.clone();
                    v.px = this.____size.px;
                    v.py = this.____size.py;
                    return v;
                }

                return this.__size;
            },
            function (v) {
                this.__size = v;
            }
        ),

        __eWidth: createSomePropertyWithGetterAndSetter(
            function () {
                return this.____size ? { x: this.____size.x, px: this.____size.px } : { x: this.__width }
            },
            function (v) {
                if (isObject(v)) {
                    this.____size = this.____size || new Vector2();
                    this.____size.x = v.x;
                    this.____size.px = v.px;
                    this.__size = this.____size;
                }
            }
        ),

        __eHeight: createSomePropertyWithGetterAndSetter(
            function () {
                return this.____size ? { y: this.____size.y, py: this.____size.py } : { y: this.__height }
            },
            function (v) {
                if (isObject(v)) {
                    this.____size = this.____size || new Vector2();
                    this.____size.y = v.y;
                    this.____size.py = v.py;
                    this.__size = this.____size;
                }
            }
        ),

        //undebug

        __animatronix: createSomePropertyWithGetterAndSetter(
            function () {
                return this.____animatronixv;
            },
            function (v) {
                this.____animatronixv = v;

                if (isFunction(v)) {
                    this.____animatronix = v;
                } else
                    if (v) {

                        if (v.r) {
                            // simple linear rotation
                            var beginRotation = this.____rotation, seconds = v.r;
                            this.____animatronix = function () {
                                this.____rotation = (beginRotation + 0.006283185307179587 * __gameTime / seconds);
                                this.__matrixNeedsUpdate = 1;
                            }

                        } else {


                            var v1, v2, v3, v4;

                            if (isNumeric(v)) {
                                v1 = (v % 10) + 1;
                                v2 = (0.1 + (v % 100 - v % 10) / 100 - 0.001);
                                v3 = (20 + 15 * ((v % 1000 - v % 100) / 1000 - 0.5));
                                v4 = (v % 10000 - v % 1000) / 10000 + 1;
                            } else {
                                v1 = v.v1 || 2;
                                v2 = v.v2 || 0.9;
                                v3 = v.v3 || 20;
                                v4 = v.v4 || 1;
                            }
                            var t = this;
                            t.__wwp = new Vector2(0, 0);
                            t.__wwac = new Vector2(0, 0);
                            t.__realRotate = t.__realRotate || 0;
                            t.__wap = t.__worldPosition;
                            t.__an = new Vector2(0, 0);
                            t.__anc = new Vector2(0, 0);
                            t.____rotation = 0;
                            t.__rotateAcc = 0;
                            this.____animatronix = function () {

                                var wp = t.__worldPosition.clone();
                                var wap = t.__wap;
                                var dt = __currentFrameDeltaTime / 1000;
                                wap = wap.sub(wp);
                                t.__wwp.lerp(wap, 0.4);

                                //                     if (a) {
                                t.__rotateAcc = (t.__rotateAcc * v2 - sign(t.____rotation - t.__realRotate)) * dt / 100 / v1;
                                t.____rotation = lerp(t.____rotation + clamp(atan2(t.__wwp.x, t.__wwp.y + 8) / v3, -0.01, 0.01) + clamp(t.__rotateAcc, -0.001, 0.001), t.__realRotate, dt * v4);
                                //                     }

                                //                     if (t.__asd > 5){
                                //                         t.__wwac.sub(t.__wwp).__multiplyScalar(0.99);
                                //                         
                                //                         t.__anc.x = t.__anc.x * 0.9998 + wap.x * dt / 10 * sign(t.__an.x+0.0001);
                                //                         t.__anc.y = t.__anc.y * 0.9998 + wap.y * dt / 10 * sign(t.__an.y+0.0001);
                                //                         t.__an.x = lerp( t.__an.x + t.__anc.x, 0, dt/10);
                                //                         t.__an.y = lerp( t.__an.y + t.__anc.y, 0, dt/10);
                                // //                         console.log( t.__an.x );
                                //                         t.__matrixWorldNeedsUpdate = 1;
                                //                     }
                                t.__wap = wp;

                                //                         t.__asd = (t.__asd||0)+1;
                            }
                        }

                    } else {
                        this.____animatronix = undefined;
                    }
            }

        ),

        __childsIterator: createSomePropertyWithGetterAndSetter(function () {
            return new NodeChildsIterator(this);
        }),
        __traverseIterator: createSomePropertyWithGetterAndSetter(function () {
            return new NodeTraverseIterator(this);
        }),

        $: {
            value: function (selector, initObj, a) {
                var a = a || new NodeArrayIterator();
                if (isObject(selector)) {
                    return this.$(function (n) {
                        for (var i in selector) if (n[i] != selector[i]) return;
                        return 1;
                    }, initObj, a);
                } else
                    if (isFunction(selector)) {
                        this.__traverse(function (n) {
                            if (selector(n)) {
                                a.push(n);
                            }
                        });
                    } else
                        if (isString(selector)) {

                            var selector = selector.split(' ');
                            if (selector.length > 1) {
                                return this.$(selector, initObj, a);
                            } else {
                                //TODO: by class?
                                this.__getObjectsByName(selector[0], a);
                            }
                        } else
                            if (isArray(selector) && selector.length) {

                                var b = [this];
                                while (selector.length) {
                                    var nodes = [];
                                    $each(b, function (bi) { bi.$(selector[0], 0, nodes); });
                                    b = nodes;
                                    selector.splice(0, 1);
                                }

                                a.push.apply(a, b);

                            } else {
                                this.__traverse(function (n) { a.push(n) });
                            }


                return initObj ? a.__init(initObj) : a;
            }
        },

        __busObservers: createSomePropertyWithGetterAndSetter(
            function () {
                return this.____busObservers;
            },
            function (v) {
                var t = this;
                if (!v) {
                    BUS.__removeEventListener(t);
                } else {
                    if (!t.____busObservers) {
                        t.____busObservers = v;
                    } else {
                        mergeObj(t.____busObservers, v);
                    }

                    if (!t.__on) {
                        t.__on = function (type) {
                            var bo = (t.____busObservers || 0)[type];
                            return bo ? bo.apply(t, arguments) : 1;
                        };
                        BUS.__addEventListener(objectKeys(t.____busObservers), t);
                        t.__addOnDestruct(BUS.__removeEventListener.bind(BUS, t));
                    }
                }
            }
        ),

        __onTapHighlight: createSomePropertyWithGetterAndSetter(0,
            function (v) {
                if (v) {
                    onTapHighlight(this, isNumeric(v) || isFunction(v) ? 0 : this.$(v), isFunction(v) ? v : 0);
                }

                //cheats
                if (v == 2) {
                    this.__minimalTapArea = 20;
                }
                //endcheats
            }
        ),

        __cursor: {
            set(v) {
                this.____cursor = v;
            },
            get() {
                return this.____cursor;
            }
        },

        __addedProperties: createSomePropertyWithGetterAndSetter(
            function () {
                return this.____addedProperties;
            },
            function (v) {
                if (v) {
                    this.____addedProperties = mergeObj(this.____addedProperties || {}, v);
                    ObjectDefineProperties(this, v);
                }
            }
        ),

        __aliasing: { set: function (v) { this.__setAliasesData(v); } },

        __aliasing1: { set: function (v) { this.__setAliasesData(v, 0, 1); } }

    };

//debug
function NodeSelfProperty(publicName, privateName, g, s) {
    g = g || function () { return this[privateName] };
    s = s || function (v) {
        if (this.__debugProperty == publicName)
            debugger;
        this[privateName] = v;
    };

    NodePropertiesObject[publicName] = createSomePropertyWithGetterAndSetter(g, function (v) {
        s.call(this, v);
        if (!__propertiesAppliedByClass) {
            this.__selfProperties[publicName] = v;
        }
    });
}

NodeSelfProperty('__transformAnchor', '____transformAnchor');
NodeSelfProperty('name', '____name');
NodeSelfProperty('__userData', '____userData');
NodeSelfProperty('__alpha', '____alpha');
NodeSelfProperty('__alphaDeep', '____alphaDeep');
NodeSelfProperty('__notNormalNode', '____notNormalNode');

//undebug

ObjectDefineProperties(NodePrototype, NodePropertiesObject);

function NodeArrayIterator() {
    Array.apply(this, arguments);
}

var NodeArrayIteratorPrototype = NodeArrayIterator.prototype = ObjectCreate(Array.prototype);

NodeArrayIteratorPrototype.__properties = {};
function wrapNodeMethodForNodeIterator(method) {
    NodeArrayIteratorPrototype[method] = function () {
        for (var i = 0, l = this.length; i < l; i++) {
            this[i][method].apply(this[i], arguments);
        }
        return this;
    }
}

function wrapNodePropertyForNodeIterator(property) {
    if (!NodeArrayIteratorPrototype.__properties[property]) {
        NodeArrayIteratorPrototype.__properties[property] = 1;
        ObjectDefineProperty(NodeArrayIteratorPrototype, property, {
            set: function (v) {
                for (var i = 0, l = this.length; i < l; i++)
                    this[i][property] = v;
            },
            get: function () {
                var a = [];
                for (var i = 0, l = this.length; i < l; i++)
                    a.push(this[i][property]);
                return a;
            }
        });
    }
}

NodePropertiesObject.parent = NodePropertiesObject.__childs = {};

for (var i in NodePrototype) wrapNodeMethodForNodeIterator(i);
for (var i in NodePropertiesObject) wrapNodePropertyForNodeIterator(i);
for (var i in Object3dPropertiesObject) wrapNodePropertyForNodeIterator(i);
delete NodeArrayIteratorPrototype.__properties;


function createNodeIteratorPrototype(f) {
    var p = function (node) { this.n = node; };
    p.prototype = $map(NodePrototype, f);
    return p;
}

var NodeChildsIterator = createNodeIteratorPrototype(function (method, methodName) {
    return function () {
        var args = arguments;
        method.apply(this.n, args);
        this.n.__eachChild(function (cc) { method.apply(cc, args); });
        return this;
    }
});

var NodeTraverseIterator = createNodeIteratorPrototype(function (method, methodName) {
    return function () {
        var args = arguments;
        this.n.__traverse(function (cc) { method.apply(cc, args); });
        return this;
    }
});





var HTMLNode = makeClass(function (v) {
    var t = this;
    t.__size = [1, 1];
    Node.call(t, v);
    t.__validToSave = 0;
    t.__childs = [];
    t.____vis = 1;
}, {

    __destruct() {
        var t = this;
        NodePrototype.__destruct.call(t);
        t.__reset();
    },

    __updateElement(v) {
        var t = this, lp = this.__htmlElement;
        NodePrototype.__updateMatrixWorld.apply(t, arguments);
        if (lp) {
            var bb = t.__getScreenBoundingBox(1),
                sz = bb[1].sub(bb[0]);

            lp.style = (t.__noEvents ? "pointer-events:none;" : "") +
                "position:fixed;width:" + abs(sz.x) + "px;height:" + abs(sz.y) + "px;" +
                "left:" + bb[0].x + "px; top:" + (bb[0].y + sz.y) + "px;" +
                "display:" + (v ? 'block;' : 'none;');
        }
    },

    __render() {
        var t = this, lp = this.__htmlElement;
        if (lp) {
            t.__updateElement(1);
            if (!lp.parentElement) {
                t.__addToBody();
                t.update();
            }
            t.__lf = __currentFrame;
            var ll = __currentFrame;
            looperPost(f => {
                if (t.__lf == ll) {
                    t.__updateElement(0);
                }
            });
        }
    },

    __reset() {
        var t = this;
        if (t.__htmlElement) {
            html.__removeElement(t.__htmlElement);
            delete t.__htmlElement;
        }
    },

    __addToBody() {
        html.__addHtmlToBody(this.__htmlElement);
    }

}, {
    __vis: {
        set(v) {
            var t = this;
            if (v != t.____vis) {
                t.____vis = v;
                t.__updateElement(v);
            }
        },
        get() {
            return this.____vis;
        }
    },
    __viewable: {
        set(v) { this.__vis = v; },
        get() {
            return this.____vis;
        }
    },
    __visible: {
        set(v) { this.__vis = v; },
        get() {
            return this.____vis;
        }
    }
}, Node);