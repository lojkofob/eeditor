

const _v1$5 = new Vector3();
const _m1$4 = new Matrix4();

const _matrix$2 = new Matrix4();
const _quaternion$3 = new Quaternion();

const InterpolateDiscrete = 2300;
const InterpolateLinear = 2301;
const InterpolateSmooth = 2302;

const NormalAnimationBlendMode = 2500;
const AdditiveAnimationBlendMode = 2501;

function Euler(x, y, z, order) {

    this._x = x || 0;
    this._y = y || 0;
    this._z = z || 0;
    this._w = order || Euler.DefaultOrder;

}

Euler.RotationOrders = ['XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX'];
Euler.DefaultOrder = 'XYZ';


makeClass(Euler, {


    set(x, y, z, order) {

        this._x = x;
        this._y = y;
        this._z = z;
        this._w = order || Euler.DefaultOrder;

        this.__onChangeCallback();

        return this;

    },

    __clone() {

        return new Euler(this._x, this._y, this._z, this._w);

    },

    __copy(euler) {

        this._x = euler._x;
        this._y = euler._y;
        this._z = euler._z;
        this._w = euler._w;

        this.__onChangeCallback();

        return this;

    },

    __setFromRotationMatrix(m, order, update) {

        // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

        var te = m.e;
        var m11 = te[0], m12 = te[4], m13 = te[8];
        var m21 = te[1], m22 = te[5], m23 = te[9];
        var m31 = te[2], m32 = te[6], m33 = te[10];

        order = order || this._w;

        if (order === 'XYZ') {

            this._y = asin(clamp(m13, - 1, 1));

            if (abs(m13) < 0.99999) {

                this._x = atan2(- m23, m33);
                this._z = atan2(- m12, m11);

            } else {

                this._x = atan2(m32, m22);
                // 					this._z = 0;

            }

        } else if (order === 'YXZ') {

            this._x = asin(- clamp(m23, - 1, 1));

            if (abs(m23) < 0.99999) {

                this._y = atan2(m13, m33);
                this._z = atan2(m21, m22);

            } else {

                this._y = atan2(- m31, m11);
                this._z = 0;

            }

        } else if (order === 'ZXY') {

            this._x = asin(clamp(m32, - 1, 1));

            if (abs(m32) < 0.99999) {

                this._y = atan2(- m31, m33);
                this._z = atan2(- m12, m22);

            } else {

                this._y = 0;
                this._z = atan2(m21, m11);

            }

        } else if (order === 'ZYX') {

            this._y = asin(- clamp(m31, - 1, 1));

            if (abs(m31) < 0.99999) {

                this._x = atan2(m32, m33);
                this._z = atan2(m21, m11);

            } else {

                this._x = 0;
                this._z = atan2(- m12, m22);

            }

        } else if (order === 'YZX') {

            this._z = asin(clamp(m21, - 1, 1));

            if (abs(m21) < 0.99999) {

                this._x = atan2(- m23, m22);
                this._y = atan2(- m31, m11);

            } else {

                this._x = 0;
                this._y = atan2(m13, m33);

            }

        } else if (order === 'XZY') {

            this._z = asin(- clamp(m12, - 1, 1));

            if (abs(m12) < 0.99999) {

                this._x = atan2(m32, m22);
                this._y = atan2(m13, m11);

            } else {

                this._x = atan2(- m23, m33);
                this._y = 0;

            }

        } else {

            consoleWarn('Euler: .setFromRotationMatrix() given unsupported order: ' + order);

        }

        this._w = order;

        if (update === undefined || update) {
            this.__onChangeCallback();
        }

        return this;

    },

    __setFromQuaternion(q, order, update) {

        return this.__setFromRotationMatrix(new Matrix4().__makeRotationFromQuaternion(q), order, update);

    },

    __setFromVector3(v, order) {

        return this.set(v.x, v.y, v.z, order || this._w);

    },

    __equals(euler) {

        return (euler._x === this._x) && (euler._y === this._y) && (euler._z === this._z) && (euler._w === this._w);

    },

    __fromArray(array) {

        this._x = array[0];
        this._y = array[1];
        this._z = array[2];
        if (array[3] !== undefined) this._w = array[3];

        this.__onChangeCallback();

        return this;

    },

    __toArray(array, offset) {

        if (array === undefined) array = [];
        if (offset === undefined) offset = 0;

        array[offset] = this._x;
        array[offset + 1] = this._y;
        array[offset + 2] = this._z;
        if (this._w != Euler.DefaultOrder) {
            array[offset + 3] = this._w;
        }
        return array;

    },

    __toJson() {
        return this.__toArray();
    },

    __toVector3(optionalResult) {

        if (optionalResult) {

            return optionalResult.set(this._x, this._y, this._z);

        } else {

            return new Vector3(this._x, this._y, this._z);

        }

    },

    __onChangeCallback() { }

},
    {
        __isEuler: { enumerable: false, value: true },

        x: createSomePropertyWithGetterAndSetter(function () {
            return this._x;
        }, function (value) {
            this._x = value;
            this.__onChangeCallback();
        }),

        y: createSomePropertyWithGetterAndSetter(function () {
            return this._y;
        }, function (value) {
            this._y = value;
            this.__onChangeCallback();
        }),

        z: createSomePropertyWithGetterAndSetter(function () {
            return this._z;
        }, function (value) {
            this._z = value;
            this.__onChangeCallback();
        }),

        __order: createSomePropertyWithGetterAndSetter(function () {
            return this._w;
        }, function (value) {
            this.__setFromQuaternion(_quaternion$3.__setFromEuler(this), value, 1);
        })
    });


mergeObj(Matrix4.prototype, {

    __transpose() {

        var te = this.e;
        var tmp;

        tmp = te[1]; te[1] = te[4]; te[4] = tmp;
        tmp = te[2]; te[2] = te[8]; te[8] = tmp;
        tmp = te[6]; te[6] = te[9]; te[9] = tmp;

        tmp = te[3]; te[3] = te[12]; te[12] = tmp;
        tmp = te[7]; te[7] = te[13]; te[13] = tmp;
        tmp = te[11]; te[11] = te[14]; te[14] = tmp;

        return this;

    },

    __copyPosition(m) {

        var te = this.e;
        var me = m.e;

        te[12] = me[12];
        te[13] = me[13];
        te[14] = me[14];

        return this;

    },

    __extractRotation(m) {

        var te = this.e;
        var me = m.e;

        var scaleX = 1 / sqrt(me[0] * me[0] + me[1] * me[1] + me[2] * me[2]);
        var scaleY = 1 / sqrt(me[4] * me[4] + me[5] * me[5] + me[6] * me[6]);
        var scaleZ = 1 / sqrt(me[8] * me[8] + me[9] * me[9] + me[10] * me[10]);

        te[0] = me[0] * scaleX;
        te[1] = me[1] * scaleX;
        te[2] = me[2] * scaleX;

        te[4] = me[4] * scaleY;
        te[5] = me[5] * scaleY;
        te[6] = me[6] * scaleY;

        te[8] = me[8] * scaleZ;
        te[9] = me[9] * scaleZ;
        te[10] = me[10] * scaleZ;

        return this;

    },

    __makeRotationFromEuler(euler) {

        var te = this.e;

        var x = euler.x, y = euler.y, z = euler.z;
        var a = cos(x), b = sin(x);
        var c = cos(y), d = sin(y);
        var e = cos(z), f = sin(z);

        if (euler.__order === 'XYZ') {

            var ae = a * e, af = a * f, be = b * e, bf = b * f;

            te[0] = c * e;
            te[4] = - c * f;
            te[8] = d;

            te[1] = af + be * d;
            te[5] = ae - bf * d;
            te[9] = - b * c;

            te[2] = bf - ae * d;
            te[6] = be + af * d;
            te[10] = a * c;

        } else if (euler.__order === 'YXZ') {

            var ce = c * e, cf = c * f, de = d * e, df = d * f;

            te[0] = ce + df * b;
            te[4] = de * b - cf;
            te[8] = a * d;

            te[1] = a * f;
            te[5] = a * e;
            te[9] = - b;

            te[2] = cf * b - de;
            te[6] = df + ce * b;
            te[10] = a * c;

        } else if (euler.__order === 'ZXY') {

            var ce = c * e, cf = c * f, de = d * e, df = d * f;

            te[0] = ce - df * b;
            te[4] = - a * f;
            te[8] = de + cf * b;

            te[1] = cf + de * b;
            te[5] = a * e;
            te[9] = df - ce * b;

            te[2] = - a * d;
            te[6] = b;
            te[10] = a * c;

        } else if (euler.__order === 'ZYX') {

            var ae = a * e, af = a * f, be = b * e, bf = b * f;

            te[0] = c * e;
            te[4] = be * d - af;
            te[8] = ae * d + bf;

            te[1] = c * f;
            te[5] = bf * d + ae;
            te[9] = af * d - be;

            te[2] = - d;
            te[6] = b * c;
            te[10] = a * c;

        } else if (euler.__order === 'YZX') {

            var ac = a * c, ad = a * d, bc = b * c, bd = b * d;

            te[0] = c * e;
            te[4] = bd - ac * f;
            te[8] = bc * f + ad;

            te[1] = f;
            te[5] = a * e;
            te[9] = - b * e;

            te[2] = - d * e;
            te[6] = ad * f + bc;
            te[10] = ac - bd * f;

        } else if (euler.__order === 'XZY') {

            var ac = a * c, ad = a * d, bc = b * c, bd = b * d;

            te[0] = c * e;
            te[4] = - f;
            te[8] = d * e;

            te[1] = ac * f + bd;
            te[5] = a * e;
            te[9] = ad * f - bc;

            te[2] = bc * f - ad;
            te[6] = b * e;
            te[10] = bd * f + ac;

        }

        // last column
        te[3] = 0;
        te[7] = 0;
        te[11] = 0;

        // bottom row
        te[12] = 0;
        te[13] = 0;
        te[14] = 0;
        te[15] = 1;

        return this;

    },

    __makeRotationFromQuaternion(q) {

        var te = this.e;

        var x = q.x, y = q.y, z = q.z, w = q.w;
        var x2 = x + x, y2 = y + y, z2 = z + z;
        var xx = x * x2, xy = x * y2, xz = x * z2;
        var yy = y * y2, yz = y * z2, zz = z * z2;
        var wx = w * x2, wy = w * y2, wz = w * z2;

        te[0] = 1 - (yy + zz);
        te[4] = xy - wz;
        te[8] = xz + wy;

        te[1] = xy + wz;
        te[5] = 1 - (xx + zz);
        te[9] = yz - wx;

        te[2] = xz - wy;
        te[6] = yz + wx;
        te[10] = 1 - (xx + yy);

        // last column
        te[3] = 0;
        te[7] = 0;
        te[11] = 0;

        // bottom row
        te[12] = 0;
        te[13] = 0;
        te[14] = 0;
        te[15] = 1;

        return this;

    },


    __compose(position, quaternion, scale) {

        const te = this.e;

        const x = quaternion._x, y = quaternion._y, z = quaternion._z, w = quaternion._w;
        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2;
        const yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;

        const sx = scale.x, sy = scale.y, sz = scale.z;

        te[0] = (1 - (yy + zz)) * sx;
        te[1] = (xy + wz) * sx;
        te[2] = (xz - wy) * sx;
        te[3] = 0;

        te[4] = (xy - wz) * sy;
        te[5] = (1 - (xx + zz)) * sy;
        te[6] = (yz + wx) * sy;
        te[7] = 0;

        te[8] = (xz + wy) * sz;
        te[9] = (yz - wx) * sz;
        te[10] = (1 - (xx + yy)) * sz;
        te[11] = 0;

        te[12] = position.x;
        te[13] = position.y;
        te[14] = position.z;
        te[15] = 1;

        return this;

    },

    __decompose(position, quaternion, scale) {

        const te = this.e;

        let sx = _v1$5.set(te[0], te[1], te[2]).__length();
        const sy = _v1$5.set(te[4], te[5], te[6]).__length();
        const sz = _v1$5.set(te[8], te[9], te[10]).__length();

        // if determine is negative, we need to invert one scale
        const det = this.determinant();
        if (det < 0) sx = - sx;

        position.x = te[12];
        position.y = te[13];
        position.z = te[14];

        // scale the rotation part
        _m1$4.__copy(this);

        const invSX = 1 / sx;
        const invSY = 1 / sy;
        const invSZ = 1 / sz;

        _m1$4.e[0] *= invSX;
        _m1$4.e[1] *= invSX;
        _m1$4.e[2] *= invSX;

        _m1$4.e[4] *= invSY;
        _m1$4.e[5] *= invSY;
        _m1$4.e[6] *= invSY;

        _m1$4.e[8] *= invSZ;
        _m1$4.e[9] *= invSZ;
        _m1$4.e[10] *= invSZ;

        quaternion.__setFromRotationMatrix(_m1$4);

        scale.x = sx;
        scale.y = sy;
        scale.z = sz;

        return this;

    }
});








/* ----------- Box3
const _vector$c =  new Vector3();
const _quaternion$4 =  new Quaternion();

class Box3 {

    constructor( min = new Vector3( + Infinity, + Infinity, + Infinity ), max = new Vector3( - Infinity, - Infinity, - Infinity ) ) {

        this.isBox3 = true;

        this.min = min;
        this.max = max;

    }

    set( min, max ) {

        this.min.__copy( min );
        this.max.__copy( max );

        return this;

    }

    setFromArray( array ) {

        this.makeEmpty();

        for ( let i = 0, il = array.length; i < il; i += 3 ) {

            this.expandByPoint( _vector$b.fromArray( array, i ) );

        }

        return this;

    }

    setFromBufferAttribute( attribute ) {

        this.makeEmpty();

        for ( let i = 0, il = attribute.count; i < il; i ++ ) {

            this.expandByPoint( _vector$b.fromBufferAttribute( attribute, i ) );

        }

        return this;

    }

    setFromPoints( points ) {

        this.makeEmpty();

        for ( let i = 0, il = points.length; i < il; i ++ ) {

            this.expandByPoint( points[ i ] );

        }

        return this;

    }

    setFromCenterAndSize( center, size ) {

        const halfSize = _vector$b.__copy( size ).multiplyScalar( 0.5 );

        this.min.__copy( center ).sub( halfSize );
        this.max.__copy( center ).add( halfSize );

        return this;

    }

    setFromObject( object, precise = false ) {

        this.makeEmpty();

        return this.expandByObject( object, precise );

    }

    __clone() {

        return new this.constructor().__copy( this );

    }

    copy( box ) {

        this.min.__copy( box.min );
        this.max.__copy( box.max );

        return this;

    }

    makeEmpty() {

        this.min.x = this.min.y = this.min.z = + Infinity;
        this.max.x = this.max.y = this.max.z = - Infinity;

        return this;

    }

    isEmpty() {

        // this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes

        return ( this.max.x < this.min.x ) || ( this.max.y < this.min.y ) || ( this.max.z < this.min.z );

    }

    getCenter( target ) {

        return this.isEmpty() ? target.set( 0, 0, 0 ) : target.addVectors( this.min, this.max ).multiplyScalar( 0.5 );

    }

    getSize( target ) {

        return this.isEmpty() ? target.set( 0, 0, 0 ) : target.subVectors( this.max, this.min );

    }

    expandByPoint( point ) {

        this.min.min( point );
        this.max.max( point );

        return this;

    }

    expandByVector( vector ) {

        this.min.sub( vector );
        this.max.add( vector );

        return this;

    }

    expandByScalar( scalar ) {

        this.min.addScalar( - scalar );
        this.max.addScalar( scalar );

        return this;

    }

    expandByObject( object, precise = false ) {

        // Computes the world-axis-aligned bounding box of an object (including its children),
        // accounting for both the object's, and children's, world transforms

        object.updateWorldMatrix( false, false );

        const geometry = object.geometry;

        if ( geometry !== undefined ) {

            const positionAttribute = geometry.getAttribute( 'position' );

            // precise AABB computation based on vertex data requires at least a position attribute.
            // instancing isn't supported so far and uses the normal (conservative) code path.

            if ( precise === true && positionAttribute !== undefined && object.isInstancedMesh !== true ) {

                for ( let i = 0, l = positionAttribute.count; i < l; i ++ ) {

                    if ( object.isMesh === true ) {

                        object.getVertexPosition( i, _vector$b );

                    } else {

                        _vector$b.fromBufferAttribute( positionAttribute, i );

                    }

                    _vector$b.applyMatrix4( object.__matrixWorld );
                    this.expandByPoint( _vector$b );

                }

            } else {

                if ( object.boundingBox !== undefined ) {

                    // object-level bounding box

                    if ( object.boundingBox === null ) {

                        object.computeBoundingBox();

                    }

                    _box$4.__copy( object.boundingBox );


                } else {

                    // geometry-level bounding box

                    if ( geometry.boundingBox === null ) {

                        geometry.computeBoundingBox();

                    }

                    _box$4.__copy( geometry.boundingBox );

                }

                _box$4.applyMatrix4( object.__matrixWorld );

                this.union( _box$4 );

            }

        }

        const children = object.children;

        for ( let i = 0, l = children.length; i < l; i ++ ) {

            this.expandByObject( children[ i ], precise );

        }

        return this;

    }

    containsPoint( point ) {

        return point.x >= this.min.x && point.x <= this.max.x &&
            point.y >= this.min.y && point.y <= this.max.y &&
            point.z >= this.min.z && point.z <= this.max.z;

    }

    containsBox( box ) {

        return this.min.x <= box.min.x && box.max.x <= this.max.x &&
            this.min.y <= box.min.y && box.max.y <= this.max.y &&
            this.min.z <= box.min.z && box.max.z <= this.max.z;

    }

    getParameter( point, target ) {

        // This can potentially have a divide by zero if the box
        // has a size dimension of 0.

        return target.set(
            ( point.x - this.min.x ) / ( this.max.x - this.min.x ),
            ( point.y - this.min.y ) / ( this.max.y - this.min.y ),
            ( point.z - this.min.z ) / ( this.max.z - this.min.z )
        );

    }

    intersectsBox( box ) {

        // using 6 splitting planes to rule out intersections.
        return box.max.x >= this.min.x && box.min.x <= this.max.x &&
            box.max.y >= this.min.y && box.min.y <= this.max.y &&
            box.max.z >= this.min.z && box.min.z <= this.max.z;

    }

    intersectsSphere( sphere ) {

        // Find the point on the AABB closest to the sphere center.
        this.clampPoint( sphere.center, _vector$b );

        // If that point is inside the sphere, the AABB and sphere intersect.
        return _vector$b.distanceToSquared( sphere.center ) <= ( sphere.radius * sphere.radius );

    }

    intersectsPlane( plane ) {

        // We compute the minimum and maximum dot product values. If those values
        // are on the same side (back or front) of the plane, then there is no intersection.

        let min, max;

        if ( plane.normal.x > 0 ) {

            min = plane.normal.x * this.min.x;
            max = plane.normal.x * this.max.x;

        } else {

            min = plane.normal.x * this.max.x;
            max = plane.normal.x * this.min.x;

        }

        if ( plane.normal.y > 0 ) {

            min += plane.normal.y * this.min.y;
            max += plane.normal.y * this.max.y;

        } else {

            min += plane.normal.y * this.max.y;
            max += plane.normal.y * this.min.y;

        }

        if ( plane.normal.z > 0 ) {

            min += plane.normal.z * this.min.z;
            max += plane.normal.z * this.max.z;

        } else {

            min += plane.normal.z * this.max.z;
            max += plane.normal.z * this.min.z;

        }

        return ( min <= - plane.constant && max >= - plane.constant );

    }

    intersectsTriangle( triangle ) {

        if ( this.isEmpty() ) {

            return false;

        }

        // compute box center and extents
        this.getCenter( _center );
        _extents.subVectors( this.max, _center );

        // translate triangle to aabb origin
        _v0$3.subVectors( triangle.a, _center );
        _v1$7.subVectors( triangle.b, _center );
        _v2$4.subVectors( triangle.c, _center );

        // compute edge vectors for triangle
        _f0.subVectors( _v1$7, _v0$3 );
        _f1.subVectors( _v2$4, _v1$7 );
        _f2.subVectors( _v0$3, _v2$4 );

        // test against axes that are given by cross product combinations of the edges of the triangle and the edges of the aabb
        // make an axis testing of each of the 3 sides of the aabb against each of the 3 sides of the triangle = 9 axis of separation
        // axis_ij = u_i x f_j (u0, u1, u2 = face normals of aabb = x,y,z axes vectors since aabb is axis aligned)
        let axes = [
            0, - _f0.z, _f0.y, 0, - _f1.z, _f1.y, 0, - _f2.z, _f2.y,
            _f0.z, 0, - _f0.x, _f1.z, 0, - _f1.x, _f2.z, 0, - _f2.x,
            - _f0.y, _f0.x, 0, - _f1.y, _f1.x, 0, - _f2.y, _f2.x, 0
        ];
        if ( ! satForAxes( axes, _v0$3, _v1$7, _v2$4, _extents ) ) {

            return false;

        }

        // test 3 face normals from the aabb
        axes = [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ];
        if ( ! satForAxes( axes, _v0$3, _v1$7, _v2$4, _extents ) ) {

            return false;

        }

        // finally testing the face normal of the triangle
        // use already existing triangle edge vectors here
        _triangleNormal.crossVectors( _f0, _f1 );
        axes = [ _triangleNormal.x, _triangleNormal.y, _triangleNormal.z ];

        return satForAxes( axes, _v0$3, _v1$7, _v2$4, _extents );

    }

    clampPoint( point, target ) {

        return target.__copy( point ).clamp( this.min, this.max );

    }

    distanceToPoint( point ) {

        return this.clampPoint( point, _vector$b ).distanceTo( point );

    }

    getBoundingSphere( target ) {

        if ( this.isEmpty() ) {

            target.makeEmpty();

        } else {

            this.getCenter( target.center );

            target.radius = this.getSize( _vector$b ).__length() * 0.5;

        }

        return target;

    }

    intersect( box ) {

        this.min.max( box.min );
        this.max.min( box.max );

        // ensure that if there is no overlap, the result is fully empty, not slightly empty with non-inf/+inf values that will cause subsequence intersects to erroneously return valid values.
        if ( this.isEmpty() ) this.makeEmpty();

        return this;

    }

    union( box ) {

        this.min.min( box.min );
        this.max.max( box.max );

        return this;

    }

    applyMatrix4( matrix ) {

        // transform of empty box is an empty box.
        if ( this.isEmpty() ) return this;

        // NOTE: I am using a binary pattern to specify all 2^3 combinations below
        _points[ 0 ].set( this.min.x, this.min.y, this.min.z ).applyMatrix4( matrix ); // 000
        _points[ 1 ].set( this.min.x, this.min.y, this.max.z ).applyMatrix4( matrix ); // 001
        _points[ 2 ].set( this.min.x, this.max.y, this.min.z ).applyMatrix4( matrix ); // 010
        _points[ 3 ].set( this.min.x, this.max.y, this.max.z ).applyMatrix4( matrix ); // 011
        _points[ 4 ].set( this.max.x, this.min.y, this.min.z ).applyMatrix4( matrix ); // 100
        _points[ 5 ].set( this.max.x, this.min.y, this.max.z ).applyMatrix4( matrix ); // 101
        _points[ 6 ].set( this.max.x, this.max.y, this.min.z ).applyMatrix4( matrix ); // 110
        _points[ 7 ].set( this.max.x, this.max.y, this.max.z ).applyMatrix4( matrix ); // 111

        this.setFromPoints( _points );

        return this;

    }

    translate( offset ) {

        this.min.add( offset );
        this.max.add( offset );

        return this;

    }

    __equals( box ) {

        return box.min.__equals( this.min ) && box.max.__equals( this.max );

    }

}

const _points = [
     new Vector3(),
     new Vector3(),
     new Vector3(),
     new Vector3(),
     new Vector3(),
     new Vector3(),
     new Vector3(),
     new Vector3()
];

const _vector$b =  new Vector3();

const _box$4 =  new Box3();

// triangle centered vertices

const _v0$3 =  new Vector3();
const _v1$7 =  new Vector3();
const _v2$4 =  new Vector3();

// triangle edge vectors

const _f0 =  new Vector3();
const _f1 =  new Vector3();
const _f2 =  new Vector3();

const _center =  new Vector3();
const _extents =  new Vector3();
const _triangleNormal =  new Vector3();
const _testAxis =  new Vector3();

function satForAxes( axes, v0, v1, v2, extents ) {

    for ( let i = 0, j = axes.length - 3; i <= j; i += 3 ) {

        _testAxis.fromArray( axes, i );
        // project the aabb onto the separating axis
        const r = extents.x * abs( _testAxis.x ) + extents.y * abs( _testAxis.y ) + extents.z * abs( _testAxis.z );
        // project all 3 vertices of the triangle onto the separating axis
        const p0 = v0.dot( _testAxis );
        const p1 = v1.dot( _testAxis );
        const p2 = v2.dot( _testAxis );
        // actual test, basically see if either of the most extreme of the triangle points intersects r
        if ( max( - max( p0, p1, p2 ), min( p0, p1, p2 ) ) > r ) {

            // points of the projected triangle are outside the projected half-length of the aabb
            // the axis is separating and we can exit
            return false;

        }

    }

    return true;

}

const _box$3 =  new Box3();
const _v1$6 =  new Vector3();
const _v2$3 =  new Vector3();
 ------------- box3 */

function Quaternion(x, y, z, w) {

    this._x = x || 0;
    this._y = y || 0;
    this._z = z || 0;
    this._w = w || 1;

}

makeClass(Quaternion, {

    __slerpFlat(dst, dstOffset, src0, srcOffset0, src1, srcOffset1, t) {

        // fuzz-free, array-based Quaternion SLERP operation

        let x0 = src0[srcOffset0 + 0],
            y0 = src0[srcOffset0 + 1],
            z0 = src0[srcOffset0 + 2],
            w0 = src0[srcOffset0 + 3];

        const x1 = src1[srcOffset1 + 0],
            y1 = src1[srcOffset1 + 1],
            z1 = src1[srcOffset1 + 2],
            w1 = src1[srcOffset1 + 3];

        if (t === 0) {

            dst[dstOffset + 0] = x0;
            dst[dstOffset + 1] = y0;
            dst[dstOffset + 2] = z0;
            dst[dstOffset + 3] = w0;
            return;

        }

        if (t === 1) {

            dst[dstOffset + 0] = x1;
            dst[dstOffset + 1] = y1;
            dst[dstOffset + 2] = z1;
            dst[dstOffset + 3] = w1;
            return;

        }

        if (w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1) {

            let s = 1 - t;
            const cos = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1,
                dir = (cos >= 0 ? 1 : - 1),
                sqrSin = 1 - cos * cos;

            // Skip the Slerp for tiny steps to avoid numeric problems:
            if (sqrSin > Number.EPSILON) {

                const sin = sqrt(sqrSin),
                    len = atan2(sin, cos * dir);

                s = sin(s * len) / sin;
                t = sin(t * len) / sin;

            }

            const tDir = t * dir;

            x0 = x0 * s + x1 * tDir;
            y0 = y0 * s + y1 * tDir;
            z0 = z0 * s + z1 * tDir;
            w0 = w0 * s + w1 * tDir;

            // Normalize in case we just did a lerp:
            if (s === 1 - t) {

                const f = 1 / sqrt(x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0);

                x0 *= f;
                y0 *= f;
                z0 *= f;
                w0 *= f;

            }

        }

        dst[dstOffset] = x0;
        dst[dstOffset + 1] = y0;
        dst[dstOffset + 2] = z0;
        dst[dstOffset + 3] = w0;

    },

    __multiplyQuaternionsFlat(dst, dstOffset, src0, srcOffset0, src1, srcOffset1) {

        const x0 = src0[srcOffset0];
        const y0 = src0[srcOffset0 + 1];
        const z0 = src0[srcOffset0 + 2];
        const w0 = src0[srcOffset0 + 3];

        const x1 = src1[srcOffset1];
        const y1 = src1[srcOffset1 + 1];
        const z1 = src1[srcOffset1 + 2];
        const w1 = src1[srcOffset1 + 3];

        dst[dstOffset] = x0 * w1 + w0 * x1 + y0 * z1 - z0 * y1;
        dst[dstOffset + 1] = y0 * w1 + w0 * y1 + z0 * x1 - x0 * z1;
        dst[dstOffset + 2] = z0 * w1 + w0 * z1 + x0 * y1 - y0 * x1;
        dst[dstOffset + 3] = w0 * w1 - x0 * x1 - y0 * y1 - z0 * z1;

        return dst;

    },

    set(x, y, z, w) {

        this._x = x;
        this._y = y;
        this._z = z;
        this._w = w;

        this.__onChangeCallback();

        return this;

    },

    __clone() {

        return new this.constructor(this._x, this._y, this._z, this._w);

    },

    __copy(quaternion) {

        this._x = quaternion.x;
        this._y = quaternion.y;
        this._z = quaternion.z;
        this._w = quaternion.w;

        this.__onChangeCallback();

        return this;

    },

    __setFromEulerArray(array, update) {
        return this.__setFromEulerXYZO(array[0], array[1], array[2], array[3], update);
    },

    __setFromEuler(euler, update) {
        return this.__setFromEulerXYZO(euler._x, euler._y, euler._z, euler._w, update);
    },

    __setFromEulerXYZO(x, y, z, order, update) {

        order = order || Euler.DefaultOrder;
        // http://www.mathworks.com/matlabcentral/fileexchange/
        // 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
        //	content/SpinCalc.m

        const c1 = cos(x / 2);
        const c2 = cos(y / 2);
        const c3 = cos(z / 2);

        const s1 = sin(x / 2);
        const s2 = sin(y / 2);
        const s3 = sin(z / 2);

        switch (order) {

            case 'XYZ':
                this._x = s1 * c2 * c3 + c1 * s2 * s3;
                this._y = c1 * s2 * c3 - s1 * c2 * s3;
                this._z = c1 * c2 * s3 + s1 * s2 * c3;
                this._w = c1 * c2 * c3 - s1 * s2 * s3;
                break;

            case 'YXZ':
                this._x = s1 * c2 * c3 + c1 * s2 * s3;
                this._y = c1 * s2 * c3 - s1 * c2 * s3;
                this._z = c1 * c2 * s3 - s1 * s2 * c3;
                this._w = c1 * c2 * c3 + s1 * s2 * s3;
                break;

            case 'ZXY':
                this._x = s1 * c2 * c3 - c1 * s2 * s3;
                this._y = c1 * s2 * c3 + s1 * c2 * s3;
                this._z = c1 * c2 * s3 + s1 * s2 * c3;
                this._w = c1 * c2 * c3 - s1 * s2 * s3;
                break;

            case 'ZYX':
                this._x = s1 * c2 * c3 - c1 * s2 * s3;
                this._y = c1 * s2 * c3 + s1 * c2 * s3;
                this._z = c1 * c2 * s3 - s1 * s2 * c3;
                this._w = c1 * c2 * c3 + s1 * s2 * s3;
                break;

            case 'YZX':
                this._x = s1 * c2 * c3 + c1 * s2 * s3;
                this._y = c1 * s2 * c3 + s1 * c2 * s3;
                this._z = c1 * c2 * s3 - s1 * s2 * c3;
                this._w = c1 * c2 * c3 - s1 * s2 * s3;
                break;

            case 'XZY':
                this._x = s1 * c2 * c3 - c1 * s2 * s3;
                this._y = c1 * s2 * c3 - s1 * c2 * s3;
                this._z = c1 * c2 * s3 + s1 * s2 * c3;
                this._w = c1 * c2 * c3 + s1 * s2 * s3;
                break;
            //cheats
            default:
                consoleWarn('Quaternion: .setFromEuler() encountered an unknown order: ' + order);
                break;
            //endcheats

        }

        if (update === undefined || update) {
            this.__onChangeCallback();
        }

        return this;

    },

    __setFromAxisAngle(axis, angle) {

        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

        // assumes axis is normalized

        const halfAngle = angle / 2, s = sin(halfAngle);

        this._x = axis.x * s;
        this._y = axis.y * s;
        this._z = axis.z * s;
        this._w = cos(halfAngle);

        this.__onChangeCallback();

        return this;

    },

    __setFromRotationMatrix(m, update) {

        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

        // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

        const te = m.e,

            m11 = te[0], m12 = te[4], m13 = te[8],
            m21 = te[1], m22 = te[5], m23 = te[9],
            m31 = te[2], m32 = te[6], m33 = te[10],

            trace = m11 + m22 + m33;

        if (trace > 0) {

            const s = 0.5 / sqrt(trace + 1.0);

            this._w = 0.25 / s;
            this._x = (m32 - m23) * s;
            this._y = (m13 - m31) * s;
            this._z = (m21 - m12) * s;

        } else if (m11 > m22 && m11 > m33) {

            const s = 2.0 * sqrt(1.0 + m11 - m22 - m33);

            this._w = (m32 - m23) / s;
            this._x = 0.25 * s;
            this._y = (m12 + m21) / s;
            this._z = (m13 + m31) / s;

        } else if (m22 > m33) {

            const s = 2.0 * sqrt(1.0 + m22 - m11 - m33);

            this._w = (m13 - m31) / s;
            this._x = (m12 + m21) / s;
            this._y = 0.25 * s;
            this._z = (m23 + m32) / s;

        } else {

            const s = 2.0 * sqrt(1.0 + m33 - m11 - m22);

            this._w = (m21 - m12) / s;
            this._x = (m13 + m31) / s;
            this._y = (m23 + m32) / s;
            this._z = 0.25 * s;

        }

        if (update) {
            this.__onChangeCallback();
        }

        return this;

    },

    __setFromUnitVectors(vFrom, vTo) {

        // assumes direction vectors vFrom and vTo are normalized

        let r = vFrom.dot(vTo) + 1;

        if (r < Number.EPSILON) {

            // vFrom and vTo point in opposite directions

            r = 0;

            if (abs(vFrom.x) > abs(vFrom.z)) {

                this._x = - vFrom.y;
                this._y = vFrom.x;
                this._z = 0;
                this._w = r;

            } else {

                this._x = 0;
                this._y = - vFrom.z;
                this._z = vFrom.y;
                this._w = r;

            }

        } else {

            // crossVectors( vFrom, vTo ); // inlined to avoid cyclic dependency on Vector3

            this._x = vFrom.y * vTo.z - vFrom.z * vTo.y;
            this._y = vFrom.z * vTo.x - vFrom.x * vTo.z;
            this._z = vFrom.x * vTo.y - vFrom.y * vTo.x;
            this._w = r;

        }

        return this.__normalize();

    },

    __angleTo(q) {

        return 2 * acos(abs(clamp(this.dot(q), - 1, 1)));

    },

    __rotateTowards(q, step) {

        const angle = this.__angleTo(q);

        if (angle === 0) return this;

        const t = mmin(1, step / angle);

        this.slerp(q, t);

        return this;

    },

    __identity() {

        return this.set(0, 0, 0, 1);

    },

    __invert() {

        // quaternion is assumed to have unit length

        return this.__conjugate();

    },

    __conjugate() {

        this._x *= - 1;
        this._y *= - 1;
        this._z *= - 1;

        this.__onChangeCallback();

        return this;

    },

    dot(v) {

        return this._x * v._x + this._y * v._y + this._z * v._z + this._w * v._w;

    },

    __lengthSq() {

        return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;

    },

    __length() {

        return sqrt(this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w);

    },

    __normalize() {

        let l = this.__length();

        if (l === 0) {

            this._x = 0;
            this._y = 0;
            this._z = 0;
            this._w = 1;

        } else {

            l = 1 / l;

            this._x = this._x * l;
            this._y = this._y * l;
            this._z = this._z * l;
            this._w = this._w * l;

        }

        this.__onChangeCallback();

        return this;

    },

    __multiply(q) {

        return this.__multiplyQuaternions(this, q);

    },

    __premultiply(q) {

        return this.__multiplyQuaternions(q, this);

    },

    __multiplyQuaternions(a, b) {

        // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

        const qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
        const qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

        this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
        this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
        this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
        this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

        this.__onChangeCallback();

        return this;

    },

    __slerp(qb, t) {

        if (t === 0) return this;
        if (t === 1) return this.__copy(qb);

        const x = this._x, y = this._y, z = this._z, w = this._w;

        // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

        let cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;

        if (cosHalfTheta < 0) {

            this._w = - qb._w;
            this._x = - qb._x;
            this._y = - qb._y;
            this._z = - qb._z;

            cosHalfTheta = - cosHalfTheta;

        } else {

            this.__copy(qb);

        }

        if (cosHalfTheta >= 1.0) {

            this._w = w;
            this._x = x;
            this._y = y;
            this._z = z;

            return this;

        }

        const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

        if (sqrSinHalfTheta <= Number.EPSILON) {

            const s = 1 - t;
            this._w = s * w + t * this._w;
            this._x = s * x + t * this._x;
            this._y = s * y + t * this._y;
            this._z = s * z + t * this._z;

            this.normalize(); // normalize calls __onChangeCallback()

            return this;

        }

        const sinHalfTheta = sqrt(sqrSinHalfTheta);
        const halfTheta = __onChangeCallbackatan2(sinHalfTheta, cosHalfTheta);
        const ratioA = __onChangeCallbacksin((1 - t) * halfTheta) / sinHalfTheta,
            ratioB = __onChangeCallbacksin(t * halfTheta) / sinHalfTheta;

        this._w = (w * ratioA + this._w * ratioB);
        this._x = (x * ratioA + this._x * ratioB);
        this._y = (y * ratioA + this._y * ratioB);
        this._z = (z * ratioA + this._z * ratioB);

        this.__onChangeCallback();

        return this;

    },

    __slerpQuaternions(qa, qb, t) {

        return this.__copy(qa).slerp(qb, t);

    },

    __random() {

        // sets this quaternion to a uniform random unit quaternnion

        // Ken Shoemake
        // Uniform random rotations
        // D. Kirk, editor, Graphics Gems III, pages 124-132. Academic Press, New York, 1992.

        const theta1 = 2 * PI * random();
        const theta2 = 2 * PI * random();

        const x0 = random();
        const r1 = sqrt(1 - x0);
        const r2 = sqrt(x0);

        return this.set(
            r1 * sin(theta1),
            r1 * cos(theta1),
            r2 * sin(theta2),
            r2 * cos(theta2),
        );

    },

    __equals(quaternion) {

        return (quaternion._x === this._x) && (quaternion._y === this._y) && (quaternion._z === this._z) && (quaternion._w === this._w);

    },

    __fromArray(array, offset) {
        this._x = array[offset];
        this._y = array[offset + 1];
        this._z = array[offset + 2];
        this._w = array[offset + 3];
        this.__onChangeCallback();
        return this;

    },

    __toArray(array, offset) {
        array[offset] = this._x;
        array[offset + 1] = this._y;
        array[offset + 2] = this._z;
        array[offset + 3] = this._w;
        return array;
    },


    __toJson() {
        return this.toArray();
    },

    __onChangeCallback() { }

}, {

    __isQuaternion: { enumerable: false, value: true },

    x: createSomePropertyWithGetterAndSetter(function () {
        return this._x;
    }, function (value) {
        this._x = value;
        this.__onChangeCallback();
    }),

    y: createSomePropertyWithGetterAndSetter(function () {
        return this._y;
    }, function (value) {
        this._y = value;
        this.__onChangeCallback();
    }),

    z: createSomePropertyWithGetterAndSetter(function () {
        return this._z;
    }, function (value) {
        this._z = value;
        this.__onChangeCallback();
    }),

    w: createSomePropertyWithGetterAndSetter(function () {
        return this._w;
    }, function (value) {
        this._w = value;
        this.__onChangeCallback();
    })

});


//////////////////// Keyframe animations



/**
 * Abstract base class of interpolants over parametric samples.
 *
 * The parameter domain is one dimensional, typically the time or a path
 * along a curve defined by the data.
 *
 * The sample values can have any dimensionality and derived classes may
 * apply special interpretations to the data.
 *
 * This class provides the interval seek in a Template Method, deferring
 * the actual interpolation to derived classes.
 *
 * Time complexity is O(1) for linear access crossing at most two points
 * and O(log N) for random access, where N is the number of positions.
 *
 * References:
 *
 * 		http://www.oodesign.com/template-method-pattern.html
 *
 */

var Interpolant = makeClass(function (parameterPositions, sampleValues, sampleSize, resultBuffer) {

    this.parameterPositions = parameterPositions;
    this._cachedIndex = 0;

    this.resultBuffer = resultBuffer !== undefined ?
        resultBuffer : new sampleValues.constructor(sampleSize);
    this.sampleValues = sampleValues;
    this.valueSize = sampleSize;

    this.settings = null;
    this.DefaultSettings_ = {};

}, {

    evaluate(t) {

        const pp = this.parameterPositions;
        let i1 = this._cachedIndex,
            t1 = pp[i1],
            t0 = pp[i1 - 1];

        validate_interval: {

            seek: {

                let right;

                linear_scan: {

                    //- See http://jsperf.com/comparison-to-undefined/3
                    //- slower code:
                    //-
                    //- 				if ( t >= t1 || t1 === undefined ) {
                    forward_scan: if (!(t < t1)) {

                        for (let giveUpAt = i1 + 2; ;) {

                            if (t1 === undefined) {

                                if (t < t0) break forward_scan;

                                // after end

                                i1 = pp.length;
                                this._cachedIndex = i1;
                                return this.copySampleValue_(i1 - 1);

                            }

                            if (i1 === giveUpAt) break; // this loop

                            t0 = t1;
                            t1 = pp[++i1];

                            if (t < t1) {

                                // we have arrived at the sought interval
                                break seek;

                            }

                        }

                        // prepare binary search on the right side of the index
                        right = pp.length;
                        break linear_scan;

                    }

                    //- slower code:
                    //-					if ( t < t0 || t0 === undefined ) {
                    if (!(t >= t0)) {

                        // looping?

                        const t1global = pp[1];

                        if (t < t1global) {

                            i1 = 2; // + 1, using the scan for the details
                            t0 = t1global;

                        }

                        // linear reverse scan

                        for (let giveUpAt = i1 - 2; ;) {

                            if (t0 === undefined) {

                                // before start

                                this._cachedIndex = 0;
                                return this.copySampleValue_(0);

                            }

                            if (i1 === giveUpAt) break; // this loop

                            t1 = t0;
                            t0 = pp[--i1 - 1];

                            if (t >= t0) {

                                // we have arrived at the sought interval
                                break seek;

                            }

                        }

                        // prepare binary search on the left side of the index
                        right = i1;
                        i1 = 0;
                        break linear_scan;

                    }

                    // the interval is valid

                    break validate_interval;

                } // linear scan

                // binary search

                while (i1 < right) {

                    const mid = (i1 + right) >>> 1;

                    if (t < pp[mid]) {

                        right = mid;

                    } else {

                        i1 = mid + 1;

                    }

                }

                t1 = pp[i1];
                t0 = pp[i1 - 1];

                // check boundary cases, again

                if (t0 === undefined) {

                    this._cachedIndex = 0;
                    return this.copySampleValue_(0);

                }

                if (t1 === undefined) {

                    i1 = pp.length;
                    this._cachedIndex = i1;
                    return this.copySampleValue_(i1 - 1);

                }

            } // seek

            this._cachedIndex = i1;

            this.intervalChanged_(i1, t0, t1);

        } // validate_interval

        return this.interpolate_(i1, t0, t, t1);

    },

    getSettings_() {

        return this.settings || this.DefaultSettings_;

    },

    copySampleValue_(index) {

        // copies a sample value to the result buffer

        const result = this.resultBuffer,
            values = this.sampleValues,
            stride = this.valueSize,
            offset = index * stride;

        for (let i = 0; i !== stride; ++i) {

            result[i] = values[offset + i];

        }

        return result;

    },

    // Template methods for derived classes:

    interpolate_( /* i1, t0, t, t1 */) {

        throw new Error('call to abstract method');
        // implementations shall return this.resultBuffer

    },

    intervalChanged_( /* i1, t0, t1 */) {

        // empty

    }

});

/**
 * Fast and simple cubic spline interpolant.
 *
 * It was derived from a Hermitian construction setting the first derivative
 * at each sample position to the linear slope between neighboring positions
 * over their parameter interval.
 */

var CubicInterpolant = makeClass(function (parameterPositions, sampleValues, sampleSize, resultBuffer) {

    Interpolant.call(this, parameterPositions, sampleValues, sampleSize, resultBuffer);

    this._weightPrev = - 0;
    this._offsetPrev = - 0;
    this._weightNext = - 0;
    this._offsetNext = - 0;

    this.DefaultSettings_ = {

        endingStart: ZeroCurvatureEnding,
        endingEnd: ZeroCurvatureEnding

    };

}, {

    intervalChanged_(i1, t0, t1) {

        const pp = this.parameterPositions;
        let iPrev = i1 - 2,
            iNext = i1 + 1,

            tPrev = pp[iPrev],
            tNext = pp[iNext];

        if (tPrev === undefined) {

            switch (this.getSettings_().endingStart) {

                case ZeroSlopeEnding:

                    // f'(t0) = 0
                    iPrev = i1;
                    tPrev = 2 * t0 - t1;

                    break;

                case WrapAroundEnding:

                    // use the other end of the curve
                    iPrev = pp.length - 2;
                    tPrev = t0 + pp[iPrev] - pp[iPrev + 1];

                    break;

                default: // ZeroCurvatureEnding

                    // f''(t0) = 0 a.k.a. Natural Spline
                    iPrev = i1;
                    tPrev = t1;

            }

        }

        if (tNext === undefined) {

            switch (this.getSettings_().endingEnd) {

                case ZeroSlopeEnding:

                    // f'(tN) = 0
                    iNext = i1;
                    tNext = 2 * t1 - t0;

                    break;

                case WrapAroundEnding:

                    // use the other end of the curve
                    iNext = 1;
                    tNext = t1 + pp[1] - pp[0];

                    break;

                default: // ZeroCurvatureEnding

                    // f''(tN) = 0, a.k.a. Natural Spline
                    iNext = i1 - 1;
                    tNext = t0;

            }

        }

        const halfDt = (t1 - t0) * 0.5,
            stride = this.valueSize;

        this._weightPrev = halfDt / (t0 - tPrev);
        this._weightNext = halfDt / (tNext - t1);
        this._offsetPrev = iPrev * stride;
        this._offsetNext = iNext * stride;

    },

    interpolate_(i1, t0, t, t1) {

        const result = this.resultBuffer,
            values = this.sampleValues,
            stride = this.valueSize,

            o1 = i1 * stride, o0 = o1 - stride,
            oP = this._offsetPrev, oN = this._offsetNext,
            wP = this._weightPrev, wN = this._weightNext,

            p = (t - t0) / (t1 - t0),
            pp = p * p,
            ppp = pp * p;

        // evaluate polynomials

        const sP = - wP * ppp + 2 * wP * pp - wP * p;
        const s0 = (1 + wP) * ppp + (- 1.5 - 2 * wP) * pp + (- 0.5 + wP) * p + 1;
        const s1 = (- 1 - wN) * ppp + (1.5 + wN) * pp + 0.5 * p;
        const sN = wN * ppp - wN * pp;

        // combine data linearly

        for (let i = 0; i !== stride; ++i) {

            result[i] =
                sP * values[oP + i] +
                s0 * values[o0 + i] +
                s1 * values[o1 + i] +
                sN * values[oN + i];

        }

        return result;

    }

}, {}, Interpolant);


var LinearInterpolant = makeClass(0, {

    interpolate_(i1, t0, t, t1) {

        const result = this.resultBuffer,
            values = this.sampleValues,
            stride = this.valueSize,

            offset1 = i1 * stride,
            offset0 = offset1 - stride,

            weight1 = (t - t0) / (t1 - t0),
            weight0 = 1 - weight1;

        for (let i = 0; i !== stride; ++i) {

            result[i] =
                values[offset0 + i] * weight0 +
                values[offset1 + i] * weight1;

        }

        return result;

    }

}, {}, Interpolant);

/**
 *
 * Interpolant that evaluates to the sample value at the position preceding
 * the parameter.
 */

var DiscreteInterpolant = makeClass(0, {

    interpolate_(i1 /*, t0, t, t1 */) {

        return this.copySampleValue_(i1 - 1);

    }

}, {}, Interpolant);


/**
 * Spherical linear unit quaternion interpolant.
 */

var QuaternionLinearInterpolant = makeClass(0, {

    interpolate_(i1, t0, t, t1) {

        const result = this.resultBuffer,
            values = this.sampleValues,
            stride = this.valueSize,

            alpha = (t - t0) / (t1 - t0);

        let offset = i1 * stride;

        for (let end = offset + stride; offset !== end; offset += 4) {

            Quaternion.slerpFlat(result, 0, values, offset - stride, values, offset, alpha);

        }

        return result;

    }
}, 0, Interpolant);
/////////////// -----------------------------------------------------


// converts an array to a specific type
function convertArray(array, type, forceClone) {

    if (!array || // let 'undefined' and 'null' pass
        !forceClone && array.constructor === type) return array;

    if (typeof type.BYTES_PER_ELEMENT === 'number') {

        return new type(array); // create typed array

    }

    return Array.prototype.slice.call(array); // create Array

}

function isTypedArray(object) {

    return ArrayBuffer.isView(object) &&
        !(object instanceof DataView);

}

// returns an array by which times and values can be sorted
function getKeyframeOrder(times) {

    function compareTime(i, j) {

        return times[i] - times[j];

    }

    const n = times.length;
    const result = new Array(n);
    for (let i = 0; i !== n; ++i) result[i] = i;

    result.sort(compareTime);

    return result;

}

// uses the array previously returned by 'getKeyframeOrder' to sort data
function sortedArray(values, stride, order) {

    const nValues = values.length;
    const result = new values.constructor(nValues);

    for (let i = 0, dstOffset = 0; dstOffset !== nValues; ++i) {

        const srcOffset = order[i] * stride;

        for (let j = 0; j !== stride; ++j) {

            result[dstOffset++] = values[srcOffset + j];

        }

    }

    return result;

}

// function for parsing AOS keyframe formats
function flattenJSON(jsonKeys, times, values, valuePropertyName) {

    let i = 1, key = jsonKeys[0];

    while (key !== undefined && key[valuePropertyName] === undefined) {

        key = jsonKeys[i++];

    }

    if (key === undefined) return; // no data

    let value = key[valuePropertyName];
    if (value === undefined) return; // no data

    if (isArray(value)) {

        do {

            value = key[valuePropertyName];

            if (value !== undefined) {

                times.push(key.time);
                values.push.apply(values, value); // push all elements

            }

            key = jsonKeys[i++];

        } while (key !== undefined);

    } else if (value.__toArray !== undefined) {

        // ...assume THREE.Math-ish

        do {

            value = key[valuePropertyName];

            if (value !== undefined) {

                times.push(key.time);
                value.__toArray(values, values.length);

            }

            key = jsonKeys[i++];

        } while (key !== undefined);

    } else {

        // otherwise push as-is

        do {

            value = key[valuePropertyName];

            if (value !== undefined) {

                times.push(key.time);
                values.push(value);

            }

            key = jsonKeys[i++];

        } while (key !== undefined);

    }

}

function subclip(sourceClip, name, startFrame, endFrame, fps = 30) {

    const clip = sourceClip.__clone();

    clip.name = name;

    const tracks = [];

    for (let i = 0; i < clip.tracks.length; ++i) {

        const track = clip.tracks[i];
        const valueSize = track.getValueSize();

        const times = [];
        const values = [];

        for (let j = 0; j < track.times.length; ++j) {

            const frame = track.times[j] * fps;

            if (frame < startFrame || frame >= endFrame) continue;

            times.push(track.times[j]);

            for (let k = 0; k < valueSize; ++k) {

                values.push(track.values[j * valueSize + k]);

            }

        }

        if (times.length === 0) continue;

        track.times = convertArray(times, track.times.constructor);
        track.values = convertArray(values, track.values.constructor);

        tracks.push(track);

    }

    clip.tracks = tracks;

    // find minimum .times value across all tracks in the trimmed clip

    let minStartTime = Infinity;

    for (let i = 0; i < clip.tracks.length; ++i) {

        if (minStartTime > clip.tracks[i].times[0]) {

            minStartTime = clip.tracks[i].times[0];

        }

    }

    // shift all tracks such that clip begins at t=0

    for (let i = 0; i < clip.tracks.length; ++i) {

        clip.tracks[i].shift(- 1 * minStartTime);

    }

    clip.resetDuration();

    return clip;

}

function makeClipAdditive(targetClip, referenceFrame = 0, referenceClip = targetClip, fps = 30) {

    if (fps <= 0) fps = 30;

    const numTracks = referenceClip.tracks.length;
    const referenceTime = referenceFrame / fps;

    // Make each track's values relative to the values at the reference frame
    for (let i = 0; i < numTracks; ++i) {

        const referenceTrack = referenceClip.tracks[i];
        const referenceTrackType = referenceTrack.ValueTypeName;

        // Skip this track if it's non-numeric
        if (referenceTrackType === 'bool' || referenceTrackType === 'string') continue;

        // Find the track in the target clip whose name and type matches the reference track
        const targetTrack = targetClip.tracks.find(function (track) {

            return track.name === referenceTrack.name
                && track.ValueTypeName === referenceTrackType;

        });

        if (targetTrack === undefined) continue;

        let referenceOffset = 0;
        const referenceValueSize = referenceTrack.getValueSize();

        if (referenceTrack.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline) {

            referenceOffset = referenceValueSize / 3;

        }

        let targetOffset = 0;
        const targetValueSize = targetTrack.getValueSize();

        if (targetTrack.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline) {

            targetOffset = targetValueSize / 3;

        }

        const lastIndex = referenceTrack.times.length - 1;
        let referenceValue;

        // Find the value to subtract out of the track
        if (referenceTime <= referenceTrack.times[0]) {

            // Reference frame is earlier than the first keyframe, so just use the first keyframe
            const startIndex = referenceOffset;
            const endIndex = referenceValueSize - referenceOffset;
            referenceValue = referenceTrack.values.slice(startIndex, endIndex);

        } else if (referenceTime >= referenceTrack.times[lastIndex]) {

            // Reference frame is after the last keyframe, so just use the last keyframe
            const startIndex = lastIndex * referenceValueSize + referenceOffset;
            const endIndex = startIndex + referenceValueSize - referenceOffset;
            referenceValue = referenceTrack.values.slice(startIndex, endIndex);

        } else {

            // Interpolate to the reference value
            const interpolant = referenceTrack.createInterpolant();
            const startIndex = referenceOffset;
            const endIndex = referenceValueSize - referenceOffset;
            interpolant.evaluate(referenceTime);
            referenceValue = interpolant.resultBuffer.slice(startIndex, endIndex);

        }

        // Conjugate the quaternion
        if (referenceTrackType === 'quaternion') {

            const referenceQuat = new Quaternion().__fromArray(referenceValue).__normalize().__conjugate();
            referenceQuat.__toArray(referenceValue);

        }

        // Subtract the reference value from all of the track values

        const numTimes = targetTrack.times.length;
        for (let j = 0; j < numTimes; ++j) {

            const valueStart = j * targetValueSize + targetOffset;

            if (referenceTrackType === 'quaternion') {

                // Multiply the conjugate for quaternion track types
                Quaternion.__multiplyQuaternionsFlat(
                    targetTrack.values,
                    valueStart,
                    referenceValue,
                    0,
                    targetTrack.values,
                    valueStart
                );

            } else {

                const valueEnd = targetValueSize - targetOffset * 2;

                // Subtract each value for all other numeric track types
                for (let k = 0; k < valueEnd; ++k) {

                    targetTrack.values[valueStart + k] -= referenceValue[k];

                }

            }

        }

    }

    targetClip.blendMode = AdditiveAnimationBlendMode;

    return targetClip;

}

// --------------------------------------

var KeyframeTrack = makeClass(function (name, times, values, interpolation) {
    //cheats
    if (name === undefined) throw new Error('KeyframeTrack: track name is undefined');
    if (times === undefined || times.length === 0) throw new Error('KeyframeTrack: no keyframes in track named ' + name);
    //endcheats

    this.name = name;

    this.times = convertArray(times, this.TimeBufferType);
    this.values = convertArray(values, this.ValueBufferType);

    this.setInterpolation(interpolation || this.DefaultInterpolation);

}, {

    // Serialization (in context, because of constructor invocation
    // and automatic invocation of .__toJson):

    __toJson(track) {

        const trackType = track.constructor;

        let json;

        // derived classes can define a __toJson method
        if (trackType.__toJson !== this.__toJson) {

            json = trackType.__toJson(track);

        } else {

            // by default, we assume the data can be serialized as-is
            json = {

                'name': track.name,
                'times': convertArray(track.times, Array),
                'values': convertArray(track.values, Array)

            };

            const interpolation = track.getInterpolation();

            if (interpolation !== track.DefaultInterpolation) {

                json.interpolation = interpolation;

            }

        }

        json.type = track.ValueTypeName; // mandatory

        return json;

    },

    InterpolantFactoryMethodDiscrete(result) {

        return new DiscreteInterpolant(this.times, this.values, this.getValueSize(), result);

    },

    InterpolantFactoryMethodLinear(result) {

        return new LinearInterpolant(this.times, this.values, this.getValueSize(), result);

    },

    InterpolantFactoryMethodSmooth(result) {

        return new CubicInterpolant(this.times, this.values, this.getValueSize(), result);

    },

    setInterpolation(interpolation) {

        let factoryMethod;

        switch (interpolation) {

            case InterpolateDiscrete:

                factoryMethod = this.InterpolantFactoryMethodDiscrete;

                break;

            case InterpolateLinear:

                factoryMethod = this.InterpolantFactoryMethodLinear;

                break;

            case InterpolateSmooth:

                factoryMethod = this.InterpolantFactoryMethodSmooth;

                break;

        }

        if (factoryMethod === undefined) {

            const message = 'unsupported interpolation for ' +
                this.ValueTypeName + ' keyframe track named ' + this.name;

            if (this.createInterpolant === undefined) {

                // fall back to default, unless the default itself is messed up
                if (interpolation !== this.DefaultInterpolation) {

                    this.setInterpolation(this.DefaultInterpolation);

                } else {

                    throw new Error(message); // fatal, in this case

                }

            }

            console.warn('KeyframeTrack:', message);
            return this;

        }

        this.createInterpolant = factoryMethod;

        return this;

    },

    getInterpolation() {

        switch (this.createInterpolant) {

            case this.InterpolantFactoryMethodDiscrete:

                return InterpolateDiscrete;

            case this.InterpolantFactoryMethodLinear:

                return InterpolateLinear;

            case this.InterpolantFactoryMethodSmooth:

                return InterpolateSmooth;

        }

    },

    getValueSize() {

        return this.values.length / this.times.length;

    },

    // move all keyframes either forwards or backwards in time
    shift(timeOffset) {

        if (timeOffset !== 0.0) {

            const times = this.times;

            for (let i = 0, n = times.length; i !== n; ++i) {

                times[i] += timeOffset;

            }

        }

        return this;

    },

    // scale all keyframe times by a factor (useful for frame <-> seconds conversions)
    scale(timeScale) {

        if (timeScale !== 1.0) {

            const times = this.times;

            for (let i = 0, n = times.length; i !== n; ++i) {

                times[i] *= timeScale;

            }

        }

        return this;

    },

    // removes keyframes before and after animation without changing any values within the range [startTime, endTime].
    // IMPORTANT: We do not shift around keys to the start of the track time, because for interpolated keys this will change their values
    trim(startTime, endTime) {

        const times = this.times,
            nKeys = times.length;

        let from = 0,
            to = nKeys - 1;

        while (from !== nKeys && times[from] < startTime) {

            ++from;

        }

        while (to !== - 1 && times[to] > endTime) {

            --to;

        }

        ++to; // inclusive -> exclusive bound

        if (from !== 0 || to !== nKeys) {

            // empty tracks are forbidden, so keep at least one keyframe
            if (from >= to) {

                to = Math.max(to, 1);
                from = to - 1;

            }

            const stride = this.getValueSize();
            this.times = times.slice(from, to);
            this.values = this.values.slice(from * stride, to * stride);

        }

        return this;

    },

    // ensure we do not get a GarbageInGarbageOut situation, make sure tracks are at least minimally viable
    validate() {

        let valid = true;

        const valueSize = this.getValueSize();
        if (valueSize - Math.floor(valueSize) !== 0) {

            console.error('KeyframeTrack: Invalid value size in track.', this);
            valid = false;

        }

        const times = this.times,
            values = this.values,

            nKeys = times.length;

        if (nKeys === 0) {

            console.error('KeyframeTrack: Track is empty.', this);
            valid = false;

        }

        let prevTime = null;

        for (let i = 0; i !== nKeys; i++) {

            const currTime = times[i];

            if (typeof currTime === 'number' && isNaN(currTime)) {

                console.error('KeyframeTrack: Time is not a valid number.', this, i, currTime);
                valid = false;
                break;

            }

            if (prevTime !== null && prevTime > currTime) {

                console.error('KeyframeTrack: Out of order keys.', this, i, currTime, prevTime);
                valid = false;
                break;

            }

            prevTime = currTime;

        }

        if (values !== undefined) {

            if (isTypedArray(values)) {

                for (let i = 0, n = values.length; i !== n; ++i) {

                    const value = values[i];

                    if (isNaN(value)) {

                        console.error('KeyframeTrack: Value is not a valid number.', this, i, value);
                        valid = false;
                        break;

                    }

                }

            }

        }

        return valid;

    },

    // removes equivalent sequential keys as common in morph target sequences
    // (0,0,0,0,1,1,1,0,0,0,0,0,0,0) --> (0,0,1,1,0,0)
    optimize() {

        // times or values may be shared with other tracks, so overwriting is unsafe
        const times = this.times.slice(),
            values = this.values.slice(),
            stride = this.getValueSize(),

            smoothInterpolation = this.getInterpolation() === InterpolateSmooth,

            lastIndex = times.length - 1;

        let writeIndex = 1;

        for (let i = 1; i < lastIndex; ++i) {

            let keep = false;

            const time = times[i];
            const timeNext = times[i + 1];

            // remove adjacent keyframes scheduled at the same time

            if (time !== timeNext && (i !== 1 || time !== times[0])) {

                if (!smoothInterpolation) {

                    // remove unnecessary keyframes same as their neighbors

                    const offset = i * stride,
                        offsetP = offset - stride,
                        offsetN = offset + stride;

                    for (let j = 0; j !== stride; ++j) {

                        const value = values[offset + j];

                        if (value !== values[offsetP + j] ||
                            value !== values[offsetN + j]) {

                            keep = true;
                            break;

                        }

                    }

                } else {

                    keep = true;

                }

            }

            // in-place compaction

            if (keep) {

                if (i !== writeIndex) {

                    times[writeIndex] = times[i];

                    const readOffset = i * stride,
                        writeOffset = writeIndex * stride;

                    for (let j = 0; j !== stride; ++j) {

                        values[writeOffset + j] = values[readOffset + j];

                    }

                }

                ++writeIndex;

            }

        }

        // flush last keyframe (compaction looks ahead)

        if (lastIndex > 0) {

            times[writeIndex] = times[lastIndex];

            for (let readOffset = lastIndex * stride, writeOffset = writeIndex * stride, j = 0; j !== stride; ++j) {

                values[writeOffset + j] = values[readOffset + j];

            }

            ++writeIndex;

        }

        if (writeIndex !== times.length) {

            this.times = times.slice(0, writeIndex);
            this.values = values.slice(0, writeIndex * stride);

        } else {

            this.times = times;
            this.values = values;

        }

        return this;

    },

    __clone() {

        const times = this.times.slice();
        const values = this.values.slice();

        const TypedKeyframeTrack = this.constructor;
        const track = new TypedKeyframeTrack(this.name, times, values);

        // Interpolant argument to constructor is not saved, so copy the factory method directly.
        track.createInterpolant = this.createInterpolant;

        return track;

    },

    TimeBufferType: Float32Array,
    ValueBufferType: Float32Array,
    DefaultInterpolation: InterpolateLinear

});


/**
 * A Track of Boolean keyframe values.
 */
var BooleanKeyframeTrack = makeClass(0, {

    ValueTypeName: 'bool',
    ValueBufferType: Array,
    DefaultInterpolation: InterpolateDiscrete,
    InterpolantFactoryMethodLinear: undefined,
    InterpolantFactoryMethodSmooth: undefined,

}, {}, KeyframeTrack)


/**
 * A Track of keyframe values that represent color.
 */
var ColorKeyframeTrack = makeClass(0, { ValueTypeName: 'color' }, 0, KeyframeTrack)

/**
 * A Track of numeric keyframe values.
 */
var NumberKeyframeTrack = makeClass(0, { ValueTypeName: 'number' }, 0, KeyframeTrack)

/**
 * A Track of quaternion keyframe values.
 */
var QuaternionKeyframeTrack = makeClass(0, {

    InterpolantFactoryMethodLinear(result) {

        return new QuaternionLinearInterpolant(this.times, this.values, this.getValueSize(), result);

    },
    ValueTypeName: 'quaternion',
    InterpolantFactoryMethodSmooth: undefined

}, 0, KeyframeTrack);


/**
 * A Track that interpolates Strings
 */
var StringKeyframeTrack = makeClass(0, {

    ValueTypeName: 'string',
    ValueBufferType: Array,
    DefaultInterpolation: InterpolateDiscrete,
    InterpolantFactoryMethodLinear: undefined,
    InterpolantFactoryMethodSmooth: undefined

}, 0, KeyframeTrack);

/**
 * A Track of vectored keyframe values.
 */
var VectorKeyframeTrack = makeClass(0, {

    ValueTypeName: 'vector'

}, 0, KeyframeTrack);



var AnimationClip = makeClass(function (name = '', duration = - 1, tracks = [], blendMode = NormalAnimationBlendMode) {

    this.name = name;
    this.tracks = tracks;
    this.duration = duration;
    this.blendMode = blendMode;

    this.uuid = generateUUID();

    // this means it should figure out its duration by scanning the tracks
    if (this.duration < 0) {

        this.resetDuration();

    }

}, {


    __parse(json) {

        const tracks = [],
            jsonTracks = json.tracks,
            frameTime = 1.0 / (json.fps || 1.0);

        for (let i = 0, n = jsonTracks.length; i !== n; ++i) {

            tracks.push(parseKeyframeTrack(jsonTracks[i]).scale(frameTime));

        }

        const clip = new this(json.name, json.duration, tracks, json.blendMode);
        clip.uuid = json.uuid;

        return clip;

    },

    __toJson(clip) {

        const tracks = [],
            clipTracks = clip.tracks;

        const json = {

            'name': clip.name,
            'duration': clip.duration,
            'tracks': tracks,
            'uuid': clip.uuid,
            'blendMode': clip.blendMode

        };

        for (let i = 0, n = clipTracks.length; i !== n; ++i) {

            tracks.push(KeyframeTrack.__toJson(clipTracks[i]));

        }

        return json;

    },

    CreateFromMorphTargetSequence(name, morphTargetSequence, fps, noLoop) {

        const numMorphTargets = morphTargetSequence.length;
        const tracks = [];

        for (let i = 0; i < numMorphTargets; i++) {

            let times = [];
            let values = [];

            times.push(
                (i + numMorphTargets - 1) % numMorphTargets,
                i,
                (i + 1) % numMorphTargets);

            values.push(0, 1, 0);

            const order = getKeyframeOrder(times);
            times = sortedArray(times, 1, order);
            values = sortedArray(values, 1, order);

            // if there is a key at the first frame, duplicate it as the
            // last frame as well for perfect loop.
            if (!noLoop && times[0] === 0) {

                times.push(numMorphTargets);
                values.push(values[0]);

            }

            tracks.push(
                new NumberKeyframeTrack(
                    '.morphTargetInfluences[' + morphTargetSequence[i].name + ']',
                    times, values
                ).scale(1.0 / fps));

        }

        return new this(name, - 1, tracks);

    },

    findByName(objectOrClipArray, name) {

        let clipArray = objectOrClipArray;

        if (!Array.isArray(objectOrClipArray)) {

            const o = objectOrClipArray;
            clipArray = o.geometry && o.geometry.animations || o.animations;

        }

        for (let i = 0; i < clipArray.length; i++) {

            if (clipArray[i].name === name) {

                return clipArray[i];

            }

        }

        return null;

    },

    CreateClipsFromMorphTargetSequences(morphTargets, fps, noLoop) {

        const animationToMorphTargets = {};

        // tested with https://regex101.com/ on trick sequences
        // such flamingo_flyA_003, flamingo_run1_003, crdeath0059
        const pattern = /^([\w-]*?)([\d]+)$/;

        // sort morph target names into animation groups based
        // patterns like Walk_001, Walk_002, Run_001, Run_002
        for (let i = 0, il = morphTargets.length; i < il; i++) {

            const morphTarget = morphTargets[i];
            const parts = morphTarget.name.match(pattern);

            if (parts && parts.length > 1) {

                const name = parts[1];

                let animationMorphTargets = animationToMorphTargets[name];

                if (!animationMorphTargets) {

                    animationToMorphTargets[name] = animationMorphTargets = [];

                }

                animationMorphTargets.push(morphTarget);

            }

        }

        const clips = [];

        for (const name in animationToMorphTargets) {

            clips.push(this.CreateFromMorphTargetSequence(name, animationToMorphTargets[name], fps, noLoop));

        }

        return clips;

    },

    // parse the animation.hierarchy format
    parseAnimation(animation, bones) {

        if (!animation) {

            console.error('AnimationClip: No animation in JSONLoader data.');
            return null;

        }

        const addNonemptyTrack = function (trackType, trackName, animationKeys, propertyName, destTracks) {

            // only return track if there are actually keys.
            if (animationKeys.length !== 0) {

                const times = [];
                const values = [];

                flattenJSON(animationKeys, times, values, propertyName);

                // empty keys are filtered out, so check again
                if (times.length !== 0) {

                    destTracks.push(new trackType(trackName, times, values));

                }

            }

        };

        const tracks = [];

        const clipName = animation.name || 'default';
        const fps = animation.fps || 30;
        const blendMode = animation.blendMode;

        // automatic length determination in AnimationClip.
        let duration = animation.length || - 1;

        const hierarchyTracks = animation.hierarchy || [];

        for (let h = 0; h < hierarchyTracks.length; h++) {

            const animationKeys = hierarchyTracks[h].keys;

            // skip empty tracks
            if (!animationKeys || animationKeys.length === 0) continue;

            // process morph targets
            if (animationKeys[0].morphTargets) {

                // figure out all morph targets used in this track
                const morphTargetNames = {};

                let k;

                for (k = 0; k < animationKeys.length; k++) {

                    if (animationKeys[k].morphTargets) {

                        for (let m = 0; m < animationKeys[k].morphTargets.length; m++) {

                            morphTargetNames[animationKeys[k].morphTargets[m]] = - 1;

                        }

                    }

                }

                // create a track for each morph target with all zero
                // morphTargetInfluences except for the keys in which
                // the morphTarget is named.
                for (const morphTargetName in morphTargetNames) {

                    const times = [];
                    const values = [];

                    for (let m = 0; m !== animationKeys[k].morphTargets.length; ++m) {

                        const animationKey = animationKeys[k];

                        times.push(animationKey.time);
                        values.push((animationKey.morphTarget === morphTargetName) ? 1 : 0);

                    }

                    tracks.push(new NumberKeyframeTrack('.morphTargetInfluence[' + morphTargetName + ']', times, values));

                }

                duration = morphTargetNames.length * fps;

            } else {

                // ...assume skeletal animation

                const boneName = '.bones[' + bones[h].name + ']';

                addNonemptyTrack(
                    VectorKeyframeTrack, boneName + '.position',
                    animationKeys, 'pos', tracks);

                addNonemptyTrack(
                    QuaternionKeyframeTrack, boneName + '.quaternion',
                    animationKeys, 'rot', tracks);

                addNonemptyTrack(
                    VectorKeyframeTrack, boneName + '.scale',
                    animationKeys, 'scl', tracks);

            }

        }

        if (tracks.length === 0) {

            return null;

        }

        const clip = new this(clipName, duration, tracks, blendMode);

        return clip;

    },

    resetDuration() {

        const tracks = this.tracks;
        let duration = 0;

        for (let i = 0, n = tracks.length; i !== n; ++i) {

            const track = this.tracks[i];

            duration = Math.max(duration, track.times[track.times.length - 1]);

        }

        this.duration = duration;

        return this;

    },

    trim() {

        for (let i = 0; i < this.tracks.length; i++) {

            this.tracks[i].trim(0, this.duration);

        }

        return this;

    },

    validate() {

        let valid = true;

        for (let i = 0; i < this.tracks.length; i++) {

            valid = valid && this.tracks[i].validate();

        }

        return valid;

    },

    optimize() {

        for (let i = 0; i < this.tracks.length; i++) {

            this.tracks[i].optimize();

        }

        return this;

    },

    __clone() {

        const tracks = [];

        for (let i = 0; i < this.tracks.length; i++) {

            tracks.push(this.tracks[i].__clone());

        }

        return new this.constructor(this.name, this.duration, tracks, this.blendMode);

    },
    __toJson() {

        return this.constructor.__toJson(this);

    }

});

function getTrackTypeForValueTypeName(typeName) {

    switch (typeName.toLowerCase()) {

        case 'scalar':
        case 'double':
        case 'float':
        case 'number':
        case 'integer':

            return NumberKeyframeTrack;

        case 'vector':
        case 'vector2':
        case 'vector3':
        case 'vector4':

            return VectorKeyframeTrack;

        case 'color':

            return ColorKeyframeTrack;

        case 'quaternion':

            return QuaternionKeyframeTrack;

        case 'bool':
        case 'boolean':

            return BooleanKeyframeTrack;

        case 'string':

            return StringKeyframeTrack;

    }

    throw new Error('KeyframeTrack: Unsupported typeName: ' + typeName);

}

function parseKeyframeTrack(json) {

    if (json.type === undefined) {

        throw new Error('KeyframeTrack: track type undefined, can not parse');

    }

    const trackType = getTrackTypeForValueTypeName(json.type);

    if (json.times === undefined) {

        const times = [], values = [];

        flattenJSON(json.keys, times, values, 'value');

        json.times = times;
        json.values = values;

    }

    // derived classes can define a parse method
    if (trackType.parse !== undefined) {

        return trackType.parse(json);

    } else {

        // by default, we assume a constructor compatible with the base
        return new trackType(json.name, json.times, json.values, json.interpolation);

    }

}

