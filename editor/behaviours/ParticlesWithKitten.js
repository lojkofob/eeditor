
(function(){

var templates = {}, emittersList;

function toggleComponentsFields(){
    
    var cell = this.parent.parent.parent;
    
    var cellComponentsPanel = cell.__alias('componentsPanel');
    if (cellComponentsPanel){
        
        cellComponentsPanel.__visible = !cellComponentsPanel.__visible;
        
        if (!cellComponentsPanel.filled) {
            
            cellComponentsPanel.filled = 1;
            
            var prop = cell.prop;
            var object = cell.object;
            
            var proxyComponentsObject = {
                cell: cell.__alias('hzcells').parent
            };
            
            fillpanel( cellComponentsPanel, prop, "sub_", object, proxyComponentsObject);

            Editor.prepareEditorUINode( cellComponentsPanel, proxyComponentsObject );
    
            cellComponentsPanel.update(1);
        }
        
        
        if (cellComponentsPanel.__visible) {
            EditFieldsWithKitten.updateAllPropsIn(cellComponentsPanel);
            cell.__size = {x: cell.__width, y:20, py: 'o' };
        } else {
            cell.__size = {x: cell.__width, y:20, py: 0 };
        }
        
        cell.__root.update(1).update(1).update(1);
    }
    return 1;
    
}

function fillpanel(panel, propsList, propprefix, object, proxyObject){

    propprefix = propprefix || '';
    var list = propsList.components || propsList;
    for (var propname in list){
        
        var prop = list[propname];
        prop.__name = propname;
        
        var template = templates[(propprefix?propprefix:'') + prop.type];
        if (!template && propprefix) template = templates[prop.type];
        
        if (!template) continue;
 
        
        var cell = panel.__addChildBox( template );
        
        if (proxyObject){
            
            function createProxyProperty(pname, cll) {
                ObjectDefineProperty(proxyObject, pname, {
                    
                    set: function(v){
                        
                        var prop = propsList;
                        
                        if (!prop.__name && propsList[pname]){
                            prop = propsList[pname];
                        }
                    
                        if (isString(v)) {
                            if (prop.type != 'img' && prop.type != 's') {
                                try { v = JSON.parse(v); } catch(e) { v = 0 };
                            }
                        }
                        
                        if ( prop.__name ) {
              
                            var value = object[ prop.__name ];
                            
                            if (prop.type != 'number') {
                                if (value == undefined) value = [0];
                                if (isNumeric(value)) value = [value];
                                     
                                if (prop.components && prop.components[pname]) {
                                    if (isArray(value)){
                                        var setval = {};
                                        for (var i in list) setval[i] = deepclone( value );
                                        value = setval;
                                        
                                    }
                                    
                                    if (isObject(v)){
                                        var v1 = v[1];
                                        v = [v[0]||0];
                                        if (v1!=undefined) v[1] = v1;
                                    }
                                    
                                    if ( isObject(value) ) {
                                         value[pname] = v;
                                         v = value;
                                    }
                                }
                                else
                                if (isObject(v)){
                                    var v1 = v[1];
                                    v = [v[0]||0];
                                    if (v1!=undefined) v[1] = v1;
                                }
                            }
                            
//                           
                            
                            object[ prop.__name ] = v;
                            consoleLog('set ', prop.__name +'.'+ pname, v);

                        } else {
                            
                            object[ pname ] = v;
                            consoleLog('set ', pname, value);
                        }
                        
                        EditFieldsWithKitten.updateAllPropsIn(cll);
                        
                    },
                    
                    get: function(){
                        
                        var prop = propsList;
                        var value;
                        if ( prop.__name ) {
                            
                            value = prop.__name ? object[ prop.__name ] : object[pname];
                            if (isObject(value)){
                                return value[ pname ];
                            }
                        } else {
                            
                            value = object[pname];
                            
                            if ( isObject( value ) )
                                return '??';
                            
                        }

                        return value;
                    }    
                });
            }
            
            createProxyProperty(propname, proxyObject.cell || cell);
        }
 
        cell.__propertyBinding = propname;
        
        if (prop.type=='list'){
            var changer = cell.$({__class:'e-changer'})[0];
            if (changer){
                changer.__propertyBinding = '=' + JSON.stringify(prop.values);
                changer.__stringifiedProperties = 1;
            }
        }
        
        cell.objectToChange = proxyObject || object;
        cell.object = object;
        cell.prop = prop;
        
        cell.__alias('label').__text = prop.label || propname;
        
        var toggleBut = cell.__alias('toggle');
        if (toggleBut){
            if (prop.components) {
                toggleBut.__onTap = toggleComponentsFields;
                onTapHighlight( toggleBut );
            } else {
                toggleBut.__removeFromParent();
            }
        }
        
        if (prop.step != undefined) {
            cell.__traverse(function(n){
                n.__numericInputStep = prop.step;
            });
        }
        
        
        
            
    }

}

function createComponentPanel(component){
    
    var componentPanel = new Node(templates.component);
    
    var type = ParticlesComponentsTypesMap[component.t];
    var proxyObject = { };
    
    fillpanel(componentPanel.panel, particlesPropertiesDescriptions[type], 0, component, proxyObject);

    
    componentPanel.label.__text = type.replace('EmitterComponent', '');
    componentPanel.__trustY = 1;
    
    component.panel = componentPanel;
        
    componentPanel.__onDestruct = function(){
        delete component.panel;
    }
    
    componentPanel.component = component;
    
    componentPanel.__traverse( function(n){ n.__objectConstructorIfUndefined = function(){ return [0,0] }; });
    
    componentPanel.__onRecalc = function(){
        var emitter = componentPanel.__traverseParents(function(n){ return n.emitter })
        if (emitter) {
            updateEmitterPanel(emitter);
        }
    }
    
    Editor.prepareEditorUINode(componentPanel, proxyObject);
    return componentPanel;
    
}

function updateEmitterPanel(emitter, createFlag){
    
    var emitterPanel = emitter.panel;
    
    if (!createFlag && !emitterPanel)
        return;

    
    if (!emitterPanel) {
        
        emitterPanel = PanelsWithKitten.addPanelFromTemplate(
            templates.emitter, 'rightView', emitter
        );
        
        emitterPanel.emitter = emitter;
        emitterPanel.__needRemoveOnClose = 1;
        emitter.panel = emitterPanel;
        emitterPanel.__onDestruct = function(){ delete emitter.panel; }
        
        var proxyObject = { 
            
        };
        
        fillpanel(emitterPanel.panel, particlesPropertiesDescriptions.emitter, 0, emitter, proxyObject);
        
        Editor.prepareEditorUINode(emitterPanel.panel, proxyObject);

        _setTimeout( function(){
            emitterPanel.__scrollIntoView(0.2);
        }, 0.1);
    } 
    
    for (var i in emitter.__components){
        var component = emitter.__components[i];
        var cpanel = component.panel;
        if (!cpanel) {
            component.panel = cpanel = createComponentPanel(component);
            emitterPanel.panel.__addChildBox(cpanel);
        }

    }
        
    EditFieldsWithKitten.updateAllPropsIn(emitterPanel);

    Editor.ui.__needUpdateDeep = 1;
    
}



function updateParticlesPanel(){
    if (!emittersList)
        return;
    var panel = emittersList.parent.parent;
    
    emittersList.__clearChildNodes();
    var count = 0;
    eachSelected( function(sn){
        var effect = sn.__effect;
        if (effect){
            for (var i in effect.emitters){
                
                count ++;
                
                var emitter = effect.emitters[i];
                
                var cell = emittersList.__addChildBox( templates.emittersList );
                
                Editor.prepareEditorUINode(cell, emitter);
                
                cell.emitter = emitter;
                
                EditFieldsWithKitten.updateAllPropsIn(cell);
                
            }
        }
        
    });
    
    emittersList.update(1);
    
    
}

function emitterRemoved(emitter){
    if (emitter){ 
        PanelsWithKitten.removePanel(emitter.panel);
    }
}

BUS.__addEventListener({

    __ON_NODE_SELECTED: looperPostOne(updateParticlesPanel),

    __ON_NODE_UNSELECTED: looperPostOne(updateParticlesPanel),

    __OBJECT_CHANGED_emitter_add: function(t, change){
      
        updateEmitterPanel(change.emitter, 1);
        updateParticlesPanel();
         
    },
    
    __OBJECT_CHANGED_emitter_remove: function(t, change){
        emitterRemoved(change.emitter);
        updateParticlesPanel();
    },
    
    EDITOR_LOADED: function(t,editor){
    
        templates.emitter = extractLayoutFromLayout( 'emitter_template', Editor.uiLayout );
        
        [ "[]", "b", "number", "component", "hz", "img", "s", "list", "node", "sub_hz" ].forEach(
            function (type){
                templates[type] = extractLayoutFromLayout(type + '_template', templates.emitter );
            } );
        
        templates.emittersList = extractLayoutFromLayout('emittersList_template', Editor.uiLayout );
        
        consoleLog('templates', templates);
        
    },
    
    ON_EMITTER__destruct: function(){
        emitterRemoved(this);
    },
    
    ON_EMITTER__addComponent: function(){
        updateEmitterPanel(this);
    },
    
    ON_EMITTER__removeComponent: function(component){
        
        if ( component && component.panel ) {
            var p = component.panel.parent;
            component.panel.__removeFromParent();
        }
        
        updateEmitterPanel(this);
        
    }
    
});
    
BUS.__wrapObjectMethodByEvent(ParticleEmitter.prototype, '__destruct', 'ON_EMITTER__destruct');
BUS.__wrapObjectMethodByEvent(ParticleEmitter.prototype, '__addComponent', 'ON_EMITTER__addComponent');
BUS.__wrapObjectMethodByEvent(ParticleEmitter.prototype, '__removeComponent', 'ON_EMITTER__removeComponent');
    
addEditorBehaviours( {    
    emittersList: function(n){
        emittersList = n;
    }
} );

addEditorEvents('Editor', {
    
  showEmitterPanel: function(d){
      
      if (d.caller) {
          updateEmitterPanel(d.caller.parent.emitter, 1);
      }
          
    }

})

})();
