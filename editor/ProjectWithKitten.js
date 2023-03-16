

function ProjectWithKitten(name, onLoad){
    var _this = this;    
    _this.name = name;
    var c = 0;
    var needc = 2;
    
    _this.options = { __allServerPath:'../projects/' + name + '/', __projectServerPath: '' };
    
    function inc(){
        c++; 
        if (c==needc){
            try {
                onLoad();
            } catch (e){
                consoleError( 'error while open project', e );
                debugger;
            }
        }
    }
    
    looperPost( function(){
        
        function continueLoading(){
            //activateOptions(_this.options);
            
            var onPluginsLoaded = function(){
                
                serverCommand({ command: 'dirlist' }, 
                function(list){
                    
                    _this.files = list;
                    
                    BUS.__post( 'PROJECT_PLUGINS_LOADED', _this );
                    
                    activateOptions(_this.options);
                    
                    loadResources(_this.res, function(){
                        deactivateOptions(_this.options);
                        inc();
                    });
                    
                    deactivateOptions(_this.options);
                    
                    inc();
                    
                }, 0, inc);
                
            }
            
            var tasks = new ParallelTasks().__then(onPluginsLoaded);
            tasks.__push( ()=>{
                Editor.activateOptions();
                TASKS_RUN(Editor.initPlugins( _this.plugins ), ()=>{ looperPost(()=>tasks.__inc()) });
                Editor.deactivateOptions();
            });

            tasks.__push( ()=>{
                activateOptions(_this.options);
                TASKS_RUN( Editor.initClasses( _this.classes ), ()=>{ looperPost(()=>tasks.__inc()) });
                deactivateOptions(_this.options);
            });
            
            tasks.__run();
            
        }
        
        serverCommand({ command: 'fileOpen', file:'project.json' }, 
            function(r){
                try { 
                    
                    r = JSON.parse(r);
                    
                    _this.settings = r;
                    
                    if (r) {
                        var opts = r.options||0;
                        if (opts.__goodResolution){
                            if ( opts.__goodResolution.x > 100 && opts.__goodResolution.y > 100) {
                                options.__default.__goodResolution = deepclone( opts.__goodResolution );
                            }
                        }
                        
                        mergeObjectDeep( _this, r );
                        
                        needc++;
                        
                        continueLoading();
                        
                    }
                }  catch(e) { onError(e);  }
                 
                inc();
                
            }, 0, function(e){
                consoleError( 'error while open project', e );
                
                continueLoading();
                
                inc();
//                 debugger;
            });
    
        
    });
}


ProjectWithKitten.prototype = {
    
    
    constructor : ProjectWithKitten 
    
    
}


