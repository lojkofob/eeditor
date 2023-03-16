var BatchLayoutProcessingWithKitten = makeSingleton(
    //data
    { 
      
      
    },
    //methods
    {
        forEachLayout: callback => {
            
            if (callback) {
                $each( FileManagerWithKitten.listing('layouts'), file => {
                
                    FileManagerWithKitten.openFile( file.path, content => {
                        callback(file, content);
                    } );
                    
                });
            }
            
        },
        
        findString: (str, f) => {
            
            BatchLayoutProcessingWithKitten.forEachLayout( (file, content) => {
                
                 traversingWithoutLoops( content, (j, key, depth, parent) => {
                     if (j == str){
                        consoleLog( str, 'founded in ', file.path || file);
                        if (f) f(j, key, depth, parent);
                     }
                 } )
                
            } );
            
        },
        
        fixCorners: () => {
            var allObbj = {};
            BatchLayoutProcessingWithKitten.forEachLayout( (file, content) => {
                var corner, img, cc = 0;
                //TODOMS
                traversingWithoutLoops( content, function(j, key, depth, parent){
                    if (isObject(j)){
                        
                        corner = j.__corner || j.C;
                        img = j.__img || j.i;
                        
                        if (corner && img) {
                            
                            if (!allObbj[img]){
                                allObbj[img] = [];
                            }
                            if (!$find(allObbj[img], function(a){
                                return a[0] == corner[0] && a[1] == corner[1]
                            })) {
                                cc++;
                                allObbj[img].push(corner);
                            }
                        }
                    }
                } );
                
                consoleLog(file.path, cc )
                
            } )
            
            return allObbj;
            
        }
        
      
    });
  

