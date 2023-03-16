
(function() {

mergeObjectDeep( EditorUIBehavioursWithKitten, { 
    
    behaviours: {
        
        FAQ: function(n){
            
            BUS.__addEventListener({
                EDITOR_PREPARED:function(){
                    var c = 1;
                    function addRow(t1, t2){
                        
                        n.w.__addChildBox({
                            __size: { x:500, y:20 }, sha:0, ha:0,
                            __childs:[
                                {  __size: { x:120 }, ha:0, __text:{ __text:t1, __fontsize:16 } },
                                {  __size: { x:120 }, __x:120, ha:0, __text:{ __text:t2, __fontsize:16 } }
                            ]
                        });
                        c++;
                    }
                    
                    addRow('Keyboard: shift+k');
                    addRow('Panels: shift+d');
                    /*
                    for (var i in keyboardMap){
                        addRow( i, keyboardMap[i] );
                    }*/
                    n.w.__height = c * 25;
                    n.w.update(1);
                    
                    n.w.$({__class:'e-btn-x'}).__onKey = 'escape';

                }
            })
        }
    }

} );



})();
