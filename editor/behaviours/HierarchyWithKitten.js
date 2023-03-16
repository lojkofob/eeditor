
var hierarchyPanel;
(function(){

if (window.HierarchyPanelDisabled)
    return;

function onTapItemOnTree( entryItem ){
    
    var entry = this;
//     consoleLog( entry, entryItem );
    if (entry.node.selected) {
        entry.node.__unselect();
    } else {
        selectNode(entry.node);
    }
}

NodePrototype.toTree = function(){
    
    var t = this;
    
    if (t.__validToSave) {
        var name = t.name;
        var desc = isString(t.__description) ? '\\#aaf;\\s13;['+t.__description+']' : '';
            
        if (!t.name){
    //         consoleLog(t.__index);
            
            if (desc){
                name = desc;
            }
            else {
                var index = t.parent ? t.parent.__childs.indexOf(t):0; 
                name = '\\#aaa;_' + index;
            }
        } else {
            if (desc){
                name += ' ' + desc;
            }
        }
        
        t.__subobj = [t];
        t.__highlightMult = 10;
        var da = { 
                text: name,
                data: [],
                node: t,
                onTap: onTapItemOnTree,
                data: [],
                toggleVis: 1,
                toggleSelectable: 1
            };
            
            
        if (t.treeEntry) {
            t.treeEntry.init( da );
        } else {
            t.treeEntry = new TreeEntry( da );
        }
        
        for (var i in this.__childs){
            if (t.__childs[i].toTree) {
                var c = t.__childs[i].toTree();
                if (c)
                t.treeEntry.data.push( c );
            }
        }
    }
    
    return t.treeEntry;
};

BUS.__addEventListener({

    PROJECT_CLOSED: function(t){
        hierarchyPanel.__clearChildNodes();
    },
    
    LAYOUT_DEACTIVATED: function(t, layout){
        
        hierarchyPanel.__removeChild( layout.hierarchyNode );
        
    },
    
    LAYOUT_ACTIVATED: function(t, layout){
        
        var view = layout.layoutView;
        
        if (!layout.hierarchyNode) {
        
            layout.hierarchyNode = TreeWithKitten.fill(hierarchyPanel, view.toTree(), 0, {
                onEntryPlateDragEnd: function(pl){
                    
                    var parent, index;
                    var node = pl.entry.node;
                    
                    if (pl.p0){
                        parent = pl.p0.entry.node;
                        index = 0;
                    }
                    else 
                    if ( pl.p1 && pl.p2 ){

                        var needp = pl.p1;
                        
                        
                        index = 0;
                        if (pl.p2.entry.node.parent == needp.entry.node){
                            parent = needp.entry.node;
                        }
                        else {
                            
                            if (pl.dp2 < pl.dp1){
                                needp = pl.p2;
                                index--;
                            }
                                
                            index += needp.entry.node.__realIndex + 1;
                            
                            if (needp.entry.node.parent == node.parent)
                                if (node.__realIndex< index)
                                    index--;    

                            parent = needp.entry.node.parent;
                        }
                        

                    } else 
                    if (!pl.p2 && pl.p1){
                        
                        if (pl.dp1 < 50){
                            
                            parent = pl.p1.entry.node.parent;
                            index = pl.p1.entry.node.__realIndex + 1;
                            
                        } else {
                            
                            parent = pl.p1.entry.node.__root;
                            
                        }
                        
                    } else 
                    if (!pl.p1 && pl.p2){
                        parent = pl.p2.entry.node.parent;
                        index = 0;
                        
                    }
                        
                        
                    if (parent){
                        
                        if (node.__traverse( function(n){ if (n == parent) return 1; } ) ) {
                            return;
                        }
                        
                        node.parent.__removeChild(node);
                        pl.entry.remove();
                        
                        parent.__addChildBox(node);
                        if (index != undefined) {
                            removeFromArray( node , parent.__childs);
                            parent.__childs.splice(index, 0, node);
                        }
                        
                        node.parent.treeEntry.add( node.toTree() );
                        
                        if (index != undefined) {
                            
                            node.treeEntry.updateSelfIndex(node.__realIndex, 1);
                        }
                        parent.update(1);
                    }
                }
            });
        }
        
        if (!layout.hierarchyNode.parent ) {
            hierarchyPanel.__addChildBox(layout.hierarchyNode);
        }

        layout.hierarchyNode.parent.__updateScrollY();
        
    }, 

    __ON_NODE_SELECTED: function(t, node){

        if (node.treeEntry) {
            node.treeEntry.focus(
                node.treeEntry.focused? 0 : { 
                    withAutoExpand:1,
                    withAutoScroll:1 
                });
        }
        
    },

    __ON_NODE_UNSELECTED: function(t, node){
        
        if (node.treeEntry)
            node.treeEntry.unfocus();
        
    },

    __OBJECT_CHANGED: function(t, changes){
        
        for (var i in changes){
            var change = changes[i];
            var node = change.node;
//             consoleLog(change);
            switch( change.type ) {
                case 'set':{
                    if (change.prop == '__realIndex') {
                        if (node.treeEntry) 
                            node.treeEntry.updateSelfIndex( change.next );
                    }
                    break;
                }
                case 'paste': {
                    //TODO:
                    for ( var j in change.addedNodes )  {
                        change.addedNodes[j].parent.treeEntry.add( change.addedNodes[j].toTree() );
                    }
                    break;
                }
                    
                case '+':
                    if (node.parent && node.parent.treeEntry)
                        node.parent.treeEntry.add( node.toTree(), change.noselect );
                    
                    if (node.treeEntry) {
                        node.treeEntry.updateSelfIndex(node.__realIndex);
                    }
                    break;
                    
                case '-':
                    if (node.treeEntry) {
                        node.treeEntry.remove();
                    }
                    break;
            }
        }
    } 
    
});
    
addEditorBehaviours( {    

    hierarchy : function(n){
    
        hierarchyPanel = n;
        
        function selectNext(f){
            var n;
            eachSelected( function(node){
                try {
                    n = 1;
                    node = f(node);
                    if (node) {
                        selectNode(node);
                    }
                } catch (e){}
                return 1;
            } );
            if (!n && Editor.currentLayout){
                hierarchyPanel.__traverseVisible( function(treeItem){
                    if (treeItem.entry && treeItem.__isTreeItem &&
                        checkGoodForSelect(treeItem.entry.node) ) {
                            n = treeItem.entry.node;
                    }
                });
                if (n) {
                    selectNode(n);
                }
            }
        }
        
        function checkGoodForSelect(n){
            return (n && n.treeEntry && !n.treeEntry.__isRoot) ? n : 0;
        }
        
        function selnxty(sgn){
            return selectNext ( function(node) {
                var miny = sgn * 10000000, sn = 0;
                var y = node.treeEntry.treeItem.plate.__worldPosition.y;
                var cond = sgn == 1 ? function(ey){
                    return ey > y && (ey < miny );
                } : function(ey){
                    return ey < y && (ey > miny );
                };
                hierarchyPanel.__traverseVisible( function(treeItem){
                    if (treeItem.entry && treeItem.__isTreeItem){
                        var ey = treeItem.plate.__worldPosition.y;
                        if ( cond(ey)){
                            miny = ey;
                            sn = treeItem.entry.node
                        }
                    }
                });
                return checkGoodForSelect(sn);
            } )
        }
        
        var findPanel = hierarchyPanel.parent.__alias('findPanel')||0;
        findPanel.__visible = 0;
                            
        addEditorEvents('Hierarchy', {
            cursorUp: function(){
                selnxty(-1);
            },
            
            cursorDown: function(){
                selnxty(1);
            },
            
            cursorRight: function(){
                selectNext ( function(node) {
                    return node.__findChild( checkGoodForSelect ) || checkGoodForSelect(node.__nextNode);
                } );
            },
            
            cursorLeft: function(){
                selectNext ( function(node) {
                    if ( checkGoodForSelect( node.parent ) ){
                        if (getDeepFieldFromObject( node, 'treeEntry', 'treeItem', 'content', '__visible' ) )
                        {
                            node.treeEntry.toggleContent();
                        }
                        else {
                            return node.parent;
                        }
                    }
                } );
            },
            
            cancelFind: function(){
                if (findPanel){
                    findPanel.input.unfocus();
                }
            },
            
            find: function(){
                
                if (findPanel){
                    
                    findPanel.__visible = 1;
                    
                    if (!findPanel.input.__bindedObject){
                        ObjectDefineProperty(hierarchyPanel, 'findText', createSomePropertyWithGetterAndSetter(
                            function(){ return this.__findText; },
                            function(v){
                                this.__findText = v;
                                if (v){
                                    var l = (Editor.currentLayout||0).layoutView;
                                    if (l){
                                        function finder(p, re){
                                            
                                            return re ? function(n){
                                                if (n.__validToSave){
                                                    var f = n[p];
                                                    if (f && f.match(v))
                                                        return n;
                                                }
                                            } : function(n){
                                                    if (n.__validToSave){
                                                        var f = n[p];
                                                        if (f && f.indexOf(v)>=0)
                                                            return n;
                                                    }
                                                }
                                        }
                                        
                                        var node = l.__traverse(finder('name')) 
                                            || l.__traverse(finder('__description'))
                                            || l.__traverse(finder('fullname'));
                                        
                                        if (node && node.__select) {
                                            eachSelected(function(sn){ sn.__unselect(); });
                                            node.__select();
                                        }
                                    }
                                }
                            }
                        ));
                        
                        findPanel.input.__onBlur = function(){
                            findPanel.__visible = 0;
                        };
                        
                        EditFieldsWithKitten.bindInput(findPanel.input, hierarchyPanel, 'findText');
                    }

                    findPanel.input.focus();
                    
                }
                
            }
            
        } );
        
        addKeyboardMap({
            'ctrl+f': 'Hierarchy.find',
            'ctrl+arrowup': 'Hierarchy.cursorUp',
            'ctrl+arrowdown':'Hierarchy.cursorDown',
            'ctrl+arrowleft':'Hierarchy.cursorLeft',
            'ctrl+arrowright':'Hierarchy.cursorRight'
        });
    
    }
        
} );

    
    
    
})();
