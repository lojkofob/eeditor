
let RenderOverTexturePlugin = (() => {

    consoleLog('RenderOverTexturePlugin!');

    let cc = makeSingleton({

    }, {

    });

    addEditorEvents('RenderOverTexturePlugin', {

    });

    addEditorBehaviours({

    });

    function rot(l, node) {

        var opts = getDeepFieldFromObject(node, '__userData', 'renderOverTexture');
        if (!opts)
            return;

        function getSize() {
            switch (opts.szType) {
                default: return __realScreenSize; break;
                case 1: return l.layoutView.__size; break;
                case 2: return __screenSize; break;
                case 3: return node.__size; break;
            }
        }

        var sz = getSize();
        var rt = new WebGLRenderTarget(sz.x, sz.y, { __dynamic: 1 });
        var nod = new ENode({
            __size: { x: 1, y: 1 },
            __shader: 'base',
            map: rt.__texture,
            __busObservers: {
                __ON_RESIZE: function () {
                    nod.update(1);
                    sz = getSize();
                    rt.__setSize(sz.x, sz.y);
                }
            }
        });

        node.__defaultUVSBuffer = new MyBufferAttribute('uv2', Float32Array, 2, GL_ARRAY_BUFFER, [0, 1, 1, 1, 0, 0, 1, 0], 1);
        var tmpb = defaultUVSBuffer;

        node.__updateUVS = function () {

            defaultUVSBuffer = node.__defaultUVSBuffer;

            NodePrototype.__updateUVS.apply(this, arguments);

            defaultUVSBuffer = tmpb;

            var uvs = node.__uvsBuffer;
            if (uvs && !uvs.__kk) {
                uvs.__name = 'uv2';
                node.__uvsBuffer2 = uvs;
            }


            node.__updateMatrixWorld();
            node.__removeAttributeBuffer('uv');
            uvs = node.__uvsBuffer = node.__addAttributeBuffer('uv', 2);
            if (node.__uvsBuffer2) {

                node.__uvsBuffer.__passToGL = function (pa) {
                    if (opts.useUV1) {
                        node.__uvsBuffer2.__array = node.__uvsBuffer.__array;
                        node.__uvsBuffer2.__changed = 1;
                    }
                    if (opts.swapUV) {
                        node.__uvsBuffer2.__name = 'uv';
                        node.__uvsBuffer.__name = 'uv2';
                    } else {
                        node.__uvsBuffer2.__name = 'uv2';
                        node.__uvsBuffer.__name = 'uv';
                    }

                    MyBufferAttribute.prototype.__passToGL.call(node.__uvsBuffer2, pa);
                    MyBufferAttribute.prototype.__passToGL.call(node.__uvsBuffer, pa);

                };
            }

            uvs.__kk = 1;
            var nsz = node.__size.__divideScalar(2);

            function getVec(x, y) {
                var v = new Vector3(x * nsz.x, y * nsz.y, 0).__applyMatrix4(node.mw).__applyMatrix4(l.camera.__projectionMatrix).__toVector2();
                v.x = (v.x + 1) / 2;
                v.y = (v.y + 1) / 2;
                return v;
            }

            var p1 = getVec(-1, +1);
            var p2 = getVec(+1, +1);
            var p3 = getVec(-1, -1);
            var p4 = getVec(+1, -1);

            uvs.__getArrayOfSize(8, 1).set([p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y]);

            return this;
        }
        var pass = 0;

        if (opts.deep) {
            // node.__traverseChilds(n => {
            //     n.__visible = 0;
            // });
        }

        l.layoutView.render = function () {
            renderNodeToTexture(l.layoutView, { __size: sz, __target: rt, __camera: l.camera, __clear: 1 });
        }

        var dropRT = node.$("dropRT");
        dropRT = dropRT ? dropRT[0] : 0;

        if (node.__img && !node.map3) {
            node.map3 = globalConfigsData.__frames[node.__img.split('.')[0]] || globalConfigsData.__frames[node.__img].tex;
        }

        if (dropRT) {
            var rt2 = new WebGLRenderTarget(sz.x, sz.y, { __dynamic: 1 });
            node.__render = function () {
                renderer.__setRenderTarget(rt2);
                renderer.__clear();
            };

            dropRT.__render = function () {
                renderer.__setRenderTarget(0);
                renderer.__render(nod, camera);

                if (opts.swapMap) {
                    node.map2 = rt.__texture;
                    node.map = rt2.__texture;
                } else {
                    node.map = rt.__texture;
                    node.map2 = rt2.__texture;
                }
                NodePrototype.__render.apply(node, arguments);
            };

        }
        else {

            node.__render = function () {

                renderer.__setRenderTarget(0);

                renderer.__render(nod, camera);

                if (node.map != rt.__texture) {
                    node.map2 = node.map;
                }

                node.map = rt.__texture;

                NodePrototype.__render.apply(this, arguments);

                if (node.map2) {
                    node.map = node.map2;
                }

            }
        }

    }

    BUS.__addEventListener({
        LAYOUT_ACTIVATED: function (t, l) {
            if (l.layoutView) {

                if (l.layoutView.render)
                    return;

                $each(l.layoutView.$("renderOverTexture"), n => {
                    if (!n.__userData) {
                        n.__userData = { renderOverTexture: {} };
                    }
                });

                l.layoutView.$(n => {
                    rot(l, n);
                });
            }
        }
    });

    return cc;

})();
