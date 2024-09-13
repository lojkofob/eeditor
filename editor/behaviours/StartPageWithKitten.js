var StartPageWithKitten;
(function () {

    var projectItemTemplate;

    addEditorBehaviours({

        StartPageWithKitten: function (n) {

            StartPageWithKitten = n;

            function hideUI() {
                Editor.ui.__alias('leftView').__visible = 0;
                Editor.ui.__alias('rightView').__visible = 0;
                Editor.ui.__alias('top').__visible = 0;
            }

            function showUI() {
                Editor.ui.__alias('leftView').__visible = 1;
                Editor.ui.__alias('rightView').__visible = 1;
                Editor.ui.__alias('top').__visible = 1;
            }

            StartPageWithKitten.close = function () {
                if (StartPageWithKitten.w.input)
                    StartPageWithKitten.w.input.unfocus();
                StartPageWithKitten.__visible = 0;
                showUI();
            }

            StartPageWithKitten.show = function () {

                StartPageWithKitten.__visible = 1;
                var w = StartPageWithKitten.w;

                w.__anim({ __scaleF: [0, 1], __y: [-200, 0] }, 0.3, 0, easeBackO);

                if (!Editor.currentProject) {
                    StartPageWithKitten.$('cancel').__visible = 0;
                    hideUI();
                } else {
                    StartPageWithKitten.$('cancel').__visible = 1;
                }

                if (w.input) {
                    StartPageWithKitten.filtr = w.input.inputValue = '';
                    w.input.focus();
                }

            }

            ObjectDefineProperties(StartPageWithKitten, {
                filtr: createSomePropertyWithGetterAndSetter(
                    () => { return this.__filtr },
                    v => {
                        this.__filtr = v;
                        var gg;
                        sc.__eachChild(n => {
                            if (n.__project) {
                                n.__visible = v ? n.__project.toLowerCase().indexOf(v.toLowerCase()) >= 0 : 1;
                                if (!gg && n.__visible) {
                                    gg = 1;
                                    n.__scrollIntoView(0.1);
                                }
                            }
                        });
                        sc.update(1);
                    }
                )
            });

            var sc = StartPageWithKitten.__alias('scrollContainer');

            if (StartPageWithKitten.w.input) {
                EditFieldsWithKitten.bindInput(StartPageWithKitten.w.input, StartPageWithKitten, 'filtr');

                StartPageWithKitten.w.input.__disableEvents = 1;

                StartPageWithKitten.w.input.onInputInput = function (v) {
                    StartPageWithKitten.filtr = v;
                }
            }

            function selectNext(x, y) {
                return function () {
                    var all = [], selected = StartPageWithKitten.selected && StartPageWithKitten.selected.__visible ? StartPageWithKitten.selected : 0;
                    sc.__eachChild(n => {
                        if (n.__visible) {
                            all.push(n);
                        }
                    });

                    if (!selected) {
                        selectedNext = all[0];
                    } else {
                        var w = 168
                            , h = 200
                            , wpx = round(selected.__worldPosition.x / w)
                            , wpy = round(selected.__worldPosition.y / h);

                        selectedNext = $find(all,
                            n => { return round(n.__worldPosition.x / w) == wpx + x && round(n.__worldPosition.y / h) == wpy + y }
                        );
                    }

                    if (selectedNext) {
                        if (StartPageWithKitten.selected) {
                            StartPageWithKitten.selected.__alpha = StartPageWithKitten.selected.__baseAlpha;
                        }
                        StartPageWithKitten.selected = selectedNext;
                        selectedNext.__scrollIntoView(0.1);
                        selectedNext.__baseAlpha = selectedNext.__alpha;
                        selectedNext.__alpha = 1.1;
                    }

                }
            }

            StartPageWithKitten.__onKey = {
                arrowdown: selectNext(0, 1),
                arrowup: selectNext(0, -1),
                arrowleft: selectNext(-1, 0),
                arrowright: selectNext(1, 0),
                enter: function () {
                    if (StartPageWithKitten.selected && StartPageWithKitten.selected.__visible) {
                        if (StartPageWithKitten.w.input)
                            StartPageWithKitten.w.input.unfocus();
                        invokeEventWithKitten('Project.open', StartPageWithKitten.selected.__project);
                    }
                }
            };




            if (!Editor.opts.inspectorMode) {
                BUS.__addEventListener({

                    NO_PROJECT: function (t, project) {
                        if (StartPageWithKitten && !StartPageWithKitten.__visible) {
                            StartPageWithKitten.show();
                        }
                    },

                    PROJECT_OPENED: function (t, project) {

                        if (StartPageWithKitten) {
                            StartPageWithKitten.close();
                        }

                    },

                    EDITOR_PREPARED: function (t, editor) {

                        if (StartPageWithKitten) {

                            if (!editor.currentProject) {
                                StartPageWithKitten.show();
                            }

                            onTapHighlight(StartPageWithKitten.__alias('cancel').__init({ __onTap: function () { StartPageWithKitten.close(); return 1; } }));

                            var sc = StartPageWithKitten.__alias('scrollContainer');
                            var slider = StartPageWithKitten.__alias('__slider');
                            sc.__scroll = { __onlyScrollX: 1, __slider: slider };

                            sc.__busObservers = {
                                __ON_RESIZE: function () {
                                    sc.__updateScrollX(0.2);
                                }
                            };

                            serverCommand({ command: 'projectsList' },
                                function (list) {

                                    $each(list, function (v, pname) {

                                        var pi = sc.__addChildBox(projectItemTemplate);

                                        pi.txt.__text = pname;
                                        pi.__canBeFrustummed = pi.__simpleBounding = 1;
                                        pi.__project = pi.txt.__project = pname;
                                        if (v.preview) {
                                            pi.img.__keepImage = 1;
                                            pi.img.__fitImg = 1;
                                            pi.img.__img = '../projects/' + pname + '/' + v.preview + '?';
                                        }
                                        pi.__onTap = function () {
                                            if (StartPageWithKitten.w.input) {
                                                StartPageWithKitten.w.input.unfocus();
                                            }
                                            invokeEventWithKitten('Project.open', pi.__project);
                                            return 1;
                                        };

                                        onTapHighlight(pi);

                                    });

                                    //                     consoleLog(list);

                                    sc.update(1);

                                });

                        }

                    }

                });
            }
        }

    });

    BUS.__addEventListener({

        EDITOR_LOADED: function (t, editor) {

            projectItemTemplate = extractLayoutFromLayout('projectItem', Editor.uiLayout);

        }
    });

})()
