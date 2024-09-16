

var __cameraId = 0, CameraOrtho = makeClass(
    function () {
        this.id = __cameraId++;
        this.____zoom = 1;
        this.__isOrthographic = 1;
        Object3D.call(this)
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
                , pm = this.pm
                , te = pm.e
                , w = zoom / (right - left)
                , h = zoom / (top - bottom)
                , p = 1.0 / (far - near)
                , x = (right + left) * w
                , y = (top + bottom) * h
                , z = (far + near) * p;

            te[0] = 2 * w;
            te[12] = - x;
            te[5] = 2 * h;
            te[13] = - y;
            te[10] = - 2 * p;
            te[14] = - z;
            te[15] = 1;

            pm.im = pm.__getInverseMatrix(pm.im);

            return t;
        },

        __makeRay(pos) {
            var t = this, origin = new Vector3(pos.x, pos.y, (t.__near + t.__far) / (t.__near - t.__far)).__unproject(t);
            return new Ray(
                origin,
                new Vector3(t.__x, t.__y, 0)
            )
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
    }, Object3D),

    CameraPerspective = makeClass(
        function () {
            this.id = __cameraId++;
            this.____zoom = 1;
            this.__isPerspective = 1;
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
                    , pm = this.pm
                    , te = pm.e
                    , w = zoom / (right - left)
                    , h = zoom / (top - bottom)
                    , p = 1.0 / (far - near)
                    , x = (right + left) * w
                    , y = (top + bottom) * h
                    , z = (far + near) * p;

                te[0] = 2 * w;
                te[12] = - x;
                te[5] = 2 * h;
                te[13] = - y;
                te[10] = - 2 * p;
                te[14] = - z;
                te[15] = 1;

                pm.im = pm.__getInverseMatrix(pm.im);

                return t;
            },

            __makeRay(pos) {
                var t = this, origin = t.mw.__getPosition();
                return new Ray(
                    origin,
                    new Vector3(pos.x, pos.y, 0).__unproject(t).sub(origin).__normalize()
                )
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
            }
        });


function CameraCachedRay(cam, ppos) {
    var r = cam._cray;
    if (!r || r.x != ppos.x || r.y != ppos.y || r.__currentFrame != __currentFrame) {
        cam._cray = r = cam.__makeRay(ppos);
        r.__currentFrame = __currentFrame;
        r.__camera = cam;
        r.x = ppos.x;
        r.y = ppos.y;
    }
    return r;
}