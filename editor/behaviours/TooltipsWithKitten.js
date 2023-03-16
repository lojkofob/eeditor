
var TooltipsWithKitten = (() =>{ 
    
    function showTooltip(o){
        if (o && o.node && o.text) {
            var t = o.node;
            if (t.__tttTO) {
                _clearTimeout(t.__tttTO);
                delete t.__tttTO;
            }
            var bb = t.__getUIWorldBoundingBox();
            
            var sp = t.__screenPosition().sub(__screenCenter);
            
            if (t.__tooltipNode) {
                t.__tooltipNode = t.__tooltipNode.__removeFromParent();
            }
            
            t.__tooltipNode = new Node({
                __text: o.text,
                __class: 'e-tooltip',
                __busObservers: {
                    __ON_POINTER_UP(){
                        if (t.__tooltipNode) {
                            t.__tooltipNode = t.__tooltipNode.__removeFromParent();
                        }
                        return 1;
                    }
                }
            });
            
            addToScene(t.__tooltipNode, Editor.scene);
            
            t.__tooltipNode.update(1);
//             debugger;
            var sz = t.__tooltipNode.__size.clone();
            sz.x = (sz.x+10)/2;
            sz.y = (sz.y+10)/2;
            var nszx = bb[1].x - bb[0].x;
            var nszy = bb[1].y - bb[0].y;
//             consoleLog(sz);
            var x = clamp(sp.x + nszx / 2, -__screenCenter.x + sz.x, __screenCenter.x - sz.x);
            var y = clamp(sp.y + sz.y +  nszy / 2, -__screenCenter.y + sz.y, __screenCenter.y - sz.y);
            x = clamp(mouse.x / layoutsResolutionMult - __screenCenter.x, -__screenCenter.x + sz.x, __screenCenter.x - sz.x);
            y = clamp(mouse.y / layoutsResolutionMult - __screenCenter.y- sz.y, -__screenCenter.y + sz.y, __screenCenter.y - sz.y);
            
            t.__tooltipNode.__ofs = [x, y /*+ t.__tooltipNode.__size.y*/, -20000];
            
            if (o.time) {
                t.__tttTO = _setTimeout(()=>{
                    if (t.__tooltipNode) {
                        t.__tooltipNode = t.__tooltipNode.__removeFromParent();
                    }
                }, o.time);
            }
            
            if (o.params){
                t.__tooltipNode.__init(o.params);
            }
        }
    }
    
    BUS.__addEventListener({
        TOOLTIP(t, o){
            showTooltip(o);
        }    
    });

    var ont = function(){ consoleLog(111); };
    
    ObjectDefineProperties(NodePrototype, {
        __tooltip: {
            set(v){
                var t = this;

                if (v && !t.__onTap) t.__onTap = ont; else
                if (!v && t.__onTap == ont) t.__onTap = 0;

                if (!t.__ttPPPPP) {
                    ObjectDefineProperties(t, {
                        __ttPPPPP: { value: 1, enumerable: false },
                        __mouseIn: {
                            get(){ 
                                return t.____mouseIn; 
                            },
                            set(m){
                                t.____mouseIn = m;
                                if (m){
                                    
                                    if (t.____tooltip) {
                                        t.__tttTO = _setTimeout(()=>{
                                            if (t.____tooltip) {
                                                showTooltip({node: t, text: t.____tooltip.text || t.____tooltip, params: t.____tooltip.params});
                                            }
                                        }, t.____tooltip.time || 1 );
                                    }
                                } else {
                                           
                                    if (t.__tttTO) {
                                        _clearTimeout(t.__tttTO);
                                        delete t.__tttTO;
                                    }
                                    
                                    if (t.__tooltipNode) {
                                        t.__tooltipNode = t.__tooltipNode.__removeFromParent();
                                    }
                                }
                            }
                        }
                    });
                }
                
                t.____tooltip = v;
            },
            
            get(){
                return this.____tooltip;
            }
        }
    });
    
    
   return makeSingleton({
        
   },
   {
       showTooltip: showTooltip
   });
   
   
   
})();


