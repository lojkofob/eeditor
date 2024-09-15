// base vertex shader
/*
uniform mat4 matrixWorld;
uniform mat4 projectionMatrix;
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv; 
void main() { 
    vUv = uv;
    gl_Position = projectionMatrix * matrixWorld * vec4( position,  1.0, 1.0 );
}
*/

// base fragment shader
/*
varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;

void main() {
    vec4 c = texture2D( map, vUv );
    c.rgb *= color;
    gl_FragColor = c * opacity;
} 
*/


let ShaderEditorPlugin = (() => {

    consoleLog('ShaderEditorPlugin!');

    let types = ['float', 'int', 'vec2', 'vec3', 'vec4', 'mat3', 'mat4', 'sampler2D'];
    let typesMap = invertMap($mapArrayToObject(types, (a, i) => i));

    let typename = { type: 'typename', values: types };


    function log() {
        let a = Array.prototype.slice.call(arguments);
        a.unshift('ShaderEditorPlugin:');
        consoleLog.apply(console, a);
    }

    function loge() {
        let a = Array.prototype.slice.call(arguments);
        a.unshift('ShaderEditorPlugin:');
        consoleError.apply(console, a);
        debugger;
    }

    let ShaderEditorItemsCollection = makeClass(function (node) {
        this.node = node;
        this.items = [];
    }, {
        init(a) {
            if (isObject(a)) {
                let t = this;
                if (isArray(a.items)) {
                    t.clear();
                    t.items = $filter($map(a.items, d => {
                        var id = d.id;
                        if (plugin.items[id]) {
                            let item = new ShaderEditorItem(id, t.node, d);
                            return item;
                        }
                    }), a => a);
                }
            }
            return this;
        },

        eachItem(f) {
            $each((this.items || []).slice(), f);
            return this;
        },

        clear() {
            this.eachItem(item => item.destruct()).items = [];
        },

        __toJson() {
            return {
                items: $map(this.items, it => it.__toJson())
            }
        },
        push(item) {
            if (this.items.indexOf(item) == -1) {
                this.items.push(item);
            }
        }
    }, {
        length: createSomePropertyWithGetterAndSetter(() => (this.items || []).length)
    });


    let ShaderEditorItem = makeClass(function (id, node, data) {
        let itemCfg = plugin.items[id];
        this.init(itemCfg);
        this.id = id;
        this.node = node;
        if (data) {
            this.init(data);
        }

        if (!this.uid)
            this.uid = plugin.uniqueItemId(node);

    }, {

        init(v) {
            mergeObj(this, v);
            this.initPanel();
            return this;
        },

        initPanel() {
            let t = this;
            if ((t.misc || 0).panel && t.panel) {
                t.panel.__init(t.misc.panel);
            }
            return this;
        },

        destruct() {
            let t = this;
            if (t.panel) {
                PanelsWithKitten.removePanel(t.panel);
                delete t.panel;
            }
            removeFromArray(this, getDeepFieldFromObject(this.node, '__userData', '__shaderEditor', 'items') || []);
            plugin.itemDestructed(t);
            return this;
        },

        __toJson() {

            let t = this;
            let panel = t.panel;

            let d = {
                id: this.id,
                uid: this.uid,
                data: this.data,
                misc: {}
            };

            if (panel) {
                d.misc.panel = {
                    __ofs: [panel.__x, panel.__y]
                }
            }
            return d;
        },

        addPanel() {

            let t = this, toNode = t.node;

            log('add', t.id);

            if (toNode.itemsPool[t.uid] == 1) {
                toNode.itemsPool[t.uid] = this;
            }

            if (toNode.itemsPool[t.uid] != this) {
                debugger;
            }

            if (!t.data) t.data = {};

            if (!toNode.__userData) toNode.__userData = {};

            if (!(toNode.__userData.__shaderEditor instanceof ShaderEditorItemsCollection)) {
                toNode.__userData.__shaderEditor = new ShaderEditorItemsCollection(toNode);
            }

            toNode.__userData.__shaderEditor.push(t);

            t.panel = invokeEventWithKitten('Editor.showCustomPanel', {
                name: t.id + '#' + t.uid,
                title: t.id,
                acceptor: toNode,
                object: t.data,
                properties: t.properties
            }, 0, 1);

            t.panel.__needRemoveOnClose = 1;
            t.panel.__addOnDestruct(() => {
                delete t.panel;
                t.destruct();
            });
            t.panel.__validToSave = 0;
            this.initPanel();
            return this;
        }
    });

    function getVarType(type) {
        if (typesMap[type] != undefined) {
            return typesMap[type]
        } else {
            loge("unknown type ", type);
        }
    }

    let parsers = {
        typename: (a) =>
            setNonObfuscatedParams({}, a + ' t s ;', (type, name) => {
                return {
                    type: getVarType(type),
                    name: name
                }
            }),

        typename_value: () =>
            setNonObfuscatedParams({},
                't s ;', (a, type, name) => { return { type: getVarType(type), name: name } },
                't s = v ;', (a, type, name, value) => { return { type: getVarType(type), name: name, value: value } }
            ),

        func: (funcName, args) =>
            setNonObfuscatedParams({}, 's ( v , v ) ;', (a, args) => {
                return {
                    input: args
                }
            })

    };

    let functions = {
        texture2D: ['sampler2D', 'vec2']
    };

    let plugin = makeSingleton({

        items: {

            attribute: {
                parser: parsers.typename('attribute'),
                properties: {
                    typename: typename
                }
            },

            uniform: {
                parser: parsers.typename('uniform'),
                properties: {
                    typename: typename
                }
            },

            varying: {
                parser: parsers.typename('varying'),
                properties: {
                    typename: typename
                }
            },

            variable: {
                parser: parsers.typename_value(),
                properties: {
                    typename: typename,
                    value: { type: 's', label: 'value' }
                }
            }
        }

    }, {

        uniqueItemId(node, item) {
            if (!node.itemsPool) {
                node.itemsPool = {};
            }
            let pool = node.itemsPool;
            let i = 0;
            while (true) {
                if (!pool[i]) {
                    pool[i] = item || 1;
                    return i;
                }
                i++;
            }
        },

        itemDestructed(item) {
            if (item && item.node && item.node.itemsPool) {
                delete item.node.itemsPool[item.uid];
            }
        },

        addItem() {

            let toNode = this.__parent ? this.__parent : plugin.lastActiveNode;

            plugin.lastActiveNode = toNode;

            AskerWithKitten.ask({
                list: objectKeys(plugin.items),
                search: 1,
                ok: function (d) {
                    let item = plugin.items[d];
                    if (item) {
                        item = new ShaderEditorItem(d, toNode);
                        item.addPanel();
                    }
                }
            });

        },

        activateEditorOnNode(node) {

            if (!node || getDeepFieldFromObject(node, '__userData', '__shaderEditor') instanceof ShaderEditorItemsCollection)
                return;

            node.__root.__eventsDisabled = 0;

            let she_plus = node.$('SE_plus')[0];

            if (!she_plus) {
                she_plus = node.__addChildBox({
                    __class: 'e-btn', name: 'SE_plus', sha: 2, sva: 0, __text: '+',
                    __validToSave: 0
                });
            }

            she_plus.__onTap = plugin.addItem;

            plugin.lastActiveNode = node;

            var she = new ShaderEditorItemsCollection(node);
            if (node.__userData) {
                she.init(node.__userData.__shaderEditor);
            }
            else {
                node.__userData = {};
            }

            node.__userData.__shaderEditor = she;
            $each(she.items, it => it.addPanel());

            plugin.parseFragmentShader(globalConfigsData["shaders/base.f"]);
        },

        tokenizeShader(txt) {
            let tokens = [];

            let tokenType;
            let tokenValue = '';
            let dOperators = '=<>/*+-';
            function flush() {
                if (tokenType) {

                    if (tokenType == 's') {
                        if (typesMap[tokenValue] != undefined) {
                            tokenType = 't';
                        } else
                            if (functions[tokenValue]) {
                                tokenType = 'f';
                            }
                        tokens.push([tokenType, tokenValue]);
                    }
                    else
                        if (tokenType == 'o') {
                            tokens.push(tokenValue);
                        }

                    tokenValue = '';
                    tokenType = undefined;
                }
            }

            for (let i = 0; i < txt.length; i++) {
                let c = txt.charAt(i);
                let c1 = txt.charAt(i + 1);

                if ((c >= '0' && c <= '9') || (c == '.' && c1 >= '0' && c1 <= '9')) {
                    if (tokenType == 's') {
                        tokenValue += c;
                    } else {
                        if (tokenType != 'd') flush();
                        tokenType = 'd';
                        tokenValue += c;
                    }
                } else
                    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_') {
                        if (tokenType != 's') flush();
                        tokenType = 's';
                        tokenValue += c;
                    } else
                        if (c == ' ') {
                            flush();
                        } else {
                            if (tokenType != 'o') {
                                flush();
                            }
                            tokenType = 'o';
                            tokenValue += c;
                            if (c1 == '=' && dOperators.indexOf(c) >= 0) {

                            } else {
                                flush();
                            }
                        }
            }

            flush();

            tokens = plugin.replaceTokens(tokens, {
                's * s': (a, b) => {
                    consoleLog(a, b);
                    return ['v', [a, '*', b]]
                }
            });

            return tokens;
        },

        replaceTokens(tokens, map) {

            function isTokenEqual(token, s) {
                return token[0] == s;
            }

            $each(map, (f, k) => {
                let a = k.split(' ');

                for (let i = 0; i < tokens.length; i++) {
                    let eq = 1;
                    for (let j = 0; j < a.length; j++) {
                        if (!isTokenEqual(tokens[i + j], a[j])) {
                            eq = 0;
                            break;
                        }
                    }
                    if (eq) {
                        // TODO: 
                    }
                }
            });

        },

        parseFragmentShader(txt, node) {

            node = node || plugin.lastActiveNode;
            if (node && isString(txt)) {
                plugin.activateEditorOnNode(node);
                txt = plugin.minifyShaderText(txt);
                consoleLog(txt);

                consoleLog(plugin.tokenizeShader(txt));



                let data = {

                    items: []

                };
                /*
                $each(plugin.items, (itemCfg, id) => {
                    if (itemCfg.parser) {
                        $each( itemCfg.parser, ( func, regExp ) => {
                            
                            txt = txt.replace( new RegExp( regExp, 'g'), (a, b, c, d, e) => {
                                
                                let itemData = func.call(itemCfg, a, b, c, d, e);
                                if (itemData != undefined){
                                    let uid = plugin.uniqueItemId(node);
                                    data.items.push({
                                        id: id, 
                                        data: itemData,
                                        uid: uid
                                    });
                                    return '<<<'+uid+'>>>';
                                }
                                return arguments[0];
                            } ) 
                        });
                    }
                });*/

                consoleLog(data);


                consoleLog(txt);


                node.__userData.__shaderEditor.init(data).eachItem(item => item.addPanel());


                //debugger;

            }

        },

        minifyShaderText(txt) {
            if (isString(txt)) {
                txt = txt.replace(/(#.*)/gi, '$1<<<define here>>>');
                txt = txt.replace(/\/\/.*/gi, '');
                txt = txt.replace(/\/\*.*\*\//gi, '');
                txt = txt.replace(/[\n\r]/gi, ' ');
                txt = txt.replace(/\s+/gi, ' ');
                txt = txt.replace(/([^\w\d]) ([\w\d])/gi, '$1$2');
                txt = txt.replace(/([\w\d]) ([^\w\d])/gi, '$1$2');
                txt = txt.replace(/([^\w\d]) ([^\w\d])/gi, '$1$2');
                txt = txt.replace(/^\s/gi, '');
                txt = txt.replace(/\s$/gi, '');
                txt = txt.replace(/<<<define here>>>/gi, '\\n');
                return txt;
            }
            return "";
        }


    });


    addKeyboardMap({
        'ctrl++': 'ShaderEditorPlugin.addItem'
    });

    addEditorEvents('ShaderEditorPlugin', {
        addItem: plugin.addItem
    });

    addEditorBehaviours({

    });

    BUS.__addEventListener({
        LAYOUT_ACTIVATED(t, l) {
            if (l.layoutView) {
                $each(l.layoutView.$("shaderEditor"), plugin.activateEditorOnNode.bind(plugin));
            }
        }
    });

    return plugin;

})();
