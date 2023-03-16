var AskerWithKitten = (function(){

                    
    function askerOk(){
        if (asker.o)
        if (asker.o.ok) {
            if (asker.selected && asker.selected.__visible)
                asker.result = asker.selected.__value;
            
            if (asker.o.ok( asker.result ))
                return 1;
        }
        
        asker.close();
    }
    
    var asker = {
       
        ask( o ){
            
            asker.result = undefined;
            asker.o = o;
            asker.n.__visible = 1;
            asker.selected = 0;
            var w = asker.w;
            w.txt.__visible = !!o.caption;
            w.txt.__text = o.caption;
            
            w.__scaleF = 0.6;
            w.__anim({ __scaleF:1 }, 0.3, 0,easeElasticO);
            
            if (o.list){
                w.list.__visible = 1;
                w.list.__clearChildNodes();
                let generator = o.generator || (f => isObject(f) ? f : isString(f) ? f : 0);
                $each( $map( o.list, generator ), kl => {
                    if (kl) {
                        var b = w.list.__addChildBox({
                            __onTapHighlight: 1,
                            __class:'e-li',
                            li:1,
                            __text: kl.custom ? '' : isString(kl) ? kl : kl.text || kl.value,
                            __value: isString(kl) ? kl : kl.value || kl.text,
                            __onTap: function(){
                                
                                asker.result = this.__value || this.__textString;
                                
                                asker.selected = this;
                                
                                w.list.$({__classModificator:'selected'}).__killAllAnimations().__classModificator = null;
                                this.__killAllAnimations().__classModificator = 'selected';
                                if (this.__ltt > TIME_NOW - 0.4){
                                    askerOk();
                                }
                                else {
                                    this.__ltt = TIME_NOW;
                                }
                                this.__scrollIntoView(0.1);
                                return 1;
                            }
                        });
                        
                        if (kl.custom)
                            b.__init(kl.custom);
                    }
                });
                
                w.list.__scroll = { __onlyScrollY:1 }
            } else {
                w.list.__visible = 0;
            }
            
            if (o.noinput){
                w.input.__visible = 0;
                w.input.inputValue = '';
            } else {
                w.input.__visible = 1;
                asker.result = w.input.inputValue = o.value || '';
                w.input.focus();
            }

            w.bar.__visible = o.bar ? 1 : 0;
            
            if (o.onCreate) {
                o.onCreate(w);
            }

            w.__setAliasesData({ 
                no: { 
                    __visible: isFunction(getDeepFieldFromObject(asker, 'o', 'no'))
                }
            });
            
            asker.n.update(1);
            asker.n.update(1);
            
            BUS.__post( 'WINDOW_SHOWED' );
        
        },
        
        progress: function(progress, txt){
            if (txt) txt = txt + ' '; else txt = '';
            asker.w.bar.__text = txt + round( progress * 100 ) + '%';
            asker.w.bar.fll.__size = { x:progress, px: 1, y: 1, py:1 };
        }
        
    };
    
    mergeObjectDeep( EditorUIBehavioursWithKitten, { 
        
        behaviours: {

            asker : function(n){
                
                n.__onTap = 1;
                asker.n = n;
                asker.w = n.w;
                
                EditFieldsWithKitten.bindInput(n.w.input, asker, 'result');
                
                n.w.input.__disableEvents = 1;
                
                n.w.input.onInputInput = function(v){
                    asker.result = v;
                    n.w.input.__text = v;
                    if (asker.o && asker.o.search && asker.w.list.__visible){
                            
                        if (v.length>0) {
                            if (!asker.w.list.sds) {
                                asker.w.list.sds = 1;
                                asker.w.list.__size = { x: asker.w.list.__size.x, y: asker.w.list.__size.y-5 };
                            }
                            var asdf = 0;
                            asker.w.list.$(function(n){
                                if (n.__textString && !n.__searchSkip) {
                                    var vis = n.__textString.toLowerCase().indexOf(v.toLowerCase()) >= 0;
                                    if (!n.li) n.__traverseParents( p => p.li ? n = p : 0 );
                                    n.__visible = vis;
                                    if (n.__visible && !asdf) {
                                        asdf = 1;
                                        looperPost(function(){
                                            n.__scrollIntoView(0.1);
                                        });
                                    }
                                }
                            });
                            
                            
                        } else {
                            asker.w.list.$().__visible = 1;
                        }
                        asker.w.update(1);
                    
                    } else if (asker.o && asker.o.list && asker.selected && asker.o.unselectListOnInput) {
                        var selectedCell = asker.selected;
                        selectedCell.__killAllAnimations().__classModificator = null;
                        asker.selected = 0;
                    }
                    
                }
        
                asker.setCaption = function(txt){
                     asker.w.txt.__text = txt;
                };
                
                asker.close = function(){
                    
                    n.__visible = 0;
                    asker.w.input.unfocus();
                    if (asker.o)
                    if (asker.o.close) asker.o.close( );
                    
                };
                
                function selectNext(ind){
                    return function(){
                        var all = [], selected = asker.selected && asker.selected.__visible ? asker.selected : 0;
                        asker.w.list.__eachChild( function(n){
                            if (n.__visible) {
                                all.push(n);
                                if (!selected && asker.result == n.__value && n.__onTap){
                                    selected = n;
                                }
                            }
                        });
                        
                        var selectedIndex = (all.indexOf(selected) || 0) + ind;
                        var selectedNext = all[selectedIndex] || all[ ind < 0 ? all.length - 1 : 0];
                        if (selectedNext && selected != selectedNext){
                            selectedNext.__ltt = 0;
                            selectedNext.__onTap();
                        }
                        
                    }
                }
                
                n.__onKey = {
                    arrowdown: selectNext(1),
                    arrowup: selectNext(-1)
                };
                
                n.__drag = 1;
                
                asker.w.__setAliasesData({ 
                    ok: {
                        __onKey : 'enter',
                        __onTapHighlight: 1,
                        __onTap : askerOk
                    }, 

                    no: {
                        __onTapHighlight: 1,
                        __onTap(){
                            if (!callFunction(getDeepFieldFromObject(asker, 'o', 'no'))) {
                                asker.close();
                            }
                        }
                    }, 
                    
                    cancel: {
                        __onKey : 'escape',
                        __onTapHighlight: 1,
                        __onTap(){
                            if (!callFunction(getDeepFieldFromObject(asker, 'o', 'cancel')))
                                asker.close();
                        }
                    }
                });
                
            }
            
        }

    } );

    
    return asker;
    
})();
