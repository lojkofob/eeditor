
var AttachedBindMode = 1, DetachedBindMode = 2;

var Default3dCullFace = CullFaceFront;

// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
const _lut = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0a', '0b', '0c', '0d', '0e', '0f', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '1a', '1b', '1c', '1d', '1e', '1f', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '2a', '2b', '2c', '2d', '2e', '2f', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '3a', '3b', '3c', '3d', '3e', '3f', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '4a', '4b', '4c', '4d', '4e', '4f', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '5a', '5b', '5c', '5d', '5e', '5f', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '6a', '6b', '6c', '6d', '6e', '6f', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '7a', '7b', '7c', '7d', '7e', '7f', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '8a', '8b', '8c', '8d', '8e', '8f', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '9a', '9b', '9c', '9d', '9e', '9f', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'aa', 'ab', 'ac', 'ad', 'ae', 'af', 'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'ba', 'bb', 'bc', 'bd', 'be', 'bf', 'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'ca', 'cb', 'cc', 'cd', 'ce', 'cf', 'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'da', 'db', 'dc', 'dd', 'de', 'df', 'e0', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'ea', 'eb', 'ec', 'ed', 'ee', 'ef', 'f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'fa', 'fb', 'fc', 'fd', 'fe', 'ff'];

function generateUUID() {

    const d0 = random() * 0xffffffff | 0;
    const d1 = random() * 0xffffffff | 0;
    const d2 = random() * 0xffffffff | 0;
    const d3 = random() * 0xffffffff | 0;
    const uuid = _lut[d0 & 0xff] + _lut[d0 >> 8 & 0xff] + _lut[d0 >> 16 & 0xff] + _lut[d0 >> 24 & 0xff] + '-' +
        _lut[d1 & 0xff] + _lut[d1 >> 8 & 0xff] + '-' + _lut[d1 >> 16 & 0x0f | 0x40] + _lut[d1 >> 24 & 0xff] + '-' +
        _lut[d2 & 0x3f | 0x80] + _lut[d2 >> 8 & 0xff] + '-' + _lut[d2 >> 16 & 0xff] + _lut[d2 >> 24 & 0xff] +
        _lut[d3 & 0xff] + _lut[d3 >> 8 & 0xff] + _lut[d3 >> 16 & 0xff] + _lut[d3 >> 24 & 0xff];

    // .toLowerCase() here flattens concatenated strings to save heap memory space.
    return uuid.toLowerCase();

}


var factory3d = {

    __model3dDataMap: {},

    __onDataLoaded: function (url, scene) {

        var bv = basename(url).replace(/\?.*$/, '');

        factory3d.__model3dDataMap[bv] = scene ? {
            __scene: scene
        } : { __bad: 1 };

    }

};

function load3d(opts, onload, onerror) {
    return TASKS_RUN([[TASKS_3D, opts]], onload, onerror);
}


var __Object3dProxy = (function () {

    ObjectDefineProperties(NodePrototype, {
        __model3d: {
            get: function () {
                return this.__model3dObject;
            },
            set: function (v) {
                var t = this;
                if (t.____model3dObject) {
                    t.____model3dObject.__destruct();
                    delete t.____model3dObject;
                }
                if (v) {
                    t.__model3dObject = v;
                }
            }
        },

        __model3dObject: {
            get: function () {
                return this.____model3dObject;
            },
            set: function (v) {
                var t = this;
                if (t.____model3dObject == v)
                    return;

                if (t.____model3dObject && (!v || (v instanceof __Object3dProxy))) {
                    t.____model3dObject.__destruct();
                    delete t.____model3dObject;
                }

                if (v instanceof __Object3dProxy) {
                    t.____model3dObject = v;
                }
                else if (v) {
                    if (!t.____model3dObject) {
                        t.____model3dObject = new __Object3dProxy(this)
                    }
                    t.____model3dObject.__init(v);
                }
            }
        }

    });

    return makeClass(function (parentNode) {

        this.__parent = parentNode;

    }, {

        __init: function (v) {
            var t = this, path = v.__path;
            var bv = basename(path).replace(/\?.*$/, '');
            t.____path = path;
            var loadD = factory3d.__model3dDataMap[bv];

            function onload(l) {
                var loadedData = factory3d.__model3dDataMap[bv];
                l.__scene = loadedData.__scene;
                l.__onDataReady();
            };

            if (loadD) {
                if (loadD.__loading) { loadD.__loading.push(t); return t; }
                if (loadD.__bad) return t;
                onload(t);
            } else {
                loadD = factory3d.__model3dDataMap[bv] = { __loading: [t] };

                load3d(v, function () {
                    $each(loadD.__loading, onload);
                    delete loadD.__loading;
                }, function (err) {
                    consoleDebug(err)
                    factory3d.__model3dDataMap[bv] = { __bad: 1 };
                });
            }
            mergeObj(t, v)
            return t;
        },

        __onDataReady: function () {
            var t = this;
            t.__scene.__validToSave = 0;
            t.__parent.__addChildBox(t.__scene);
        },
        //debug
        __toJson: function () {
            var t = this;
            var o = {
                __name: t.__name,
                __path: t.__path,
            };

            if (t.__scene) {
                o.__sceneSave = t.__scene.__toJson();
            }

            return $filterObject(o, a => a);
        },

        //undebug

        __destruct: function () {
            var t = this;
            if (t.__scene)
                t.__scene.__removeFromParent()
            delete t.__scene;
        },

        __play: function (params) { // { __animationName, __speedUp, __repeatNumber, __maxTimeForAnim }

        },

        __stop: function () {
            //this.__setEmptyAnimations();
            return this;
        }

    }, {

    });


})();

mergeObj(LoadTask__loaders, {
    fbx: function (t, l) {
        new FBXLoader().__load(l[1].__path, t)
    }
});


function Node3d(a) {
    var t = this;

    t.__is3D = 1;
    // t.__notNormalNode = 1;

    t.____rotation3d = new Euler();
    t.__quaternion = new Quaternion();

    t.____rotation3d.__onChangeCallback = function () {
        t.__quaternion.__setFromEuler(t.____rotation3d, false);
        t.__dirty = 3;
    };

    t.__quaternion.__onChangeCallback = function () {
        t.____rotation3d.__setFromQuaternion(t.__quaternion, undefined, false);
        t.__dirty = 3;
    };

    Node.call(this, a)

    t.__matrix.__is3D = 1;
    t.mw.__is3D = 1;

    var scale = t.____scale;
    t.____scale = new Vector3(scale.x, scale.y, scale.z == undefined ? scale.x == scale.y ? scale.x : 1 : scale.z);
}

makeClass(Node3d, {

    __addGroup(start, count, materialIndex) {
        if (!this.__groups) this.__groups = [];
        this.__groups.push([start, count, materialIndex || 0])
    },

    __destruct() {
        if (t.____geometry) {
            t.____geometry.__destruct();
            t.____geometry = null;
        }
        NodePrototype.__destruct.call(this)
    },

    __clearGroups() {
        this.__groups = [];
    },

    __applyMatrix4(m) {
        var t = this;
        t.__matrix.__premultiply(m);
        t.__matrix.__decompose(t.__offset, t.__quaternion, t.____scale);
        t.__offset.y *= -1;
    },

    __applyQuaternion(q) {
        this.__quaternion.__premultiply(q);
        return this;
    },

    __updateMatrix() {
        var t = this;
        t.__offset.y *= -1;
        t.__matrix.__compose(t.__offset, t.__quaternion, t.____scale);
        t.__offset.y *= -1;
        t.__matrixWorldNeedsUpdate = 1;
    },

    __drawMe() {
        var t = this;
        if (t.__verticesCount) {
            if (t.__groups) {
                var r = 0;
                $each(t.__groups, g => {
                    t.__currentMaterialIndex = g[2];
                    r += renderer.__draw(t, g[1], 0, g[0]);
                });
                t.__currentMaterialIndex = 0;
                return r;
            } else {
                return renderer.__draw(t, t.__verticesCount);
            }
        } else {
            return NodePrototype.__drawMe.call(t);
        }
    },


    __bind(skeleton, bindMatrix) {

        var t = this;
        t.__skeleton = skeleton;

        if (bindMatrix === undefined) {

            t.__updateMatrixWorld(true);

            t.__skeleton.__calculateInverses();

            bindMatrix = this.__matrixWorld;

        }

        if (!t.__bindMatrix) {
            t.__bindMatrix = new Matrix4();
            t.__bindMatrixInverse = new Matrix4();
        }
        t.__bindMatrix.__copy(bindMatrix);
        t.__bindMatrixInverse.__copy(bindMatrix).__invert();

    }

    , __pose() {
        var skeleton = this.__skeleton;
        if (s) skeleton.__pose();

    }

    , __normalizeSkinWeights() {
        if (!this.__skinWeightBuffer) {
            return;
        }

        const skinWeight = this.__skinWeightBuffer.__array;

        for (let i = 0, l = skinWeight.length; i < l; i += 4) {

            const scale = 1.0 / (abs(skinWeight[i]) + abs(skinWeight[i + 1]) + abs(skinWeight[i + 2]) + abs(skinWeight[i + 3]));

            if (scale !== Infinity) {
                skinWeight[i] *= scale;
                skinWeight[i + 1] *= scale;
                skinWeight[i + 2] *= scale;
                skinWeight[i + 3] *= scale;
            } else {
                skinWeight[i] = 1;
                skinWeight[i + 1] = 0;
                skinWeight[i + 2] = 0;
                skinWeight[i + 3] = 0;
            }

        }

    },

    __updateMatrixWorld(force) {

        var t = this;
        Node.prototype.__updateMatrixWorld.call(t, force);

        if (t.__bindMatrix) {
            if (t.__bindMode === DetachedBindMode) {
                t.__bindMatrixInverse.__copy(t.__bindMatrix).__invert();
            } else {
                t.__bindMatrixInverse.__copy(t.mw).__invert();
            }
        }
    },

    __updateGeometry() {
        var t = this;
        return t.____geometry ? t : NodePrototype.__updateGeometry.call(t);
    },

    __computeBoundingBox() {
        /*
        var t = this;
        const geometry = t.__geometry;

        if ( t.__boundingBox === null ) {
            t.__boundingBox = new Box3();
        }

        t.__boundingBox.__makeEmpty();

        const positionAttribute = geometry.__buffers['position'];

        for ( let i = 0; i < positionAttribute.__array.length/3; i ++ ) {

            t.__getVertexPosition( i, _vertex );
            t.__boundingBox.expandByPoint( _vertex );

        }
        */
    },

    __computeBoundingSphere() {
        /*
        const geometry = this.__geometry;

        if ( t.__boundingSphere === null ) {

            t.__boundingSphere = new Sphere();

        }

        t.__boundingSphere.makeEmpty();

        const positionAttribute = geometry.getAttribute( 'position' );

        for ( let i = 0; i < positionAttribute.count; i ++ ) {

            t.getVertexPosition( i, _vertex );
            t.__boundingSphere.expandByPoint( _vertex );

        }
        */
    }
    /*
    
    __copy(source, recursive) {
        
        super.__copy(source, recursive);

        this.__bindMode = source.__bindMode;
        this.__bindMatrix.__copy(source.__bindMatrix);
        this.__bindMatrixInverse.__copy(source.__bindMatrixInverse);

        this.__skeleton = source.__skeleton;

        if (source.__boundingBox !== null) this.__boundingBox = source.__boundingBox.__clone();
        if (source.__boundingSphere !== null) this.__boundingSphere = source.__boundingSphere.__clone();

        return this;

    }

    raycast(raycaster, intersects) {

        const material = this.material;
        const matrixWorld = this.__matrixWorld;

        if (material === undefined) return;

        // test with bounding sphere in world space

        if (this.__boundingSphere === null) this.computeBoundingSphere();

        _sphere$4.__copy(this.__boundingSphere);
        _sphere$4.applyMatrix4(matrixWorld);

        if (raycaster.ray.intersectsSphere(_sphere$4) === false) return;

        // convert ray to local space of skinned mesh

        _inverseMatrix$2.__copy(matrixWorld).__invert();
        _ray$2.__copy(raycaster.ray).applyMatrix4(_inverseMatrix$2);

        // test with bounding box in local space

        if (this.__boundingBox !== null) {

            if (_ray$2.intersectsBox(this.__boundingBox) === false) return;

        }

        // test for intersections with geometry

        this._computeIntersections(raycaster, intersects, _ray$2);

    }

    getVertexPosition(index, target) {

        super.getVertexPosition(index, target);

        this.applyBoneTransform(index, target);

        return target;

    }*/


    /*
    applyBoneTransform(index, vector) {

        const skeleton = this.__skeleton;
        const geometry = this.__geometry;

        _skinIndex.fromBufferAttribute(geometry.attributes.skinIndex, index);
        _skinWeight.fromBufferAttribute(geometry.attributes.skinWeight, index);

        _basePosition.__copy(vector).applyMatrix4(this.__bindMatrix);

        vector.set(0, 0, 0);

        for (let i = 0; i < 4; i++) {

            const weight = _skinWeight.getComponent(i);

            if (weight !== 0) {

                const boneIndex = _skinIndex.getComponent(i);

                _matrix4.multiplyMatrices(skeleton.bones[boneIndex].__matrixWorld, skeleton.boneInverses[boneIndex]);

                vector.addScaledVector(_vector3.__copy(_basePosition).applyMatrix4(_matrix4), weight);

            }

        }

        return vector.applyMatrix4(this.__bindMatrixInverse);

    }
    */

    , __setupVertexAttributes(program) {
        var t = this;

        if (!t.__buffers || !t.__verticesCount) {
            return NodePrototype.__setupVertexAttributes.call(t, program);
        }

        //debug
        (t.__verticesBuffer || 0).__debugDrawing =
            (t.__uvsBuffer || 0).__debugDrawing =
            (t.__colorsBuffer || 0).__debugDrawing =
            (t.__indecesBuffer || 0).__debugDrawing =
            (t.__skinIndexBuffer || 0).__debugDrawing =
            (t.__skinWeightBuffer || 0).__debugDrawing =
            (t.__normalBuffer || 0).__debugDrawing =
            (t.__uvsBuffer0 || 0).__debugDrawing =
            (t.__uvsBuffer1 || 0).__debugDrawing =
            (t.__uvsBuffer2 || 0).__debugDrawing =
            (t.__uvsBuffer3 || 0).__debugDrawing = t.__debugDrawing;
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

        if (t.__skinIndexBuffer)
            t.__skinIndexBuffer.__passToGL(programAttributes);

        if (t.__skinWeightBuffer)
            t.__skinWeightBuffer.__passToGL(programAttributes);

        if (t.__normalBuffer)
            t.__normalBuffer.__passToGL(programAttributes);

        if (t.__uvsBuffer0)
            t.__uvsBuffer0.__passToGL(programAttributes);

        if (t.__uvsBuffer1)
            t.__uvsBuffer1.__passToGL(programAttributes);

        if (t.__uvsBuffer2)
            t.__uvsBuffer2.__passToGL(programAttributes);

        if (t.__uvsBuffer3)
            t.__uvsBuffer3.__passToGL(programAttributes);

        return 1;
    },


    __updateUVS() {
        return this;
        var t = this;
        if (t.__uvsBuffer0 && !t.__uvsBuffer0.__updated && t.__material && t.__material[0] && t.__material[0].__map) {
            if (t.__groups) {
                $each(t.__groups, g => {
                    t.__transformUvBuf(t.__uvsBuffer0, t.__material[g[2]].__map);
                });
            } else {
                t.__transformUvBuf(t.__uvsBuffer0, t.__material[0].__map);
            }
            t.__uvsBuffer0.__updated = 1;
        }
    },

    __transformUvBuf(buffer, tex) {
        if (buffer && tex) {
            var a = buffer.__array, v = new Vector2(), t = this;
            for (var i = 0; i < a.length; i += 2) {
                v.set(a[i], a[i + 1]);
                t.__transformUv(tex, v);
                a[i] = v.x; a[i + 1] = v.y;
            }
        }
    },

    __transformUv(tex, uv, flipY) {

        var tx = (tex.__offset || 0).x || 0,
            ty = (tex.__offset || 0).y || 0,
            sx = (tex.__repeat || 0).x || 1,
            sy = (tex.__repeat || 0).y || 1,
            c = cos(tex.__rotation || 0),
            s = sin(tex.__rotation || 0),
            cx = (tex.__center || 0).x || 0,
            cy = (tex.__center || 0).y || 0,
            m = new Matrix4().set(
                sx * c, sx * s, - sx * (c * cx + s * cy) + cx + tx, 1,
                - sy * s, sy * c, - sy * (- s * cx + c * cy) + cy + ty, 1,
                0, 0, 1, 0,
                0, 0, 0, 1
            );

        uv.__applyMatrix4(m);

        if (uv.x < 0 || uv.x > 1) {
            switch (tex.__wraps) {
                case GL_REPEAT:
                    uv.x = uv.x - floor(uv.x);
                    break;
                case GL_CLAMP_TO_EDGE:
                    uv.x = uv.x < 0 ? 0 : 1;
                    break;
                case GL_MIRRORED_REPEAT:
                    if (abs(floor(uv.x) % 2) === 1) {
                        uv.x = ceil(uv.x) - uv.x;
                    } else {
                        uv.x = uv.x - floor(uv.x);
                    }
                    break;
            }
        }

        if (uv.y < 0 || uv.y > 1) {
            switch (tex.__wrapt) {
                case GL_REPEAT:
                    uv.y = uv.y - floor(uv.y);
                    break;

                case GL_CLAMP_TO_EDGE:
                    uv.y = uv.y < 0 ? 0 : 1;
                    break;

                case GL_MIRRORED_REPEAT:
                    if (abs(floor(uv.y) % 2) === 1) {
                        uv.y = ceil(uv.y) - uv.y;
                    } else {
                        uv.y = uv.y - floor(uv.y);
                    }
                    break;
            }
        }
        if (flipY) {
            uv.y = 1 - uv.y;
        }
        return uv;

    }


}, {

    ____rotation: {
        get() { return this.____rotation3d._z; },
        set(v) { this.____rotation3d.z = v; }
    },

    __rotation3d: {
        set(v) {
            var r = this.____rotation3d;
            if (!v) {
                r.set(0, 0, 0);
            } else if (isArray(v)) {
                r.__fromArray(v)
            } else if (v.__isEuler) {
                r.__copy(v);
            } else if (v.__isVector3) {
                r.__setFromVector3(v);
            } else if (v.__isQuternion) {
                r.__setFromQuaternion(q, r._w, true);
            }
        },
        get() { return this.____rotation3d; }
    },

    //cheats
    __EditorColors: {
        enumerable: false, value: {
            'DarkSimple': '#aac',
            'DarkBlue': '#88d',
            'LightBlue': '#335'
        }
    },

    __hierarchyColor: {
        enumerable: false, get() {
            return this.__EditorColors[Editor.uiTheme]
        }
    },
    //endcheats

    t_uv0: {
        get() {
            return this.__material[this.__currentMaterialIndex].__map;
        }
    },

    __geometry: {
        set(v) {

            var t = this;
            if (t.____geometry == v)
                return;

            t.____geometry = v;
            // t.__debugDrawing = 1;
            t.__verticesCount = 0;
            t.__dirty = 4;

            if (v) {
                // todo: clone!
                // not supported now
                delete v.__buffers.a_skinIndex;
                delete v.__buffers.a_skinWeight;
                delete v.__buffers.a_normal;
                t.__groups = v.__groups;
                t.__buffers = v.__buffers;
                var mat = v.__material;
                if (isObject(mat)) {
                    t.__material = [v.__material];
                } else if (isArray(mat)) {
                    t.__material = mat;
                }
                t.__currentMaterialIndex = 0;

                t.__verticesBuffer = v.__buffers.a_position;
                t.__colorsBuffer = v.__buffers.a_color;
                t.__skinIndexBuffer = v.__buffers.a_skinIndex;
                t.__skinWeightBuffer = v.__buffers.a_skinWeight;
                t.__normalBuffer = v.__buffers.a_normal;
                t.__uvsBuffer0 = v.__buffers.a_uv0;
                t.__uvsBuffer1 = v.__buffers.a_uv1;
                t.__uvsBuffer2 = v.__buffers.a_uv2;
                t.__uvsBuffer3 = v.__buffers.a_uv3;
                t.__indecesBuffer = v.__buffers.indices;
                if (!v.__normalized) {
                    t.__normalizeSkinWeights();
                    v.__normalized = 1;
                }
                t.__shader = ComputeShaderFor(t)

                if (t.__shader) {
                    if (t.__indecesBuffer) {
                        t.__verticesCount = t.__indecesBuffer.__realsize;
                    } else if (t.__verticesBuffer) {
                        t.__verticesCount = t.__verticesBuffer.__realsize / t.__verticesBuffer.__itemSize;
                    }
                }
                t.__cullFace = Default3dCullFace;

            } else {
                t.__groups =
                    t.__verticesCount =
                    t.__shader =
                    t.__material =
                    t.__buffers =
                    t.__verticesBuffer =
                    t.__colorsBuffer =
                    t.__skinIndexBuffer =
                    t.__skinWeightBuffer =
                    t.__normalBuffer =
                    t.__uvsBuffer0 =
                    t.__uvsBuffer1 =
                    t.__uvsBuffer2 =
                    t.__uvsBuffer3 =
                    t.__indecesBuffer = null;
            }
        },
        get() {
            return this.____geometry;
        }
    },

}, Node);




//////////////////////// Skeleton

function Skeleton(bones, boneInverses) {
    this.uuid = generateUUID();
    this.bones = bones ? bones.slice(0) : [];
    this.boneInverses = boneInverses || [];
    this.boneMatrices = null;
    this.boneTexture = null;
    this.__init();
}

makeClass(Skeleton, {

    __init() {

        const bones = this.bones;
        const boneInverses = this.boneInverses;

        this.boneMatrices = new Float32Array(bones.length * 16);

        // calculate inverse bone matrices if necessary

        if (boneInverses.length === 0) {

            this.__calculateInverses();

        } else {

            // handle special case

            if (bones.length !== boneInverses.length) {

                console.warn('THREE.__skeleton: Number of inverse bone matrices does not match amount of bones.');

                this.boneInverses = [];

                for (let i = 0, il = this.bones.length; i < il; i++) {

                    this.boneInverses.push(new Matrix4());

                }

            }

        }

    },

    __calculateInverses() {

        this.boneInverses.length = 0;

        for (let i = 0, il = this.bones.length; i < il; i++) {

            const inverse = new Matrix4();

            if (this.bones[i]) {

                inverse.__copy(this.bones[i].__matrixWorld).__invert();

            }

            this.boneInverses.push(inverse);

        }

    },

    __pose() {

        // recover the bind-time world matrices

        for (let i = 0, il = this.bones.length; i < il; i++) {

            const bone = this.bones[i];

            if (bone) {

                bone.__matrixWorld.__copy(this.boneInverses[i]).__invert();

            }

        }

        // compute the local matrices, positions, rotations and scales

        for (let i = 0, il = this.bones.length; i < il; i++) {

            const bone = this.bones[i];

            if (bone) {

                if (bone.__parent && bone.__parent.isBone) {

                    bone.__matrix.__copy(bone.__parent.__matrixWorld).__invert();
                    bone.__matrix.__multiply(bone.__matrixWorld);

                } else {

                    bone.__matrix.__copy(bone.__matrixWorld);

                }

                bone.__matrix.__decompose(bone.__offset, bone.__quaternion, bone.__scale);

            }

        }

    },

    __update() {

        const bones = this.bones;
        const boneInverses = this.boneInverses;
        const boneMatrices = this.boneMatrices;
        const boneTexture = this.boneTexture;

        // flatten bone matrices to array

        for (let i = 0, il = bones.length; i < il; i++) {

            // compute the offset between the current and the original transform

            const matrix = bones[i] ? bones[i].__matrixWorld : _identityMatrix$1;

            _offsetMatrix.multiplyMatrices(matrix, boneInverses[i]);
            _offsetMatrix.toArray(boneMatrices, i * 16);

        }

        if (boneTexture !== null) {

            boneTexture.needsUpdate = true;

        }

    },

    __clone() {

        return new Skeleton(this.bones, this.boneInverses);

    },

    __computeBoneTexture() {

        // layout (1 matrix = 4 pixels)
        //      RGBA RGBA RGBA RGBA (=> column1, column2, column3, column4)
        //  with  8x8  pixel texture max   16 bones * 4 pixels =  (8 * 8)
        //       16x16 pixel texture max   64 bones * 4 pixels = (16 * 16)
        //       32x32 pixel texture max  256 bones * 4 pixels = (32 * 32)
        //       64x64 pixel texture max 1024 bones * 4 pixels = (64 * 64)

        let size = sqrt(this.bones.length * 4); // 4 pixels needed for 1 matrix
        size = ceil(size / 4) * 4;
        size = max(size, 4);

        const boneMatrices = new Float32Array(size * size * 4); // 4 floats per RGBA pixel
        boneMatrices.set(this.boneMatrices); // copy current values

        const boneTexture = new DataTexture(boneMatrices, size, size, RGBAFormat, FloatType);
        boneTexture.needsUpdate = true;

        this.boneMatrices = boneMatrices;
        this.boneTexture = boneTexture;

        return this;

    },

    __getBoneByName(name) {

        for (let i = 0, il = this.bones.length; i < il; i++) {

            const bone = this.bones[i];

            if (bone.name === name) {

                return bone;

            }

        }

        return undefined;

    },

    __destruct() {

        if (this.boneTexture !== null) {

            this.boneTexture.__destruct();

            this.boneTexture = null;

        }

    },

    __fromJSON(json, bones) {

        this.uuid = json.uuid;

        for (let i = 0, l = json.bones.length; i < l; i++) {

            const uuid = json.bones[i];
            let bone = bones[uuid];

            if (bone === undefined) {

                console.warn('THREE.__skeleton: No bone found with UUID:', uuid);
                bone = new Node3d();

            }

            this.bones.push(bone);
            this.boneInverses.push(new Matrix4().fromArray(json.boneInverses[i]));

        }

        this.init();

        return this;

    },

    __toJson() {

        const data = {
            metadata: {
                version: 4.6,
                type: 'Skeleton',
                generator: 'SkeletontoJson'
            },
            bones: [],
            boneInverses: []
        };

        data.uuid = this.uuid;

        const bones = this.bones;
        const boneInverses = this.boneInverses;

        for (let i = 0, l = bones.length; i < l; i++) {

            const bone = bones[i];
            data.bones.push(bone.uuid);

            const boneInverse = boneInverses[i];
            data.boneInverses.push(boneInverse.toArray());

        }

        return data;

    }

});
