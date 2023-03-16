
var easings_template;
var EditorUIBehavioursWithKitten = {
    
    behaviours:{ 
        
        effectPreview: function(n){
            EditorUIBehavioursWithKitten.effectPreview = n;
            
            n.set.__onTap = function(){
                invokeEventWithKitten('Editor.closePanel', { caller: this });
                eachSelected( function(nod){
                    activateProjectOptions();
                    nod.__effect = n.__effectName;
                    deactivateProjectOptions();
                });
                return 1;
            }
            
            onTapHighlight( n.set);
            
        },
        
        
        imagePreview: function(n){
            EditorUIBehavioursWithKitten.imagePreview = n;
        },
        
        textPreview: function(n){
            EditorUIBehavioursWithKitten.textPreview = n;
        },
        
        dragonBonesPreview: function(n){
            EditorUIBehavioursWithKitten.dragonBonesPreview = n;
            
            n.set.__onTap = function(){
                
                if (n.dbnod.__dragonBones){
                    invokeEventWithKitten('set', { __dragonBones:n.dbnod.__dragonBones.__name });
                    invokeEventWithKitten('Editor.closePanel', { caller: this });
                }
                else
                if (n.dbnod.__spine){
                    invokeEventWithKitten('set', { __spine:n.dbnod.__spine.clone() });
                    invokeEventWithKitten('Editor.closePanel', { caller: this });
                }

                return 1;
            }
            
            onTapHighlight( n.set);
        
        },
        
        easingsSelector: function(n){
            
            var p = n.__padding;
            p[1] = 50;
            
            n.__init( {
                
                ha: 0,
                
                __stringifiedProperties: stringseaseArrayForEasingConversionFromDigit,
                
                __childs:{
                    icon:{ __size:{x:40, y:25}, sha:0, __x:-44 }
                },
                __padding: p,
                
                __onValueUpdate: function(val){
                    this.icon.__img = stringseaseArrayForEasingConversionFromDigit[val];
                },
                
                __htmlInputDisabled:1,
                
                __onFocus: function(){
                    var t = this;
                    if (!t.et){
                        var et = t.__addChildBox(easings_template);
                        et.__visible = 1;
                        t.et = et;
                        et.__eachChild( function(col){
                            
                            col.__eachChild( function(c){
                                if (c.__propertyBinding){
                                    c.__onTap = function(){
                                        t.__setValue(this.__propertyBinding);
                                        return 1;
                                    }
                                    onTapHighlight(c);
                                }
                            });
                        } );
                    }                        
                },
                
                __onBlur: function(){
                    var t = this;
                   
                    BUS.__addEventListener('__ON_POINTER_UP', function(){
                        if (t.et) {
                            t.et.__removeFromParent();
                            t.et = 0;
                        }
                        return 1;
                    });
                }
                
            });
                
            
        }
    },
    
    prepare: function(n){
        if (n.____behaviours){
            $each(n.____behaviours, b => {
                if (!n.__behaviourPrepared) n.__behaviourPrepared = {};
                if (!n.__behaviourPrepared[b] && EditorUIBehavioursWithKitten.behaviours[b]) {
                    EditorUIBehavioursWithKitten.behaviours[b](n);
                    n.__behaviourPrepared[b] = 1;
                }
            });
        }
        
    }
    
};

BUS.__addEventListener({
    
    EDITOR_LOADED: function(){
        easings_template = extractLayoutFromLayout( 'easings_template', Editor.uiLayout );
        return 1;
    }
    
});

function addEditorBehaviours( d ){
    mergeObjectDeep( EditorUIBehavioursWithKitten, { 
        behaviours: d
    } );
    
    if (typeof Editor != undefinedType && Editor.ui) {
        Editor.ui.$(function(n){ EditorUIBehavioursWithKitten.prepare(n); })
    }
}


modClass( Node, {
    hasBehaviour(s){
        return this.____behaviours && this.____behaviours.indexOf(s) >= 0;
    }
    
}, {
    __behaviour: {
        set(v){
            this.____behaviours = $filter( $map((v||'').split(','), s=>s.trim()), a=>a );
            this.____behaviour = this.____behaviours.join(',');
            
            if ( !__propertiesAppliedByClass ){
                this.__selfProperties.__behaviour = this.____behaviour ? this.____behaviour : undefined;
            }
        }, 
        get(){ return this.____behaviour }
    },
    
    behaviours: {
        get(){ return this.____behaviours; },
        set(v){ this.__behaviour = v.join(','); }
    },
    
    isTextarea: {
        get(){ return this.hasBehaviour('textarea') }
    }
});
