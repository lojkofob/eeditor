const CONSTANTS = {
    BLEND_FACTOR: {
        GL_ZERO: GL_ZERO,
        GL_ONE: GL_ONE,
        GL_SRC_COLOR: GL_SRC_COLOR,
        GL_ONE_MINUS_SRC_COLOR: GL_ONE_MINUS_SRC_COLOR,
        GL_DST_COLOR: GL_DST_COLOR,
        GL_ONE_MINUS_DST_COLOR: GL_ONE_MINUS_DST_COLOR,
        GL_SRC_ALPHA: GL_SRC_ALPHA,
        GL_ONE_MINUS_SRC_ALPHA: GL_ONE_MINUS_SRC_ALPHA,
        GL_DST_ALPHA: GL_DST_ALPHA,
        GL_ONE_MINUS_DST_ALPHA: GL_ONE_MINUS_DST_ALPHA,
        GL_CONSTANT_COLOR: GL_CONSTANT_COLOR,
        GL_ONE_MINUS_CONSTANT_COLOR: GL_ONE_MINUS_CONSTANT_COLOR,
        GL_CONSTANT_ALPHA: GL_CONSTANT_ALPHA,
        GL_ONE_MINUS_CONSTANT_ALPHA: GL_ONE_MINUS_CONSTANT_ALPHA,
        GL_SRC_ALPHA_SATURATE: GL_SRC_ALPHA_SATURATE
    },
    BLEND_EQUATION: {
        GL_FUNC_ADD: GL_FUNC_ADD,
        GL_FUNC_SUBTRACT: GL_FUNC_SUBTRACT,
        GL_FUNC_REVERSE_SUBTRACT: GL_FUNC_REVERSE_SUBTRACT
    }
};

function numericInputStepMult() {
    return isShiftPressed ? 10 : isCtrlPressed ? 0.1 : 1
}

function reorderPadding(p) {
    var tmp = p[1];
    p[1] = p[3];
    p[3] = tmp;
    return p;
}

function noneColor() {
    return invertedDefTextColor().lerp({ r: 0.5, g: 0.5, b: 0.5 }, 0.7).__toJson()
}

var EditFieldsWithKitten = {

    focusedInput: 0,

    specialUpdators: {

        __eSize: function (property, input, node, val) {

            var inputWidth = input.$({ __propertyBinding: 'x' })[0];
            var inputHeight = input.$({ __propertyBinding: 'y' })[0];

            if (!inputWidth || !inputHeight) return;

            if (val) {
                inputWidth.__numericInputStep = val.px == undefined ? abs(val.x) <= 1 ? 0.1 : 1 : (val.px == 'a' || val.px == 'o') ? 1 : val.px == false ? 1 : 0.1;
                inputHeight.__numericInputStep = val.py == undefined ? abs(val.y) <= 1 ? 0.1 : 1 : (val.py == 'a' || val.py == 'o') ? 1 : val.py == false ? 1 : 0.1;

                if (val.px === true) val.px = '%';
                if (val.py === true) val.py = '%';

                if (val.px === 1) val.px = '%';
                if (val.py === 1) val.py = '%';
            }


            this.updateInputSimple('__eSize.x', inputWidth, node, val ? val.x : undefined, !(node || 0).____size);
            this.updateInputSimple('__eSize.y', inputHeight, node, val ? val.y : undefined, !(node || 0).____size);



            this.updateInputSimple('__eSize.px', input.$({ __propertyBinding: '__eSize.px' })[0], node, val ? val.px == undefined ? abs(val.x) <= 1 ? '%' : '' : val.px == false ? '' : val.px : undefined, !(node || 0).____size);
            this.updateInputSimple('__eSize.py', input.$({ __propertyBinding: '__eSize.py' })[0], node, val ? val.py == undefined ? abs(val.y) <= 1 ? '%' : '' : val.py == false ? '' : val.py : undefined, !(node || 0).____size);


        }

    },

    valuesInputs: [],

    inputsForProperties: {

    },

    updateInputSimple: function (property, input, node, val, isGray) {
        //if (input.__isDDList) debugger;
        if (val == undefined && input.__defaultValue) {
            val = input.__defaultValue;
        }

        if (input.value) {
            return EditFieldsWithKitten.updateInputSimple(property, input.value, node, val, isGray);
        }

        if (input.__operation == 'set') {
            if (!input.__isCheckBox && !input.__isDDList) {
                return;
            }
        }

        input.__value = val;
        if (input.__onValueUpdate)
            input.__onValueUpdate(val);

        if (input.__isCheckBox) {
            input.__value = input.__valueToSet != undefined ? isValuesEquals(input.__valueToSet, val) : (val ? 1 : 0);
            input.__killAllAnimations().__classModificator = input.__value ? 'checked' : null;
        } else
            if (input.__isValueInput || input.__isPart || input.__isChanger || input.__isDDList) {
                var textNode = input.__alias('value') || input;
                if (textNode) {
                    if (textNode.__text && textNode.__text.__baseColor == undefined) {
                        textNode.__text.__baseColor = input.__text.__color;
                    }
                    if (val == undefined) {
                        if (textNode.__text) {
                            if (input.__isDDList) {
                                textNode.__text = { __text: '<none>', __color: noneColor() };
                            } else {
                                textNode.__text = '';
                                textNode.__text.update();
                                textNode.__text.__visible = 0;
                            }
                        }
                    } else {

                        if (input.__stringifiedProperties && input.__stringifiedProperties[val]) {
                            val = input.__stringifiedProperties[val];
                        }

                        if (isNumeric(val)) {
                            textNode.__text = '' + (floor(val) == val ? val : val.toFixed ? val.toFixed(2) : val);
                        } else {
                            textNode.__text = '' + val;
                        }

                        if (isGray) {
                            if (textNode.__text.__baseColor == undefined) {
                                textNode.__text.__baseColor = input.__text.__color;
                                textNode.__text.__color = 0x888888;
                            }
                        } else {
                            if (textNode.__text.__baseColor != undefined) {
                                textNode.__text.__color = input.__text.__baseColor
                                delete textNode.__text.__baseColor;
                            }
                        }

                        textNode.__text.__visible = 1;

                    }
                }

                if (input.onInputUpdate)
                    input.onInputUpdate();

            }


    },

    updateInputParts: function (property, input, node, val) {
        if (input.__parts) {

            for (var i in input.__parts) {
                var part = input.__parts[i];
                if (part.__htmlInputDisabled && !part.__normalUpdate) {
                    this.updateInputSimple(property, part, node, val);
                } else {
                    var prop = part.__propertyBinding;
                    this.updatePropertyData(property + '.' + prop, part, node, val == undefined ? val : val[prop])
                }
            }
        }

    },

    updatePropertyData: function (property, input, node, val, forceParts) {

        node = node || input.__bindedObject;
        
        var type = node ? stringifyTypeOfObject(node) : 'ENode';
        
        input = input || this.inputsForProperties[type][property];

        if (input && !property && input.__property)
            property = input.__property;

        if (input && !property && input.__propertyBinding)
            property = input.__propertyBinding;

        if (!input && property && property.indexOf('.') > 0) {

            var a = property.split('.');
            if (a.length > 0) {
                forceParts = 1;
                property = a[0];
                val = undefined;
                input = this.inputsForProperties[type][a[0]];
            }
        }

        if (isArray(input) || (input instanceof NodeArrayIterator)) {
            for (var i = 0, l = input.length; i < l; i++) {
                this.updatePropertyData(property, input[i], node, val, forceParts);
            }
            return;
        }

        if (input && input.updatePropertyData) {
            return input.updatePropertyData(property, input, node, val, forceParts);
        }

        if (input && !property && input.__propertyBinding)
            property = input.__propertyBinding;

        node = node || (input && input.__bindedObject) || forOneSelected();

        if (input && input.__bindedObject && node != input.__bindedObject) return;

        val = val == undefined ? getPropVal(node, property) : val;

        if (this.specialUpdators[property]) {
            return this.specialUpdators[property].call(this, property, input, node, val, forceParts);
        }

        if (input) {
            if (val && val.getHexString)
                val = '#' + val.getHexString();

            //             if (input.__parts) {
            this.updateInputParts(property, input, node, val);
            //             } else 
            if (!(isObject(val) || isArray(val) || forceParts)) {

                this.updateInputSimple(property, input, node, val);

            }
        }

        //         consoleLog(property,input);
    },

    bindInput: function (n, object, property) {

        this.wrapInputField(n, object, property);

    },

    updateAllPropsIn: function (panel) {
        /* var props = [];
        panel.__traverseParents( (p)=> { 
            if (isString(p.__propertyBinding)){
                props.push(p.__propertyBinding.split('=')[0]);
            }
        }); */
        EditFieldsWithKitten.updatePropertyData(null /* props.length ? props.join('.') : null*/, panel.$({ addedToInputsForProperties: 1 }));

    },

    updateAllProps: function (list, node) {
        list = list || EditFieldsWithKitten.inputsForProperties.ENode;
        for (var i in list) {
            EditFieldsWithKitten.updatePropertyData(i, EditFieldsWithKitten.inputsForProperties.ENode[i], node)
        }
    },

    checkSingleton: function () {

        if (!this.__on) {
            this.__on = 1;

            var div = document.getElementById('gameDiv');


            var htmlInput = this.htmlInput = document.createElement('input');
            htmlInput.className = 'EditFieldsWithKitten';
            htmlInput.style.display = "none";
            div.appendChild(htmlInput);

            htmlInput.onchange = function () { if (EditFieldsWithKitten.focusedInput) EditFieldsWithKitten.focusedInput.onInputChange(htmlInput.value); };
            htmlInput.oninput = function () { if (EditFieldsWithKitten.focusedInput) EditFieldsWithKitten.focusedInput.onInputInput(htmlInput.value); }
            htmlInput.onblur = function () {
                if (EditFieldsWithKitten.focusedInput)
                    EditFieldsWithKitten.focusedInput.unfocus();
            }
            htmlInput.onwheel = function (e) {
                if (e && e.deltaY && EditFieldsWithKitten.focusedInput && EditFieldsWithKitten.focusedInput.__numericInputStep) {
                    EditFieldsWithKitten.focusedInput.__changeBy(sign(e.deltaY));
                    blockBrowserEvent(e);
                    htmlInput.value = EditFieldsWithKitten.focusedInput.inputValue;
                }
            }

            var htmlTextarea = this.htmlTextarea = document.createElement('textarea');
            htmlTextarea.className = 'EditFieldsWithKitten';
            htmlTextarea.style.display = "none";

            div.appendChild(htmlTextarea);

            htmlTextarea.onchange = function () { if (EditFieldsWithKitten.focusedInput) EditFieldsWithKitten.focusedInput.onInputChange(htmlTextarea.value); };
            htmlTextarea.oninput = function () { if (EditFieldsWithKitten.focusedInput) EditFieldsWithKitten.focusedInput.onInputInput(htmlTextarea.value); }
            htmlTextarea.onblur = function () {
                if (EditFieldsWithKitten.focusedInput)
                    EditFieldsWithKitten.focusedInput.unfocus();
            }


            BUS.__addEventListener({

                __OBJECT_CHANGED_set: function (e, d) {
                    //                     consoleLog(d);
                    var val = d.next;
                    var prop = d.prop;
                    var object = d.node;

                    var type = stringifyTypeOfObject(object);

                    if (prop == '__ofs') {
                        EditFieldsWithKitten.updatePropertyData('__x', 0, object);
                        EditFieldsWithKitten.updatePropertyData('__y', 0, object);
                        EditFieldsWithKitten.updatePropertyData('__z', 0, object);
                    }

                    if (EditFieldsWithKitten.inputsForProperties[type]) {
                        if (!EditFieldsWithKitten.inputsForProperties[type][prop]) {
                            type = "ENode"; // TODO: это костыль
                        }
                        EditFieldsWithKitten.updatePropertyData(
                            prop,
                            EditFieldsWithKitten.inputsForProperties[type][prop],
                            object,
                            val
                        );
                    }

                },

                __ON_NODE_SELECTED: looperPostOne(() => {
                    EditFieldsWithKitten.updateAllProps();
                }),

                __ON_NODE_UNSELECTED: looperPostOne(() => {
                    EditFieldsWithKitten.updateAllProps();
                })/*,
                
                __UNDO: function(){
                    
                },
                
                __REDO: function(){
                    
                }*/

            }, this);

        }

    },

    unbindInput: function (t, disableparentCheck) {
        if (t) {
            delete t.bindingPrepared;
            delete t.__bindedObject;

            if (!disableparentCheck && t.__parent) {
                if (t.__parent.__parts || t.name == 'value') {
                    t.name = 0;
                    return this.unbindInput(t.__parent);
                }
            }

            var ifpp = EditFieldsWithKitten.inputsForProperties;
            for (var j in ifpp) {
                var ifp = ifpp[j];
                for (var i in ifp) {
                    var l = ifp[i].length;
                    ifp[i] = ifp[i].filter(function (n) {
                        return n != t
                    });

                    if (l != ifp[i].length) {
                        //                     consoleLog(i, 'unbinded');
                        //return;
                    }
                }
            }

            for (var i in t.__parts) EditFieldsWithKitten.unbindInput(t.__parts[i], 1);

            EditFieldsWithKitten.unbindInput(t.value, 1);

        }
    },

    wrapInputField: function (n, object, property) {
        if (!n)
            return;

        n = n.value || n;

        n.__addOnDestruct(function () {
            if (this.unfocus) {
                this.unfocus();
            }
            EditFieldsWithKitten.unbindInput(this);
        });

        if (n.__parts) return;

        if (n.__isCheckBox || n.__isChanger || n.__isDDList) {
            return n;
        }

        if (!n.__property) n.__property = property;
        n.__bindedObject = object;

        n.__baseColor = brightColor(n.__color, 0);

        //         consoleLog(n.__property);

        n.__isValueInput = 1;
        EditFieldsWithKitten.valuesInputs.push(n);


        if (!n.__alreadyBinded) {
            ObjectDefineProperty(n, 'inputValue', {
                get: function () { return this.__value || 0 },
                set: function (v) {
                    this.__value = v;
                    EditFieldsWithKitten.updateInputSimple(this.__property, this, 0, v);
                }
            });

            ObjectDefineProperty(n, 'inputText', {
                get: function () {
                    return EditFieldsWithKitten.focusedInput == this && this.htmlInput ? this.htmlInput.value : ('' + (this.inputValue || ''))
                },
                set: function (v) {
                    if (EditFieldsWithKitten.focusedInput == this && this.htmlInput) {
                        this.htmlInput.value = this.inputValue = v;
                    }
                    else {
                        this.inputValue = v;
                    }
                }
            });
        };

        n.__scrollable = 1;

        n.init({

            __alreadyBinded: 1,

            __onTap: function () {
                this.focus();
                return 1;
            },

            removeHtmlInput: function () {

                if (this.htmlInput) {

                    if (this.__changed) {
                        this.onInputChange(this.htmlInput.value);
                        this.__changed = 0;
                    }

                    this.htmlInput.style.display = "none";
                    this.htmlInput = 0;
                    this.htmlInput.value = "";
                    if (this.__text)
                        this.__text.__viewable = 1;
                }

            },

            onInputInput: function (v) { this.__setValue(v, 1); },
            onInputChange: function (v) {
                if (!this.__onInputChangeCalled) {
                    this.__onInputChangeCalled = 1;
                    this.__setValue(v);
                }
            },

            __dragStart: function () {
                if (this.__numericInputStep) {
                    //                      lockPointer();

                    this.__startValue = this.inputValue =
                        getPropVal(this.__bindedObject || forOneSelected(), this.__property);

                }
            },

            __setValue: function (v, onInput) {

                if (this.__numericInputStep) v = parseFloat(v);

                var withHistory = 1;
                var withHistoryStack = 1;

                var o = {};

                o[this.__property] = v;

                if (this.inputValue != v) {
                    this.inputValue = v;
                    this.__changed = 1;
                }

                if (this.__disableEvents) withHistory = 0;

                __objectConstructorIfUndefined__ = this.__objectConstructorIfUndefined;

                invokeEventWithKitten('set', o, {
                    withHistory: withHistory,
                    withHistoryStack: withHistoryStack,
                    object: this.__bindedObject
                });

                __objectConstructorIfUndefined__ = undefined;

            },

            __changeBy: function (d) {

                if (this.__numericInputStep) {

                    var v = this.inputValue
                        , s = Number(this.__numericInputStep) * numericInputStepMult()
                        , change = clamp(d * s, -s, s);

                    v = round((v + change) / s) * s;

                    if (isNaN(v)) v = round(change / s) * s;

                    this.__setValue(v);

                }

            },

            __scrollBy: function (d) { this.__changeBy(-sign(d)); },

            __wheel: function (d) {
                if (PanelsWithKitten.__lastWheelTime > TIME_NOW - 1)
                    return;

                this.__changeBy(-sign(d));
                return 1;
            },

            __canDrag: function () {
                return this.__numericInputStep;
            },

            __drag: function (x, y, dx, dy) { this.__changeBy(dx - dy); },

            __dragEnd: function () {
                BUS.__post('FLUSH_HISTORY_STACK');
            },

            __updateMatrixWorld: function () {

                NodePrototype.__updateMatrixWorld.apply(this, arguments);
                this.updateHtmlInput();

            },

            updateHtmlInput: function () {

                if (this.htmlInput) {

                    var pos = this.__worldPosition.__clone() // .__multiplyScalar(1/layoutsResolutionMult)
                        , sz = this.__size;

                    pos.sub(sz.__clone().__divideScalar(2)).add(this.__parentScrollVector);

                    sz.__multiplyScalar(layoutsResolutionMult);


                    var pm = this.__projectionMatrix;
                    if (pm.e[0] == 1) pm = camera.__projectionMatrix;

                    pm.e[13] = -pm.e[13]; // wtf????

                    var sp = new Vector3(pos.x, pos.y, this.mw.e[14])
                        .__applyMatrix4(pm)
                        .__toVector2()
                        .__multiply(__realScreenCenter)
                        .add(__realScreenCenter);

                    pm.e[13] = -pm.e[13]; // wtf????

                    if (this.__width < 40) {
                        this.htmlInput.classList.add('nospinbut');
                    }

                    if (this.__text) {
                        mergeObj(this.htmlInput.style, {
                            color: color_to_string(this.__text.__color),
                            left: sp.x + "px",
                            top: sp.y + "px",
                            height: sz.y + "px",
                            width: sz.x + "px",
                            padding: reorderPadding(
                                $map(this.__padding || [0, 0, 0, 0], p => p * layoutsResolutionMult + 'px '),
                                [1, 4, 3, 2]).join(''),
                            textAlign: ['left', 'center', 'right'][this.isTextarea ? this.__text.__align : (this.ha === 0 ? 0 : this.ha || 1)],
                            fontSize: round(this.__text.__fontsize * layoutsResolutionMult) + "px",
                            fontFamily: this.__text.__fontface || options.__defaultTextProperties.__fontface || 'Arial'
                        });

                        this.__text.__viewable = 0;
                    }

                }
            },

            addHtmlInput: function () {
                if (!this.htmlInput && this.__text) {

                    var htmlInput = this.htmlInput = this.isTextarea ? EditFieldsWithKitten.htmlTextarea : EditFieldsWithKitten.htmlInput;

                    this.htmlInput.style.display = "block";

                    if (this.__numericInputStep) {
                        htmlInput.type = 'number';
                        htmlInput.step = this.__numericInputStep;
                    }
                    else {
                        htmlInput.type = 'text';
                    }

                    htmlInput.value = this.__text ? this.__text.__text : this.__textString;

                    htmlInput.focus();

                }

                this.updateHtmlInput();

            },

            focus: function () {
                if (!this.focused) {
                    this.__onInputChangeCalled =
                        this.__changed = 0;
                    if (EditFieldsWithKitten.focusedInput) {
                        EditFieldsWithKitten.focusedInput.unfocus();
                    }
                    this.focused = 1;
                    EditFieldsWithKitten.focusedInput = this;
                    if (!this.__htmlInputDisabled) {
                        this.__killAllAnimations().__classModificator = 'focus';
                        this.addHtmlInput();
                    }

                    if (this.__onFocus)
                        this.__onFocus();
                }
            },

            unfocus: function () {

                if (this.focused) {
                    this.focused = 0;
                    this.removeHtmlInput();

                    EditFieldsWithKitten.focusedInput = 0;

                    if (!this.__htmlInputDisabled) {
                        this.__killAllAnimations().__classModificator = null;
                    }

                    if (this.hasBehaviour('compound')) {
                        this.__eachChild(c => Editor.prepareEditorUINode(c, this.__bindedObject));
                    }

                    if (this.__onBlur)
                        this.__onBlur();

                }


            }

        });

        if (n.__img || n.__shader == 'c' || n.name != 'value') {
            onTapHighlight(n);
        }
        else
            if (n.name == 'value') {
                onTapHighlight(n, n.__parent);
            }

    },

    prepare: function (n, baseprop, object) {


        if (n.__propertyBinding && !n.bindingPrepared) {

            //             if (n.__propertyBinding == "0"){
            //                 debugger;
            //                 n.__debugging = 1;
            //             }
            //             

            if (n.__class) {
                if (n.__class.indexOf('checkbox') >= 0) {
                    n.__isCheckBox = 1;
                    n.__htmlInputDisabled = 1;
                } else if (n.__class.indexOf('changer') >= 0) {
                    n.__isChanger = 1;
                    n.__htmlInputDisabled = 1;
                } else if (n.__class.indexOf('ddList') >= 0) {
                    n.__isDDList = 1;
                    n.__htmlInputDisabled = 1;
                }
            }

            n.bindingPrepared = 1;

            this.checkSingleton();

            var eindex = n.__propertyBinding.indexOf('=');

            function addInputPropertyField(input, property) {

                var type = object ? stringifyTypeOfObject(object) : 'ENode';
                if (!EditFieldsWithKitten.inputsForProperties[type]) EditFieldsWithKitten.inputsForProperties[type] = {};
                if (!EditFieldsWithKitten.inputsForProperties[type][property]) EditFieldsWithKitten.inputsForProperties[type][property] = [];

                EditFieldsWithKitten.inputsForProperties[type][property].push(input);

                EditFieldsWithKitten.inputsForProperties.ENode3d = EditFieldsWithKitten.inputsForProperties.ENode;
                EditFieldsWithKitten.inputsForProperties.Node = EditFieldsWithKitten.inputsForProperties.ENode;
                EditFieldsWithKitten.inputsForProperties.Node3d = EditFieldsWithKitten.inputsForProperties.ENode;

                input.addedToInputsForProperties = 1;

            }

            if ((baseprop && eindex >= 0) || n.__htmlInputDisabled) {
                var a = n.__propertyBinding.split('=');
                var propertyVal = a[1];

                if (CONSTANTS[propertyVal]) {

                    n.__stringifiedProperties = 1;
                    propertyVal = CONSTANTS[propertyVal];

                }

                if (eindex > 0) {
                    n.__propertyBinding = a[0];
                }

                if (eindex < 0 && n.__htmlInputDisabled) {
                    propertyVal = '!';
                    baseprop = (baseprop ? (baseprop + '.') : '') + n.__propertyBinding;
                    n.__normalUpdate = 1;
                }
                if (n.__isChanger) {
                    if (eindex != 0) {
                        if (n.__propertyBinding != 'undefined') {
                            baseprop = (baseprop ? (baseprop + '.') : '') + n.__propertyBinding;
                        }
                    }

                    n.__operation = 'change';
                } else
                    if (n.__isDDList) {
                        //                     n.__normalUpdate = 1;
                        if (eindex != 0) {
                            if (n.__propertyBinding != 'undefined') {
                                baseprop = (baseprop ? (baseprop + '.') : '') + n.__propertyBinding;
                            }
                        }

                        n.__operation = 'set';
                    } else {
                        n.__operation = 'set';
                    }

                if (!baseprop) {
                    baseprop = n.__propertyBinding;
                }

                n.__propertyBinding = baseprop;


                try {
                    if (propertyVal == "undefined") {
                        propertyVal = undefined;
                    }
                    else {
                        propertyVal = JSON.parse(propertyVal);
                    }
                } catch (e) {
                    if (propertyVal == '!') {
                        n.__operation = 'inverse';
                    }
                }

                if (propertyVal && propertyVal.__operation) {
                    n.__operation = propertyVal.__operation;
                    propertyVal = undefined;
                }


                if (n.__operation == 'set')
                    n.__valueToSet = propertyVal;

                n.__propertyVal = deepclone(propertyVal);

                if (n.__stringifiedProperties) {

                    if (isArray(propertyVal)) {
                        n.__stringifiedProperties = deepclone(propertyVal);
                        for (var i in propertyVal) {
                            n.__propertyVal[i] = Number(i);
                        }
                    } else
                        if (isObject(propertyVal)) {
                            n.__stringifiedProperties = invertMap(propertyVal, {});
                            n.__propertyVal = [];
                            for (var i in propertyVal) {
                                n.__propertyVal.push(propertyVal[i]);
                            }
                        }
                }

                n.__onTap = function () {
                    var o = {};
                    var pvalarr = this.__propertyVal;
                    if (this.__operation == 'change') {

                        if (isArray(pvalarr)) {

                            var cind = pvalarr.indexOf(this.__value);

                            if (!this.__value) {
                                if (cind < 0) cind = pvalarr.indexOf(null);
                                if (cind < 0) cind = pvalarr.indexOf(0);
                                if (cind < 0) cind = pvalarr.indexOf(false);
                                if (cind < 0) cind = pvalarr.indexOf('');
                                if (cind < 0) cind = -1;
                            }

                            //                             if (cind >= 0){
                            cind++;
                            if (pvalarr.length <= cind) cind = 0;
                            o[baseprop] = pvalarr[cind];
                            //                             }

                            this.cind = cind;
                        }

                    } else if (this.__operation == 'inverse') {

                        o[baseprop] = this.__classModificator != 'checked';

                    } else if (this.__operation == 'set' && this.__isDDList) {

                        //                          debugger;
                        var values = n.__stringifiedProperties;
                        if (values.length == 0) {
                            return;
                        }
                        var dropPanel = n.__alias('ddPanel');

                        if (!dropPanel.__filled) {

                            $each(values, (v, i) => {
                                dropPanel.__addChildBox({
                                    __class: "e-ddList-field",
                                    __text: v == undefined ? { __text: '<none>', __color: noneColor() } : v,
                                    __onTap() {
                                        /* if (v == 'none') {
                                            v = undefined;
                                        } */
                                        o[baseprop] = v;
                                        invokeEventWithKitten('set', o, {
                                            withHistory: 1,
                                            object: n.__bindedObject
                                        });
                                    },
                                    __highlight(a) {
                                        this.__classModificator = a == 0 ? null : 'hover';
                                    }
                                });
                            });
                            dropPanel.__filled = 1;
                        }

                        dropPanel.__visible = !dropPanel.__visible;
                        if (!dropPanel.__parent.__initialZ) {
                            dropPanel.__parent.__initialZ = dropPanel.__parent.__z;
                        }
                        dropPanel.__parent.__z = dropPanel.__visible ? -25 : dropPanel.__parent.__initialZ;

                        if (dropPanel.__visible) {
                            dropPanel.__showTime = TIME_NOW;
                            BUS.__addEventListener({
                                __ON_POINTER_UP() {
                                    if (dropPanel.__showTime == TIME_NOW) return;
                                    dropPanel.__visible = false;
                                    dropPanel.__parent.__z = dropPanel.__parent.__initialZ;
                                    return 1;
                                }
                            });
                        }

                        return;

                    } else if (isObject(this.__operation)) {

                        $each(this.__operation, function (arg, key) {
                            switch (key) {
                                case '*': o[baseprop] = function (obj, i) { return (getPropVal(obj, i) || 0) * arg; }; break;
                                case '/': o[baseprop] = function (obj, i) { return (getPropVal(obj, i) || 0) / arg; }; break;
                                case '+': o[baseprop] = function (obj, i) { return (getPropVal(obj, i) || 0) + arg; }; break;
                                case '-': o[baseprop] = function (obj, i) { return (getPropVal(obj, i) || 0) - arg; }; break;
                            }

                        });


                    } else {
                        o[baseprop] = this.__valueToSet;
                    }

                    invokeEventWithKitten('set', o, {
                        withHistory: 1,
                        object: n.__bindedObject
                    });

                    return 1;
                }

                addInputPropertyField(n, baseprop);

                onTapHighlight(n);

                n.__bindedObject = n.__bindedObject || object;

                if (n.__htmlInputDisabled)
                    return n;

                return;

            } else {
                var property = n.__propertyBinding;
                if (baseprop) {
                    property = baseprop + '.' + property;
                }
                else {

                }

                n.__property = property;

                if (n.value) {
                    n.value.__property = property;
                }

                //                 consoleLog(property);
                n.__traverseChilds(function (subn) {

                    var part = EditFieldsWithKitten.prepare(subn, property, object);
                    if (part) {
                        if (!n.__parts) {
                            n.__parts = [];
                        }
                        //                             if (part.__debugging)
                        //                                 debugger;
                        n.__parts.push(part);

                        part.__isPart = 1;
                        part.addedToInputsForProperties = 0;
                    }

                });

                //                 if (n.__isPart || !n.__parts) {
                addInputPropertyField(n, property);
                //                 }

                this.wrapInputField(n, object);

            }

            n.__traverse(function (m) { m.__bindedObject = m.__bindedObject || object });

            return n;

        }

    },


    nextInput: function () {

        var fi = EditFieldsWithKitten.focusedInput;
        if (fi) {

            var vi = EditFieldsWithKitten.valuesInputs;

            vi = $filter(vi, function (b) { return b.__deepVisible() && b.focus; });

            //             vi.sort( function(a, b){
            //                 return a.__totalZ - b.__totalZ;
            //             });

            var wp = fi.__worldPosition;
            var z = fi.__totalZ;

            vi = $filter(vi, function (b) { return abs(b.__totalZ - z) < 100; });
            /* 
             $each( vi, function(a){
                 
                 consoleLog( (a == fi ? '>>>>>' : '') + a.__propertyBinding, a.__worldPosition.__distanceToSquared(wp));
                 
             } );
                        */
            //             vi = $filter( vi, function(b){ 
            //                 
            //                 return b.__worldPosition.__distanceToSquared(wp) < 50000;
            //                 
            //             } );

            /* vi = vi.sort( function(a, b){
                 return a.__worldPosition.__distanceToSquared(wp) - b.__worldPosition.__distanceToSquared(wp);
             });*/

            var index = vi.indexOf(fi);

            nextInput = vi[index + 1];

            if (nextInput) { nextInput.focus(); nextInput.__scrollIntoView(0.1); return nextInput; }


            /*
            $each( vi, function(a){
                
                consoleLog( (a == fi ? '>>>>>' : '') + a.__propertyBinding );
                
            } );*/

            //debugger;

            function isInOneParent(a, b) {
                if (a.__parent == b.__parent) {
                    return 1;
                }

                if (a.__parent.__parent == b.__parent) {
                    return 1;
                }

                if (a.__parent == b.__parent.__parent) {
                    return 1;
                }

            }

            var nextInput;

            function ffind(f) {

                nextInput = $find(vi, f);

                if (nextInput) { nextInput.focus(); return nextInput; }
            }

            if (ffind(function (a) { return isInOneParent(a, fi) && a.__worldPosition.y == wp.y && a.__worldPosition.x > wp.x; }))
                return;

            if (ffind(function (a) { return isInOneParent(a, fi) && a.__worldPosition.y > wp.y }))
                return;

            if (ffind(function (a) { return isInOneParent(a.__parent, fi.__parent) && a.__worldPosition.y == wp.y && a.__worldPosition.x > wp.x; }))
                return;

            if (ffind(function (a) { return isInOneParent(a.__parent, fi.__parent) && a.__worldPosition.y > wp.y }))
                return;

            if (ffind(function (a) { return isInOneParent(a.__parent.__parent, fi.__parent.__parent) && a.__worldPosition.y == wp.y && a.__worldPosition.x > wp.x; }))
                return;

            if (ffind(function (a) { return isInOneParent(a.__parent.__parent, fi.__parent.__parent) && a.__worldPosition.y > wp.y }))
                return;

        }

    }


};



modClass(Node, {}, {
    __propertyBinding: {
        set(v) {
            this.__propertyBinding__ = v;
            if (!__propertiesAppliedByClass) {
                this.__selfProperties.__propertyBinding = v;
            }
        },
        get() { return this.__propertyBinding__ }
    }
});
