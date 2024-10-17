

var CameraOrtho = makeClass(
    function () {
        var t = this;
        t.____zoom = 1;
        t.__isOrthographic = 1;
        Object3D.call(this)
        t.__projectionMatrix = new Matrix4();
        t.__near = -50000;
        t.__far = 50000;
    },
    {

        __init: defaultMergeInit,

        __setViewOffset: function (x, y, zoom) {

            var t = this;
            t.____zoom = zoom;

            x = x - (t.__right + t.__left) / 2;
            t.__right += x;
            t.__left += x;

            y = y - (t.__top + t.__bottom) / 2;
            t.__top += y;
            t.__bottom += y;

            return t.__updateProjectionMatrix();

        },

        __updateProjectionMatrix: function () {
            var t = this
                , left = t.__left
                , right = t.__right
                , top = t.__top
                , bottom = t.__bottom
                , zoom = t.____zoom
                , far = t.__far
                , near = t.__near
                , pm = t.__projectionMatrix
                , te = pm.e
                , w = zoom / (right - left)
                , h = zoom / (top - bottom)
                , p = 1.0 / (far - near)
                , x = (right + left) * w
                , y = (top + bottom) * h
                , z = (far + near) * p
                , mw = t.mw;

            te[0] = 2 * w;
            te[12] = - x;
            te[5] = 2 * h;
            te[13] = - y;
            te[10] = - 2 * p;
            te[14] = - z;
            te[15] = 1;

            pm.im = pm.__getInverseMatrix(pm.im);
            mw.im = mw.__getInverseMatrix(mw.im);
            return t;
        },

        __makeRay(pos) {
            var t = this, origin = new Vector3(pos.x, pos.y, (t.__near + t.__far) / (t.__near - t.__far)).__unproject(t);
            return new Ray(
                origin,
                new Vector3(t.__x, t.__y, 1)
            )
        },

        __moveBy(x, y){
            this.__x += x;
            this.__y += y;
        }
    },


    {
        __zoom: {
            set: function (v) {
                this.____zoom = v;
                this.__updateProjectionMatrix();
            },
            get: function () {
                return this.____zoom
            }
        },

        __x: {
            set: function (x) {
                var dx = (x || 0) - this.__x;
                this.__right += dx;
                this.__left += dx;
                this.__updateProjectionMatrix();
            },
            get: function () { return (this.__right + this.__left) / 2 }
        },

        __y: {
            set: function (v) {
                var dy = (v || 0) - this.__y;
                this.__top += dy;
                this.__bottom += dy;
                this.__updateProjectionMatrix();
            },

            get: function () { return (this.__top + this.__bottom) / 2 }

        }
    }, Object3D);

    