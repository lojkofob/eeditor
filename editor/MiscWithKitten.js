function blurOther() {


}

function getSelectedNodes() {
    if (!Editor || !Editor.currentLayout) return [];
    var layout = Editor.currentLayout.layoutView;
    return layout ? layout.__getObjectsByProperty('selected', true) : [];
}

function getSelectedNodesParents() {
    if (!Editor || !Editor.currentLayout) return [];
    var layout = Editor.currentLayout.layoutView;
    return layout ? layout.__getObjectsParentsByProperty('selected', true) : [];
}


function eachSelected(cb, ifEmptyUseLayoutView, onlyParents) {

    if (!Editor || !Editor.currentLayout) return;
    var a = onlyParents ? getSelectedNodesParents() : getSelectedNodes();

    if (ifEmptyUseLayoutView && a.length == 0)
        a.push(Editor.currentLayout.layoutView);

    for (var i in a) {
        var f = cb(a[i]);
        if (f != undefined) return f;
    }
}


function forOneSelected(cb, elsecb) {
    var a = getSelectedNodes();
    if (a.length == 1) {
        if (cb) cb(a[0]);
        return a[0];
    } else {
        if (elsecb) elsecb(a);
    }
}

var __constructors__ = {
    __padding: function () { return [0, 0, 0, 0]; },
    __margin: function () { return [0, 0, 0, 0]; },
    __spacing: function () { return [0, 0, 0, 0]; }
};

var __specValuePreparers__ = {
    __padding: function (value, a, v, d) { return v == undefined ? null : value; },
    __margin: function (value, a, v, d) { return v == undefined ? null : value; },
    __spacing: function (value, a, v, d) { return v == undefined ? null : value; },
    __shadow: function (value, a, v, d) { return v == undefined ? null : value; },

    rad: function (value, a, v, d) { return value; },
    trans: function (value, a, v, d) { return value; }
};


var __properties_setters__ = {
    /*color: function(o, a, v){
        
        o.__color[a[1]] = Number( v );
        return o.__color = o.__color;
    },*/

    name: function (o, a, v) {
        o.name = v;
        if (o.treeEntry) {
            if (!v) {
                var index = o.__parent ? o.__parent.__childs.indexOf(o) : 0;
                v = '_' + index;
            }
            o.treeEntry.init({ text: v });
        }
    },

    __blending: function (o, a, v, d) {
        if (a.length == 1) {
            o.__blending = v;
        } else
            if (a.length == 2) {
                var vv = o.__blending;
                if (!isObject(vv)) vv = {};
                vv[a[1]] = v;
                o.__blending = vv;
            }

    },

    __s1hadow: function (o, a, v, d) {

        var value = o.__shadow;
        if (v == undefined)
            return undefined;

        if (!value)
            value = {};

        if (a.length > 1)
            value[a[1]] = v;
        else
            value = v;

        return value;

    },

    __text: function (o, a, v, d) {

        if (v == undefined && a.length < 2) {
            o.__text = undefined;
        }
        else {
            var value = o.__text ? mergeObj({}, o.__text.__p) : {};

            if (a[2]) {
                if (a[1] == '__shadow' && isArray(value.__shadow)) {
                    value.__shadow = {
                        x: value.__shadow[0] || 0,
                        y: value.__shadow[1] || 0,
                        __blur: value.__shadow[2] || 0
                    }
                }

                if (a[2] == '__color' && v && v.__isColor)
                    v = colorToJson(v);

                goDeeperSet(value, a, d + 1, v);
            } else {
                value[a[1]] = v;
            }

            if (!o.__text) {
                looperPost(function () {
                    EditFieldsWithKitten.updateAllProps();
                });
            }

            o.__text = value;
            o.__text.__visible = 1;
            return value;
        }
    }

    /*__width: function(o, v){ 
        o.__width = v;
        o.____size.px = 0;
    },
    __height: function(o, v){ 
        o.__height = v;
        o.____size.py = 0;
        return v;
    },
    
    '__anchor.x': function(o,v){
        consoleLog (o,v)
    }*/
};

var __objectConstructorIfUndefined__;

function goDeeperSet(obj, a, d, v) {
    if (obj != undefined) {

        var k = a[d];

        if (__properties_setters__[k]) {
            return __properties_setters__[k](obj, a, v, d);
        }

        if (a.length > d + 1) {

            var value = obj[k];
            if (value == undefined) {

                if (__objectConstructorIfUndefined__) {
                    value = __objectConstructorIfUndefined__();
                } else
                    if (__constructors__[k]) {
                        value = __constructors__[k]();
                    }
                    else {
                        value = {};
                    }
                // call constructor for value ?
            }

            var result = goDeeperSet(value, a, d + 1, v);
            //                 consoleLog(k, value);
            if (__specValuePreparers__[k])
                value = __specValuePreparers__[k](value, a, v, d);

            looperPost(function () {
                EditFieldsWithKitten.updateAllProps();
            });

            obj[k] = value;
            return result;
        }

        return obj[k] = v;

    }
}

function setPropVal(obj, p, val, params) {

    return p ? goDeeperSet(obj, p.split('.'), 0, val) : undefined;
}

function goDeeperGet(obj, a, d) {
    if (obj != undefined)
        return a.length > d ? goDeeperGet(obj[a[d]], a, d + 1) : obj;
}

function getPropVal(obj, p) {
    return p ? goDeeperGet(obj, p.split('.'), 0) : undefined;
}



var optionsStack = [];
var optsUniqId = 1;

function setEditorOptions() {

    mergeObjectDeep(options, {
        __disableCache: 1,
        __gesturesTapNotFirst: 1,
        __minimalTapArea: 10,
        __disableAutoanim: 1,
        __autoRemoveKeyFrameAnimation: 0
    });

}

function activateOptions(opts) {

    if (!isObject(opts)) throw ('bad opts');

    if (!opts.optsUniqId) opts.optsUniqId = optsUniqId++;

    optionsStack.push(opts);

    mergeObjectDeep(options, opts);

    setEditorOptions();

}

function deactivateOptions(opts) {

    if (!isObject(opts) || !opts.optsUniqId)
        throw ('bad opts');

    var i = optionsStack.indexOf(opts);

    if (i >= 0) {
        optionsStack.splice(i, 1);
        options.__reset();

        optionsStack.e$(function (o) {
            mergeObjectDeep(options, o);
        });

        setEditorOptions();
    }
}


function loadResources(res, cb) {
    if (res) {
        TASKS_RUN(res, cb);
    } else {
        cb()
    }
}


function explodeString(str) {
    if (!str) return [];
    str = str.split(',');
    for (var i in str) str[i] = str[i].trim();
    return str;
}




function showSomeHtml(html) {
    var div_showSomeHtml = window.div_showSomeHtml;
    if (!div_showSomeHtml) {
        div_showSomeHtml = window.div_showSomeHtml = __document.createElement('div');
        div_showSomeHtml.setAttribute("style", "position:absolute;top:0px;left:0px;z-index:900;width:100%;height:100%;");
        __document.body.appendChild(div_showSomeHtml);
        div_showSomeHtml.addEventListener("click", function () {
            div_showSomeHtml.style.display = "none";
        }, false);
    }
    div_showSomeHtml.innerHTML = html;
    div_showSomeHtml.style.display = "block";

}


function showImage(i) {
    setTimeout(function () {

        if (globalConfigsData.__frames[i])
            i = renderOverTexture(0, 0, { __img: i });

        if (!i) {
            return consoleError('image is undefined');
        }
        else
            if (i instanceof Node) {
                var cam = new CameraOrtho();

                var b = i.__getBoundingBox();

                var lx = (b.min.x + b.max.x) / 2;
                var ly = -(b.min.y + b.max.y) / 2;
                var sz = b.max.sub(b.min);

                updateCamera(sz.x, sz.y, cam, lx, ly);

                return showImage(renderNodeToTexture(i, { __camera: cam }));
            }
            else
                if (i instanceof HTMLImageElement) {
                    i = base64ImageFromImage(i);
                }
                else
                    if (i.__texture || i instanceof Texture) { // bufferTexture / texture 
                        i = base64ImageFromTexture(i);
                    } else
                        if (i.toDataURL) {
                            i = i.toDataURL(); // canvas
                        }
                        else {
                            consoleError("I don't know.. what is it?", i);
                            return;
                        }

        showSomeHtml("<img src='" + i + "'/>");
    }, 100);
}





function reload() {
    looperPost(function () { location.reload() });
}



function selectMaxSomethingBy(arr, chanceSelection, mod) {
    var maxItemChance = -Infinity, a;
    $each(arr, function (it, i) {
        var chance = chanceSelection(it, i);
        if (chance > maxItemChance) {
            maxItemChance = chance;
            a = it;
        }
    });
    return mod ? maxItemChance : a
}

function selectMinSomethingBy(arr, chanceSelection, mod) {
    var minItemChance = Infinity, a;
    $each(arr, function (it, i) {
        var chance = chanceSelection(it, i);
        if (chance < minItemChance) {
            minItemChance = chance;
            a = it;
        }
    });
    return mod ? minItemChance : a
}



function frameForShader(fll) {

    frame = globalConfigsData.__frames[fll.__img];
    var img = frame.tex.__image,
        rect = frame.r,
        w = img.width,
        h = img.height;

    if (frame.R) fll.__rotate -= 90; // TODO: move to shader
    fll.c = new Vector2((rect[0] + rect[2] / 2) / w, 1 - (rect[1] + rect[3] / 2) / h);
}

function deleteUndefinedProps(j) {
    var k = mergeObj({}, j);
    $each(k, function (a, i) {
        if (a == undefined)
            delete j[i];
    });
}

function jsonSubObjectsDiff(j1, j2, skipDebugger) {
    var k = {};

    var f = function (c, i, o1, o2) {
        k[i] = jsonDiff(o1[i], o2[i], { __childs: 1 }, skipDebugger);
        if (o1[i] && o1[i].__childs) {
            var childs = jsonSubObjectsDiff(o1[i].__childs, o2[i].__childs);
            if (childs && (objectKeys(childs).length != 0)) {
                if (!k[i])
                    k[i] = {};
                k[i].__childs = childs;
            }
        }
    };

    $each(j1, (c, i) => f(c, i, j1, j2));
    $each(j2, (c, i) => { if (j1 && !j1[i]) f(c, i, j1, j2) });

    deleteUndefinedProps(k);
    if (objectKeys(k).length != 0)
        return k;
}

function currentLayoutJsonDiff() {
    activateProjectOptions();
    var j2 = Editor.currentLayout.layoutView.__toJson().__childs;
    var j1 = Editor.currentLayout.opts.json;
    var k = jsonSubObjectsDiff(j1, j2);
    return k;
}

function jsonDiff(j1, j2, skipProps, skipDebugger) {

    skipProps = skipProps || 0;
    j1 = j1 || {};
    j2 = j2 || {};
    var diff = { j1: {}, j2: {} }, hasDiff;
    $each(j1, function (a, i) {
        if (skipProps[i])
            return;
        if (!isValuesEquals(a, j2[i])) {
            diff.j1[i] = a;
            diff.j2[i] = j2[i];
            hasDiff = 1;
        }
    });
    $each(j2, function (a, i) {
        if (skipProps[i])
            return;
        if (!isValuesEquals(a, j1[i])) {
            diff.j1[i] = j1[i];
            diff.j2[i] = a;
            hasDiff = 1;
        }
    });

    if (hasDiff) {
        if (!skipDebugger) {
            consoleLog('j1', j1);
            consoleLog('j2', j2);
            consoleLog('diff j1', diff.j1);
            consoleLog('diff j2', diff.j2);
            debugger;
        }
        return diff;
    }

}


function removeEmptyEffects() {

    var c = 0;
    Editor.currentLayout.layoutView.$(function (n) {

        if (n.__effect) {
            if (n.__effect.__emitters.length == 0) {
                n.__effect = undefined;
                c++;
            }
        }

    });

    consoleLog('affected', c, 'nodes');
}




function traversingWithoutLoops(obj, func, filter) {

    __traversingWithoutLoops(obj, '', func, 0, [], filter || (o => typeof o == 'object'));


}

function __traversingWithoutLoops(obj, key, func, depth, stack, filter, parent) {


    if (filter(obj)) {
        if (stack.indexOf(obj) < 0) {

            stack.push(obj);

            try {

                if (func(obj, key, depth, parent) == -1) {
                    return;
                }

                $each(obj, function (subObject, subKey) {
                    __traversingWithoutLoops(subObject, subKey, func, depth + 1, stack, filter, obj);
                });
            } catch (e) {
                console.error(e);
            }

        }
    }
    else {
        func(obj, key, depth);
    }

}



function escapeRegExpWithKitten(s) {
    return String(s).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
}

function fallbackCopyTextToClipboard(text) {

    var sp = __document.createElement('span');
    try {
        __document.body.appendChild(sp);
        sp.innerText = inputText;
        var r = __document.createRange();
        r.selectNode(sp);
        getSelection().removeAllRanges();
        getSelection().addRange(r);
        successful = __document.execCommand("copy");
    } catch (e) { }
    __document.body.removeChild(sp);

    if (successful) {
        return true;
    }

    var textArea = __document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    try {
        __document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        successful = __document.execCommand('copy');
    } catch (e) { }
    __document.body.removeChild(textArea);
    return successful;
}

function copyTextToClipboard(inputText, onSuccess, onFail) {
    try { navigator.clipboard.writeText(inputText).then(onSuccess, onFail); } catch (ex) {
        try { fallbackCopyTextToClipboard(inputText) ? onSuccess() : onFail(); } catch (ex) { }
    }
}




var indecesBuffer123 = new MyBufferAttribute('', Uint16Array, 1, GL_ELEMENT_ARRAY_BUFFER, []);

function setLineIndecesBuffer(t, len) {
    if (!t.__indecesBuffer) {
        t.__indecesBuffer = indecesBuffer123;
    }
    if (indecesBuffer123.__size < len) {
        var a = indecesBuffer123.__getArrayOfSize(len);
        for (var i = 0; i < a.length; i++) {
            a[i] = i;
        }
    }
    t.__verticesCount = len / 2;
}

function updateVerticesCustomFunction(f, args) {
    return function () {
        var t = this;
        var arr = f.apply(t, args);
        if (arr) {
            var len = arr.length;
            if (!t.__geomSize) {
                t.__geomSize = new Vector2(0, 0);
            }
            if (!t.__verticesBuffer) {
                t.__verticesBuffer = t.__addAttributeBuffer('position', 2);
            }
            setLineIndecesBuffer(t, len);
            t.__verticesBuffer.__getArrayOfSize(len).set(arr);

        }
        return t;
    }
}



var LineNode = makeClass(
    function (opts) {
        var t = this;
        t.opts = mergeObjExclude(opts, {
            __color: __defaultTextProperties.__color
        });
        Node.call(t, t.opts);
    },
    {
        __drawMode: 3,
        __validToSave: 0,
        //TODO: use __curveChanged for cache ?
        __updateVertices: updateVerticesCustomFunction(function () { return this.curveData; }),

        update: function (deep) {
            var t = this;
            t.addPointsNodes();
            return NodePrototype.update.apply(t, arguments);
        },

        addPointsNodes: function () {
            var t = this;
            if (t.__newCurve) {
                t.__clearChildNodes();

                var t = this;
                for (var i = 0; i < t.curveData.length; i += 2) {
                    t.__addChildBox({
                        index: i / 2,
                        __size: [7, 7],
                        __color: t.opts.__color,
                        __img: 'qbord_8_w',
                        __ofs: [t.curveData[i], -t.curveData[i + 1], 0],
                        __drag: t.opts.__pointDrag
                    });
                }
                t.__newCurve = 0;

            } else {

                for (var i = 0; i < t.curveData.length; i += 2) {
                    if (t.__childs[i / 2]) {
                        t.__childs[i / 2].__ofs = [t.curveData[i], -t.curveData[i + 1], 0];
                    } else {
                        break;
                    }
                }

            }

            t.__curveChanged = 0;

        }

    }, {
    curveData: createSomePropertyWithGetterAndSetter(
        function () {
            return this.__curveData;
        },
        function (v) {
            if (!this.__curveData) {
                this.__newCurve = 1;
            } else if (v && this.__curveData && v.length != this.__curveData.length) {
                this.__newCurve = 1;
            }
            this.__curveChanged = 1;
            this.__curveData = v;
            this.update(1);
        }
    )
}, NodePrototype);






function looperPostOne(f) {

    return () => {
        if (!f.__posted) {
            f.__posted = 1;
            looperPost(() => {
                f();
                f.__posted = 0;
            }, 1);
        }
    }

}


function showLoading(node) {

    node.__loadNode = node.__addChildBox({ __img: 'prt14' });
    node.__loadNode.__anim({ __rotate: [0, 360] }, 1, 1, 0);
    return node.__loadNode;
}

function hideLoading(node) {
    if (node.__loadNode) {
        node.__loadNode.__removeFromParent();
    }
}
