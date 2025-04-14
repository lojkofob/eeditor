
function EditorWithKitten(opts) {

    this.opts = {};

    this.opts.uiTheme = this.opts.uiTheme || findGetParameter('theme', 'DarkSimple');
    this.opts.uiLayout = this.opts.uiLayout || findGetParameter('ui', 'ui');

    this.uiLayout = this.opts.uiLayout;
    this.uiTheme = this.opts.uiTheme;

    this.options = this.opts.options || {};
    this.opts.options = this.options;

    if (!this.opts.options.__allServerPath) {
        this.opts.options.__allServerPath = '';
    }

}

EditorWithKitten.prototype = {

    constructor: EditorWithKitten,

    setOpts: function (opts) {
        mergeObjectDeep(this.opts, opts);
        return this;
    },

    createView: function () {

        var _this = this;

        if (_this.opts.shaders) {
            _this.resources = [];
            $each(_this.opts.shaders, (shd, k) => {
                setCachedData(options.__baseShadersFolder + k, shd);
            });
        } else {
            _this.resources = [
                [TASKS_SHADERS].concat(_this.opts.shadersList)
            ];
        }

        _this.resources.push([TASKS_ATLAS, 'atlas-1.png?', 'atlas-1.json?']);

        options.__disableAnimation = 1;

        _this.__render = function () {
            $each(Editor.scene.__childs, function (layer) {
                if (layer.render) {
                    layer.render();
                }
                else {
                    renderer.__render(layer, layer.camera || camera);
                }
            });

            if (Editor.__afterFrame) {
                Editor.__afterFrame();
            }

            if (!Editor.opts.inspectorMode) {
                renderer.__finishRender();
            }
        };

        createGame({

            element: document.getElementById('gameDiv'),

            __renderLoop: _this.opts.inspectorMode ? 0 : function () {
                renderer.__setRenderTarget(null);
                renderer.__clear();
                _this.__render();
            },

            onCreate: function () {

                Editor.scene = scene;

                var cb = function () {
                    StateWithKitten.init(function () {

                        mergeObj(_this, StateWithKitten.state.editor);

                        _this.resources.push([TASKS_LAYOUT, _this.uiLayout + '.json']);
                        _this.resources.push([TASKS_CLASS, 'theme_' + _this.uiTheme + '.json']);

                        _this.activateOptions();

                        TASKS_RUN(_this.resources, function () {

                            var dtp = globalConfigsData.__classes["e-__defaultTextProperties"];
                            if (dtp && dtp.__text) {
                                dtp.__text.__text = '';
                                _this.options.__defaultTextProperties = dtp.__text;
                            }

                            _this.activateOptions();

                            BUS.__post('EDITOR_LOADED', _this);

                            _this.ui = new ENode(_this.uiLayout, 1);
                            _this.ui.__validToSave = 0;
                            _this.ui.__size = { x: 1, y: 1, px: 1, py: 1 };
                            _this.ui.__z = -10000;
                            _this.prepareView();
                            _this.ui.__isScene = 1;

                            addToScene(_this.ui);

                            BUS.__addEventListener({
                                PROJECT_CLOSED: function () {
                                    $each(scenes, s =>
                                        s.__removeChildsByFilter(n => n != _this.ui));
                                }
                            });

                            BUS.__post('EDITOR_PREPARED', _this);

                        }, function () {
                            html.__setHtml(html.__getBody(), '<div style="margin:20"><h3>loading editor resources error</h3><pre>check your url parameters or </pre><br/><button onclick="StateWithKitten.reset(); reload()">try clear cache and reload</button></div>');
                        });

                        _this.deactivateOptions();
                    });
                }

                var plugins = concatArraysWithUniqueItems(explodeString(findGetParameter('plugins')), [
                    'matter.min',
                    'physics',
                    'qrcode',
                    'combiner',
                    'renderOverTexture',
                    'shaderEditor',
                    'quadSelector',
                    'helpers'
                ]);

                _this.activateOptions();
                _this.initPlugins(plugins, cb);
                _this.deactivateOptions();


                renderer.__handleGLErrors(0);
            }
        });

        return this;
    },

    loadProfile: function () {

        // create custom ui view
        return this;
    },

    bindCommandsToPanel: function (node, object) {

    },

    prepareEditorUINode: function (nod, objectToChange, baseprop) {
        nod.__objectToChange = objectToChange;
        nod.__traverse(function (n) {
            if (!n.____preparedByEditor) {
                n.____preparedByEditor = 1;

                EditFieldsWithKitten.prepare(n, baseprop, objectToChange);

                EditorUIBehavioursWithKitten.prepare(n);
 
                if (n.__onTap) {
                    looperPost(function () {
                        if (isFunction(EditorEventsWithKitten[n.__onTap])) {
                            n.__tapCommand = n.__onTap;
                            onTapHighlight(n);
                            n.__onTap = function () {
                                invokeEventWithKitten(this.__tapCommand, { caller: this });
                                return 1;
                            }
                        } else
                            if (isString(n.__onTap)) {
                                n.__tapCommand = n.__onTap;
                                onTapHighlight(n);
                                n.__onTap = function () {
                                    eval(this.__tapCommand);
                                    return 1;
                                }
                            }
                    });
                }
            }
        });


        return nod;
    },

    prepareView: function () {
        var t = this;
        function wc(n, d) {
            var vx = n.__setAliasesData({
                __widthChanger: {
                    __onTap: 1,
                    __onTapHighlight: 1,
                    __notNormalNode: 1,
                    __visible: 1,
                    __highlight(a) { this.__alpha = a / 2; },
                    __drag(x, y, dx, dy) { n.__width += d * dx; }
                }
            });
        }

        wc(t.ui.__alias('leftView'), 1);
        wc(t.ui.__alias('rightView'), -1);

        var middle = t.ui.__alias('middle');

        middle.__wheel = function (d) {
            EditorEventsWithKitten.invokeOperation('middle.wheel', { d: d });
        };

        middle.__canDrag = function () {
            return mouseButtons[1] || EditorEventsWithKitten.keysDown.space;
        }

        middle.__drag = function (x, y, dx, dy) {
            if (mouseButtons[1] || EditorEventsWithKitten.keysDown.space) {
                EditorEventsWithKitten.invokeOperation('middle.drag', { dx: dx, dy: dy });
            }
        };

        this.prepareEditorUINode(this.ui);

    },

    openLayout: function (data, filter, cb) {
        var _this = this;

        if (!data) return;
        if (isString(data)) data = { path: data };
        var needactivate = !(data.active != undefined && !data.active);
        if (data.path && !data.name)
            data.name = data.path.replace(/(.*\/)|(\.json)/g, '');


        filter = filter || Editor.layoutViewFilter || function (v) { return v; };

        cb = cb || function () { };

        if (data.layoutView) {

            var layout = new LayoutWithKitten(data);
            layout.createView();
            cb();

        } else if (data.json) {

            var layout = new LayoutWithKitten(data);

            if (Editor.layoutConverter) {
                data.json = Editor.layoutConverter.convert(data.json, data);
            }

            layout.createView(filter(data.json));

            cb();

        } else if (data.path) {

            if (FilePanelWithKitten) {
                for (var i in FilePanelWithKitten.__childs) {
                    var tab = FilePanelWithKitten.__childs[i];
                    if (tab.layout && tab.layout.opts.path == data.path) {

                        if (_this.currentLayout) {
                            _this.currentLayout.deactivate();
                        }
                        _this.currentLayout = tab.layout;
                        tab.layout.activate();
                        return;
                    }
                }
            }

            var path = data.realPath || data.path;

            FileManagerWithKitten.openFile(path, {
                callback(content) {
                    data = deepclone(data);
                    data.json = content;
                    _this.openLayout(data, filter, cb);
                },
                isBackup: data.isBackup
            });

            needactivate = 0;
        }

        if (needactivate && layout) {
            consoleLog('needactivate', data);
            if (_this.currentLayout) {
                _this.currentLayout.deactivate();
            }
            _this.currentLayout = layout.activate();
        }
    },

    _initedPlugins: [],

    activateOptions: function () {
        activateOptions(this.options);
    },
    deactivateOptions: function () {
        deactivateOptions(this.options);
    },

    initPlugins: function (plugins, cb) {
        plugins = $filter($map(plugins, function (p) {
            if (Editor._initedPlugins.indexOf(p) < 0) {
                Editor._initedPlugins.push(p);
                p = p.replace(/^project\//, ((Editor.currentProject || 0).options || 0).__allServerPath || '');
                return (p.indexOf('/') > 0 ? '' : 'plugins/') + p + (p.endsWith('.js') ? '' : '.js') + "?";
            }
        }), function (v) { return v })

        if (cb) {
            if (plugins && plugins.length) {
                TASKS_RUN([[TASKS_SCRIPT].concat(plugins)], cb);
            } else {
                cb();
            }
        } else {
            if (plugins && plugins.length) {
                return [[TASKS_SCRIPT].concat(plugins)];
            }
            return [];
        }
    },

    addPluginButton() {


    },

    _initedClasses: [],

    initClasses: function (classes, cb) {

        classes = $filter($map(classes, function (p) {
            if (Editor._initedClasses.indexOf(p) < 0) {
                Editor._initedClasses.push(p);
                return p;
            }
        }), function (v) { return v })

        if (cb) {
            if (classes && classes.length) {
                TASKS_RUN([[TASKS_CLASS].concat(classes)], cb);
            } else {
                cb();
            }
        } else {
            if (classes && classes.length) {
                return [[TASKS_CLASS].concat(classes)];
            }
            return [];
        }
    },

    buildTopPanelMenu(opts) {
        if (Editor.ui.top) {
            Editor.ui.top.__setAliasesData($map(opts, v =>
                isObject(v) ? v :
                    isString(v) || isFunction(v) ? { __onTap: v } :
                        { __visible: v }
            ));
        }
    }

}


var Editor = new EditorWithKitten();
