


var __wm__queues__ = {};
var windowManager = { 
    
    __hasOpenedWindow: function(){
        return $find( __wm__queues__, function(a){ return a.length } );
    },
    
    __topWindow: function(){
        var windows = [];
        for (var i in __wm__queues__){
            for (var j in __wm__queues__[i]){
                var w = __wm__queues__[i][j];
                if (w.W) windows.push( w );
            }
        }
        windows.sort(function(a, b){ return b.W.__totalZ - a.W.__totalZ });
        return windows[0];
    },
    
    $: function(windowName, cb){
        for (var i in __wm__queues__){
            for (var j in __wm__queues__[i]){
                var w = __wm__queues__[i][j];
                if (w.W && w.n == windowName){
                    return cb ? cb(w.W) : w.W ;
                }
            }
        }
    },
    
    __push: function(nameOfQueue, w){
        var queue = __wm__queues__[nameOfQueue];
        if (!queue) queue = __wm__queues__[nameOfQueue] = [];
        queue.push(w);
    },
    
    __pop: function(w){
        if (w.W) w.W.__removeFromParent();
        if (__wm__queues__[w.q]) {
            removeFromArray( w, __wm__queues__[w.q] );
            if (!__wm__queues__[w.q].length){
                delete __wm__queues__[w.q];
            } else {
                if (w.q) {
                    return __wm__queues__[w.q][0];
                }
            }
        }
        
    },
    
    __closeAllWindows: function() {
        
        $each( __wm__queues__, function(queue){
            $each(queue, function(w){
                w.W.__close();
            });
        } );
        
    }
    
};


function closeWindow(windowName){
    return windowManager.$(windowName, function(w){ return w.__close() });
}

function __showWindow__(_window){
    if (!_window)
        return;
    
    if (_window.c) _window.c();
    
    var wnd = _window.W = new ENode( _window.n );
    
    wnd.__realClose = function(){
        
        if (wnd.__onClose) {
            wnd.__onClose.apply(wnd, arguments);
        }
        
        // pop and show next
        if (! __showWindow__( windowManager.__pop(_window) ) ) {
            BUS.__post(__ON_CLOSE_ALL_WINDOWS); 
        }
        
        if (wnd.__afterClose) {
            wnd.__afterClose.apply(wnd, arguments);
        }
        
    };
    
    wnd.__close = function(){
        
        if (wnd.__closed)
            return wnd;
        
        if (wnd.__minimumShowTime && wnd.__showTime + wnd.__minimumShowTime > TIME_NOW){
            return 1;
        }
        
        wnd.__traverseIterator.__disabled = 1;
        
        if (wnd.__closeAnimation) {
            wnd.__closeAnimation.apply(wnd, arguments);
        } else {
            wnd.__realClose.apply(wnd, arguments);
        }
            
                
        wnd.__closed = 1;

        wnd.__scrollable = 0;
        
        return wnd;
    };
    
    // TODO: auto z ordering?
    wnd.__z = -340;
    
    wnd.__onTap = wnd.__drag = wnd.__blockScroll = 1;
    
    wnd.__scrollable = 1;
    
    wnd.__showTime = TIME_NOW;
    
    _window.w( wnd );
    
    addToScene( wnd );
//     wnd.__updateShadows();
    wnd.update(1);
    
    return wnd;
    
}



function showWindow(name, onShow, afterShow, params){
    
    params = params || {};
    
    var nameOfQueue = params.__notInQueue ? 0 : (params.__queue || "__mainQueue")
        , uniqWindow = !params.__notUniq  //уникально ли это окно или может дублироваться
        , firstWindow = nameOfQueue && __wm__queues__[nameOfQueue]
        , thisTypeOfWindowExistInQueue = firstWindow ? $find( __wm__queues__[nameOfQueue], function(w){ return w.n == name && w.W } ) : 0
        , _window = { w:onShow, n:name, q:nameOfQueue, c: params.__beforeCreateCb }; 
        
    if (uniqWindow && thisTypeOfWindowExistInQueue)
        return;
    
    windowManager.__push(nameOfQueue, _window);
    
    if (firstWindow) return;
    
    
    var wnd = __showWindow__(_window);
    if (afterShow)
        afterShow(wnd);
    
    return wnd;
}


