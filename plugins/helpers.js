function makeParallax2d(coeff, fov) {
    if (window.parallax_coeff == undefined) {
        ObjectDefineProperties(NodePrototype, {
            parallaxOffset: {
                get() {
                    var e = this.mw.e
                        , x = e[12]
                        , y = e[13]
                        , z = this.__totalZ
                        , v = __screenCenter.clone()
                            .sub(mouse)
                            .__divide(__screenCenter)
                            .__multiplyScalar(window.parallax_coeff * this.__totalZ);
                    v.y *= -1;
                    v.y += y * z * window.parallax_fov;
                    v.x += x * z * window.parallax_fov;
                    return v;
                }
            }
        });
    }
    Editor.currentLayout.layoutView.$().__shader = 'parallax2d';
    window.parallax_coeff = (coeff || 1) / 1000;
    window.parallax_fov = (fov || 0) / 1000000;
}




function makeParallax3dCam(coeff, fov, cam) {

    cam = cam || Editor.currentLayout.camera;
    fov = fov || 5;
    coeff = (coeff || 0) / 1000;

    cam.__updateProjectionMatrix = function () {

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
            , z = (far + near) * p;

        var c = __screenCenter.clone().sub(mouse);

        te[0] = 2 * w; te[4] = 0; te[8] = 0; te[12] = - x + coeff * c.x;
        te[1] = 0; te[5] = 2 * h; te[9] = 0; te[13] = - y - coeff * c.y;
        te[2] = 0; te[6] = 0; te[10] = - 2 * p; te[14] = - z;
        te[3] = 0; te[7] = 0; te[11] = -0.001 * fov; te[15] = 1;

        pm.__is3D = 1;
        pm.__isScrollMatrix = 1;
        pm.im = pm.__getInverseMatrix();
        pm.htc = 0;
        looperPost(() => { cam.__updateProjectionMatrix() });
        return this;

    };

    cam.__updateProjectionMatrix();

}




function onOneLine(v1x, v1y, v2x, v2y, v3x, v3y) {
    if (v1y == v2y) {
        return v1y == v3y;
    }
    if (v1y == v3y) {
        return 0;
    }
    if (v1x == v2x) {
        return v1x == v3x;
    }
    if (v1x == v3x) {
        return 0;
    }
    return (v3y - v1y) / (v2y - v1y) == (v3x - v1x) / (v2x - v1x);
}

function exportChildVertices(node, scale, offset) {
    var r = {};
    node.__eachChild((c, i) => { r[c.name] = exportVertices(c.__childs, scale, offset) });

    consoleLog(JSON.stringify(r));
    return r;
}

function exportVertices(nodes, scale, offset) {

    var r = { i: [], v: [], u: [] }, gi = 0;
    if (scale) r.scale = scale;
    if (offset) r.offset = offset;
    $each(nodes, n => {
        var verts = n.__verticesBuffer.__array
            , uvs = n.__uvsBuffer.__array
            , inds = n.__indecesBuffer.__array
            , cache = {};

        for (var i = 0; i < inds.length;) {
            var i1 = inds[i++], i2 = inds[i++], i3 = inds[i++],
                i12 = i1 * 2, i22 = i2 * 2, i32 = i3 * 2,
                v1x = verts[i12], v1y = verts[i12 + 1],
                v2x = verts[i22], v2y = verts[i22 + 1],
                v3x = verts[i32], v3y = verts[i32 + 1];

            if (!onOneLine(v1x, v1y, v2x, v2y, v3x, v3y)) {
                i1 = i2 = i3 = 0;

                var te = n.__matrix.e, w,
                    n11 = te[0], n12 = te[4], n14 = te[12],
                    n21 = te[1], n22 = te[5], n24 = te[13],
                    n41 = te[3], n42 = te[7], n44 = te[15];

                w = n41 * v1x + n42 * v1y + n44;
                v1x = (n11 * v1x + n12 * v1y + n14) / w;
                v1y = (n21 * v1x + n22 * v1y + n24) / w;

                w = n41 * v2x + n42 * v2y + n44;
                v2x = (n11 * v2x + n12 * v2y + n14) / w;
                v2y = (n21 * v2x + n22 * v2y + n24) / w;

                w = n41 * v3x + n42 * v3y + n44;
                v3x = (n11 * v3x + n12 * v3y + n14) / w;
                v3y = (n21 * v3x + n22 * v3y + n24) / w;

                if (cache[v1x]) i1 = cache[v1x][v1y];
                if (cache[v2x]) i2 = cache[v2x][v2y];
                if (cache[v3x]) i3 = cache[v3x][v3y];

                if (!i1) {
                    i1 = r.v.length / 2;
                    if (!cache[v1x]) cache[v1x] = {};
                    cache[v1x][v1y] = i1;
                    r.v.push(v1x, v1y);
                    r.u.push(uvs[i12], uvs[i12 + 1]);
                }

                if (!i2) {
                    i2 = r.v.length / 2;
                    if (!cache[v2x]) cache[v2x] = {};
                    cache[v2x][v2y] = i2;
                    r.v.push(v2x, v2y);
                    r.u.push(uvs[i22], uvs[i22 + 1]);
                }

                if (!i3) {
                    i3 = r.v.length / 2;
                    if (!cache[v3x]) cache[v3x] = {};
                    cache[v3x][v3y] = i3;
                    r.v.push(v3x, v3y);
                    r.u.push(uvs[i32], uvs[i32 + 1]);
                }

                r.i.push(i1, i2, i3);
            }
        }
    });

    return { geometry: r };
}
