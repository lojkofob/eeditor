(function(){
    

    var cameras = [];


    BUS.__addEventListener({
        
        LAYOUT_ACTIVATED: function(t, layout){
            
            if (!layout.camera){
                
                layout.camera = new Camera();
                
                if (layout.nodeEditWithKitten)
                    layout.nodeEditWithKitten.view.camera = layout.camera;
                
                layout.layoutView.camera = layout.camera;
                
            }
            
            updateCamera(__screenSize.x, __screenSize.y, layout.camera);
            cameras.push(layout.camera);
            
        },
        
        LAYOUT_DEACTIVATED: function(t, layout){
            
            removeFromArray(layout.camera, cameras);
            
        }, 
        
        __ON_RESIZE: function(){
            $each( cameras, function(c){
                updateCamera(__screenSize.x, __screenSize.y, c, c.__x, c.__y );
            } );
        },
        
        
        EDITOR_PREPARED: function(t, e){
            
            function cameraOperation(f){
                if (e.currentLayout) {
                    var c = e.currentLayout.camera;
                    if (c) f(c);
                }
            }
            
            function moveCamera(dx, dy){
                cameraOperation( function(c) {
                    c.__x -= (dx||0) / c.__zoom;
                    c.__y += (dy||0) / c.__zoom;
                } );
            }
            
            function zoomCamera(d) {
                cameraOperation( function(c){
                    c.__zoom = clamp(c.__zoom - ((d||0) / 10 ) * c.__zoom, 0.1, 50);
                } );
            }
            
            addEditorEvents('Camera', {
                move: function( d ){ moveCamera( d.dx, d.dy ); },
                moveLeft: function(d){ moveCamera( d.dx || -20, 0 ); },
                moveRight: function(d){ moveCamera( d.dx || 20, 0 ); },
                moveUp: function(d){ moveCamera( 0, d.dy || -20 ); },
                moveDown: function(d){ moveCamera( 0, d.dy || 20 ); },
                zoom: function(d){ zoomCamera(d.d) },
                zoomIn: function(d){ zoomCamera(d.d || 1); },
                zoomOut: function(d){ zoomCamera(d.d || -1); }
            });
            
        }
        
        
    });
    
    
})();
