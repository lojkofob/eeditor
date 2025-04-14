
function offsetChanger(dx, dy, dz) {

    return function (node) {
        var ofs = node.__offset.__clone(),
            v = new Vector3(dx, dy, 0),
            mw = node.__parent.__matrixWorld.__getInverseMatrix().__scale(new Vector3(1, -1, 1));

        mw.e[12] = mw.e[13] = 0;
        v.__applyMatrix4(mw);

        ofs.x += v.x;
        ofs.y -= v.y;
        ofs.z += dz || 0;
        return { __ofs: ofs };

    }
}

var prevefinedPreviousValue, usePrevefinedPreviousValue;

var __clipboard = '';
var __emitterClipboard = '';
var __curveClipboard = '';
var __historyEventsEnabled = 1;

ObjectDefineProperties(window, {
    historyEventsEnabled: {
        set(v) { __historyEventsEnabled = v; },
        get() { return __historyEventsEnabled }
    }
});


function objectChanged(changes, params) {

    if (changes && changes.length) {
        params = params || {};
        var tmph = historyEventsEnabled;
        if (params.withHistory !== undefined) {
            historyEventsEnabled = params.withHistory
        } else {
            historyEventsEnabled = 1;
        }

        if (params.noBusPost)
            return;

        $each(changes, change => {
            if (params.withHistoryStack)
                change.stack = 1;
            if (change.type) {
                BUS.__post(__OBJECT_CHANGED + '_' + change.type, change);
            }
        });


        BUS.__post(__OBJECT_CHANGED, changes);

        historyEventsEnabled = tmph;

    }
}

function getPanelFromPanelEvent(dat) {
    if (dat) {
        var p = dat.panel;
        if (!p && dat.caller) {
            var but = dat.caller;
            p = but.__traverseParents(function (n) {
                return n.hasBehaviour('panel') || (n.__class && n.__class.indexOf('sub-panel') >= 0) ? n : 0
            })
        }
        return p;
    }

}

function invokeEventWithKitten() {
    return EditorEventsWithKitten.invokeEvent.apply(EditorEventsWithKitten, arguments);
}

function invokeOperationWithKitten() {
    return EditorEventsWithKitten.invokeOperation.apply(EditorEventsWithKitten, arguments);
}

var EditorEventsWithKitten = {

    keysDown: {},

    tapCatchers: new UpdatableProto(),

    invokeEvent: function (e, data, params, returnChanges) {
        var ee = isFunction(e) ? e : EditorEventsWithKitten[e].bind(EditorEventsWithKitten);
        if (ee) {
            params = params || {};
            var changes = ee(data, params);
            if (changes) {
                objectChanged(changes, params);
            }
            BUS.__post('EVENT_INVOKED', e, changes);
            return returnChanges ? changes : 1;
        }
    },

    operations: {

        'middle.wheel': function (d) {
            d = (d.d || 0);
            if (isShiftPressed) {
                invokeEventWithKitten('Camera.move', { dx: d * 20 });
            }
            else
                if (isCtrlPressed) {
                    invokeEventWithKitten('Camera.move', { dy: -d * 20 });
                }
                else {
                    invokeEventWithKitten('Camera.zoom', { d: sign(d) });
                }
        },

        'middle.drag': function (d) {
            invokeEventWithKitten('Camera.move', d);
        }

    },

    invokeOperation: function (op, params) {

        if (EditorEventsWithKitten.operations[op]) {
            EditorEventsWithKitten.operations[op](params || 0);
        }

    },




    'Project.close': function () {

        if (Editor.currentLayout) {
            StateWithKitten.save();
            Editor.currentLayout.deactivateOptions();
        }

        BUS.__post('PROJECT_CLOSED');

        deactivateProjectOptions();
        optionsStack = [];
        options.__reset();
        setEditorOptions();
        Editor.currentProject = null;
        Editor.currentLayout = null;
        BUS.__post('NO_PROJECT');
    },

    'Project.settings': function () {

        invokeEventWithKitten('ProjectSettings.show');

    },

    'Project.publish': function () {



    },

    'Project.create': function (d) {

        if (!isString(d)) {
            AskerWithKitten.ask({
                caption: 'Enter project name',
                ok: function (r) { invokeEventWithKitten('Project.create', r); }
            })
        } else {
            serverCommand({
                command: 'projectCreate',
                project: d
            }, function (j) {
                invokeEventWithKitten('Project.open', d);
            });
        }
    },

    'Project.open': function (pname) {

        if (pname) {
            BUS.__post('NO_PROJECT');

            if (isString(pname)) {

                if (Editor.currentProject)
                    invokeEventWithKitten('Project.close');

                Editor.currentProject = new ProjectWithKitten(pname, function () {
                    BUS.__post('PROJECT_OPENED', Editor.currentProject);
                });
            }

        }

    },

    'Project.save': function () {



    },

    'Project.sync': function () {

        serverCommand({ command: 'sync' }, function (r) {
            consoleLog(r);
        });

    },

    'Project.options': function () {



    },

    'Project.scripts': function () {



    },

    'Project.backups': function () {



    },

    'Files.update': function () {

        updateFiles();

    },


    'Edit.addNoSelect': function () {
        invokeEventWithKitten('Edit.add', 'noselect');
    },

    'Edit.add': function (d, params) {

        var changes = [];
        params = params || 0;

        eachSelected(

            selectedNode => {

                let andSelect = d != 'noselect';
                if (andSelect) {
                    unselectNode(selectedNode, changes);
                }

                var n = selectedNode.__addChildBox(params.__node || params.__json || {
                    __color: randomInt(0, 0xffffff),
                    __size: [100, 100]
                });

                changes.push({ type: '+', node: n, noselect: !andSelect });
                if (andSelect) {
                    n.__select();
                }

                selectedNode.update(1);
                selectedNode.__dirty = 3;

            }
            , 1
        );

        return changes;

    },


    'Edit.remove': function () {
        var changes = [];
        var p;
        if (Editor.currentLayout) {
            eachSelected(function (selectedNode) {
                if (!selectedNode.__someParentSelected()) {
                    changes.push({ type: '-', node: selectedNode, parent: selectedNode.__parent, index: selectedNode.__realIndex });
                    if (selectedNode.__parent) {
                        p = selectedNode.__parent;
                    }
                    selectedNode.__unselect();
                    p.__removeChild(selectedNode);
                }
            });


            if (p && p != Editor.currentLayout.layoutView && p.treeEntry && p.__parent)
                p.__select();

            Editor.currentLayout.layoutView.update(1);
            Editor.currentLayout.layoutView.update(1);
        }
        return changes;
    },

    'Edit.copy': function () {

        __clipboard = '[';
        var z = '';
        eachSelected(function (selectedNode) {

            if (!selectedNode.__someParentSelected()) {
                activateProjectOptions();
                var o = selectedNode.__toJson();
                deactivateProjectOptions();
                o.nnnnflag = 12;
                __clipboard += z + JSON.stringify(o, null, 2);
                z = ',';
            }
        });
        __clipboard += ']';

        copyTextToClipboard(__clipboard);

        // todo: return focus back ?
        //         var t = $('#clipboardTextarea');
        //         t.val( __clipboard );
        //     consoleLog( __clipboard );
        //         t[0].setSelectionRange(0, __clipboard.length);
        //         document.execCommand('copy');
    },

    'Edit.pasteNoSelect': function (d) {
        invokeEventWithKitten('Edit.paste', 'noselect');
    },

    'Edit.paste': function (d) {
       
        if (!Editor.currentLayout) return;
       
        function process(clipboardData) {
            var layout = Editor.currentLayout.layoutView;
            activateProjectOptions();

            var cj;

            __clipboard = clipboardData;

            if (isString(__clipboard)) {

                cj = parseJson(__clipboard, err => {});

            } else if (isObject(__clipboard)) {
                
                switch(__clipboard.type){
                    case "image": {
                        var name = __clipboard.full_name + '?';
                        cj = [{ __img: name, nnnnflag: 12 }];
                    }
                }

            } 
            
            if (isArray(cj) && isObject(cj[0])) { 

                let andSelect = d != 'noselect';
                if (andSelect) {
                    layout.__traverse(c => { c.nnnnflag = 1; }, 1);
                }

                var nodes = [];
                var addedNodes = [];

                eachSelected(selectedNode => {

                    nodes.push(selectedNode);

                    for (var i in cj) {
                        addedNodes.push(selectedNode.__addChildBox(cj[i]));
                    }

                    if (andSelect) {
                        selectedNode.__unselect();
                    }

                }, 1);

                if (andSelect) {
                    layout.__traverse(c => {
                        if (c.selected) c.__unselect();
                        if (c.nnnnflag == 12) { c.__select(); }
                        delete c.nnnnflag;
                    }, 1);
                }

                var changes = [{ type: 'paste', clipboard: __clipboard, nodes: nodes, addedNodes: addedNodes }];

                Editor.currentLayout.layoutView.update(1);
                Editor.currentLayout.layoutView.__dirty = 3;

                deactivateProjectOptions();
                return changes;

            }
        }
        
        readDataFromClipboard( clipboardData => {
            process(clipboardData || __clipboard)
        }, e => {
            console.debug("Clipboard error while paste ", e)
            process(__clipboard)
        });


        //             $('#clipboardTextarea').blur();

        //         }, 1);
    },

    'Edit.cut': function () {
        invokeEventWithKitten('Edit.copy');
        invokeEventWithKitten('Edit.remove');
    },

    'Edit.clone': function () {
        invokeEventWithKitten('Edit.copy');
        var selnode;
        forOneSelected(n => { selnode = n }, n => { selnode = n[0] });
        if (selnode) {
            selnode = selnode.__parent;
        }
        if (selnode) {
            eachSelected(function (sn) { sn.__unselect(); });
            selnode.__select();
            invokeEventWithKitten('Edit.paste');
        }
    },


    'Edit.editTextDirectly': function () {

    },

    'set': function (d, params) {
        window.currentHistoryParams = params;
        var changes = params.changes || [];

        function changeObject(obj) {

            var ddd = isFunction(d) ? d(obj) : d;

            for (var i in ddd) {

                if (isFunction(ddd[i])) ddd[i] = ddd[i](obj, i);

                var prev = usePrevefinedPreviousValue ? prevefinedPreviousValue[i] : getPropVal(obj, i);
                if (prev) {

                    if (isFunction(prev.__clone)) {
                        prev = prev.__clone();
                    }
                    else {
                        prev = deepclone(prev.__p ? prev.__p : prev);
                    }
                }

                changes.push({
                    type: 'set',
                    node: obj,
                    prop: i,
                    prev: prev,
                    next: ddd[i]
                });

                //                 consoleLog(prev, '\n', ddd[i], '\n', params.withHistory, params.withHistoryStack);

                setPropVal(obj, i, ddd[i], params);

            }

        }


        if (params.object) {
            changeObject(params.object)
        } else {
            if (Editor.currentLayout) {
                Editor.currentLayout.activateOptions();
            }

            eachSelected(changeObject, 0, params.eachSelectedParent);

            if (Editor.currentLayout) {
                Editor.currentLayout.deactivateOptions();
            }

        }


        return changes;

    },


    'Edit.moveNodeUp': function () {
        invokeEventWithKitten('set', offsetChanger(0, -numericInputStepMult(), 0), { withHistoryStack: 1, eachSelectedParent: 1 });
    },
    'Edit.moveNodeDown': function () {
        invokeEventWithKitten('set', offsetChanger(0, numericInputStepMult(), 0), { withHistoryStack: 1, eachSelectedParent: 1 });
    },
    'Edit.moveNodeLeft': function () {
        invokeEventWithKitten('set', offsetChanger(-numericInputStepMult(), 0), { withHistoryStack: 1, eachSelectedParent: 1 });
    },
    'Edit.moveNodeRight': function () {
        invokeEventWithKitten('set', offsetChanger(numericInputStepMult(), 0), { withHistoryStack: 1, eachSelectedParent: 1 });
    },

    'Edit.undo': function () {
        BUS.__post(__UNDO);
    },

    'Edit.redo': function () {
        BUS.__post(__REDO);
    },

    'Edit.selectAllChildrens': function () {

        eachSelected(function (n) {
            n.__unselect();
            for (var i in n.__childs) {
                if (isVisibleInHierarchy(n.__childs[i]))
                    if (n.__childs[i].__select)
                        n.__childs[i].__select();
            }
        }, 1);

    },

    'Edit.selectAll': function () {
        eachSelected(function (n) {
            for (var i in n.__childs) {
                if (isVisibleInHierarchy(n.__childs[i]))
                    if (n.__childs[i].__select)
                        n.__childs[i].__select();
            }
        }, 1);
    },

    'Edit.removeEmitter': function (d) {
        var selectedNode = forOneSelected();
        if (!selectedNode) return;
        if (d) {

            var emitter = d.emitter;

            if (d.caller) {
                emitter = d.caller.__traverseParents(function (n) { return n.emitter })
            }

            if (emitter) {
                emitter.__removeFromParent();
                return [{ type: 'emitter_remove', node: selectedNode, emitter: emitter }]
            }
        }

    },

    'Edit.copyEmitter': function (d) {
        if (d) {
            var emitter = d.emitter;

            if (d.caller) {
                emitter = d.caller.__traverseParents(function (n) { return n.emitter })
            }

            if (emitter) {
                this.emitterClipboard = emitter.__toJson();
            }
        }

    },

    'Edit.addEmitter': function (d) {

        var emitter = d && d.emitter ? d.emitter : {
            enabled: 1,
            texture: 'rbord_20_w',
            duration: 1,
            lifespan: [2, 1],
            power: 20,
            blending: 1,
            loop: 1,
            rate: 100,
            c: [
                {
                    t: 'd',
                    direction: [0, 180],
                    velocity: 50,
                    size: 32
                },
                {
                    t: 'c',
                    color_factor: { r: 1, g: 1, b: 1, a: [[[0, 1], [1, 0]]] }
                }]
        };

        var changes = [];
        eachSelected(function (selectedNode) {
            if (!selectedNode.__effect) selectedNode.__effect = {};
            var e = selectedNode.__effect.__push(emitter);
            changes.push({ type: 'emitter_add', node: selectedNode, emitter: e });
        });

        return changes;
    },

    'Edit.pasteEmitter': function () {
        if (this.emitterClipboard) {
            invokeEventWithKitten('Edit.addEmitter', { emitter: this.emitterClipboard });
        }
    },

    'Edit.removeEmitterComponent': function (d) {
        if (!d) return;
        var emitter = d.emitter;
        if (d.caller) emitter = d.caller.__traverseParents(function (n) { return n.emitter })

        var component = d.component;
        if (d.caller) component = d.caller.__traverseParents(function (n) { return n.component })

        if (emitter && component)
            emitter.__removeComponent(component);


    },

    'Edit.addEmitterComponent': function (d) {
        if (!d) return;
        var emitter = d.emitter;
        if (d.caller) emitter = d.caller.__traverseParents(function (n) { return n.emitter })

        var list = [];
        for (var i in ParticlesComponentsTypesMap) {
            list.push(ParticlesComponentsTypesMap[i].replace('EmitterComponent', ''));
        }

        AskerWithKitten.ask({
            caption: 'select component',
            list: list,
            noinput: 1,
            ok: function (d) {
                var t = '';
                for (var i in ParticlesComponentsTypesMap) {
                    if (ParticlesComponentsTypesMap[i] == d + 'EmitterComponent') {
                        t = i; break;
                    }
                }
                var newComponent = EffectComponentsFactory.__createByType(t);
                emitter.__addComponent(newComponent);
            }

        });
    },


    'Edit.nodeDown': function () {
        var changes = [];
        eachSelected(function (n) {

            var index = n.__realIndex;
            n.__realIndex++;
            var next = n.__realIndex;

            if (next != index)
                changes.push({ type: 'set', node: n, prop: '__realIndex', prev: index, next: next });

        });

        return changes;
    },

    'Edit.nodeUp': function () {
        var changes = [];
        eachSelected(function (n) {

            var index = n.__realIndex;
            n.__realIndex--;
            var next = n.__realIndex;

            if (next != index)
                changes.push({ type: 'set', node: n, prop: '__realIndex', prev: index, next: next });

        });

        return changes;
    },

    'Edit.clearOffset': function () {
        invokeEventWithKitten('set', { __ofs: null });
    },


    'Edit.clearColor': function () {
        invokeEventWithKitten('set', { __color: null });
    },

    'Edit.clearText': function () {
        invokeEventWithKitten('set', { __text: null });
    },

    'Edit.clearEffect': function () {
        invokeEventWithKitten('set', { __effect: null });
    },


    'Settings.show': function () {

        invokeEventWithKitten('Editor.showPanel', { panel: Editor.ui.middle.settings });

    }

};

function removeEditorEvents(a, p) {
    var prefix = p ? a + '.' : '';
    if (!p) {
        if (isString(a)) {
            var toDelete = [];
            $each($map(EditorEventsWithKitten, (f, i) => i.indexOf(a) == 0), (f, i) => f ? toDelete.push(i) : 0);
            a = toDelete;
        } else
            if (stringifyTypeOfObject(a) == "RegExp") {
                var toDelete = [];
                $each($map(EditorEventsWithKitten, (f, i) => i.match(a)), (f, i) => f ? toDelete.push(i) : 0);
                a = toDelete;
            }
    }
    $each(p || a, function (i) {
        delete EditorEventsWithKitten[prefix + i];
    });

    return removeEditorEvents;
}

function addEditorEvents(a, p) {
    var prefix = p ? a + '.' : '';
    $each(p || a, function (b, i) {
        EditorEventsWithKitten[prefix + i] = b;
    });
    return addEditorEvents;
}



addEditorEvents('Editor', {

    showFAQ() {

        Editor.ui.__alias('FAQ').__visible = 1;
        BUS.__post('WINDOW_SHOWED');

    },

    closeFAQ() {

        Editor.ui.__alias('FAQ').__visible = 0;

    },

    screenshotSelected(dat) {
        showImage(forOneSelected());
    },

    setTheme(dat) {

        var theme = dat ? dat.caller ? dat.caller.__textString : dat : 0;

        if (isString(theme)) {

            StateWithKitten.apply({
                editor: { uiTheme: theme }
            });
            reload();

        }

    },

    setUILayout(dat) {

        var layout = dat ? dat.caller ? dat.caller.__textString : dat : 0;

        if (isString(layout)) {

            StateWithKitten.apply({
                editor: { uiLayout: layout }
            });
            reload();

        }

    },

    nextInput() {

        EditFieldsWithKitten.nextInput();

    },

    showPanel(dat) {
        dat = dat || 0;
        var p = getPanelFromPanelEvent(dat);
        if (!p.__visible || dat.force) {
            p.__visible = 1;

            if (dat.scroll) {
                _setTimeout(function () { p.__scrollIntoView(0.2); }, 0.1);
            }

            BUS.__post('PANEL_SHOWED', { panel: p });
        }
    },

    closePanel(dat) {
        var p = getPanelFromPanelEvent(dat);
        if (p.__visible || (dat && dat.force)) {
            p.__visible = 0;
            BUS.__post('PANEL_CLOSED', { panel: p });
        }

    },

    togglePanel(dat) {

        var p = getPanelFromPanelEvent(dat);

        var panel = dat.__force ? p : p.panel || p.__alias('panel');

        panel.__visible = !panel.__visible;

        BUS.__post('PANEL_TOGGLED', { panel: p });

    },

    NavCloseTab(d) {
        if (d && d.caller) {
            FilePanelWithKitten.closeTab.call(d.caller)
        }
    },

    showInterface() {
        if (Editor.ui.__visible) return;
        return invokeEventWithKitten('Editor.toggleInterface');
    },

    hideInterface() {
        if (!Editor.ui.__visible) return;
        return invokeEventWithKitten('Editor.toggleInterface');
    },

    toggleInterface() {
        if (Editor.opts.inspectorMode && Editor.currentLayout) {
            if (Editor.currentLayout.layoutView == Editor.scene) {
                if (Editor.ui.__visible) {
                    Editor.currentLayout.deactivate();
                } else {
                    Editor.currentLayout.activate();
                }
            }
        }

        Editor.ui.__visible = !Editor.ui.__visible;
        BUS.__post('EDITOR_UI_TOGGLED');
        onWindowResize(1);
    },


    disableSelect() {
        Editor.disableSelect = 1;
    },

    enableSelect() {
        Editor.disableSelect = 0;
    },

    saveEffect() {
        var sn = forOneSelected();
        if (!sn) return;
        if (sn.__effect) {
            AskerWithKitten.ask({
                caption: 'Effect name',
                value: sn.__effect.name,
                ok: function (r) {
                    if (r) {
                        sn.__effect.name = r;
                        activateProjectOptions();
                        FileManagerWithKitten.saveFile(options.__baseParticlesFolder + r + '.effect.json', sn.__effect.__toJson(), ParticlesFileWorker);
                        deactivateProjectOptions();
                    }
                }
            })
        }
    }
});

function generateNewLayoutName() {
    var name = 'newLayout';
    var i = 1;

    while ($find(StateWithKitten.layouts, l => name == (l.getLayoutNameForTab ? l.getLayoutNameForTab() : l.name))) {
        name = 'newLayout_' + (i++);
    }

    if (LayoutWithKitten.prototype.checkAndPrepareLayoutName) {
        name = LayoutWithKitten.prototype.checkAndPrepareLayoutName(name);
    }

    return name;
}

addEditorEvents('Layout', {

    create(data) {

        Editor.openLayout(
            mergeObj(
                mergeObj({
                    name: generateNewLayoutName(),
                    json: {
                        __color: randomInt(0, 0xffffff),
                        __size: [1, 1, 1, 1]
                    },
                    __markedAsNew: 1,
                }, getDeepFieldFromObject(Editor, 'currentProject', 'options', '__newLayoutOpts')
                ), data)
        );
    },

    open(data) {

        if (data && (isString(data) || data.json || data.name || data.path)) {
            Editor.openLayout(data);
        } else {

            activateProjectOptions();

            var folder = options.__baseLayoutsFolder;

            var files = getDeepFieldFromObject.apply(this, [Editor.currentProject.files].concat(folder.split('/')).filter(function (a) { return a }))

            if (folder && files) {
                AskerWithKitten.ask({
                    caption: 'Open layout',
                    list: $filter(
                        $map(files, function (a) {
                            if (isString(a) && a.indexOf('.json') > 0) {
                                return a.replace('.json', '')
                            }
                        }), function (a) {
                            return a
                        }),
                    search: 1,
                    ok: function (d) {
                        invokeEventWithKitten('Layout.open', folder + d + '.json');
                    }

                });
            }

            deactivateProjectOptions();
        }

    },

    close(l) {

        if (!(l instanceof LayoutWithKitten))
            l = Editor.currentLayout;
        if (!l) return;

        var cb = function () {
            BUS.__post('LAYOUT_CLOSED', l);

            if (l.__active) {
                l.deactivate();
            }

            l.close();

            if (Editor.currentLayout == l) {
                Editor.currentLayout = 0;
            }
        }

        if (l.opts.changed && !l.opts.disableSave) {
            AskerWithKitten.ask({
                caption: 'Close without saving?',
                noinput: 1,
                ok: cb
            });
        }
        else cb();

    },

    saveAs() {
        EditorEventsWithKitten.forceAskName = 1;
        invokeEventWithKitten('Layout.save');
    },

    save(name) {

        var cl = Editor.currentLayout;
        if (cl) {

            if (cl.opts.disableSave) {
                AskerWithKitten.ask({
                    caption: 'this layout can not be saved ((',
                    noinput: 1
                });
                return;
            }

            if (!isString(name)) name = cl.opts.name || cl.name;

            if (cl.__markedAsNew || name.match(/newLayout(_\d)?/) || isShiftPressed || EditorEventsWithKitten.forceAskName === 1) {
                AskerWithKitten.ask({
                    caption: 'Enter layout name',
                    ok: function (a) {

                        if (!a) {
                            AskerWithKitten.ask({
                                caption: 'No name entered. Please, try again',
                                noinput: 1,
                                ok() {
                                    looperPost(function () { invokeEventWithKitten("Layout.save"); });
                                }
                            });
                            return 1;
                        }

                        if (cl.checkAndPrepareLayoutName) {
                            a = cl.checkAndPrepareLayoutName(a);
                            if (!a) {
                                AskerWithKitten.ask({
                                    caption: 'Not valid name for layout. Please, try again',
                                    noinput: 1,
                                    ok() {
                                        looperPost(function () { invokeEventWithKitten("Layout.save"); });
                                    }
                                });
                                return 1;
                            }
                        }

                        EditorEventsWithKitten.forceAskName = 2;
                        cl.__markedAsNew = 0;

                        if (Editor.currentProject.options.layoutSaveHandler) {
                            a = Editor.currentProject.options.layoutSaveHandler(cl, a);
                        }

                        invokeEventWithKitten('Layout.save', a);
                    },
                    cancel: function () {
                        EditorEventsWithKitten.publish = 0;
                        EditorEventsWithKitten.download = 0;
                    }

                });
                EditorEventsWithKitten.forceAskName = 0;
                return;
            }


            if (isString(name)) {
                activateProjectOptions();
                if (EditorEventsWithKitten.forceAskName === 2) {
                    var o = cl.opts.name;

                    if (cl.checkAndPrepareLayoutName) {
                        name = cl.checkAndPrepareLayoutName(name);
                    }

                    cl.opts.name = name;
                    //TODO: bad path! use cl.opts.path

                    if (options.layoutSaveHandler && cl.opts.path) {

                    } else {
                        cl.opts.path = options.__baseLayoutsFolder + name + '.json';
                    }
                    EditorEventsWithKitten.forceAskName = 0;

                    BUS.__post('LAYOUT_NAME_CHANGED', { l: cl, o: o });
                }

                var path = cl.opts.path || (options.__baseLayoutsFolder + name + '.json');

                if (EditorEventsWithKitten.download) {
                    FileManagerWithKitten.downloadFile(path, cl);
                    EditorEventsWithKitten.download = 0;
                } else
                    if (EditorEventsWithKitten.publish) {
                        FileManagerWithKitten.publishFile(path, cl);
                        EditorEventsWithKitten.publish = 0;
                        cl.__markedAsNew = 0;
                    } else {

                        FileManagerWithKitten.saveFile(path, cl, LayoutFileWorker);
                        cl.__markedAsNew = 0;

                    }
                deactivateProjectOptions();
            }

        }

    },

    publish() {
        EditorEventsWithKitten.publish = 1;
        invokeEventWithKitten('Layout.save');
    },

    download() {
        EditorEventsWithKitten.download = 1;
        invokeEventWithKitten('Layout.save');
    },

    'export': function () {
        EditorEventsWithKitten.download = 1;
        invokeEventWithKitten('Layout.export');
    },

    'import': function () {
        // ???
    },

    options() {

    },

    scripts() {

    },

    backups() {
        let cl = Editor.currentLayout;
        if (cl) {

            activateProjectOptions();

            let regexp = (basename((Editor.currentLayout.opts || 0).path || '') || (cl.name + '.json'));
            regexp = '_' + escapeRegExpWithKitten(regexp) + '$';

            let re = new RegExp(regexp);

            serverCommand({
                command: 'backupsList',
                path: options.__baseLayoutsFolder,
                regexp: regexp
            }, result => AskerWithKitten.ask({
                caption: 'Choose backup for layout ' + cl.name,
                list: result.list,
                generator: n => { return { value: n, text: n.replace(re, '') } },
                ok: function (r) {
                    Editor.openLayout({
                        path: r,
                        realPath: result.path + '/' + r,
                        isBackup: 1
                    });
                },
                search: 1
            })
            );
            deactivateProjectOptions();
        }
    }
});



var keyboardMap = {

    'f1': 'Editor.showFAQ',
    'tab': 'Editor.nextInput',

    'ctrl+s': 'Layout.save',
    'alt+s': 'Layout.download',
    'alt+e': 'Layout.export',
    'alt+i': 'Layout.import',
    'ctrl+shift+s': 'Layout.saveAs',

    'ctrl+k': 'Layout.publish',
    'ctrl+shift+l': 'Project.sync',

    'ctrl+o': 'Layout.open',
    'ctrl+p': 'Layout.close',
    'ctrl+shift+p': 'Project.close',

    'ctrl+m': 'Layout.create',
    'ctrl+x': 'Edit.cut',
    'ctrl+c': 'Edit.copy',
    'ctrl+shift+c': 'Edit.clone',
    'ctrl+v': 'Edit.paste',
    'ctrl+shift+v': 'Edit.pasteNoSelect',
    'ctrl+z': 'Edit.undo',
    'ctrl+y': 'Edit.redo',
    'ctrl+shift+z': 'Edit.redo',

    'ctrl+a': 'Edit.selectAllChildrens',

    'ctrl+shift+a': 'Edit.selectAll',

    '+': 'Edit.add',
    '-': 'Edit.remove',
    'insert': 'Edit.add',
    'delete': 'Edit.remove',

    'shift++': 'Edit.addNoSelect',
    'shift+insert': 'Edit.addNoSelect',

    'alt+arrowup': 'Edit.nodeUp',
    'alt+arrowdown': 'Edit.nodeDown',

    'arrowup': 'Edit.moveNodeUp',
    'arrowdown': 'Edit.moveNodeDown',
    'arrowleft': 'Edit.moveNodeLeft',
    'arrowright': 'Edit.moveNodeRight',

    'ctrl+shift+b': 'Edit.clearColor',
    'ctrl+shift+e': 'Edit.clearEffect',
    'ctrl+shift+f': 'Edit.clearText',

    'shift+i': 'Editor.toggleInterface',

    'shift+d': 'Editor.togglePanel.PanelWithPanels',
    'shift+b': 'Editor.togglePanel.backgroundPanel',
    'shift+t': 'Editor.togglePanel.textPanel',
    'shift+p': 'Editor.togglePanel.particlesPanel',
    'shift+m': 'Editor.togglePanel.miscPanel',
    'shift+s': 'Editor.togglePanel.shaderParamsPanel',
    'shift+k': 'Editor.togglePanel.keyHelperPanel',
    'shift+a': 'Editor.togglePanel.AnimationPanel',


    'ctrl+]': 'FilePanelWithKitten.nextTab',
    'ctrl+}': 'FilePanelWithKitten.nextTab',

    'ctrl+{': 'FilePanelWithKitten.prevTab',
    'ctrl+[': 'FilePanelWithKitten.prevTab',

    'ctrl+\'': 'Editor.screenshotSelected',
    'ctrl+\"': 'Editor.screenshotSelected'

};

function addKeyboardMap(p) {
    mergeObj(keyboardMap, p);
}

function eventStringFromKeys(key, ctrl, shift, alt) {

    var eventString = key;
    if (alt) eventString = 'alt+' + eventString;
    if (shift) eventString = 'shift+' + eventString;
    if (ctrl) eventString = 'ctrl+' + eventString;
    return eventString;

}

var keysToStringMap = {
    '188': '<',
    '189': '>',
    '190': '>',
    '32': 'space'
};

gestures.__onKeyUp = function (keyCode, key, ctrl, shift, alt, e) {
    key = keysToStringMap[keyCode] || key;
    EditorEventsWithKitten.keysDown[key] = 0;
    BUS.__post(__ON_KEY_UP, keyCode, key, ctrl, shift, alt, e);
}

var key_processed = 0;
gestures.__onKeyDown = function (keyCode, key, ctrl, shift, alt, e) {
    key = keysToStringMap[keyCode] || key;
    EditorEventsWithKitten.keysDown[key] = 1;
    BUS.__post(__ON_KEY_DOWN, keyCode, key, ctrl, shift, alt, e);

    if (key_processed) {
        key_processed = 0;
        return 1;
    }
}

function processKey(keyCode, key, ctrl, shift, alt, e) {

    var eventString = eventStringFromKeys(key, ctrl, shift, alt);

    var ek = keyboardMap[eventString];
    if (ek) {

        if (isFunction(ek)) {
            ek();
        }
        else if (isString(ek)) {
            invokeEventWithKitten(ek);
        }

    } else {

        if (!(ctrl && processKey(keyCode, key, 0, shift, alt, e)))
            if (!(shift && processKey(keyCode, key, ctrl, 0, alt, e)))
                if (!(alt && processKey(keyCode, key, ctrl, shift, 0, e)))
                    return;

    }

    key_processed = 1;
    return 1;

}

BUS.__addEventListener(__ON_KEY_DOWN, function (t, keyCode, key, ctrl, shift, alt, e) {

    if (EditFieldsWithKitten.focusedInput) {
        switch (key) {
            case 'tab': break;
            case 'escape': EditFieldsWithKitten.focusedInput.unfocus(); key_processed = 1; return;
            default: return;
        }
    }

    processKey(keyCode, key, ctrl, shift, alt, e);

});


function selectNode(node, changes) {
    return selectNodes([node], changes);
}

function selectNodes(nodes, changes) {

    let alreadyHasChanges = changes;
    changes = changes || [];

    if (!isShiftPressed) {
        eachSelected(sn => {
            changes.push({ type: 'unselect', node: sn });
            sn.__unselect();
        });
    }
    if (nodes) {
        $each(nodes, node => {
            if (node) {
                changes.push({ type: 'select', node: node });
                node.__select();
            }
        });
    }

    if (!alreadyHasChanges && changes.length) {
        BUS.__post('HISTORY_EVENT', changes);
    }
    return changes;

}


function unselectNodes(nodes, changes) {

    let alreadyHasChanges = changes;
    changes = changes || [];
    $each(nodes, node => {
        if (node && node.selected) {
            changes.push({ type: 'unselect', node: node });
            node.__unselect();
        }
    });

    if (!alreadyHasChanges && changes.length) {
        BUS.__post('HISTORY_EVENT', changes);
    }
    return changes;
}

function unselectNode(node, changes) {
    if (!node) return changes || [];
    return unselectNodes([node], changes);
}

gestures.__onPointerDown = function () {

    if (EditFieldsWithKitten.focusedInput)
        EditFieldsWithKitten.focusedInput.unfocus();

    BUS.__post('__ON_POINTER_DOWN');



}

gestures.__drag = function (dx, dy) {

    if (Editor.currentLayout && !Editor.disableSelect) {
        if (!QuadSelectorWithKitten.active && Editor.currentLayout.layoutView) {
            //             var hasSelected = Editor.currentLayout.layoutView.__getObjectByProperty('selected', true);
            //             if (!hasSelected){
            looperPost(a => {
                if (!curDraggingObject) {
                    QuadSelectorWithKitten.activate(Editor.currentLayout.layoutView.$(n => isVisibleInHierarchy(n) && n.__selectable), isAltPressed ? 0 : 1);
                }
            });
            return true;
            //             }
        }
    }

}

gestures.__onPointerUp = function () {
    BUS.__post('__ON_POINTER_UP');

    if (QuadSelectorWithKitten.active) {
        if (mouseButtons[0]) {
            QuadSelectorWithKitten.reactivate();
        } else {
            var a = $filter(QuadSelectorWithKitten.nodes, n => n.__isQuadSelected);

            if (isCtrlPressed) {
                unselectNodes(a);
            } else {
                selectNodes(a);
            }

            if (!Editor.disableSelect) {
                Editor.disableSelect = 1
                looperPost(a => Editor.disableSelect = 0);
            }

            QuadSelectorWithKitten.deactivate();
            return true;
        }
    }
}

function __selectChildTraversing(f) {
    let a = [];
    function kk(node) {
        node.__traverseChildsFilter(
            n => {
                if (f(n)) a.push(n)
            },
            //filter for disable childs traversing
            n => isVisibleInHierarchy(n) && n.__selectable
        );
    }
    if (isAltPressed) {
        eachSelected(kk);
    } else {
        kk(Editor.currentLayout.layoutView);
    }

    return a.sort((a, b) => { return a.z == b.z ? b.id - a.id : b.z - a.z })[0];
}


function EditorHitTest(node, pos) {

    var _cam = camera;
    camera = Editor.currentLayout.camera || node.__root.__camera || camera;
    node.__hitTest(pos);
    camera = _cam;
}

gestures.tap = function (pos) {

    pos = pos || mouse;

    BUS.__post(__ON_TAP);

    if (!Editor || !Editor.currentLayout || Editor.disableSelect) return;

    //     consoleLog(EditorEventsWithKitten.tapCatchers.a);
    if (!EditorEventsWithKitten.tapCatchers.__update()) {
        return 1;
    }



    //     if (EditFieldsWithKitten.focusedInput)
    //         EditFieldsWithKitten.focusedInput.unfocus();

    // 	delete pos.wp;


    var _cam = camera;
    camera = Editor.currentLayout.camera || camera;

    if (EditorEventsWithKitten.debugHitTest) {
        var z = 3;
        var n = Editor.currentLayout.layoutView.$('debugHitTest');

        if (!__window.ddd) {
            __window.ddd = new ENode({ __z: -2000, __y: -20, __notSelectable: 1, __disabled: 1, __validToSave: 0 });
            Editor.currentLayout.layoutView.add(__window.ddd);
        }

        if (n && n.length) {
            for (var x = -80 * z; x < 80 * z; x += 10)
                for (var y = -80 * z; y < 80 * z; y += 10) {
                    var ppos = new Vector2(pos.x + x, pos.y + y)
                        
                        , screenpos = new Vector2(
                            ppos.x / layoutsResolutionMult / __screenCenter.x - 1,
                            ppos.y / layoutsResolutionMult / __screenCenter.y - 1
                        ).__multiply(__screenCenter)

                        , ddebug = __window.ddd.__addChildBox({
                            __ofs: screenpos.__clone(), __size: { x: 5, y: 5 }, __notSelectable: 1, __disabled: 1, __validToSave: 0,
                            __color: 0x111111, __alpha: 0.4
                        }).__removeAfter(5);

                        ppos.__normalized = tappableObjects.__normalize(ppos);
                    $each(n, n => {
                        if (n.__hitTest(ppos)) {
                            ddebug.__color = 0xffffff;
                            ddebug.__alpha = 0.7;
                        }
                    });

                }
        }
    }

    pos.__normalized = tappableObjects.__normalize(pos);


    if (isCtrlPressed) {
        let node = __selectChildTraversing(n => n.selected && n.__hitTest(pos));
        if (node) {
            unselectNode(node);
            return 1;
        }
    }

    let node = __selectChildTraversing(n => n.__select && !n.selected && n.__hitTest(pos));

    camera = _cam;
    selectNode(node);

    return 1;

}


document.addEventListener("pointerlockchange", function (event) {

    var element = renderer.__domElement;
    pointerLocked = document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element;

});

document.addEventListener("pointerlockerror", function (event) {

    pointerLocked = 0;

});


function togglePointerLock() {

    if (pointerLocked) unlockPointer();
    else lockPointer();
}

function unlockPointer() {
    consoleLog('unlockPointer', pointerLocked);
    if (pointerLocked) document.exitPointerLock();
    pointerLocked = 0;

}

function lockPointer() {
    consoleLog('lockPointer2', pointerLocked);
    var element = renderer.__domElement;

    if (!pointerLocked) {
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        if (element.requestPointerLock) {
            console.log(element.requestPointerLock);
            element.requestPointerLock();
        }
    }
    consoleLog('lockPointer2', pointerLocked);

}

var oldmouseupdate = updateMouse;

updateMouse = function (e) {
    try {
        var tag = e.target.tagName.toLowerCase();
        if (tag == 'input') return 0;
    } catch (err) { }

    return oldmouseupdate.apply(this, arguments);
}

