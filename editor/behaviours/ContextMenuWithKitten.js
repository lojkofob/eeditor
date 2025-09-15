
var showContextMenu, cmp;

(function () {

    mergeObjectDeep(EditorUIBehavioursWithKitten, {

        behaviours: {

            contextMenuPanel: function (contextMenuPanel) {
                cmp = contextMenuPanel;
                contextMenuPanel.__width = 250;

                function goodFunc(f) {
                    return isFunction(f) || isString(f)
                }

                function hideContextMenu() {
                    if (contextMenuPanel.__visible) {
                        //                         console.log("hideContextMenu", contextMenuPanel.showTime, TIME_NOW);

                        contextMenuPanel.__visible = 0;
                        contextMenuPanel.__clearChildNodes();
                    }
                }

                showContextMenu = function (params, object) {

                    if (Editor.contextMenuDisabled) {
                        return;
                    }

                    contextMenuPanel.__visible = 1;
                    contextMenuPanel.__clearChildNodes();

                    $each(params, function (p, i) {
                        var func;
                        if (isObject(p)) {
                            func = p.f;
                            if (p.hidden)
                                return;
                        } else
                            if (goodFunc(p)) {
                                func = p;
                                p = {};
                            } else {
                                debugger;
                            }


                        var li = contextMenuPanel.__addChildBox({
                            __class: 'e-nav-li' + (p.__classModificator ? ':' + p.__classModificator : ''),
                            __text: p.text || i,
                            __onTapHighlight: 1,
                            __menuTarget: this,
                            __onTap: function () {
                                //                                 console.log("contextMenuPanel.li");
                                var d = { caller: this, data: p, target: object };
                                isFunction(func) ? func(d) :
                                    isString(func) ? invokeEventWithKitten(func, d) : 0;
                                hideContextMenu();
                            }
                        });

                        if (p.hotkey) {
                            li.__addChildBox({ __size: [67, 22], __class: "e-nav-li-hotkey", __text: { __fontsize: 14, __text: p.hotkey, __autoscale: 1 } });
                        }

                        if (p.icon) {
                            li.__addChildBox({ __size: [25, 25], __img: p.icon, __fitImg: 1, __x: -35 });
                            var pad = li.__padding || [0, 0, 0, 0];
                            pad[1] += 30;
                            li.__padding = pad;
                        }

                        if (isFunction(p.custom)) {
                            p.custom(li, object);
                        }

                    });


                    var w = contextMenuPanel.__width, h = contextMenuPanel.__height,
                        x = clamp(mouse.x, 0, __screenSize.x - w),
                        y = clamp(mouse.y, 0, __screenSize.y - h);
                    contextMenuPanel.__x = x;
                    contextMenuPanel.__y = y;

                    contextMenuPanel.update(1);
                    contextMenuPanel.showTime = TIME_NOW;
                    contextMenuPanel.__onTap = 1;

                    anim(contextMenuPanel, { __scaley: [0.75, 1], __x: [x - 10, x], __y: [y - h / 16, y] }, 0.1);
                    _setTimeout(function () {
                        contextMenuPanel.update(1)
                    }, 0.01)
                    //                     console.log("contextMenuPanel.showTime", contextMenuPanel.showTime);
                }

                //                 BUS.__addEventListener([ 'WINDOW_SHOWED', 'LAYOUT_SAVED', 'FILES_CHANGED', 'LAYOUT_ACTIVATED', 'LAYOUT_DEACTIVATED', 'NO_PROJECT'], hideContextMenu );
                BUS.__addEventListener(__ON_POINTER_UP, function () {
                    if (contextMenuPanel.showTime < TIME_NOW - 0.5) {
                        //                         console.log("contextMenuPanel.__checkedHitTest", contextMenuPanel.__checkedHitTest);
                        if (!contextMenuPanel.__checkedHitTest) {
                            //                             console.log("looperPost( hideContextMenu );", contextMenuPanel.showTime, TIME_NOW);
                            looperPost(hideContextMenu);
                        }
                    }
                });


                modClass(Node, 0, {

                    contextMenuData: {
                        get() { return this.__contextMenuData; },
                        set(v) {
                            var t = this;
                            if (v) {
                                // params validation
                                if (isObject(v)) {
                                    $each(v, (f, i) => {
                                        if (!goodFunc(f)) {
                                            if (isObject(f) && goodFunc(f.f)) {
                                                // good!
                                            } else {
                                                onError('bad args for contextMenuData');
                                                debugger;
                                            }
                                        }
                                    });
                                }
                                else {
                                    onError('bad args for contextMenuData');
                                    debugger;
                                }
                            }
                            t.__contextMenuData = v;
                            t.__contextMenu = v ? () => {
                                if (t.__onContextMenu && t.__onContextMenu())
                                    return 1;

                                showContextMenu(t.contextMenuData, t)
                                return 1;
                            } : 0;
                        }
                    }

                });



            }

        }

    });


})();
