(function () {

    var checkinterval, navpanels = new HitTestObjects(function (n) {
        return n.__isNavPanel || (n.__parent || 0).__isNavPanel
    }, 'navpanels'), navpanels__a = [];

    function hideAllPanels() {

        $each(navpanels__a, n => {
            n.__hide();
        });

    }


    function updatePanelsVisibility() {

        navpanels.__traverseHit(mouse, p => { });

        $each(navpanels__a, p => {
            if (!p.__checkedHitTest && p.__visible && !p.__parent.__checkedHitTest && (TIME_NOW - p.__showTime > 1)) {
                var someChildsVisible = p.__traverse(c => c.__visible && c.__checkedHitTest ? 1 : undefined);
                if (!someChildsVisible) {
                    p.__hide();
                }
            }
        });
    }

    var lastPanelShowed;
    function catchMouseMoving(t) {

        t.__navpanel = 1;

        t.__visible = 0;

        t.__onTap = 1;

        t.__show = function () {
            t.__visible = 1;
            $each(navpanels__a, p => {
                p.__showTime = 0;
            });
            lastPanelShowed = t;
            t.__showTime = TIME_NOW;
            updatePanelsVisibility();
        }

        t.__hide = function (k) {
            t.__visible = 0;
            t.__justShowed = 0;
            if (!k) {
                t.$({ __navpanel: 1 }).forEach(function (n) {
                    if (n.__hide) n.__hide(1)
                });
            }
        }

        if (!checkinterval) {
            checkinterval = 1;
            _setInterval(updatePanelsVisibility, 1);
        }

        t.__isNavPanel = 1;
        navpanels__a.push(t);

    }

    addEditorBehaviours({

        navli: function (but) {

            but.__onTap = function () {
                but.panel.__show();
                return 1;
            }

            but.__mmmin = 0;
            ObjectDefineProperties(but, {
                __mouseIn: {
                    set: function (v) {

                        this.__mmmin = v;

                        if (v) {
                            this.panel.__show();
                        }

                        updatePanelsVisibility();
                    },
                    get: function () {
                        return this.__mmmin;

                    }
                }

            });

            catchMouseMoving(but.panel);

            onTapHighlight(but);

            if (!but.panel.__llpp) {
                but.panel.__llpp = 1;
                looperPost(function () {

                    but.panel.__traverse(function (p) {

                        if (p.__parent == but.panel && p.__onTap && p.__mmmin == undefined) {
                            p.__mmmin = 0;
                            ObjectDefineProperties(p, {
                                __mouseIn: {
                                    set: function (v) {
                                        this.__mmmin = v;
                                        if (lastPanelShowed != this.__parent)
                                            lastPanelShowed.__hide();
                                    },
                                    get: function () {
                                        return this.__mmmin;
                                    }
                                }

                            });
                        }
                    });
                });
            }
        }

    });


    BUS.__addEventListener(['WINDOW_SHOWED', 'LAYOUT_SAVED', 'FILES_CHANGED', 'LAYOUT_ACTIVATED', 'LAYOUT_DEACTIVATED', 'NO_PROJECT', 'HIDE_NAV_PANELS'], hideAllPanels);

})();        
