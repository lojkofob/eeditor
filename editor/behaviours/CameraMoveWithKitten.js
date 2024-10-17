var CameraMoveWithKitten = (function () {

    var cameras = [];

    function setLayoutCamera(layout, camera)
    {

        if (layout.camera) {
            removeFromArray(layout.camera, cameras);
        }

        layout.camera = camera;

        if (layout.nodeEditWithKitten)
            layout.nodeEditWithKitten.view.camera = layout.camera;

        layout.layoutView.camera = layout.camera;

        updateCamera(__screenSize.x, __screenSize.y, layout.camera);
        
        if (cameras.indexOf(layout.camera) == -1) {
            cameras.push(layout.camera);
        }

    }
 
    BUS.__addEventListener({

        LAYOUT_ACTIVATED: function (t, layout) {
        
            if (!layout.camera) {

                setLayoutCamera(layout, CameraMoveWithKitten.cameraCreator ? CameraMoveWithKitten.cameraCreator(layout) : new CameraOrtho()); 

            } else {

                updateCamera(__screenSize.x, __screenSize.y, layout.camera);
                
            }

            if (cameras.indexOf(layout.camera) == -1) {
                cameras.push(layout.camera);
            }

        },

        LAYOUT_DEACTIVATED: function (t, layout) {

            removeFromArray(layout.camera, cameras);

        },

        __ON_RESIZE: function () {
            $each(cameras, function (c) {
                updateCamera(__screenSize.x, __screenSize.y, c, c.__x, c.__y);
            });
        },


        EDITOR_PREPARED: function (t, e) {

            function cameraOperation(f) {
                if (e.currentLayout) {
                    var c = e.currentLayout.camera;
                    if (c) f(c);
                }
            }

            function moveCamera(dx, dy) {
                cameraOperation(function (c) {
                    c.__moveBy(- (dx || 0) / c.__zoom, (dy || 0) / c.__zoom);
                });
            }

            function zoomCamera(d) {
                cameraOperation(function (c) {
                    c.__zoom = clamp(c.__zoom - ((d || 0) / 10) * c.__zoom, 0.1, 50);
                });
            }

            addEditorEvents('Camera', {
                move: function (d) { moveCamera(d.dx, d.dy); },
                moveLeft: function (d) { moveCamera(d.dx || -20, 0); },
                moveRight: function (d) { moveCamera(d.dx || 20, 0); },
                moveUp: function (d) { moveCamera(0, d.dy || -20); },
                moveDown: function (d) { moveCamera(0, d.dy || 20); },
                zoom: function (d) { zoomCamera(d.d) },
                zoomIn: function (d) { zoomCamera(d.d || 1); },
                zoomOut: function (d) { zoomCamera(d.d || -1); }
            });

        }


    });

    return {
        
        setLayoutCamera: setLayoutCamera

    }


})();
