

function LayoutWithKitten(opts){
    
    
    this.opts = opts;
    this.name = this.opts.name;
        
    this.layoutView = opts.layoutView || new Node({ 
        __hitTest: function(){},
        __size : { x:1, y:1, px:1, py:1 },
        ha:1, va: 1, __isScene: 1
    });
    
    if (!window.NodeEditWithKittenDisabled) {
        this.nodeEditWithKitten = new NodeEditWithKitten(this);
        this.nodeEditWithKitten.createView();
    }
    
    this.history = new HistoryWithKitten(this);
    
    
    
    this.options = mergeObj( {}, opts.options);
}


LayoutWithKitten.prototype = {
    
    constructor : LayoutWithKitten, 
    
    createView : function(json){
        
        if ( isObject( json ))
            json = [ json ];
        
        if ( isArray( json ))
            json = { __childs:json };
        
        this.project = Editor.currentProject;
        
        this.activateOptions();

        if (!options.__enableEventsOnLayout)
            this.layoutView.__eventsDisabled = 1;
        
        this.layoutView.init(json);
        
		this.layoutView.__select = function(){};
        
        var lv = Editor.ui.__alias('leftView');
        var rv = Editor.ui.__alias('rightView');
        this.layoutView.__updateOnResize = function(){
            if (Editor.ui.__visible && this != Editor.scene ) {
                this.__margin = [ 40, lv.__visible ? lv.__width : 0, 0, rv.__visible ? rv.__width : 0 ];
            } else {
                this.__margin = 0;
            }
            this.update(1);
        };
        
        this.layoutView.__updateOnResize();       
        BUS.__addEventListener( [__ON_RESIZE, 'PROJECT_CLOSED'], this )
        
        this.deactivateOptions();
        
        BUS.__post( 'LAYOUT_PREPARED', this );
        return this;
        
    },
    
    __on: function(t, e){
        switch(t) {
            case __ON_RESIZE: {
                if (Editor.updateLayoutSize){
                    Editor.updateLayoutSize(this);
                }
                else {
                    this.layoutView.__updateOnResize();
                }
                break;
            }
            
            case 'PROJECT_CLOSED': {
                this.close();   
                break;
            }
            
        }
    },
    
    
    close: function(){
        
        if (this.nodeEditWithKitten) {
            this.nodeEditWithKitten.deactivate();
            this.nodeEditWithKitten.view.__removeFromParent();
            this.nodeEditWithKitten.view.__destruct();
        }
        
        this.deactivateOptions();
        this.layoutView.__removeFromParent();
        this.layoutView.__destruct();
        
        this.history.deactivate();
        
    },
    
    activate: function(){
        if (!this.__active) {
            this.__active = 1;
            this.activateOptions();
            
            this.history.activate();
            
            if (this.nodeEditWithKitten) {
                this.nodeEditWithKitten.activate();
                this.nodeEditWithKitten.view.camera = this.layoutView.camera;
            }
			
            if (!inArray(this.layoutView, scenes)) {
                addToScene(this.layoutView);
                if (this.nodeEditWithKitten)
                    addToScene(this.nodeEditWithKitten.view);
            } else {
                if (this.nodeEditWithKitten) {
                    this.nodeEditWithKitten.view.__z = -2000;
                    addToScene(this.nodeEditWithKitten.view);
                }
            }
        
            this.layoutView.__needUpdateDeep = 1;
            this.deactivateOptions();
            
            BUS.__post( 'LAYOUT_ACTIVATED', this );
        }
        return this;
    },
    
    deactivate: function(){
        if (this.__active) {
            this.__active = 0;
            if (this.nodeEditWithKitten) {
                this.nodeEditWithKitten.deactivate();
                Editor.scene.__removeChild( this.nodeEditWithKitten.view );
            }
            this.history.deactivate();

            this.layoutView.parent.__removeChild( this.layoutView );
            
            BUS.__post( 'LAYOUT_DEACTIVATED', this );
            
            this.deactivateOptions();
        }
        return this;
    },
    
    
    activateOptions: function(){
        if (!this.__oactive) {
            this.__oactive = 1;
            if (this.project) activateOptions(this.project.options);
            activateOptions(this.options);
        }
        return this;
    },
    
    deactivateOptions: function(){
        
        if (this.__oactive) {
            this.__oactive = 0;
            if (this.project) deactivateOptions(this.project.options);
            deactivateOptions(this.options);
        }
        return this;
    }
    
}
