/*
 some html DOM routines
 also ad platforms support
*/

var html = (function () {

    function html_getDocumentElement(s) { if (s) return __document[s] || __document.getElementsByTagName(s)[0]; }

    function html_getElementById(s) { if (s) return __document.getElementById(s); }

    function html_getHead() { return html_getDocumentElement('head'); }

    function html_getBody() { return html_getDocumentElement('body'); }

    function html_setText(elem, text) { elem.textContent = text; return elem; }

    function html_addText(elem, text) { elem.appendChild(__document.createTextNode(text)); return elem; }

    function html_setHtml(elem, content) { elem.innerHTML = content; return elem; }

    function html_addHtml(elem, content, position) {

        if (!isNumber(position)) { position = 2; }
        if (position > 3) position = 3;

        if (isString(content)) {
            elem.insertAdjacentHTML(['beforebegin', 'afterbegin', 'beforeend', 'afterend'][position], content);
        } else
            if (content instanceof HTMLElement) {

                var pn = [elem.parentNode, elem, 0, elem.parentNode][position]
                    , ins = [elem, elem.firstChild, 0, elem.nextSibling][position];

                if (pn) {
                    pn.insertBefore(content, ins);
                }
                else {
                    elem.appendChild(content);
                }

            }
        return elem;
    }

    function html_addHtmlToHead(e) { return html_addHtml(html_getHead(), e); }

    function html_addHtmlToBody(e) { return html_addHtml(html_getBody(), e); }

    function html_createElement(d, j, f) {
        var e = mergeObj(__document.createElement(d), j);
        if (f) return f(e);
        return e;
    }

    function html_addCSSStyle(css) {
        html_addHtmlToHead(
            html_createElement('style', { type: 'text/css' }, function (e) {
                if (e.styleSheet) {
                    e.styleSheet.cssText = css;
                } else {
                    html_setText(e, css);
                }
                return e;
            })
        );
    }

    function html_addClickHandler(d, h, preventDefault) {
        var b = function (e) {
            blockBrowserEvent(e, preventDefault);
            return true;
        };
        var f = function (e) {
            blockBrowserEvent(e, preventDefault);
            return h.call(d, e);
        };
        addEventListenersToElement(d,
            set({},
                'mousemove', b,
                'touchmove', b,
                'mousedown', b,
                'touchstart', b,
                'wheel', b,
                'mouseup', f,
                'touchend', f
            )
        );
    }

    function html_init(e, j) {

        if (j.__attributes) {
            //TODO: modify j is bad
            mergeObj(e, j);
            delete j.__attributes;
        }

        if (j.__onTap) {
            //TODO: modify j is bad
            html_addClickHandler(e, j.__onTap, j.__preventDefault == undefined ? true : j.__preventDefault);
            delete j.__onTap;
        }

        $each(j, function (subj, i) {
            if (isObject(subj)) {
                $each(([]).slice.call(e.querySelectorAll(i)), function (el) {
                    html_init(el, subj);
                });
            } else if (isFunction(subj)) {
                $each(([]).slice.call(e.querySelectorAll(i)), subj);
            }
        });

        return e;
    }

    //mintegral
    var gameReady = get(__window, 'gameReady');
    if (gameReady) { BUS.__addEventListener(__ON_GAME_LOADED, a => { gameReady.call(__window); return 1; }); }
    var gameEnd = get(__window, 'gameEnd');
    if (gameEnd) { BUS.__addEventListener(__ON_GAME_END, a => { gameEnd.call(__window); return 1; }); }
    if (gameReady && gameEnd) {
        set(__window, 'gameStart', a => { BUS.__post(__ON_GAME_START); });
        set(__window, 'gameClose', a => { BUS.__post(__ON_GAME_CLOSE); });
    } else {
        BUS.__addEventListener(__ON_GAME_LOADED, a => { BUS.__post(__ON_GAME_START); return 1; })
    }
    //nomintegral

    return makeSingleton({

    }, {

        __getHead: html_getHead,
        __getBody: html_getBody,
        __setText: html_setText,
        __addText: html_addText,
        __setHtml: html_setHtml,
        __addHtml: html_addHtml,
        __addHtmlToHead: html_addHtmlToHead,
        __addHtmlToBody: html_addHtmlToBody,
        __createElement: html_createElement,
        __addCSSStyle: html_addCSSStyle,
        __addClickHandler: html_addClickHandler,
        __getElementById: html_getElementById,
        __init: html_init,

        __removeElement: function (e) {
            var pn = (e || 0).parentNode;
            if (pn) pn.removeChild(e);
            return e;
        },

        __close: function (e) {
            return html.__removeElement(e);
        },

        __show: function (n, j, appendToElementId) {

            var d = getCachedData(options.__baseHtmlFolder + n + '.html');
            if (d) {
                var div = html_getElementById(appendToElementId) || html_createElement('div');

                d = d.replace(/\$(\w+)/g, function (a, b) {
                    var b1 = (j || 0)[b];
                    if (isString(b1)) {
                        b = b1;
                    }
                    b1 = (localizationDict || 0)[b];
                    if (b1) {
                        //TODO: why replace here?
                        b = b1.replace(/\n/g, '</br>');
                    }
                    return b;
                });

                html_addHtmlToBody(html_init(html_setHtml(div, d), j));
                return div;
            }
            //debug
            else {
                debugger;
            }
            //undebug

        },
        __reload() {
            __window.location.reload()
        },

        __redirect(url, donttrack) {
            if (donttrack) {
                __window.location.replace(url);
            } else {
                __window.location.href = url;
            }
        },
        __openAppStore(url){
            // tiktok
            var a = get(__window, "openAppStore");
            if (isFunction(a)) return a.call(__window);

            // facebook
            var FbPlayableAd = get(__window, "FbPlayableAd");
            if (FbPlayableAd) {
                a = get(FbPlayableAd, "onCTAClick")
                if (a) return a.call(FbPlayableAd)
            }

            // mintegral
            a = get(__window, "install");
            if (isFunction(a)) return a.call(__window);

            var url = url || options.__appStoreUrl;
            if (isObject(url)){
                url = _bowser && _bowser.ios ? url.ios : (url.android || url.ios);
            }

            if (isString(url)) {
                // mraid (Unity, AppLovin)
                if (__mraid) {
                    return __mraid.__open(url);
                } else {
                    return this.__redirect(url)
                }
            }
            
            consoleDebug("openAppStore failed");
        }
    });

})();


// playable ads functions

__mraid = (function() {
    var mraid = get(__window, "mraid");
    // do not remove. this string is needed by unity ads app tester
    console.log("mraid.open(url)", mraid ? 1 : 0);
    if (mraid){
        var loading = 'loading', hidden = 'hidden', viewableChange = 'viewableChange', ready = 'ready'

        mraid.__isViewable = get(mraid, 'isViewable');
        mraid.__open = get(mraid, 'open');
        mraid.__getState = get(mraid, 'getState');
        mraid.__addEventListener = get(mraid, 'addEventListener');
        mraid.__removeEventListener = get(mraid, 'removeEventListener');

        mergeObj(mraid, {
            __isReady(){
                var mraid_state = mraid.__getState()
                return mraid_state != loading && mraid_state != hidden && __mraid.__isViewable();
            },
            __waitForReady(callback){

                var mraid_state = __mraid.__getState()
                if (mraid_state == loading) {
                    __mraid.__addEventListener(ready, function(){ 
                        __mraid.__removeEventListener(ready);
                        callback();
                    });
                } else
                if (mraid_state == hidden || !__mraid.__isViewable()) {
                    __mraid.__addEventListener(viewableChange, isViewable => {
                        if (isViewable) {
                            __mraid.__removeEventListener(viewableChange);
                            callback();
                        }
                    })
                } else {
                    callback();
                }

            }
        });

        return mraid;
    }
})();

  
