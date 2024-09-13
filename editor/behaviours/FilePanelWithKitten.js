var FilePanelWithKitten;



(function () {

    var activeTab;



    var tabTemplate = {
        __class: 'e-nav-tab',
        __simpleBounding: 1,
        __childs: {

            star: {
                __text: '*',
                sha: 2, __x: -35,
                __visible: 0
            },
            txt: {
                __size: { y: 40, x: 1 },
                __margin: [0, 0, 0, 40],
                ha: 0,
                __text: { __fontsize: 18, __autoscale: 1 }
            },
            close: {
                sha: 2, sva: 0,
                __onTap: function () {
                    FilePanelWithKitten.closeTab.call(this);
                    return 1;
                },
                __class: "e-btn-x",
                __z: -2
            }
        },

        activate: function () {
            this.__killAllAnimations().__classModificator = 'active';
            activeTab = this;
            this.__z = -2;
            _setTimeout(function () {
                if (activeTab)
                    activeTab.__scrollIntoView(0.2, undefined, 0, 100);
            }, 0.001);
        },

        deactivate: function () {
            this.__killAllAnimations().__classModificator = null;
            this.__z = -1;

        },

        __onTap: function () {

            if (Editor.currentLayout != this.layout) {
                if (activeTab) {
                    activeTab.layout.deactivate();
                }
                this.layout.activate();
                Editor.currentLayout = this.layout;
            }

        }
    };

    function createNewTab(l) {

        var tab = FilePanelWithKitten.__addChildBox(tabTemplate);

        tab.layout = l;
        l.tab = tab;

        //     consoleLog(l);

        onTapHighlight(tab);
        onTapHighlight(tab.close);

        if (l.opts.changed)
            tab.star.__visible = 1;

        tab.txt.__text = l.getLayoutNameForTab ? l.getLayoutNameForTab() : l.opts.name;

        if (FilePanelWithKitten.tabplus)
            FilePanelWithKitten.tabplus.__realIndex = 9012;

        return tab;

    }


    BUS.__addEventListener(
        {

            LAYOUT_DEACTIVATED: function (t, l) {

                if (!FilePanelWithKitten) return;

                for (var i in FilePanelWithKitten.__childs)
                    if (FilePanelWithKitten.__childs[i].layout == l)
                        FilePanelWithKitten.__childs[i].deactivate();

            },

            __OBJECT_CHANGED: function (t, d) {
                if (activeTab)
                    activeTab.star.__visible = 1;
            },

            LAYOUT_SAVED: function (t, l) {
                if (l.tab) l.tab.star.__visible = 0;
            },


            LAYOUT_PREPARED: function (t, l) {

                if (!FilePanelWithKitten) return;
                createNewTab(l);

            },

            LAYOUT_ACTIVATED: function (t, l) {

                if (!FilePanelWithKitten) return;

                for (var i in FilePanelWithKitten.__childs) {
                    if (FilePanelWithKitten.__childs[i].layout == l) {
                        FilePanelWithKitten.__childs[i].activate();
                        return;
                    }
                }

                createNewTab(l).activate();
            },

            FILES_CHANGED: function () {

                if (FilePanelWithKitten)
                    for (var i in FilePanelWithKitten.__childs) {
                        var tab = FilePanelWithKitten.__childs[i];
                        if (tab.layout) {
                            tab.txt.__text = tab.layout.opts.name;
                        }
                    }

            },

            LAYOUT_CLOSED: function (t, l) {

                function nxt(next) {
                    if (next && next.layout) {
                        next.layout.activate();
                        Editor.currentLayout = next.layout;
                        return 1;
                    }
                }

                if (l.tab) {
                    var active = l.__active;
                    if (active) {
                        if (!nxt(l.tab.__nextNode))
                            nxt(l.tab.__prevNode);
                    }

                    l.tab.__removeFromParent();

                    FilePanelWithKitten.__updateScrollX(0.2);
                }
            },

            PROJECT_CLOSED: function () {

                FilePanelWithKitten.$(function (n) { return n.layout }).__removeFromParent();

            }

        }


    );

    addEditorBehaviours({

        filePanel: function (n) {
            FilePanelWithKitten = n;
            n.__scroll = {
                __onlyScrollX: 1
            }

            FilePanelWithKitten.closeTab = function () {

                invokeEventWithKitten('Layout.close', this.__parent.layout);

                return 1;
            }

            addEditorEvents('FilePanelWithKitten', {
                nextTab() {
                    var nl = getDeepFieldFromObject(Editor.currentLayout, 'tab', '__nextNode', 'layout', 'tab');
                    if (nl) nl.__onTap();
                },

                prevTab() {
                    var nl = getDeepFieldFromObject(Editor.currentLayout, 'tab', '__prevNode', 'layout', 'tab');
                    if (nl) nl.__onTap();
                }
            });

        }

    });

})();        
