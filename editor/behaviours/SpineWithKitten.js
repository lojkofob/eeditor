
 
(function(){
  

var selectSkinNode;
var selectAnimNode;

var panel;
addEditorEvents('Spine', {
    
    addAnim(){
        if (!selectAnimNode) return;
        var sk = selectAnimNode.__value;
        if (isString(sk)){
            forOneSelected(n=>{
                var sp = n.__spine;
                var track = sp.track || 0;
                if (sp && sp.__animationState){
                    sp.__animationState.setAnimation(track, sk, true);
                }
            });
        }
    },
    
    addSkin(){
        if (!selectSkinNode) return;
        var sk = selectSkinNode.__value;
        if (isString(sk)){
            forOneSelected(n=>{
                var sp = n.__spine;
                if (sp){
                    invokeEventWithKitten( 'set', {
                        __skin: explodeString( sp.__skinStr ).concat([sk])
                    }, {
                        object: sp
                    });
                    EditFieldsWithKitten.updateAllPropsIn(panel);
                }
            });
        }
    }

});


addEditorBehaviours({
    
    Spine: p => {
        panel = p;
        
        function pypysh(n, d){
            if (n) {
                var k = n.$({__class:'e-ddList'})[0];
                if (k) {
                    k.__propertyBinding = '=' + JSON.stringify(d);
                    k.__stringifiedProperties = 1;
                    k.____preparedByEditor = 0;
                    k.bindingPrepared = 0;
                    k.__alias('ddPanel').__clearChildNodes().__filled = 0;
                    EditFieldsWithKitten.prepare(k);
                }
                return k;
            }
        };
        
        var f = looperPostOne(()=>{ 
            var availableSkins = panel.__alias('availableSkins');
            var anims = panel.__alias('anims');
            forOneSelected( n=>{
                var sp = n.__spine;
                if (sp){
                    selectSkinNode = pypysh(availableSkins, sp.__availableSkins);
                    selectAnimNode = pypysh(anims, sp.__availableAnimations);
                }
            }, ()=>{
                if (selectSkinNode) {
                    selectSkinNode.__alias('ddPanel').__clearChildNodes();
                    selectSkinNode = 0;
                }
                if (selectAnimNode) {
                    selectAnimNode.__alias('ddPanel').__clearChildNodes();
                    selectAnimNode = 0;
                }
            });
        });
        
        BUS.__addEventListener({
            __ON_NODE_SELECTED: f, 
            __ON_NODE_UNSELECTED: f,
            __OBJECT_CHANGED: f
        });
        
    }

});
  

})();
