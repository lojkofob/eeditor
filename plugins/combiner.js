
let CombinerPlugin = (() => {
    
    consoleLog('CombinerPlugin!');
    
    let cc = makeSingleton({
        
    }, {

        randomElementInArray(a) { return a[ randomInt(0, a.length-1) ] },
            
        randomChild(a){
            if (a) {
                if (a.__childs) return cc.randomChild(a.__childs);
                return cc.randomElementInArray( $filter( a, (b) => b.__childs && ( b.__selectable !== false ) ) );
            }
        },
        
        replaceLayoutPart(sources, node, nodel, baseInitObject){
            
            for (let i =0; i< node.__childs.length;  ){
                let child = node.__childs[i];
                let name = child.name;
                
                let newl = sources[name];
                if (newl){
                    
                    let newpart = node.__addChildBox( cc.randomChild( newl ) );
                    
                    if (newpart) {
                        newpart.name = undefined;
                        newpart.__ofs = child.__ofs;
                        newpart.__scale = child.__scale;
                        newpart.__rotate = child.__rotate;
                    }
                    
                    child.__removeFromParent();
                    
                    if (newpart) {
                        cc.replaceLayoutPart(sources, newpart, newl, baseInitObject);
                        newpart.__eSize = newpart.__size;
                        if (baseInitObject) {
                            newpart.__childsIterator.__init(baseInitObject);
                        }
                        newpart.__img = newpart.__color = newpart.__uniforms = undefined;
                    }
                    
                } else {
                    i++;
                }
            }
            
            return node
            
        },

        constructNode(sources){
            let c = cc.randomChild(sources.body);
            if (c) {
                var baseInitObject = {
                    __uniforms: {
                        __color: {r: random(), g: random(), b: random() }
                    }
                }
                
                let body = new Node( cc.randomChild(sources.body) );
                cc.replaceLayoutPart(sources, body, sources.body, baseInitObject);
                return body;
            }
        },
        
        generate(){
            
            let lw = (Editor.currentLayout||0).layoutView;
            if (lw){
                    
                let sources = {};
                $each(([]).concat.apply([], lw.$('src').__childs), c => {
                    sources[c.name] = c.toJson();
                });
                
                let c = cc.constructNode(sources);
                if (c) {
                    c.__transform = [0,0,1,1,0];
                    selectNode(lw.$('dst')[0]);
                    invokeEventWithKitten('Edit.add', 0, { __node: c });
                }
               
            }
            
        }
    });

    addEditorEvents('CombinerPlugin', {
        generate: cc.generate
    });
    
    addKeyboardMap({
        'ctrl+g': 'CombinerPlugin.generate'
    });

    addEditorBehaviours({    
    
    });
    
    return cc;
    
})();
