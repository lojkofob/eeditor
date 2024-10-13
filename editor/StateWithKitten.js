var StateWithKitten = (function () {

    function getProjects() {
        if (!StateWithKitten.state.projects)
            StateWithKitten.state.projects = {};
        return StateWithKitten.state.projects;
    }


    function projectState(project) {
        var projects = getProjects();
        if (!projects[project])
            projects[project] = { name: project };

        return projects[project];
    }

    function genProjectsStateFor(pname, s) {
        var o = { projects: {} };
        o.projects[pname] = s;
        return o
    }

    function updatePanelState(d, s) {
        if (Editor.currentProject && d.panel && !d.panel.__needRemoveOnClose) {
            StateWithKitten.apply(genProjectsStateFor(Editor.currentProject.name, { panels: set({}, d.panel.name, s) }));
        }
    }

    return {
        state: {},

        layouts: [],

        layoutState(name) {
            var s = StateWithKitten.currentProjectState();
            if (!s) return;
            if (!s.layouts) s.layouts = {};
            if (!s.layouts[name]) s.layouts[name] = { name: name };
            return s.layouts[name];
        },

        clearLayoutState(name) {
            var s = StateWithKitten.currentProjectState();
            if (!s) return;
            if (s.layouts) {
                delete s.layouts[name];
            }
        },


        currentProjectState() {
            if (Editor.currentProject) {
                return StateWithKitten.activateProject(Editor.currentProject.name);
            }
        },

        init(cb) {

            var inspectorMode = Editor.opts.inspectorMode;
            var enabled = true;
            if (inspectorMode) {
                if (Editor.opts.enableLayoutStateInInspectorMode) {

                } else {
                    enabled = false;
                }
            }

            if (enabled) {
                BUS.__addEventListener({

                    EDITOR_PREPARED() {

                        if (findGetParameter('hideInterface')) {
                            invokeEventWithKitten('Editor.toggleInterface');
                        }

                        if (findGetParameter('disableSelect')) {
                            invokeEventWithKitten('Editor.disableSelect');
                        }

                        if (!Editor.opts.enableLayoutStateInInspectorMode) {
                            var p = findGetParameter('project');
                            if (p) {
                                invokeEventWithKitten('Project.open', p);
                                return;
                            }

                            var projects = getProjects();
                            for (var i in projects) {
                                if (projects[i].active) {
                                    invokeEventWithKitten('Project.open', i);
                                    break;
                                }
                            }
                        }
                    },

                    PROJECT_OPENED(t, p) {

                        if (StateWithKitten.disableOpenActiveLayouts)
                            return;

                        var projects = getProjects();
                        for (var i in projects) { projects[i].active = 0; }
                        var s = StateWithKitten.currentProjectState();

                        var changed = !s.active;

                        s.active = 1;

                        var l = findGetParameter('layout');

                        var layouts = options.__layoutOpenFilter ? options.__layoutOpenFilter(s.layouts) : s.layouts;

                        for (var i in layouts) {
                            if (l && i == l) {
                                $each(layouts, function (ll) { ll.active = 0; });
                                layouts[i].opened = layouts[i].active = 1;
                                l = 0;
                            }
                        }

                        looperPost(() => {

                            activateProjectOptions();

                            $each(layouts, l => {
                                if (l.opened) {
                                    if (options.__layoutMask) {
                                        if (l.name && l.name.match(options.__layoutMask))
                                            invokeEventWithKitten('Layout.open', l);
                                    } else {
                                        invokeEventWithKitten('Layout.open', l);
                                    }
                                }
                            });

                            if (l) {
                                var doit = options.__layoutMask ? l.match(options.__layoutMask) : 1;
                                if (doit) {
                                    l = { name: l, opened: 1, active: 1, path: options.__baseLayoutsFolder + l + '.json' };
                                    invokeEventWithKitten('Layout.open', l);
                                }
                            }

                            deactivateProjectOptions();

                            if (changed) {
                                StateWithKitten.save();
                            }

                        });

                        PanelsWithKitten.usePanelsState(s.panels);



                    },

                    PROJECT_CLOSED() {

                        for (var i in StateWithKitten.state.projects)
                            StateWithKitten.state.projects[i].active = 0;
                        StateWithKitten.save();
                    },

                    LAYOUT_CLOSED(t, l) {
                        removeFromArray(l, StateWithKitten.layouts);
                        mergeObj(StateWithKitten.layoutState(l.opts.name), { opened: 0, active: 0 });
                        StateWithKitten.save();
                    },

                    LAYOUT_DEACTIVATED(t, l) {
                        mergeObj(StateWithKitten.layoutState(l.opts.name), { active: 0 });
                    },

                    LAYOUT_NAME_CHANGED(t, opts) {
                        var s = StateWithKitten.currentProjectState();
                        for (var i in s.layouts)
                            s.layouts[i].active = 0;
                        StateWithKitten.clearLayoutState(opts.o);
                        mergeObj(StateWithKitten.layoutState(opts.l.opts.name), {
                            opened: 1, active: 1, name: opts.l.opts.name, path: opts.l.opts.path
                        });

                        StateWithKitten.save();
                    },

                    LAYOUT_PREPARED(t, l) {
                        removeFromArray(l, StateWithKitten.layouts);
                        StateWithKitten.layouts.push(l);
                    },

                    LAYOUT_ACTIVATED(t, l) {
                        var s = StateWithKitten.currentProjectState();
                        if (!s) return;

                        for (var i in s.layouts) s.layouts[i].active = 0;

                        mergeObj(StateWithKitten.layoutState(l.opts.name), {
                            opened: 1,
                            active: 1,
                            name: l.opts.name,
                            path: l.opts.path
                        });

                        StateWithKitten.save();
                    },

                    LAYOUT_SAVED(t, l) {
                        l.opts.changed = 0;
                        if (StateWithKitten.dontTouchJsons) {
                            mergeObj(StateWithKitten.layoutState(l.opts.name), { changed: 0 });
                        } else {
                            mergeObj(StateWithKitten.layoutState(l.opts.name), { changed: 0, json: 0 });
                        }
                        StateWithKitten.save();
                    },

                    __OBJECT_CHANGED() {
                        var l = Editor.currentLayout;
                        if (l) {
                            l.opts.changed = 1;
                            if (StateWithKitten.dontTouchJsons) {
                                mergeObj(StateWithKitten.layoutState(l.opts.name), { changed: 1 });
                            } else {
                                mergeObj(StateWithKitten.layoutState(l.opts.name), { changed: 1, json: 0 });
                            }
                        }
                    },

                    __ON_VISIBILITY_CHANGED(t, visible) {

                        if (StateWithKitten.disableSavingChangedLayouts)
                            return;

                        if (!visible) {

                            var changed;
                            var s = StateWithKitten.currentProjectState() || {};

                            for (var i in s.layouts) {
                                var ls = s.layouts[i];
                                if (ls.changed && (StateWithKitten.dontTouchJsons || !ls.json)) {
                                    for (var j in StateWithKitten.layouts) {
                                        var layout = StateWithKitten.layouts[j];

                                        if (layout.opts.name == i) {
                                            changed = 1;

                                            activateProjectOptions();
                                            if (StateWithKitten.getLayoutContent) {
                                                ls.json = StateWithKitten.getLayoutContent(layout);
                                            } else {
                                                ls.json = [];
                                                layout.layoutView.__eachChild(function (c) {
                                                    ls.json.push(c.__toJson());
                                                });
                                            }
                                            deactivateProjectOptions();
                                        }
                                    }
                                }
                            }

                            if (changed) {
                                StateWithKitten.save();
                            }

                        }
                    },

                    PANEL_TOGGLED(t, d) { updatePanelState(d, { __visible: d.panel.__visible }); },

                    PANEL_CLOSED(t, d) { updatePanelState(d, { __visible: 0 }); },

                    PANEL_SHOWED(t, d) { updatePanelState(d, { __visible: 1 }); },

                });
            }

            try {
                this.state = JSON.parse(localStorage.getItem('eeditorState')) || {};

                BUS.__post('STATE_LOADED');

            }
            catch (err) { this.state = {} }
            cb();

        },

        save() {
            try {
                localStorage.setItem('eeditorState', JSON.stringify(this.state));
            } catch (err) { }
        },

        apply(obj) {
            mergeObjectDeep(this.state, obj);
            this.save();
        },

        applyToLayout(o, l) {
            l = l || Editor.currentLayout;
            if (l && isObject(o)) {
                o.changed = 1;
                l.opts.changed = 1;
                mergeObj(StateWithKitten.layoutState(l.opts.name), o);
            }
        },

        activateProject(pname) {
            var projects = getProjects();

            for (var i in projects)
                projects[i].active = 0;

            projectState(pname).active = 1;
            return projectState(pname);
        },

        reset() {
            this.state = {};
            this.save();
            reload();
        }
    }

})();
