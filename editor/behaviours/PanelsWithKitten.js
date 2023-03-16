
var PanelsWithKitten = (function() {
    
var panelAcceptors = [];
var panels = [];

var prepared = 0;


function getPanelAcceptor(panel){
    return panel.__traverseParents(function(n){ if (n.hasBehaviour('panelAcceptor')) return n; });
}

function resortPanels(topPanel){
    
    topPanel.__lastTime = TIME_NOW;
    
    panels = panels.sort( (a, b) => a.__lastTime - b.__lastTime );
    
    for (var i in panels) {
         panels[i].__z = -i*20;
    }
    
    looperPost(function(){
        resortEventsObjects();
    });
}


function hitTestParentAcceptor(){
    for (var i in panelAcceptors) {
        if (panelAcceptors[i].__hitTest(mouse)) {
            return panelAcceptors[i];
        }
    }
}

function calcStartSize(panel){
    if (panel.__eSize) {
        panel.__startSize = mergeObj({}, panel.__eSize );
        if (panel.__startSize.py === 1 || panel.__startSize.py === true || panel.__startSize.py === '%') {
            panel.__startSize.y = panel.__size.y;
            delete panel.__startSize.py;
        }
        
    }    
}

function recalcPanel(panel){
    
    var panelAcceptor = getPanelAcceptor( panel );
    
    if (!panel.__startSize) 
    {
        calcStartSize(panel);
    }
    
    
    var ss = panel.__startSize;
    var sz = panel.__size;
    
    
    if (panel.panel && panel.panel.__visible){
        
        if ( !panelAcceptor ){
            
            if (!ss.py){
                panel.__height = ss.y;
            }
        }
        else {
             panel.__size = ss;
        }
        
    } else {
        if (!ss.py){
            panel.__height = panel.__trustY ?  15 : 35;
        }
    }
            
    if (panel.resizer) 
        panel.resizer.__visible = panel.panel.__visible;
    
    
    if (panel.__onRecalc)
        panel.__onRecalc();
    
    consoleLog('recalc', panel.name, panelAcceptor ? 1 : 0);
    
    panel.__drag = panelAcceptor ? undefined : 1;
    
    panel.update(1);
    
}

function recalcPanelAcceptor(panelAcceptor){
    
    if (panelAcceptor) {
        //TODO:
        panelAcceptor.__root.update(1);
        //panelAcceptor.__root.__needUpdateDeep = 1;
        looperPost( function(){
            panelAcceptor.__updateScrollY(0.2);
        });
    }
}

var panelsCellTemplate;
    
BUS.__addEventListener({
    

    EDITOR_LOADED: function(t,editor){
        
        panelsCellTemplate = extractLayoutFromLayout( 'panelsCellTemplate', Editor.uiLayout );
        return 1;
    },
    
    PANEL_CLOSED:  function(t, d){
        var panel = d.panel;
        if (panel.__needRemoveOnClose){
            PanelsWithKitten.removePanel(panel);
        } else {
            recalcPanelAcceptor( getPanelAcceptor( panel ) );
        }
    },
    
    PANEL_SHOWED: function(t, d){
        
        var panel = d.panel;

        recalcPanel( panel );
        
        recalcPanelAcceptor( getPanelAcceptor( panel ) );
        
        resortPanels(panel);
        
        resortEventsObjects();
        
        panel.__root.__needUpdateDeep = 1;
        
    },
    
    PANEL_TOGGLED: function(t, d){
        
        var panel = d.panel;
        
        recalcPanel( panel );
        
        recalcPanelAcceptor( getPanelAcceptor( panel ) );
        
        resortPanels(panel);
        
        resortEventsObjects();
        
        panel.__root.__needUpdateDeep = 1;
        
    },
    
    EDITOR_PREPARED: function(){
        
        prepared = 1;
        
        PanelsWithKitten.removePanels(PanelsWithKitten.disabledPanels);
        PanelsWithKitten.addPanels(PanelsWithKitten.enabledPanels);
        
    },
    
    PROJECT_CLOSED: function(){

        $each( panels, function(n){ 
            if (n.__visible) {
                n.vshchhh = 1;
                n.__visible = 0;
            }
        } )
        
    },
        
    PROJECT_OPENED: function(){

        $each( panels, function(n){ 
            if (n.vshchhh) n.__visible = 1;
            delete n.vshchhh;
        } );
        
    }
    
    
});
    
  

addEditorBehaviours( {    

    PanelWithPanels: function(n){
        
        PanelsWithKitten.PanelWithPanels = n;
        var eplist = {};
        
        n.updatePanelsList = function(){
            
                $each(PanelsWithKitten.panels, function(panel){
                    var name = panel.name;
                    if (name){
                        
                        if (name.endsWith('Preview') || name.endsWith('Picker') )
                            return;
                        
                        if (eplist[name]){
                            return;
                        }
                        
                        PanelsWithKitten.preparePanelEvents(panel);
                        eplist[name] = panel;
                        
                        var cell = n.__addChildBox(panelsCellTemplate);
                        
                        cell.text.__text = name =='PanelWithPanels' ? name : name.replace('Panel', '');
                        
                        var cb = cell.$({__class:'e-checkbox'})[0];
                        cb.__killAllAnimations().__classModificator = panel.__visible ? 'checked' : null;
                        cb.panel = panel;
                        cb.__isCheckbox = 1;
                        cb.__onTap = function(){
                            ( this.panel.__visible ? PanelsWithKitten._closePanel : PanelsWithKitten._showPanel )(this.panel);
                            
                            looperPost( function(){
                                resortPanels(n.parent);
                            });
                        }
                        
                    }
                    
                });
            
        }
        
        BUS.__addEventListener(['PANEL_CLOSED','PANEL_SHOWED', 'PANEL_TOGGLED'], function(){
            if (n.__deepVisible()) {
                n.$({__isCheckbox:1}).forEach(function(cb){
                    cb.__killAllAnimations().__classModificator = cb.panel.__visible ? 'checked' : null;
                });
            }
            n.updatePanelsList();
        });
                
        BUS.__addEventListener({
            
            EDITOR_PREPARED: function(){
                n.updatePanelsList();
                return 1;
            }
        })
        
    },
    
    draggable: function(n){
        
        n.__drag = function(x,y,dx,dy){
            n.__x += dx;
            n.__y += dy;
        }
    },
        
    panelAcceptor: function(n){
        panelAcceptors.push(n);
        
        n.__onTap = 1;

        n.__scroll = { __onlyScrollY:1 };
        n.__wheel = function(d){
            PanelsWithKitten.__lastWheelTime = TIME_NOW;
            this.__scrollBy( d * 30 );
            return 1;
        }
        
        looperPost( function(){
            recalcPanelAcceptor(n);
        } );
    },
    
    resizer : function(n){
        
        n.__drag = function(x,y,dx,dy){
            
            var panel = n.parent;
                
            panel.__height = mmax(40, panel.__height + dy);
            
            if (panel.__startSize) 
                panel.__startSize.y = panel.__height;
            
            recalcPanelAcceptor(getPanelAcceptor(n));

            resortPanels(panel);
        }
        
    },
    
    panel: function(n){
        
        panels.push(n);
        calcStartSize(n);
        
        n.__ofs = {x:0,y:0};
        
        n.__lastTime = 0;
        
        n.__onTap = 1;
        
        if (n.header) {
            
            n.header.__init({
                __onTap: function(){ 
                    
                    resortPanels(n);
                    
                    return 1;
                    
                },
        
                __dragStart: function(){
                    
                    var panelAcceptor = getPanelAcceptor(n);

                    if (panelAcceptor) {
                        
                        var pos = n.__worldPosition.clone();
                        
                        panelAcceptor.__removeChild(n);
                        
                        panelAcceptor.__root.__addChildBox(n);
                        
                        n.parent.__updateMatrixWorld(1);

                        n.__width = n.__size.x;
                        n.__height = n.__size.y;
                        
                        n.update(1);
                        n.__updateMatrixWorld(1);
                        
                        
                        var pos2 = n.__worldPosition.clone();
                        
                        var pos3 = new Vector2(pos.x - pos2.x, pos.y - pos2.y);
                        
                        n.__ofs = pos3;
                        
                        n.update(1);
                        
                        recalcPanelAcceptor(panelAcceptor);
                    
                    }
                    
                    resortPanels(n);
                },
                
                __dragEnd: function(){
                    
                    var panelAcceptor = hitTestParentAcceptor();
                    
                    if (panelAcceptor) {
                        n.parent.__removeChild(n);
                        
                        n.__size = n.__startSize;
                        
                        panelAcceptor.__addChildBox( n );
                        
                        panelAcceptor.__childs = panelAcceptor.__childs.sort(function(a,b){
                            return a.__worldPosition.y -a.__size.y/2 - b.__worldPosition.y+b.__size.y/2;
                        });
                        
                        n.__x = 0;
                        n.__y = 0;
                        
                        recalcPanel(n);
                        
                        recalcPanelAcceptor(panelAcceptor);
                        
                        n.__scrollIntoView(0.2);
                    }
                },
                            
                __drag: function(x,y,dx,dy){
                    n.__x += dx;
                    n.__y += dy;
                }
            });
            onTapHighlight(n.header);
        }
        
        n.__focus = function(){
            n.__scrollIntoView(0.2);
        }

        if (prepared){
            
            recalcPanelAcceptor( getPanelAcceptor(n) );
        }
    }
    
});

return {
    
    
    _doWithPanel(a, p, focus){
        if (p){
            invokeEventWithKitten('Editor.'+a, { panel:p, __force: 1 });
            looperPost(()=> p.__deepVisible() ? p.__focus() : 0);
        }
    },

    _showPanel(p){ PanelsWithKitten._doWithPanel('showPanel', PanelsWithKitten.$(p)) },
    _closePanel(p){ PanelsWithKitten._doWithPanel('closePanel', PanelsWithKitten.$(p)) },
    _togglePanel(p){ PanelsWithKitten._doWithPanel('togglePanel', PanelsWithKitten.$(p)) },

    preparePanelEvents(panel){
        var o = {};
        var name = panel.name;
        o['Editor.showPanel.'+name] = PanelsWithKitten._showPanel.bind(EditorEventsWithKitten,name);
        o['Editor.closePanel.'+name] = PanelsWithKitten._closePanel.bind(EditorEventsWithKitten,name);
        o['Editor.togglePanel.'+name] = PanelsWithKitten._togglePanel.bind(EditorEventsWithKitten,name);
        addEditorEvents(o);
    },
                        
    addPanels: function(a){
        if (a) {
            if (this.disabledPanels == 'all'){
                this.enabledPanels = concatArraysWithUniqueItems( a, this.enabledPanels );
            }
            else
            if (isArray(this.disabledPanels))
                this.disabledPanels = this.disabledPanels.filter(function(n){ return a.indexOf(n) < 0; });
            
            if (prepared) {
                if ( panels.length ) {
                    $each(a, function(p){
                        var panel = $find( PanelsWithKitten.panels, function(n){ return p == n.name });
                        if (panel) {
                            invokeEventWithKitten('Editor.showPanel', { panel:panel, force:1 });
                        }
                    });
                }
            }
        }
        
        
    },
    
    removePanels: function(a){
        if (prepared && panels.length )
        {                      
            if ( a == 'all' ){
                a = $filter(panels, p => !inArray( p.name, this.enabledPanels ) );
            }
            
            for (var i in a){
                for (var j in panels){
                    if (panels[j].name == a[i]){
                        panels[j].__visible = 0;// __removeFromParent();
                    }
                }
            }
            
        } else {
            
            if (a == 'all')
                this.disabledPanels = 'all';
            else
                this.disabledPanels = concatArraysWithUniqueItems( this.disabledPanels, a );
            
           
        }
    },
    
    disabledPanels : [  ],
    
    $ : function(d){
        return $find(panels, function(p){ return p == d || p.name == d });
    },
    
    panels: panels,
    
    addPanelFromTemplate: function(template, acceptor, objectToChange, unique, propertyBinding){
        
        if (acceptor){
            if (isString(acceptor)){
                acceptor = Editor.ui.__alias(acceptor);
            }
        }
        else {
            acceptor = Editor.ui.middle;
        }
        
        if (acceptor) {
            var panel = acceptor.__addChildBox( template );
            if (propertyBinding) panel.__propertyBinding = propertyBinding;
            Editor.prepareEditorUINode(panel, objectToChange);
            invokeEventWithKitten('Editor.showPanel', { panel:panel, force:1 });
            
            if (unique){
                panels.push(panel);
            }
            
            return panel;
        }
    
    },
    
    removePanel: function(panel){
        
        if (!panel) return;
                
        removeFromArray(panel, panels);
        
        panel.__removeFromParent();
        
        recalcPanelAcceptor( getPanelAcceptor(panel) );
        
        resortEventsObjects();
        
    },
    
    contextPanels: [
		'ColorPicker',
		'imagePreview',
		'effectPreview',
        'textPreview',
        'dragonBonesPreview',
		'PanelWithPanels'
	],
    
    usePanelsState: function(state){
        if (!state) return;
        for (var i in panels){
		 	if ( this.contextPanels.indexOf( panels[i].name ) < 0 ) {
				var s = state[panels[i].name];
				if (s){
					this.panels[i].__init(s);
				}
			}
        }
        
    }
    
}

} )();        
