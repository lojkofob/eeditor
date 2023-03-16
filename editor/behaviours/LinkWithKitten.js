
function showQR(text){
    qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
    var qr = qrcode( 0, 'H' );
    qr.addData(text);
    qr.make();
    var size = qr.getModuleCount() * 3 + 24;
    var img = new Image();
    img.src = qr.createDataURL(3);
    showImage(img);
}
    
function followLink(link){
    
    __window.open(link, '_blank');
    
}

var LinkerWithKitten = (function(){
    
    
    var href = __window.location.href;
    
     
    function updateLinker(){
        
        var url = window.location.origin + window.location.pathname;
        
        for (var i in linker.list){
            if ( linker[i] ) {
                url = addParameterToPath( url, i, linker.list[i] );
            }
        }
        linker.w.input.inputValue = url;
        
    };

            
    var linker = {
        list: {
            project: 1, 
            layout: 1,
            hideInterface : undefined,
            autoplay : undefined,
            disableSelect: undefined,
            disableCache: undefined
        },
        
        show: function( ){
            
            var layout = Editor.currentLayout ? Editor.currentLayout.opts.name : undefined,
                project = Editor.currentProject.name;
            
            if (linker.project == undefined)
                linker.project = 1;
            
            if (linker.layout == undefined)
                linker.layout = 1;
            
            if (linker.list.project != undefined)
                linker.list.project = project;
            
            if (linker.list.layout != undefined)
                linker.list.layout = layout;
            
            linker.result = undefined;
            
            linker.n.__visible = 1;
            var w = linker.w;
            
            w.__scaleF = 0.6;
            w.__anim({ __scaleF:1 }, 0.3, 0,easeElasticO);
            
            
            w.list.__visible = 1;
            w.list.__clearChildNodes();
            
            for (var i in linker.list){
                
                onTapHighlight(
                    w.list.__addChildBox({
                        __class:'e-li',
                        __name: i,
                        __childs: {
                            chb: {
                                __class:'e-checkbox',
                                __classModificator: linker[i] ? 'checked': null
                            },
                            capt:{
                                __text: i, __x: 50, ha:0
                            }
                        },
                        
                        __onTap: function(){
                            linker[this.__name] = !linker[this.__name];
                            
                            this.chb.__killAllAnimations().__classModificator =
                                this.chb.__classModificator ? null : 'checked';
                            updateLinker();
                            return 1;
                        }
                    })
                );
                
            }

            updateLinker();
            
            linker.n.update(1);
            linker.n.update(1);
            
            BUS.__post( 'WINDOW_SHOWED' );
            
        }
        
    };
    
    addEditorBehaviours( {    
        
        linker : function(n){
            
            n.__onTap = 1;
            linker.n = n;
            linker.w = n.w;
                
            EditFieldsWithKitten.bindInput(n.w.input, linker, 'result');
            
            n.w.input.__disableEvents = 1;
            
            n.w.input.onInputInput = function(v){
                linker.result = v;
            }
            
            linker.close = function(){
                n.__visible = 0;
                linker.w.input.unfocus();
            };
            
            n.__onKey = 1;
            n.__drag = 1;
            
        
            linker.w.$('closeButton').__init({
                __onTapHighlight: 1,
                __onKey : 'escape',
                __onTap : function(){
                    linker.close();
                    return 1;
                }
            });
            
            linker.w.$('qr').__init({
                __onTapHighlight: 1,
                __onTap : function(){
                    showQR( linker.w.input.inputValue );
                    return 1;
                }
            });
            
            linker.w.$('follow').__init({
                __onTapHighlight: 1,
                __onTap : function(){
                    followLink( linker.w.input.inputValue );
                    return 1;
                }
            });
            
            linker.w.$('copy').__init({
                __onTapHighlight: 1,
                __onTap : function(){
                    copyTextToClipboard(linker.w.input.inputValue);
                    return 1;
                }
            });
            
            
        }
         
    } );

    addEditorEvents({
        //deprecated
        GenerateLink(){
            linker.show();
        }
    });
    
    addEditorEvents('Linker', {
        show(){
            linker.show();
        }
    });
        
    return linker;
    
})();

    
