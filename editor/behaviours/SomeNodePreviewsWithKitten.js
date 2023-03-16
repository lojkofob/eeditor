(function() {

    
    
addEditorBehaviours( {

    disabled: function(n){
        
        n.__killAllAnimations().__classModificator = 'disabled';
        n.__disabled = 1;
        
    },
    
    cornerPreview: function(n){
        
        var cpreview = n.__addChildBox( { __size:{x:1, y:1}, __margin:2 } );
        var xnode = cpreview.__addChildBox({ __size:{x:1, px:0, y:1}, sha:0, __color:0xffffff });
        var ynode = cpreview.__addChildBox({ __size:{x:1, py:0, y:1}, sva:0, __color:0xffffff });
        
        cpreview.__dragDist = 1;
        cpreview.__canDrag = function(){
            cpreview.__beginCorner = undefined;
            forOneSelected(function(n){ cpreview.__beginCorner = n.__corner; });
            cpreview.__signx = 0;
            return 1;
        };
        
        cpreview.__dragEnd = function(){
            cpreview.__signx = 0;
            var changes = [];
            forOneSelected(function(node){
                if (! isValuesEquals(cpreview.__beginCorner, cpreview.__draggingCorner ) ) {
                    changes.push( { type: 'set', node: node, prop: '__corner', prev: cpreview.__beginCorner, next: cpreview.__draggingCorner } );
                    objectChanged(changes);
                }
            });
        };
        function setCorner(withHistory){
            forOneSelected(function(node){

                if (cpreview.__img){
                    var sz = cpreview.__size, sp = cpreview.__screenPosition();
                    
                    var  x = clamp(-sp.x + mouse.x + sz.x / 2, 0, sz.x)
                        , y = clamp(-sp.y + mouse.y + sz.y / 2, 0, sz.y);
                    
                    var c = node.__corner || [0,0];
                    
                    var isize = node.__imgSize;
                    if (!isize) return 1;
                            
                    var sz = cpreview.__size;
                    
                    x *= isize.x / sz.x;
                    y *= isize.y / sz.y;
                    if (!cpreview.__signx) {
                        cpreview.__signx = (sign(c[0])||1);
                        cpreview.__signy = (sign(c[1])||1);
                    }
                    
                    cpreview.__draggingCorner = [ round( cpreview.__signx * x), round(cpreview.__signy * y) ];
                    
                    cpreview.__draggingCorner[0] = clamp(cpreview.__draggingCorner[0], -isize.x, isize.x);
                    cpreview.__draggingCorner[1] = clamp(cpreview.__draggingCorner[1], -isize.y, isize.y);
                    
                    var o = { __corner: cpreview.__draggingCorner};
                    invokeEventWithKitten( 'set', o, { withHistory: withHistory } );
                    
                }
                
            });
        }
        
        cpreview.__onTap = function(){ setCorner(1); return 1; }
        
        cpreview.__drag = function(){ setCorner(0); return 1; }
        
        BUS.__addEventListener([ __OBJECT_CHANGED, __ON_NODE_SELECTED ], looperPostOne(() => {
            
            forOneSelected(function(node){
                
                delete cpreview.__frame;
                cpreview.__img = node.__img;
                
                if (cpreview.__spriteSheetAnim) {
                    cpreview.__spriteSheetAnim.__update(0,0);
                }
                    
                cpreview.__killAllAnimations();
                if (cpreview.__img){
                    
                    var c = node.__corner;
                    if ( isArray(c) ) {
                        var isize = node.__imgSize;
                        if (!isize) return;
                        var sz = cpreview.__size;
                        xnode.__visible = ynode.__visible = 1;
                        xnode.__x = mmin( abs(c[0]) * sz.x / isize.x, sz.x );
                        ynode.__y = mmin( abs(c[1]) * sz.y / isize.y, sz.y );
                    } else {
                        xnode.__visible = ynode.__visible = 0;
                    }
                    
                } else {
                    xnode.__visible = ynode.__visible = 0;
                }
            });
        }));
    }
}
);


})();
