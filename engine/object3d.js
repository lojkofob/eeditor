function createUniforms(obj, uniformsList) {
    for (var name in uniformsList) {
        var f = uniformsList[name];
        if (isFunction(f)) {
            var prop = {}; prop[name] = { get: f };
            ObjectDefineProperties(obj, prop);
        }
        else {
            obj[name] = f;
        }
    }
    return obj;
}

function Object3D() {

    ObjectDefineProperty(this, 'id', { value: Object3DIdCount() });

    mergeObj(this, {
        __lastRenderTime: 0,
        __childs: [],
        __offset: new Vector3(0, 0, 0),
        __offsetByParent: new Vector3(0, 0, 0),
        ____anchor: new Vector3(0, 0, 0),

        __matrix: new Matrix4(),

        mw: new Matrix4(),

        __projectionMatrix: defaultIdentityMatrix,

        __matrixWorldNeedsUpdate: 1,
        __matrixNeedsUpdate: 1,

        ____visible: 1,

        __parentScrollVector: defaultZeroVector2,

        __worldPosition: new Vector2(),
        ____skew: new Vector2(),
        ____scale: new Vector2(1, 1),

        ____rotation: 0,

        ____registeredBlending: NormalBlending,
        ____blending: NormalBlending,

        __viewable: 1,
        __selfColor: new Color(1, 1, 1),
        __alphaDeep: 1,
        __opacityDeep: 1,
        __alpha: 1
    });
}

var Object3DPrototype = Object3D.prototype;

ObjectDefineProperties(Object3DPrototype,
    setNonObfuscatedParams({},

        'color', {
        set: function (v) { this.__selfColor = v; },
        get: function (v) { return this.__selfColor; }
    },

        matrixWorld, { get: function (v) { return this.mw; } },
        projectionMatrix, { get: function (v) { return this.__projectionMatrix; } }
    )
)

var Object3dPropertiesObject = {

    opacity: { get: function () { return this.__alpha * this.__opacityDeep; } },

    __matrixWorld: {
        get: function () {
            if (this.____visible && this.__matrixWorldNeedsUpdate || this.__matrixNeedsUpdate)
                this.__updateMatrixWorld();
            return this.mw;
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
            this.__matrixNeedsUpdate = 1;
        }
    },

    __uniforms: {
        get: function () {
            return this.____uniforms;
        },
        set: function (a) {
            this.__createUniforms(a);
            this.____uniforms = a;
        }
    },

    __shader: {
        get: function () { return this.____shader; },
        set: function (v) { this.____shader = v; this.__program = 0; }
    },

    __ready: {
        get: function () {
            var t = this;
            if (t.__notReady) {
                //debug
                consoleLog('not ready', t);
                //undebug
                return 0;
            }

            for (var i = 0; i < this.__childs.length; i++)
                if (this.__childs[i].__ready == 0)
                    return 0;

            return 1;
        }
    }
};
ObjectDefineProperties(Object3DPrototype, Object3dPropertiesObject);

mergeObj(Object3DPrototype, {

    isObject3D: true,

    __visibleForTap: function () {
        var t = this;
        if (!t.____visible || !t.__viewable) {
            return 0;
        }
        if (t.parent) {
            return t.parent.__visibleForTap();
        } else {
            return t.__isScene;
        }
        return 1;

    },

    __deepVisible: function () {
        if (!this.____visible) return false;
        return this.parent ? this.parent.__deepVisible() : 1;
    },

    __anim: function (to, time, repeat, easing, delay, agasp) {
        var t = this;
        if (isArray(to)) {
            if (isObject(to[0])) {
                tween.action(t, to[0], to[1], to[2], to[3], to[4], to[5]);
                return t;
            } else {
                if (to.length) {
                    var seq = new TweenSequence();
                    for (var i = 0; i < to.length; i++) {
                        var pp = to[i];
                        if (isArray(pp)) {
                            seq.__push(new TweenAction(t, pp[0], pp[1], pp[2], pp[3], pp[4], pp[5]));
                        }
                    }
                    seq.a[0].__zeroUpdate();
                    tween.__push(seq);
                }
            }
        }
        else
            if (isFunction(to)) {
                tween.__push(new TweenCallback(to.bind(t)));
            } else {
                //     consoleLog(to, time, repeat, easing, delay );
                tween.action(t, to, time, repeat, easing, delay, agasp);
            }
        return t;
    },


    __addOnDestruct: function (cb) {

        if (!this.__onDestruct) {
            this.__onDestruct = [];
            this.__onDestruct.push(cb);
        }
        else
            if (isFunction(this.__onDestruct)) {
                //DEPRECATED !
                this.__onDestruct = overloadMethod(this.__onDestruct, cb);
            } else {
                this.__onDestruct.push(cb);
            }

        return this;
    },

    __removeAfter: function (sec) {
        var t = this;
        var f = function () { if (t.__removingTimeout) _clearTimeout(t.__removingTimeout); };
        f();
        t.__removingTimeout = _setTimeout(t.__removeFromParentFunction(), sec);
        t.__addOnDestruct(f);
        return this;
    },

    __removeFromParentFunction: function () {

        return this.__removeFromParent.bind(this);

    },

    __destruct: function () {
        var t = this;
        if (t.__onDestruct) {
            if (isArray(t.__onDestruct)) {
                $mfcall(t, t.__onDestruct)
            } else
                //DEPRECATED
                if (isFunction(t.__onDestruct)) {
                    t.__onDestruct();
                }
        }
        t.__destructed = 1;

        return this;
    },


    __insertChildAfter: function (child, afterThat) {
        if (child && afterThat) {
            this.__insertChild(child, afterThat.__realIndex + 1);
        }
        return this;
    },

    __insertChildBefore: function (child, beforeThat) {
        if (child && beforeThat) {
            this.__insertChild(child, beforeThat.__realIndex);
        }
        return this;
    },

    __insertChild: function (child, index) {
        if (child) {
            var p = child.parent;
            if (p == this && child.__realIndex == index)
                return;

            if (p) p.__removeChild(child);
            this.__childs.splice(index, 0, child);
            child.__dirty = this.__dirty = 3;
            child.parent = this;
            child.__root = this.__root || this;
        }
        return this;
    },

    __removeChild: function (object) {
        var index = this.__childs.indexOf(object);
        if (index !== - 1) {
            object.parent = object.__root = null;
            this.__childs.splice(index, 1);
            this.__dirty = 3;
        }
    },

    __removeFromParent: function () {

        if (this.parent) {
            this.parent.__removeChild(this);
            this.parent = 0;
        }

    },

    __removeChildsByFilter: function (f) {
        var childs = this.__childs;
        for (var i = 0; i < childs.length;) {
            if (f(childs[i])) {
                childs[i].__removeFromParent();
            } else { i++; }
        }
    },

    __finishAllAnimations: function () {
        finishAnim(this);
        return this;
    },

    __killAllAnimations: function () {
        killAnim(this);
        return this;
    },

    __getObjectByProperty: function (name, value) {
        if (this[name] === value) return this;
        for (var i = 0; i < this.__childs.length; i++) {
            var a = this.__childs[i].__getObjectByProperty(name, value);
            if (a) return a;
        }
    },

    __getObjectsByProperty: function (name, value, a) {
        a = a || [];
        if (this[name] === value)
            a.push(this);

        for (var i = 0; i < this.__childs.length; i++) {
            this.__childs[i].__getObjectsByProperty(name, value, a);
        }
        return a;
    },

    __getObjectsParentsByProperty: function (name, value, a) {
        a = a || [];
        if (this[name] === value) {
            a.push(this);
        }
        else {
            for (var i = 0; i < this.__childs.length; i++) {
                this.__childs[i].__getObjectsParentsByProperty(name, value, a);
            }
        }
        return a;
    },

    __getObjectByName: function (name) {
        return this.__getObjectByProperty('name', name);
    },

    __getObjectsByName: function (name, a) {
        return this.__getObjectsByProperty('name', name, a);
    },

    __createUniforms: function (uniformsList) {
        return createUniforms(this, uniformsList);
    },

    __getRoot: function () {
        var t = this;
        while (t.parent) {
            t = t.parent;
        }
        return t;
    },

    add: function (object) {


        for (var i = 0; i < arguments.length; i++) {

            var object = arguments[i];
            if (object) {

                if (object.parent) {
                    object.parent.__removeChild(object);
                }

                object.parent = this;
                object.__parentScrollVector = this.__scrollVector || this.__parentScrollVector;
                object.__parentScissor = this.__selfScissor || this.__parentScissor;

                this.__childs.push(object);

                object.__root = this.__root || this;
            }



        }

        return this;

    },

    __getWorldScale: function () {
        var mw = this.__matrixWorld, te = mw.e;
        return new Vector3(
            sqrt(te[0] * te[0] + te[1] * te[1] + te[2] * te[2]) * (mw.determinant() < 0 ? -1 : 1),
            sqrt(te[4] * te[4] + te[5] * te[5] + te[6] * te[6]),
            sqrt(te[8] * te[8] + te[9] * te[9] + te[10] * te[10])
        );
    },

    __eachChild: function (f) {
        $each(this.__childs, f);
    },

    __findChild: function (f) {
        return $find(this.__childs, f);
    },

    __traverse: function (callback) {
        var r = callback(this);
        if (r !== undefined) return r;
        return this.__traverseChilds(callback);
    },

    __traverseFilter: function (callback, filter) {
        if (filter(this)) {
            var r = callback(this);
            if (r !== undefined) return r;
            return this.__traverseChildsFilter(callback, filter);
        }
    },

    __traverseVisible: function (callback) {

        if (!this.____visible) return;

        var r = callback(this);
        if (r !== undefined) return r;

        var childs = this.__childs;

        for (var i = 0, l = childs.length; i < l; i++) {

            r = childs[i].__traverseVisible(callback);
            if (r !== undefined) return r;
        }

    },

    __traverseChildsFilter: function (callback, filter) {
        var childs = this.__childs, r;
        for (var i = 0, l = childs.length; i < l; i++) {
            r = childs[i].__traverseFilter(callback, filter);
            if (r !== undefined) return r;
        }
    },

    __traverseChilds: function (callback) {
        var childs = this.__childs, r;
        for (var i = 0, l = childs.length; i < l; i++) {
            //debug
            if (!childs[i].__traverse)
                debugger;
            //undebug
            r = childs[i].__traverse(callback);
            if (r !== undefined) return r;
        }
    },

    __traverseParents: function (cb) {
        var p = this.parent, r;
        while (p) {
            r = cb(p);
            if (r) return r;
            p = p.parent;
        }
    },

    __updateMatrix: function () {

        var t = this,
            a = t.____anchor,
            q = t.____rotation / 2,
            s = t.____scale,
            S = t.____skew,
            o = t.__offset,
            po = t.__offsetByParent,
            ae = t.__matrix.e,
            z = sin(q),
            z2 = z + z,
            az = 1 - z * z2,
            wz = cos(q) * z2,
            // scale
            sx = s.x, sy = s.y;

        ae[0] = az * sx;
        ae[4] = tan(S.x) - wz * sy;
        ae[1] = tan(S.y) + wz * sx;
        ae[5] = az * sy;

        if (t.__transformAnchor) {

            ae[12] = po.x + o.x;
            ae[13] = po.y - o.y;

        } else {

            var ax = a.x * sx, ay = a.y * sy;

            ae[12] = az * ax - wz * ay - ax + o.x + po.x;
            ae[13] = wz * ax + az * ay - ay - o.y + po.y;

        }

        ae[10] = 1;
        ae[14] = -o.z;

        t.__matrixWorldNeedsUpdate = 1;

        //debug
        if (__window.__debugMatricesUpdates) {
            //             if (t.__lm_wwc > __currentFrame - 5) {

            if (t.__baseDebugColor) {

                if (t.____debugMatricesUpdates) {
                    debugger;
                }

                t.color.r = t.__baseDebugColor.r + randomize(-0.5, 0.5);
                t.color.g = t.__baseDebugColor.g + randomize(-0.5, 0.5);
                t.color.b = t.__baseDebugColor.b + randomize(-0.5, 0.5);

            } else {

                t.__baseDebugColor = t.color.clone();

            }

            //             } else {
            //                 t.__baseDebugColor = 0;
            //             }

            //             t.__lm_wwc = __currentFrame;
        }
        //undebug

        return t;

    },

    __updateMatrixWorld: function (force) {

        if (this.__matrixNeedsUpdate) {
            //cheats
            renderInfo.matrixUpdates++;
            //endcheats
            this.__updateMatrix();
            this.__matrixNeedsUpdate = 0;
        }

        if (this.__matrixWorldNeedsUpdate || force) {
            //cheats
            renderInfo.matrixWorldUpdates++;
            //endcheats
            if (this.parent) {
                this.mw.__multiplyMatrices(this.parent.mw, this.__matrix);
            } else {
                this.mw.copy(this.__matrix);
            }
            this.__matrixWorldNeedsUpdate = 0;
            force = 1;
        }

        // update __childs

        var __childs = this.__childs;
        for (var i = 0, l = __childs.length; i < l; i++) {
            __childs[i].__updateMatrixWorld(force);
        }
    }

});

var count$3 = 0;
function Object3DIdCount() { return count$3++; };



