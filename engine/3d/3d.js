
var AttachedBindMode = 1, DetachedBindMode = 2;


// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
const _lut = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0a', '0b', '0c', '0d', '0e', '0f', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '1a', '1b', '1c', '1d', '1e', '1f', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '2a', '2b', '2c', '2d', '2e', '2f', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '3a', '3b', '3c', '3d', '3e', '3f', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '4a', '4b', '4c', '4d', '4e', '4f', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '5a', '5b', '5c', '5d', '5e', '5f', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '6a', '6b', '6c', '6d', '6e', '6f', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '7a', '7b', '7c', '7d', '7e', '7f', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '8a', '8b', '8c', '8d', '8e', '8f', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '9a', '9b', '9c', '9d', '9e', '9f', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'aa', 'ab', 'ac', 'ad', 'ae', 'af', 'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'ba', 'bb', 'bc', 'bd', 'be', 'bf', 'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'ca', 'cb', 'cc', 'cd', 'ce', 'cf', 'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'da', 'db', 'dc', 'dd', 'de', 'df', 'e0', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'ea', 'eb', 'ec', 'ed', 'ee', 'ef', 'f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'fa', 'fb', 'fc', 'fd', 'fe', 'ff'];

function generateUUID() {

    const d0 = Math.random() * 0xffffffff | 0;
    const d1 = Math.random() * 0xffffffff | 0;
    const d2 = Math.random() * 0xffffffff | 0;
    const d3 = Math.random() * 0xffffffff | 0;
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
            t.__parent.add(t.__scene);
        },


        toJson: function () {
            var t = this;
            return $filterObject({
                __name: t.__name,
                __path: t.__path,
            }, a => a);
        },


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
    t.__validToSave = 0;
    t.__userData = {};

    t.__rotation3d = new Euler();
    t.__quaternion = new Quaternion();

    t.__rotation3d.__onChangeCallback = function () {
        t.__quaternion.setFromEuler(t.__rotation3d, false);
    };

    t.__quaternion.__onChangeCallback = function () {
        t.__rotation3d.__setFromQuaternion(t.__quaternion, undefined, false);
    };

    Node.call(this, a)

    var scale = t.____scale;
    t.____scale = new Vector3(scale.x, scale.y, scale.z == undefined ? 1 : scale.z);
}

makeClass(Node3d, {
    __addGroup(start, count, materialIndex = 0) {
        if (!this.__groups) this.__groups = {};
        this.__groups.push({
            start: start,
            count: count,
            materialIndex: materialIndex
        });
    },

    __clearGroups() {
        this.__groups = [];
    },

    __updateVertices() {
        return this;
    },

    __updateUVS() {
        return this;
    },

    __updateGeometry() {
        return this;
    },

    __applyMatrix4(m) {
        var t = this;
        if (t.__matrixAutoUpdate) t.__updateMatrix();

        t.__matrix.__premultiply(m);
        t.__matrix.__decompose(t.__offset, t.__quaternion, t.____scale);

    },

    __applyQuaternion(q) {
        this.__quaternion.__premultiply(q);
        return this;
    },

    __updateMatrix() {
        var t = this;
        t.__matrix.__compose(t.__offset, t.__quaternion, t.____scale);
        t.__matrixWorldNeedsUpdate = 1;

    },

    __updateMatrixWorld(force) {
        var t = this;
        if (t.__matrixAutoUpdate) t.__updateMatrix();

        if (t.__matrixWorldNeedsUpdate || force) {

            if (t.__matrixWorldAutoUpdate) {

                if (t.__parent === null) {

                    t.__matrixWorld.copy(t.__matrix);

                } else {

                    t.__matrixWorld.multiplyMatrices(t.__parent.__matrixWorld, t.__matrix);

                }

            }

            t.__matrixWorldNeedsUpdate = 0;

            force = true;

        }

        // make sure descendants are updated if required

        const children = t.__childs;

        for (let i = 0, l = children.length; i < l; i++) {

            children[i].__updateMatrixWorld(force);

        }

    },

    __updateWorldMatrix(updateParents, updateChildren) {

        var t = this;

        const parent = t.__parent;

        if (updateParents === true && parent !== null) {

            parent.__updateWorldMatrix(true, false);

        }

        if (t.__matrixAutoUpdate) t.updateMatrix();

        if (t.__matrixWorldAutoUpdate === true) {

            if (t.__parent === null) {

                t.__matrixWorld.copy(t.__matrix);

            } else {

                t.__matrixWorld.multiplyMatrices(t.__parent.__matrixWorld, t.__matrix);

            }

        }

        // make sure descendants are updated

        if (updateChildren === true) {

            const children = t.__childs;

            for (let i = 0, l = children.length; i < l; i++) {

                const child = children[i];

                child.updateWorldMatrix(false, true);

            }

        }

    }

}, {
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
}, Node);




function Bone() {
    Node3d.call(this)
}

makeClass(Bone, {

}, {

}, Node3d);



function SkinnedMesh(geometry, material) {
    Node3d.call(this, {
        __geometry: geometry,
        __material: material,
        __bindMode: AttachedBindMode,
        __bindMatrix: new Matrix4(),
        __bindMatrixInverse: new Matrix4()
    });
}


makeClass(SkinnedMesh, {
    __isSkinnedMesh: true,
    __type: 'SkinnedMesh',

    __destruct() {
        if (t.__geometry) {
            t.__geometry.__destruct();
            t.__geometry = null;
        }
        NodePrototype.__destruct.call(this)
    },

    __updateGeometry() {
        return this;
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

        if (source.__boundingBox !== null) this.__boundingBox = source.__boundingBox.clone();
        if (source.__boundingSphere !== null) this.__boundingSphere = source.__boundingSphere.clone();

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

    , __bind(skeleton, bindMatrix) {

        this.__skeleton = skeleton;

        if (bindMatrix === undefined) {

            this.__updateMatrixWorld(true);

            this.__skeleton.__calculateInverses();

            bindMatrix = this.__matrixWorld;

        }

        this.__bindMatrix.__copy(bindMatrix);
        this.__bindMatrixInverse.__copy(bindMatrix).__invert();

    }

    , __pose() {

        this.__skeleton.__pose();

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

        Node3d.prototype.__updateMatrixWorld.call(this, force);
        var t = this;
        if (t.__bindMode === AttachedBindMode) {

            t.__bindMatrixInverse.__copy(t.mw).__invert();

        } else if (t.__bindMode === DetachedBindMode) {

            t.__bindMatrixInverse.__copy(t.__bindMatrix).__invert();

        }
    }

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

        if (!t.__buffers) {
            return;
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

    __drawMe() {
        var t = this;

        if (t.__material) {
            if (t.__indecesBuffer) {
                renderer.__draw(t, t.__verticesCount || t.__indecesBuffer.__realsize);
                return 1;
            } else if (t.__verticesBuffer) {
                debugger;
                renderer.__draw(t, t.__verticesCount || (t.__verticesBuffer.__realsize / t.__verticesBuffer.__itemSize));
                return 1;
            }
        }
    }

}, {


    __geometry: {
        set(v) {

            var t = this;
            if (v) {
                // todo: clone!
                t.__buffers = v.__buffers;
                t.__material = v.__material;
                t.__verticesBuffer = v.__buffers.position;
                t.__colorsBuffer = v.__buffers.color;
                t.__skinIndexBuffer = v.__buffers.skinIndex;
                t.__skinWeightBuffer = v.__buffers.skinWeight;
                t.__normalBuffer = v.__buffers.normal;
                t.__uvsBuffer0 = v.__buffers.uv0;
                t.__uvsBuffer1 = v.__buffers.uv1;
                t.__uvsBuffer2 = v.__buffers.uv2;
                t.__uvsBuffer3 = v.__buffers.uv3;
                t.__indecesBuffer = v.__buffers.indices;
                if (!v.__normalized) {
                    t.__normalizeSkinWeights();
                    v.__normalized = 1;
                }
            } else {
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
            return this.__geometry;
        }
    }

}, Node3d);










//////////////////////// Skeleton

function Skeleton(bones, boneInverses) {
    this.uuid = generateUUID();
    this.bones = bones ? bones.slice(0) : [];
    this.boneInverses = boneInverses || [];
    this.boneMatrices = null;
    this.boneTexture = null;
    this.init();
}

makeClass(Skeleton, {

    init() {

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

    pose() {

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

    update() {

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

    clone() {

        return new Skeleton(this.bones, this.boneInverses);

    },

    computeBoneTexture() {

        // layout (1 matrix = 4 pixels)
        //      RGBA RGBA RGBA RGBA (=> column1, column2, column3, column4)
        //  with  8x8  pixel texture max   16 bones * 4 pixels =  (8 * 8)
        //       16x16 pixel texture max   64 bones * 4 pixels = (16 * 16)
        //       32x32 pixel texture max  256 bones * 4 pixels = (32 * 32)
        //       64x64 pixel texture max 1024 bones * 4 pixels = (64 * 64)

        let size = Math.sqrt(this.bones.length * 4); // 4 pixels needed for 1 matrix
        size = Math.ceil(size / 4) * 4;
        size = Math.max(size, 4);

        const boneMatrices = new Float32Array(size * size * 4); // 4 floats per RGBA pixel
        boneMatrices.set(this.boneMatrices); // copy current values

        const boneTexture = new DataTexture(boneMatrices, size, size, RGBAFormat, FloatType);
        boneTexture.needsUpdate = true;

        this.boneMatrices = boneMatrices;
        this.boneTexture = boneTexture;

        return this;

    },

    getBoneByName(name) {

        for (let i = 0, il = this.bones.length; i < il; i++) {

            const bone = this.bones[i];

            if (bone.name === name) {

                return bone;

            }

        }

        return undefined;

    },

    dispose() {

        if (this.boneTexture !== null) {

            this.boneTexture.dispose();

            this.boneTexture = null;

        }

    },

    fromJSON(json, bones) {

        this.uuid = json.uuid;

        for (let i = 0, l = json.bones.length; i < l; i++) {

            const uuid = json.bones[i];
            let bone = bones[uuid];

            if (bone === undefined) {

                console.warn('THREE.__skeleton: No bone found with UUID:', uuid);
                bone = new Bone();

            }

            this.bones.push(bone);
            this.boneInverses.push(new Matrix4().fromArray(json.boneInverses[i]));

        }

        this.init();

        return this;

    },

    toJSON() {

        const data = {
            metadata: {
                version: 4.6,
                type: 'Skeleton',
                generator: 'Skeleton.toJSON'
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
