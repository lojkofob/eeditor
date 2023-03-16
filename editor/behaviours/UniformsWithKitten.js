(function(){
    // TODO: create descriptions
    var defaultUniforms = {
        color: 1,
        map: 1, 
        matrixWorld: 1, 
        opacity: 1,
        projectionMatrix: 1,
     
        frrot: 1,
        frcnt: 1,
        
        scratio: 1,
        sc: 1,
        
        dt: 1,
        time: 1,
        size: 1,
        width: 1,
        height: 1,
                            
        imgsz: 1, 
        imgw: 1, 
        imgh: 1, 
                            
        atlassz: 1,
        atlasw: 1, 
        atlash: 1, 

        uvrx: 1, 
        uvry: 1, 
        uvix: 1, 
        uviy: 1, 
        
        uval: 1,
 
        time: 1,
        u_color: 1,
        u_texture: 1,
        mouse: 1,
        u_time: 1,
        u_transform: 1,
 
        __uvsBufferName: 1,
        __verticesBufferName: 1,
        
        __useColorLikeVColor: 1,
        __lvertexColorsRandom: 1
    };
    
    var uniformFormatMap =  {
        5124: { subType: "INT", type:'number', step: 1 },
        5126: { subType: "FLOAT", type:'number', step: 0.1 },
        35664: { subType: "FLOAT_VEC2", type:'vec2' },
        35665: { subType: "FLOAT_VEC3", type:'vec3' },
        35666: { subType: "FLOAT_VEC4", type:'vec4' },
        35667: { subType: "INT_VEC2", type:'ivec2' },
        35668: { subType: "INT_VEC3", type:'ivec3' },
        35669: { subType: "INT_VEC4", type:'fvec4' },
        35670: { subType: "BOOL", type:'b' },
        35671: { subType: "BOOL_VEC2", type:'bvec2' },
        35672: { subType: "BOOL_VEC3", type:'bvec3' },
        35673: { subType: "BOOL_VEC4", type:'bvec4' },
        35674: { subType: "FLOAT_MAT2", type:'fmat2' },
        35675: { subType: "FLOAT_MAT3", type:'fmat3' },
        35676: { subType: "FLOAT_MAT4", type:'fmat4' },
        35678: { subType: "SAMPLER_2D", type:'img' },
        36198: { subType: "SAMPLER_2D", type:'img' }
    };
    
    function clear(p){
        p.$({ addedByUP: 1 }).__removeFromParent();
        p.__program = 0;
    }    
    

addEditorBehaviours({
    uniforms(p){
        
        
        var update = looperPostOne(() => {

            if (p.__lastRenderTime < TIME_NOW - 1) 
                return;
            
            if (window.UniformsWithKittenDisabled && p.__program){
                clear(p);
            }
            else
            forOneSelected(n=>{
                var program = n.__program;
                if (program) {
                    
                    if (p.__program == program){
                        
                        if (p.__node) {
                            if (n == p.__node)
                                return;
                            if (objectSize(n.__uniforms) == objectSize(p.__node.__uniforms))
                                return;
                        }
                        return;
                    }
                    
                    
                    clear(p);
                    
                    p.__program = program;
                    p.__node = n;
                    
                    var list = $filterObject( $map( program.uniforms, (u, uname) => {
                        
                        if ( !defaultUniforms[uname] ){
                            var fm = uniformFormatMap[u.info.type];
                            if (fm){
                                return {
                                    label: uname.replace(/^u_/, ''),
                                    type: fm.type,
                                    step: fm.step
                                };
                            }
                        }
                        
                    } ), a=>a );
                    
                    if (n.__uniforms) {
                        mergeObjExclude( list, 
                            generatePropertyFor( $filterObject( n.__uniforms, (u, uname)=> !(defaultUniforms[uname] || list[uname] || u === null) ) ).properties );
                    }
                    
                    var r = invokeEventWithKitten('Editor.fillCustomPanel', {
                        panel: p,
                        properties: {
                            __uniforms: { type:'object', properties: list }
                        }
                    }, 0, 1);
                    
                    $each( r.cells, c => c.addedByUP = 1 );
                }
            });
            
        });
        
        p.__busObservers = {
            __OBJECT_CHANGED: update,
            __ON_NODE_SELECTED: update,
            __ON_NODE_UNSELECTED: update
        };
    }
});

function normalizeUniforms(n){
    if (n.__uniforms && n.__program) {
        n.__uniforms = $filterObject(n.__uniforms, (u, uname) => n.__program.uniforms[uname]);
        if ( !objectSize( n.__uniforms ))
            n.__uniforms = null;
    }
}

addEditorEvents('Uniforms', {
    normalize(){ eachSelected(n => { n.$(normalizeUniforms) }) }
});

})();
