
(function(){

function buildProjectTarget(name){
    
    consoleLog("start build target ", name);
    
    serverCommand({ command: 'build', target:name }, function(a){
        
        consoleLog(a);
        
    }); 

                          
    //debugger;
    
}
    
addEditorBehaviours( {

    ProjectTargetsPanel : function(panel){
    

        BUS.__addEventListener({
            
            NO_PROJECT: function(t, project){
                panel.__clearChildNodes();
            },
            
            PROJECT_OPENED: function(t, project){
                panel.__clearChildNodes();
                
                if (project.settings) {
                    $each(project.settings.build_targets, function(t, i){
                        if (!i.startsWith('.') && !i.startsWith('_')) {
                            panel.__addChildBox({
                                __class: 'e-nav-li', __text:i,
                                __onTap(){ 
                                    buildProjectTarget(i); 
                                },
                                __onTapHighlight: 1
                            });
                        }
                    });
                }
                
            },
            
            PROJECT_CLOSED: function(){
                panel.__clearChildNodes();
            }

        });
        
    }
});



})()
