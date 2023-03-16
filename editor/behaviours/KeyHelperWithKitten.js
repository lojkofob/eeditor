
(function() {
    
    
addEditorBehaviours( {    
    
    keyHelperPanel: function(khp){
        khp.ha = ALIGN_START;
        khp.va = ALIGN_FROM_START_TO_END;
        khp.__cache = {};
        
        var txtNode = new Node({ __class: 'e-info-field', __width:200, __spacing:10 });
        
        function updateKeyHelperPanel(keyCode, key, ctrl, shift, alt, e, needAnim){
            if (!khp.__deepVisible())
                return;
            
            var mod = eventStringFromKeys('', ctrl, shift, alt);
            
            khp.__childs = [];
            
            if (!khp.__cache[mod]) {
                
                khp.__cache[mod] = new Node({__size:[1,1,'o','o'], va : ALIGN_START, ha: ALIGN_FROM_START_TO_END });
                var obj = {};
                
                $each( keyboardMap, function(event, i){
                    
                    if (isString(event) && EditorEventsWithKitten[event]){
                        if (mod && i.indexOf(mod) == 0) {
                            i = i.replace( mod, '' );
                        }
                        if (i.indexOf('+')>0)
                            return;
                        var k = event.indexOf('.');
                        if (k > 0){
                            var o = event.substring(0,k);
                            if ( !obj[o] ) obj[o] = {};
                            obj[o][i] = event.substring(k+1);
                        }
                        
                    }
                    
                } );
                
                $each(obj, function(map, o){
                    
                    var txt = o + ":\n";
                    var childs = [];
                    childs.push({ __height:30, __text: { __fontsize:17, __text: o + ":" }, ha: 0  });
                    
                    var keysWidth = selectMaxSomethingBy( map, function(event, key){
                        return key.length
                    }, 1) * 6 + 40;
                    
                    var eventsWidth = selectMaxSomethingBy( map, function(event, key){
                        return event.length
                    }, 1) * 6 + 50;
                        
                    $each(map, function(event, key){
                        childs.push({
                            __size:[1, 20], ha: 0, __spacing:1,
                            __key: key,
                            __childs: [
                                { __x:5, __size:[20,20,'o'], __padding: 5, __minsize:{x:30},  __class:'btn', __text: { __fontsize:15, __text: key }, ha: 1 },
                                { __x:keysWidth, __text: { __fontsize:15, __text: event }, ha: 0 }
                            ]
                        });
                    });
                    
                    khp.__cache[mod].__addChildBox({
                        __size: { x: keysWidth + eventsWidth + 30, py:'o' },
                        va: ALIGN_FROM_START_TO_END, ha: 0,
                        __childs: childs
                    });
                    
                    
                });
                
                khp.__cache[mod].__childs = khp.__cache[mod].__childs.sort(function(a,b){
                    return (b.__childs||0).length - (a.__childs||0).length
                });
                
            }
            
            khp.__addChildBox( khp.__cache[mod] );
            khp.__addChildBox( txtNode );
            txtNode.__text = mod;
            
            khp.update(1);
            
            if (needAnim && key){
                $each( khp.$({__key: key}), function(n){
                    n.__color = 0xffffff;
                    n.__killAllAnimations().__anim({__alpha:[0,0.4]},0.1,-2);
                });
            }
            
        }
        
        BUS.__addEventListener({
        
            __ON_KEY_DOWN: function(t, keyCode, key, ctrl, shift, alt, e){
                
                updateKeyHelperPanel(keyCode, key, ctrl, shift, alt, e, 1);
            },
            
            __ON_KEY_UP: function(t, keyCode, key, ctrl, shift, alt, e){
                updateKeyHelperPanel(keyCode, key, ctrl, shift, alt, e);
            }
            
        });

        
    }
    
});
 

} )();        
