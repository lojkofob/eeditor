

function generatePropertyFor(value, propName, linear, ooo) {

    propName = propName || '';
    if (isObject(value)) {
        if (linear) {
            ooo = ooo || {};
            $each(value, (v, i) => generatePropertyFor(v, propName ? propName + '.' + i : i, 1, ooo));
            return ooo;
        }
        else
            return {
                type: 'object',
                label: propName,
                properties: $mapAndFilter(value, (v, i) => generatePropertyFor(v, i))
            }
    } else
        if (isArray(value)) {
            // ???
        } else {
            var a = {
                type: isNumber(value) ? 'number' : isFunction(value) ? 'func' : 's',
                label: propName,
                value: value
            };
            if (ooo) {
                ooo[propName] = a;
                return ooo;
            }
            return a;
        }

}

(function () {

    var templates = {};

 
    function fillpanel(panel, list, object, existingPanel) {

        return $filter($map(list, (prop, propname) => {
            
            if (!prop.__propname){
                var ppp;
                ObjectDefineProperties(prop, {
                    __propname: { enumerable: false, set(v){ ppp = v; }, get(){ return ppp } },
                    __name: { get(){ return this.__propname }, enumerable: false }
                });
            }

            prop.__propname = propname;

            var template = templates[prop.type];
            if (!template) return;

            var cell = panel.__addChildBox(template);
 

            switch(prop.type) {

                default:
                    cell.__propertyBinding = propname;
                    break;

                case 'typename':
                case 'list':
                {
                    cell.__propertyBinding = propname;
                    var changer = cell.$({ __class: 'e-changer' })[0];
                    if (changer) {
                        changer.__propertyBinding += '=' + JSON.stringify(prop.values);
                        changer.__stringifiedProperties = 1;
                    }
                    break;
                }
            
                case 'ddList': {
                    cell.__propertyBinding = propname;
                    var ddListNode = cell.$({ __class: 'e-ddList' })[0];
                    if (ddListNode) {
                        ddListNode.__propertyBinding = '=' + JSON.stringify(prop.values);
                        ddListNode.__stringifiedProperties = 1;
                    }
                    break;
                } 

                case 'button': {
                    cell.__text = prop.t;
                    cell.__onTapHighlight = 1;
                    cell.__onTap = function () { 
                        invokeEventWithKitten(prop.f, existingPanel);
                    };
                    break;
                }
            }

            // cell.objectToChange = object;
            cell.prop = prop;

            cell.__setAliasesData({ label: { __text: prop.label || propname } });

            if (prop.tooltip) {
                cell.__tooltip = prop.tooltip;
            }

            if (prop.step != undefined) {
                cell.__traverse(n => { n.__numericInputStep = prop.step; });
            }

            if (prop.__defaultValue != undefined){
                cell.__defaultValue = prop.__defaultValue;
            }

            if (prop.type == 'object') {
                fillpanel(cell.panel, prop.properties, object, existingPanel);
            }

            return cell;
        }), a => a);

    }

    BUS.__addEventListener({

        EDITOR_LOADED: function (t, editor) {

            templates.customPanel = extractLayoutFromLayout('customPanel', Editor.uiLayout);
            $each(['object', 'b', 'number', 's', 'list', 'array', 'typename', 't', 'ddList', 'img',
                'vec2', 'vec3', 'vec4', 'ivec2', 'ivec3', 'ivec4', 'bvec2', 'bvec3', 'bvec4', 'hb', 'button'], type => {
                    templates[type] = extractLayoutFromLayout(type + '_template', templates.customPanel);
                });

            //hb - для добавления кнопок в хэдер

            // state params panel
            templates.stateParamsPanel = extractLayoutFromLayout('stateParamsPanel', Editor.uiLayout);
            templates.row = extractLayoutFromLayout('row', templates.stateParamsPanel);

        }

    });


    addEditorEvents('Editor', {

        fillCustomPanel: opts => {
            opts = opts || 0;
            var r = { cells: fillpanel(opts.panel, opts.properties, opts.object, opts.existingPanel) };
            Editor.prepareEditorUINode(opts.panel, opts.object, opts.__propertyBinding);
            EditFieldsWithKitten.updateAllPropsIn(opts.panel);
            Editor.ui.__needUpdateDeep = 1;
            return r;
        },

        showCustomPanel: opts => {

            opts = opts || 0;
            var name = opts.name;
            var title = opts.title || name;
            var object = opts.object;
            

            if (!title || !opts || !templates.customPanel)
                return;

            var existingPanel = PanelsWithKitten.$(name);

            if (!existingPanel) {

                existingPanel = PanelsWithKitten.addPanelFromTemplate(
                    templates[opts.template || 'customPanel'],

                    opts.acceptor ? opts.acceptor :
                        Editor.ui.__alias('rightView').__deepVisible() ? 'rightView' :
                            Editor.ui.__alias('leftView').__deepVisible() ? 'leftView' :
                                'middle',

                    object,
                    opts.unique,
                    opts.__propertyBinding
                );
                existingPanel.name = name;
                existingPanel.__alias('header').__text = title;
                existingPanel.__needRemoveOnClose = opts.needRemoveOnClose;

                invokeEventWithKitten('Editor.fillCustomPanel', mergeObj({
                     panel: existingPanel.panel,
                     existingPanel: existingPanel
                }, opts));

                if (opts.headerButtons && templates['hb']) {
                    var template = templates['hb'];
                    existingPanel.__alias('header').__onTap = 0;
                    var headerButtonsNode = existingPanel.__alias('headerButtons');
                    $each(opts.headerButtons, hb => {
                        var cell = headerButtonsNode.__addChildBox(template);
                        cell.__text = hb.t;
                        cell.__onTapHighlight = 1;
                        cell.__onTap = function () { 
                            invokeEventWithKitten(hb.f, existingPanel);
                        };
                    });
                }


                if (opts.panelWidth) {
                    looperPost(function () {
                        var maxSize = existingPanel.__maxsize;
                        existingPanel.__maxsize = { x: mmax(opts.panelWidth, maxSize.x), y: maxSize.y };
                        existingPanel.__width = opts.panelWidth;
                        existingPanel.__alias('panel').__width = 1;
                    });
                }

            }

            invokeEventWithKitten('Editor.showPanel', { 
                panel: existingPanel, scroll: 1, force: 1 
            });
            return existingPanel;

        },

        // state params panel
        showPlayerStatePanel: () => {
            return invokeEventWithKitten('Editor.showAutobindPanel', {
                name: 'PlayerState',
                object: PlayerState,
                template: 'stateParamsPanel',
                linear: 1
            }, 0, 1);
        },

        showAutobindPanel: opts => {

            return invokeEventWithKitten('Editor.showCustomPanel', mergeObj({
                unique: 1,
                needRemoveOnClose: 1,
                properties: generatePropertyFor(opts.object, opts.pname, opts.linear).properties
            }, opts), 0, 1);

        }


    });


    addEditorEvents('CustomPanel', {

        addArrayItem: o => {
            consoleLog(o);
        }

    });


})();
