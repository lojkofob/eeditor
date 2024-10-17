var globalEventObjectsFilter;

var ev_cursor;
var HitTestObjects = makeClass(function (f, propertyArray) {
    this.__b = [];
    this.f = f;
    this.__propertyArray = propertyArray;
},
    {
        __normalize(v){
            return new Vector2(v.x / layoutsResolutionMult / __screenCenter.x - 1, 1 - v.y / layoutsResolutionMult / __screenCenter.y)
        },

        __traverseObjects: function (checker, f) {
            if (__needResortEventsObjects) {
                tappableObjects.__resort();
                draggableObjects.__resort();
                scrollableObjects.__resort();
                keyableObjects.__resort();
                wheelObjects.__resort();
                menusObjects.__resort();
                __needResortEventsObjects = 0;
            }

            var t = this, fltr = t.f;
            for (var k = scenes.length - 1; k >= 0; k--) {
                var s = scenes[k];

                for (var i = s.__childs.length - 1; i >= 0; i--) {
                    var r = s.__childs[i], a = r[t.__propertyArray];
                    if (!r.____visible || !r.__viewable)
                        continue;

                    if (!a) {
                        a = r.$(fltr);
                        r[t.__propertyArray] = a.sort(function (a, b) {
                            return (b.__totalZ - a.__totalZ) || (b.id - a.id)
                        });
                    }

                    if (globalEventObjectsFilter) {
                        a = $filter(a, globalEventObjectsFilter);
                    }

                    for (var j = 0; j < a.length; j++) {
                        var o = a[j];
                        o.__checkedHitTest = checker(o);
                        if (o.__checkedHitTest) {
                            if (f(o)) {
                                return o;
                            }
                        }
                    }

                }
            }

        },

        __keyObjects: function (key, f) {
            var checker = function (n) {
                if (n.__visibleForTap()) {
                    var tk = n.__onKey;
                    if (tk == 1) return 1;
                    if (tk == key) return 1;
                    if (isArray(tk) && tk.indexOf(key) >= 0) return 1;
                    if (isObject(tk) && tk[key]) return 1;
                }
            };
            return this.__traverseObjects(checker, f);
        },

        __traverseHit: function (pos, f) {
            var w = new Vector2(pos.x, pos.y);
            w.__normalized = this.__normalize(w);

            return this.__traverseObjects(function (o) {
                return o.__hitTest(w);
            }, f);
        },

        __resort: function () {
            var p = this.__propertyArray;
            $each(scenes, function (s) {
                s.__eachChild(function (n) { delete n[p]; });
            });
        }

    });

var pointerLocked = 0
    , __deviceOrientation = new Vector3(0, 0, 0)
    , __deviceOrientationSpeed = new Vector3(0, 0, 0)

    , tappableObjects = new HitTestObjects(function (n) { return n.____onTapFunc; }, '__tappableObjects')
    , draggableObjects = new HitTestObjects(function (n) { return n.____onDragFunc; }, '__draggableObjects')
    , scrollableObjects = new HitTestObjects(function (n) { return n.__scrollable; }, '__scrollableObjects')
    , menusObjects = new HitTestObjects(function (n) { return n.____contextMenu }, '__menusObjects')
    , wheelObjects = new HitTestObjects(function (n) { return n.____wheel }, '__wheelObjects')
    , keyableObjects = new HitTestObjects(function (n) { return n.__onKey }, '__keyableObjects')
    , curDraggingObject
    , gestures = {}
    , mouse = new Vector2()
    , isTouchEvent
    , isShiftPressed
    , isCtrlPressed
    , isAltPressed
    , lastMousePosition = new Vector2()
    , lastMouseDownTime
    , lastMouseWheelTime
    , mouseButtons = {}
    , downTime
    , downPos
    , highlightedObject
    , tmpDraggingObject = 0
    , lasttouchesdist
    , disableHighlightOnOver
    , pinchInProcess
    , allEventsBlocked
    , __needResortEventsObjects;

function resortEventsObjects(node) {
    __needResortEventsObjects = 1;
    if (node && !node.__root) {
        resortSceneChilds();
    }

}

function blockBrowserEvent(e, preventDefault) {
    if (options.__preventDefaultEvents) {
        if (e.stopPropagation) e.stopPropagation();
        if (preventDefault !== false) {
            e.preventDefault ? e.preventDefault() : (e.returnValue = false);
        }
    }
}

function updateMouse(e, withoutBlock) {

    isShiftPressed = e.shiftKey;
    isCtrlPressed = e.ctrlKey || e.metaKey;
    isAltPressed = e.altKey;

    if (pointerLocked) {
        mouse = __screenCenter.__clone();
    } else {
        getEventCoords(e, mouse);
    }

    if (!withoutBlock) {
        blockBrowserEvent(e);
    }

    return !allEventsBlocked;
}

function __getEventCoords(e, v) {
    var v = v || new Vector2();
    if (e.offsetX != undefined && e.offsetY != undefined) {
        v.x = e.offsetX;
        v.y = e.offsetY;
    } else
        if (e.pageX || e.pageY) {
            v.x = e.pageX;
            v.y = e.pageY;
        } else {
            v.x = e.clientX;
            v.y = e.clientY;
        }
    v.t = 0;
    return v;
}

var getEventCoords = function (e, v) {
    var v = __getEventCoords(
        e.targetTouches && e.targetTouches[0] ? e.targetTouches[0] :
            e.changedTouches && e.changedTouches[0] ? e.changedTouches[0] : e
        , v);
    return v;
}


function setCurrentDraggingObject(n, withoutUpdate) {
    curDraggingObject = n;
    if (!withoutUpdate) {
        curDraggingObject.mousedown = mouse.__clone().__divideScalar(layoutsResolutionMult);
        curDraggingObject.__lastMousePosition = mouse.__clone();
        curDraggingObject.__lastPosition = curDraggingObject.__worldPosition.__clone();
    }
    curDraggingObject.__isDragging = 1;

}

function onDocumentMouseDown(e) {
    isTouchEvent = 0;
    return _onDocumentMouseDown(e);
}

function onDocumentTouchDown(e) {
    isTouchEvent = 1;
    if (gestures.__touchProcess) {
        return gestures.__touchProcess(getTouches(e));
    } else {
        return _onDocumentMouseDown(e);
    }
}

function _onDocumentMouseDown(e) {

    mouseButtons[e.button || 0] = 1;

    //     consoleWarn('_onDocumentMouseDown', e);

    lastMouseDownTime = TIME_NOW;
    if (!updateMouse(e))
        return;

    var touches = getTouches(e);
    if (touches && touches.length > 1) {
        return;
    } else {
        checkPinchEnd();
    }

    if (gestures.__onPointerDown && gestures.__onPointerDown(mouse))
        return;

    downTime = Date.now();
    downPos = mouse.__clone();

    draggableObjects.__startDragPosition = mouse.__clone();

    lastMousePosition = mouse.__clone();

    tappableObjects.__traverseHit(mouse, function (tc) {

        if (tc.__skipHighlight) {
            if (tc.__onPointerDown) {
                tc.__onPointerDown();
            }
        }
        else {
            if (tc.__highlight) {
                highlightedObject = tc;
                highlightedObject.__highlight(1);

                if (highlightedObject.__onPointerDown) {
                    highlightedObject.__onPointerDown();
                }
            }
            return 1;
        }
    });

}


function brightColor(c, v) {
    return isNumeric(v) ? { r: c.r + v, g: c.g + v, b: c.b + v } :
        isObject(v) ? { r: c.r + v.r, g: c.g + v.g, b: c.b + v.b } : c;
}

function highlightTargetColor(subobj, a) {
    a *= (subobj.__highlightMult || 1);
    var color = subobj.__baseColor || subobj.__color;
    return subobj.__shader == 'colorize' ?
        { r: color.r + 0.015 * a, g: color.g + 0.015 * a, b: color.b + 0.015 * a } :
        subobj.__shader == 'hsv' ?
            { g: color.g - 0.2 * a, b: color.b + 0.1 * a, r: color.r } :
            { r: color.r + 0.2 * a, g: color.g + 0.2 * a, b: color.b + 0.2 * a }
}

function highlightSubobj(subobj, a, t) {
    killAnim(subobj.__color);
    if (!subobj.__baseColor) {
        subobj.__baseColor = brightColor(subobj.__color, 0);
    }
    t = t || 0.1;
    if (averageFPS > 30) {
        anim(subobj.__color, highlightTargetColor(subobj, a), t);
    } else {
        subobj.__color.__copy(highlightTargetColor(subobj, a));
    }
}

function _highlight_(node, a, t) {
    if (node.__highlighted != a) {
        node.__highlighted = a;
        if (node.__disabled) return;
        var dac = node.__dac;
        if (dac) {
            switch (a) {
                case 0:
                    node.__applyDac('out');
                    break;
                case 0.5:
                    node.__applyDac('hover');
                    break;
                case 1:
                    node.__applyDac('tap');
                    break;
            }
        }

        if (node.__subobj) {
            for (var i = 0; i < node.__subobj.length; i++) {
                highlightSubobj(node.__subobj[i], a, t);
            }
        }
    }
};

function highlight(a, t) { return _highlight_(this, a, t); };

var __highlightedOneObject__;
function highlightOne(a, t) {
    if (__highlightedOneObject__ && __highlightedOneObject__ != this && a) {
        _highlight_(__highlightedOneObject__, 0);
        __highlightedOneObject__.__mouseIn = 0;
        removeFromArray(__highlightedOneObject__, tappableObjects.__b);
    }
    if (a) {
        __highlightedOneObject__ = this;
    } else
        if (__highlightedOneObject__ == this) {
            __highlightedOneObject__ = 0;
        }
    _highlight_(this, a, t);
};

function onTapHighlight(obj, subobj, multiHighlight) {
    obj.__subobj = subobj ? isArray(subobj) || (subobj instanceof NodeArrayIterator) ? subobj : [subobj] : [obj];
    obj.__highlight = multiHighlight ? highlight : highlightOne;
    return obj;
}

function onDocumentMouseUp(e) {
    return _onDocumentMouseUp(e)
}

//cheats 
var specialEventHandler;
//endcheats

function _onDocumentMouseUp(e, isout) {

    if (e.button == 2 && !__window.oncm) {
        __window.oncm2 = 1;
        return onContextMenu(e);
    }

    mouseButtons[e.button || 0] = 0;

    draggableObjects.__startDragPosition = 0;

    if (!updateMouse(e))
        return;

    if (highlightedObject) {
        highlightedObject.__highlight(highlightedObject.__mouseIn ? 0.5 : 0, 0.3);

        if (highlightedObject.__onPointerUp)
            highlightedObject.__onPointerUp();

        highlightedObject = undefined;

    }

    if (lasttouchesdist) {
        lasttouchesdist = undefined;
    }

    if (curDraggingObject && curDraggingObject.__isDragging) {
        //         consoleError( 'no tap because curDraggingObject!!', curDraggingObject.name);
        if (curDraggingObject.__dragEnd) {
            //cheats
            if (specialEventHandler) specialEventHandler.eventHandler(curDraggingObject, '__dragEnd');
            //endcheats
            curDraggingObject.__dragEnd();
        }

        if (!curDraggingObject.__keepIsDragingThenMouseUp) {
            curDraggingObject.__isDragging = false;
        }

        curDraggingObject = null;

    } else {

        curDraggingObject = null;

        if (!isout && (Date.now() - downTime < 500) && downPos) {

            if (downPos.__distanceTo(mouse) < 10) {
                var catched = 0;
                if (
                    options.__gesturesTapNotFirst ||
                    (gestures.tap && !gestures.tap(mouse)) || !gestures.tap) {



                    __window.__onTapHitTestDebug = 1;
                    //                     consoleLog("__window.contextMenuFired", __window.contextMenuFired);
                    if (__window.contextMenuFired) {
                        __window.contextMenuFired = 0;
                        catched = 1;
                    } else {
                        var tapEvent = mouse.__clone();
                        catched = tappableObjects.__traverseHit(mouse, function (obj) {
                            if (isFunction(obj.____onTapFunc)) {
                                //                                 consoleLog("obj.____onTapFunc", obj);
                                obj.____onTapFunc(tapEvent);
                                if (!tapEvent.__skip) {
                                    return 1;
                                } else {
                                    tapEvent.__skip = 0;
                                }
                            }
                        });
                    }
                    //                         if (!catched) consoleError( 'no tap because no intersect');

                    __window.__onTapHitTestDebug = 0;

                }

                if (!catched && options.__gesturesTapNotFirst) {
                    if (gestures.tap) {
                        gestures.tap(mouse);
                    }
                }

            } // else { consoleError( 'no tap because downPos so far'); }


        } // else consoleError( 'no tap because Date.now() - downTime > 500', Date.now(), downTime, isout );
    }

    if (!isout && gestures.__onPointerUp)
        gestures.__onPointerUp();

    if (pinchInProcess) {
        var touches = getTouches(e);
        if (!touches || (touches.length <= 1)) {
            checkPinchEnd()
        }
    }

}

function onDocumentTouchEnd(e) {
    consoleLog('touchend');
    if (gestures.__touchProcess) {
        return gestures.__touchProcess(getTouches(e));
    } else {
        return _onDocumentMouseUp(e, 0);
    }
}


function onDocumentTouchOut(e) {
    consoleLog('touchleave');
    if (gestures.__touchProcess) {
        return gestures.__touchProcess(getTouches(e));
    } else {
        return _onDocumentMouseUp(e, 1);
    }
}

function onDocumentMouseOut(e) {
    tmpDraggingObject = 0;
    draggableObjects.__startDragPosition = 0;

    if (curDraggingObject && curDraggingObject.__keepDragThenMouseOut) {
        tmpDraggingObject = curDraggingObject;
        curDraggingObject.__keepIsDragingThenMouseUp = 1;
    }

    _onDocumentMouseUp(e, 1);

    if (tmpDraggingObject)
        tmpDraggingObject.__keepIsDragingThenMouseUp = 0;
}

function onDocumentMouseEnter(e) {

    if (tmpDraggingObject) {
        if (e.buttons) {
            onDocumentMouseMove(e);
            setCurrentDraggingObject(tmpDraggingObject, 1);
        } else {
            tmpDraggingObject.__isDragging = 0;
        }

        tmpDraggingObject = 0;

    }

}


function checkPinchEnd() {
    if (pinchInProcess) {
        pinchInProcess = 0;
        if (gestures.pinchEnd)
            gestures.pinchEnd();
    }
}

function getTouches(e) {
    return e.originalEvent ? e.originalEvent.touches : e.touches;
}

function onDocumentTouchMove(e) {
    isTouchEvent = 1;

    if (!updateMouse(e))
        return;


    var touches = getTouches(e);
    if (gestures.__touchProcess) {
        return gestures.__touchProcess(touches);
    } else
        if (touches && touches.length > 1) {

            var c = new Vector2(0, 0)
                , a = []
                , l = touches.length;

            for (var i = 0; i < touches.length; i++) {
                var b = getEventCoords(touches[i]);
                c.add(b);
                a.push(b);
            }

            c.__divideScalar(l);

            var d = $count(a, function (p) {
                var x = (p.x - c.x), y = (p.y - c.y);
                return sqrt(x * x + y * y);
            }) / l / layoutsResolutionMult;

            if (lasttouchesdist == undefined) {
                lasttouchesdist = d;
            }

            if (!pinchInProcess) {
                if (gestures.pinchStart) {
                    gestures.pinchStart(e, c, d, d - lasttouchesdist);
                }
                pinchInProcess = 1;
            }

            if (gestures.pinch) {
                gestures.pinch(e, c, d, d - lasttouchesdist);
            }

            lasttouchesdist = d;

        } else {

            checkPinchEnd();
            disableHighlightOnOver = 1;
            _onDocumentMouseMove(e);

        }

}

function onDocumentMouseWheel(e) {

    lastMouseWheelTime = TIME_NOW;
    if (!updateMouse(e))
        return;

    var delta = e.deltaY || e.detail || e.wheelDelta;
    if (gestures.wheel && gestures.wheel(mouse, delta))
        return;

    if (scrollableObjects.__traverseHit(mouse, function (o) {

        if (o.__blockScroll) {

            if (isFunction(o.__blockScroll)) {
                if (o.__blockScroll())
                    return 1;

            } else {
                return 1;
            }
        }

        if (o.__wheel) { // wheelable object
            return;
        }

        if (o.__dragStart) {
            //cheats
            if (specialEventHandler) specialEventHandler.eventHandler(o, '__dragStart');
            //endcheats
            o.__dragStart();
            return o.__scrollBy(30 * sign(delta));
        }
    })) {
        return;
    }

    wheelObjects.__traverseHit(mouse, function (o) {
        return o.__wheel(sign(delta));
    });

}


function onContextMenu(e) {

    draggableObjects.__startDragPosition = 0;
    blockBrowserEvent(e);
    if (__window.oncm)
        return;

    __window.oncm = 1;
    if (!updateMouse(e, 1))
        return;

    menusObjects.__traverseHit(mouse, function (o) {
        //         consoleLog("o.____contextMenu()");
        if (o.____contextMenu()) {
            //             consoleLog("__window.contextMenuFired!");
            __window.contextMenuFired = 1;
            looperPost(() => {
                __window.contextMenuFired = 0;
            });
            blockBrowserEvent(e);
            return 1;
        }
    });

    if (__window.oncm2 && __window.contextMenuFired) {
        blockBrowserEvent(e);
    }

    looperPost(() => { __window.oncm = 0; __window.oncm2 = 0; });
}



function onDocumentMouseMove(e) {
    isTouchEvent = 0;

    return _onDocumentMouseMove(e);
}

function setCursor(cursor) {
    (getDeepFieldFromObject(renderer, '__domElement', 'style') || 0).cursor = cursor;
    ev_cursor = cursor;
}

function _onDocumentMouseMove(e) {

    //     consoleWarn('_onDocumentMouseMove', e);

    if (!updateMouse(e))
        return;

    var mdx = (e.movementX || e.mozMovementX || e.webkitMovementX || (mouse.x - lastMousePosition.x)) / layoutsResolutionMult,
        mdy = (e.movementY || e.mozMovementY || e.webkitMovementY || (mouse.y - lastMousePosition.y)) / layoutsResolutionMult;

    if (draggableObjects.__startDragPosition) {

        curDraggingObject = draggableObjects.__traverseHit(draggableObjects.__startDragPosition, function (obj) {
            return !obj.__canDrag || obj.__canDrag(lastMousePosition)
        });

        if (curDraggingObject) {
            curDraggingObject.__lastPosition = curDraggingObject.__worldPosition.__clone();
            curDraggingObject.__lastMousePosition = lastMousePosition;
            draggableObjects.__startDragPosition = 0;
        }

    }

    lastMousePosition = mouse.__clone();

    if (curDraggingObject) {


        var z = 1;
        //debug
        var c = curDraggingObject.__camera || (curDraggingObject.__root || 0).camera;
        if (c) z = c.__zoom;
        //undebug

        var currentMousePosition = mouse.__clone()
            , dx = (pointerLocked ? mdx : currentMousePosition.x - curDraggingObject.__lastMousePosition.x) / z / layoutsResolutionMult
            , dy = (pointerLocked ? mdy : currentMousePosition.y - curDraggingObject.__lastMousePosition.y) / z / layoutsResolutionMult
            , x = curDraggingObject.__lastPosition.x + dx
            , y = curDraggingObject.__lastPosition.y + dy;

        //         consoleError( 'mouseMove', curDraggingObject.__lastMousePosition, 'mouse:', mouse.__clone() );

        if (dx * dx + dy * dy > (curDraggingObject.__dragDist || 100)) {
            if (!curDraggingObject.__isDragging)
                if (curDraggingObject.__dragStart) {
                    //cheats
                    if (specialEventHandler) specialEventHandler.eventHandler(curDraggingObject, '__dragStart');
                    //endcheats
                    curDraggingObject.__dragStart(curDraggingObject.__lastPosition.x, curDraggingObject.__lastPosition.y);
                }

            curDraggingObject.__isDragging = true;
        }

        if (curDraggingObject.__isDragging) {
            curDraggingObject.__lastPosition.set(x, y);
            curDraggingObject.__lastMousePosition = currentMousePosition;

            if (curDraggingObject.____onDragFunc) {
                curDraggingObject.____onDragFunc(x, y, dx, dy, e);
            }

        }

    }

    mouse.__normalized = tappableObjects.__normalize(mouse);

    if (!curDraggingObject && gestures.__drag && (isTouchEvent || mouseButtons[0])) {
        if (gestures.__drag(mdx, mdy))
            return;
    }

    var cursor;

    if (!curDraggingObject || e.__skip) {
        var needFilter = 0;
 
        for (var i = 0; i < tappableObjects.__b.length; i++) {
            var obj = tappableObjects.__b[i];
            if (obj.__hitTest(mouse)) {
                cursor = obj.____cursor;
            } else if (obj.__mouseIn) {
                obj.__mouseIn = 0;
                cursor = 0;
                needFilter = 1;
                if (obj.__highlight) {
                    obj.__highlight(0, 0.4);
                }
            }

        }

        if (needFilter) {
            tappableObjects.__b = $filter(tappableObjects.__b, function (obj) { return obj.__mouseIn; });
        }

        if (!disableHighlightOnOver) {
            tappableObjects.__traverseHit(mouse, function (obj) {
                if (!obj.__skipHighlight) {
                    if (!obj.__mouseIn) {
                        obj.__mouseIn = 1;
                        if (obj.____cursor) {
                            cursor = obj.____cursor;
                        }
                        tappableObjects.__b.push(obj);
                        if (obj.__highlight) {
                            obj.__highlight(0.5);
                        }
                    }
                    return 1;
                }
            });
        }

        disableHighlightOnOver = 0;

    }

    if (cursor && cursor != ev_cursor) {
        setCursor(cursor);
    } else if (ev_cursor && !cursor) {
        setCursor('');
    }

    if (gestures.move) {
        gestures.move(mouse);
    }
}




function keyFromKeyEvent(e) {
    var key = e.key || String.fromCharCode(e.keyCode);
    if (e.keyCode <= 90 && e.keyCode >= 65) key = String.fromCharCode(e.keyCode);
    key = key.toLowerCase();
    return key;
}

function onDocumentKeyDown(e) {

    isShiftPressed = e.shiftKey;
    isCtrlPressed = e.ctrlKey || e.metaKey;
    isAltPressed = e.altKey;
    if (allEventsBlocked) return;
    if (gestures.__onKeyDown && gestures.__onKeyDown(e.keyCode, keyFromKeyEvent(e), e.ctrlKey || e.metaKey, e.shiftKey, e.altKey, e)) {
        e.preventDefault();
    }

};

function onDocumentKeyUp(e) {

    isShiftPressed = e.shiftKey;
    isCtrlPressed = e.ctrlKey || e.metaKey;
    isAltPressed = e.altKey;
    if (allEventsBlocked) return;

    var k = keyFromKeyEvent(e),
        catched = 0;

    var tapEvent = mouse.__clone();

    keyableObjects.__keyObjects(k, function (nod) {
        var tk = nod.__onKey;
        if ((isFunction(tk[k]) && tk[k]()) || (nod.____onTapFunc && nod.____onTapFunc(tapEvent))) {
            if (!tapEvent.__skip) {
                catched = 1;
                return 1;
            } else {
                tapEvent.__skip = 0;
            }
        }
    });

    if (catched || (gestures.__onKeyUp && gestures.__onKeyUp(e.keyCode, k, e.ctrlKey || e.metaKey, e.shiftKey, e.altKey, e))) {
        e.preventDefault();
    }

};


function addEventListenerToElement(i, elem, listener) {
    listener = wrapFunctionInTryCatch(listener);
    return elem.addEventListener ? elem.addEventListener(i, listener, false) : elem.attachEvent ? elem.attachEvent(i, listener, false) : 0;
}

function addEventListenersToElement(elem, listeners) {
    if (!elem) return;
    for (var i in listeners) {
        addEventListenerToElement(i, elem, listeners[i]);
    }
}

function addEventListeners(elem) {

    addEventListenersToElement(elem,
        set({},
            'mousemove', onDocumentMouseMove,
            'touchmove', onDocumentTouchMove,

            'mousedown', onDocumentMouseDown,
            'touchstart', onDocumentTouchDown,

            'touchend', onDocumentTouchEnd,
            'touchleave', onDocumentTouchOut,

            'mouseout', onDocumentMouseOut,
            'mouseenter', onDocumentMouseEnter,
            'mouseup', onDocumentMouseUp,

            'wheel', onDocumentMouseWheel

        ));


    var hiddenNow = false;
    function checkVisibilityChanged() {
        var hn = !!(__document.hidden || __document.msHidden || __document.webkitHidden);
        if (hiddenNow != hn) {
            hiddenNow = hn;
            BUS.__post(__ON_VISIBILITY_CHANGED, !hiddenNow);
        }
    }

    addEventListenersToElement(__document, set({},
        'visibilitychange', checkVisibilityChanged,
        'msvisibilitychange', checkVisibilityChanged,
        'webkitvisibilitychange', checkVisibilityChanged,
        'keydown', onDocumentKeyDown,
        'keyup', onDocumentKeyUp,
        'contextmenu', onContextMenu
    ));

    addEventListenersToElement(__window, set({},
        'beforeunload', checkVisibilityChanged,
        'focus', checkVisibilityChanged,
        'blur', checkVisibilityChanged
    ));

}



///// gamepad

var Gamepads = makeClass(function () {
    var t = this;

    t.__devices = {};

    t.__gamepads = {};

    t.__haveEvents = "ongamepadconnected" in __window;

    addEventListenersToElement(__window,
        set({},
            "gamepadconnected", (e) => { t.__addGamepad(e.gamepad); },
            "gamepaddisconnected", e => { t.__removeGamepad(e.gamepad) }
        ));

    updatable.__push(t);

}, {

    __addGamepad(gamepad) {
        if (gamepad) {
            this.__devices[gamepad.index] = gamepad;
            consoleLog("gamepad", gamepad.index, "connected");
            consoleLog(gamepad);
        }
    },

    __removeGamepad(gamepad) {
        if (gamepad) {
            delete this.__devices[gamepad.index];
            consoleLog("gamepad", gamepad.index, "disconnected")
        }
    },

    __update() {
        var t = this;
        if (!t.__haveEvents) {
            $each(navigator.getGamepads(), gamepad => {
                // Can be null if disconnected during the session
                if (gamepad) {
                    if (gamepad.index in this.__devices) {
                        t.__devices[gamepad.index] = gamepad;
                    } else {
                        t.__addGamepad(gamepad);
                    }
                }
            });
        }

        $each(t.__devices, device => {
            var gp = t.__gamepads[device.index];
            if (!gp) {
                gp = t.__gamepads[device.index] = { __buttons: {}, __axes: {} };
            }

            $each(device.buttons, (b, i) => {
                gp.__buttons[i] = typeof b == "object" ? b.pressed : b;
            });

            $each(device.axes, (val, i) => {
                gp.__axes[i] = (val == -1 || val == 1) ? val : 0;
            });
        });
    }
});

