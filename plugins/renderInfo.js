var RenderInfoPanel;

BUS.__addEventListener({
    
    PROJECT_OPENED(){
        RenderInfoPanel = new ENode({
            sha:ALIGN_START,
            sva:ALIGN_END,
            ha:ALIGN_START, 
            __y:-2,
            __x:2, 
            __z: -10000,
            __size:{x:50, y:20},
            __color:1,
            __alpha:0.5,
            __onTap: function(){ 
                RenderInfoPanel.renderInfo = !RenderInfoPanel.renderInfo; 
                this.__size = RenderInfoPanel.renderInfo ? {x:150, y:180} : {x:50, y:20};
            },
            __text:{
                __fontsize:14, __text:1, __lineWidth:2, __charw:7,
                __addedLineSpacingMultiplier:0,
                __align: ALIGN_START
            }
        });
        RenderInfoPanel.__text.__cacheCanvas = 1;
        
        var renderInfoNeedRecalcs = {
            matrixUpdates : 1,
            matrixWorldUpdates : 1,
            matrixScrollUpdates : 1,
            bindTexturesCount : 1,
            calls :1,
            vertices : 1 ,
            nodesRendered: 1,
            textsRendered : 1,
            frames: 1,
            emittersRendered: 1,
            emittersUpdated: 1,
            textsGenerated: 0,
            
            nodesUpdated: 0,
            nodesRealUpdated: 0,
            nodesUpdatedDeep: 0
        }
        
        var prepr = {
            totalTextureMemory: function(v){
                return round( v ) + 'mb'
            }
        }
        
        
        function recalcRenderInfo(d){
            
            if (isNumeric(d)) return round(d);
            
            if (prepr[d]){
                return prepr[d](renderInfo[d]);
            }
            
            if (renderInfoNeedRecalcs[d])
                return round( renderInfo[d] / renderInfo.frames );
            
            return renderInfo[d]
        }
        
        function getInfo( txt, args ){
            txt += ': \\#ffff66;';
            var delim = '';
            for (var i in args){
                txt +=  delim + recalcRenderInfo(args[i]);
                delim = '/';
            }
            
            return txt;
        }
        
        _setInterval(function(){ 
            
            if (RenderInfoPanel.renderInfo){
                
                if (typeof socialManager != undefinedType) {
                    renderInfo.ntwrk1 = 0;
                    renderInfo.ntwrk2 = 0;
                    $each( socialManager.__blockedNetworkDatas, function(v){
                        renderInfo.ntwrk1++;
                        $each(v, function(){renderInfo.ntwrk2++;});
                    });
                }
                
                RenderInfoPanel.__text = [
                    (typeof socialManager == undefinedType) ? '' : getInfo( 'ntwrk', [ renderInfo.ntwrk1, renderInfo.ntwrk2 ]),
                    getInfo( 'tween', [ tween.a.length ]),
                    getInfo( 'matrx', [ 'matrixUpdates', 'matrixWorldUpdates', 'matrixScrollUpdates']),
                    getInfo( 'nodes', [ 'nodesRendered', 'nodes' ]),
                    getInfo( 'updts', [ 'nodesUpdated', 'nodesRealUpdated', 'nodesUpdatedDeep' ]),
                    getInfo( 'texts', [ 'textsRendered', 'textsTextures', 'texts' ,'textsGenerated' ]),
                    getInfo( 'parts', [ 'emittersRendered', 'emittersUpdated', 'emitters', 'particles' ]),
                    getInfo( 'buffs', [ 'totalBuffersCount' ]),
                    getInfo( 'txtrs', [ 'renderTargetsCount', 'totalTexturesCount', 'bindTexturesCount', 'totalTextureMemory' ]),
                    getInfo( 'calls', [ 'calls' ]),
                    getInfo( 'verts', [ 'vertices' ]),
                    getInfo( '  fps', [ currentFPS, round( averageFPS ) ])
                ].join('\\#;\n');
                
            }
            else {
                RenderInfoPanel.__text = 'fps ' +  round( currentFPS ); 
            }
            for (var i in renderInfoNeedRecalcs){
                renderInfo[i] = 0;
            }
            
        }, 0.2);
        
        RenderInfoPanel.__isCheats = 1;
        
        addToScene(RenderInfoPanel);
                
        return 1;
    }
});
 


                
