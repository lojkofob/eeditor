
var ColorPickerPanel;

(function () {

    var proxyColorObject = {};

    ObjectDefineProperties(proxyColorObject, {

        r: {
            get: function () { return this.value.r; },
            set: function (v) { var vv = this.value; vv.r = v; this.value = vv; }
        },

        g: {
            get: function () { return this.value.g; },
            set: function (v) { var vv = this.value; vv.g = v; this.value = vv; }
        },

        b: {
            get: function () { return this.value.b; },
            set: function (v) { var vv = this.value; vv.b = v; this.value = vv; }
        },

        value: {
            set: function (v) {
                var c;

                if (isNumeric(v)) {
                    c = new Color(v, v, v);
                }

                if (!c) {
                    c = v.__isColor ? v : isString(v) ? parseHexColor(v.replace('#', '')) : 0;
                }

                if (c) {
                    var o = {};
                    o[ColorPickerPanel.__property] = c;
                    invokeEventWithKitten('set', o, {
                        withHistory: 1,
                        withHistoryStack: this.withHistoryStack
                    });
                    updateColorPicker();
                }
            },

            get: function () {
                var c = null;
                var n = getSelectedNodes()[0];
                if (n) {
                    if (ColorPickerPanel.__property == '__color') {
                        if (n.__baseColor) {
                            c = new Color(n.__baseColor.r, n.__baseColor.g, n.__baseColor.b);
                        }
                    }

                    if (!c) {
                        c = getPropVal(n, ColorPickerPanel.__property);
                    }

                    if (c && c.__isColor) {
                        //validate
                        if (c.r == undefined) c.r = 0;
                        if (c.g == undefined) c.g = 0;
                        if (c.b == undefined) c.b = 0;
                    }

                    if (isString(c)) {
                        var hc = parseHexColor(c.replace('#', ''));
                        if (hc) return hc;
                    }
                }

                if (c == null) {
                    c = 1;
                }

                return new Color(c);
            }
        },

        h: {
            set: function (v) {
                v = clamp(v, 0, 1);
                lastHSV.disableVChange = 1;
                lastHSV.disableSChange = 1;
                lastHSV.h = v;
                proxyColorObject.value = new Color().setHSV(lastHSV.h, lastHSV.s, lastHSV.v);
            },
            get: function () { return lastHSV.h }

        },

        s: {
            set: function (v) {
                v = clamp(v, 0, 1);
                lastHSV.disableHChange = 1;
                lastHSV.disableVChange = 1;
                lastHSV.s = v;
                proxyColorObject.value = new Color().setHSV(lastHSV.h, lastHSV.s, lastHSV.v);
            },
            get: function () { return lastHSV.s }
        },

        v: {
            set: function (v) {
                v = clamp(v, 0, 1);
                lastHSV.disableHChange = 1;
                lastHSV.disableSChange = 1;
                lastHSV.v = v;
                proxyColorObject.value = new Color().setHSV(lastHSV.h, lastHSV.s, lastHSV.v);
            },

            get: function () { return lastHSV.v }
        }


    });



    function updateSliderHSV(sl, v) {

        var thumb = sl.thumb
            , sy = sl.__size.y / 2
            , y = v * 2 * (sy - 2) - sy + 2;

        thumb.__y = mmin(sy - 2, mmax(-sy + 2, y));

    }

    function updateSlider(sl, val) {
        if (val == undefined)
            return;

        var slider = sl.slider || sl
            , thumb = slider.thumb
            , v = val.__isColor ? (val.r + val.g + val.b) / 3 : val
            , sx = slider.__size.x / 2
            , x = v * 2 * (sx - 6) - sx + 6;

        thumb.__x = mmin(sx - 6, mmax(-sx + 6, x));

        EditFieldsWithKitten.updatePropertyData(sl.name, sl.value, proxyColorObject, val);

    }

    mergeObjectDeep(EditorUIBehavioursWithKitten, {

        behaviours: {

            colorPicker: function (n) {

                ColorPickerPanel = n;
                ColorPickerPanel.__onTap = 1;
                ColorPickerPanel.__parent.__visible = 0;

                ColorPickerPanel.__parent.__wheel = 1;


                function prepareSlider(sl) {

                    var slider = sl.slider
                        , thumb = slider.thumb
                        , sx = slider.__size.x / 2;

                    sl.value.__numericInputStep = 0.01;

                    slider.__wheel = function (d) {

                        var val = proxyColorObject[this.__parent.name],
                            v = val.__isColor ? (val.r + val.g + val.b) / 3 : val;
                        proxyColorObject[this.__parent.name] = (v - d * (isShiftPressed ? 0.1 : 0.01));

                        return 1;
                    };

                    slider.__onTap = 1;
                    slider.__drag =
                        slider.__canDrag = function (x, y, dx, dy) {
                            var sp = slider.__worldPosition
                                , m = toNodeCoords(mouse, 1);
                            x = mmin(sx - 6, mmax(-sx + 6, m.x - sp.x));
                            proxyColorObject.withHistoryStack = dy != undefined;
                            thumb.__x = x;
                            proxyColorObject[this.__parent.name] = (x + sx - 6) / (sx - 6) / 2;
                            return 1;
                        }

                }

                EditFieldsWithKitten.bindInput(n.value.value, proxyColorObject, 'value');

                EditFieldsWithKitten.bindInput(n.r.value, proxyColorObject, 'r');
                EditFieldsWithKitten.bindInput(n.g.value, proxyColorObject, 'g');
                EditFieldsWithKitten.bindInput(n.b.value, proxyColorObject, 'b');


                // _setInterval( updateColorPicker, 1 );

                prepareSlider(ColorPickerPanel.r);
                prepareSlider(ColorPickerPanel.g);
                prepareSlider(ColorPickerPanel.b);
                prepareSlider(ColorPickerPanel.value);

                var pmap = ColorPickerPanel.__alias('pickermap');


                pmap.__onTap = 1;
                pmap.__canDrag =
                    pmap.__drag = function (x, y, dx, dy) {

                        var sz = pmap.__size
                            , sp = pmap.__worldPosition
                            , m = toNodeCoords(mouse, 1);

                        sz.x /= 2;
                        sz.y /= 2;

                        x = mmin(sz.x, mmax(-sz.x, sp.x - m.x));
                        y = mmin(sz.y, mmax(-sz.y, m.y - sp.y));

                        lastHSV.s = 1 - clamp((x + sz.x) / (sz.x) / 2, 0, 1);
                        lastHSV.v = 1 - clamp((y + sz.y) / (sz.y) / 2, 0, 1);

                        lastHSV.disableHChange = 1;
                        proxyColorObject.withHistoryStack = dy != undefined;
                        proxyColorObject.value = new Color().setHSV(lastHSV.h, lastHSV.s, lastHSV.v);

                        return 1;
                    };

                function prepareSliderHSV(slider, property, sign, hasOverrun) {

                    slider.__wheel = function (d) {
                        var v = proxyColorObject[property];
                        var next = v + sign * d * (isShiftPressed ? 0.1 : 0.01);
                        if (hasOverrun) {
                            if (next < 0) next = 1 + next;
                            if (next > 1) next = next - 1;
                        }
                        proxyColorObject[property] = next;
                        return 1;
                    };

                    slider.__onTap = 1;
                    slider.__canDrag =
                        slider.__drag = function (x, y, dx, dy) {

                            var sz = slider.__size, sp = slider.__worldPosition;
                            sz.y /= 2;
                            var m = toNodeCoords(mouse, 1);
                            y = mmin(sz.y, mmax(-sz.y, (sp.y - m.y) * sign));
                            proxyColorObject.withHistoryStack = dy != undefined;
                            proxyColorObject[property] = 1 - clamp((y + sz.y) / (sz.y) / 2, 0, 1);

                            return 1;
                        };

                }

                prepareSliderHSV(pmap.hue, 'h', 1, 1);
                prepareSliderHSV(pmap.saturation, 's', 1);
                prepareSliderHSV(pmap.value, 'v', -1);
                if (EditFieldsWithKitten.inputsForProperties.Node.__color)
                    EditFieldsWithKitten.inputsForProperties.Node.__color.push(ColorPickerPanel);
                ColorPickerPanel.updatePropertyData = updateColorPicker;
            },

            color: function (n) {
                n.__onFocus = function () {
                    if (ColorPickerPanel) {
                        ColorPickerPanel.__property = n.__property;
                        invokeEventWithKitten('Editor.showPanel', {
                            caller: ColorPickerPanel
                        });
                        updateColorPicker();

                    }
                }

            }

        }

    });

    var lastHSV = { h: 0, s: 0, v: 0 };
    function updateColorPicker() {
        if (ColorPickerPanel && ColorPickerPanel.__parent.__visible) {

            var c = proxyColorObject.value;
            updateSlider(ColorPickerPanel.r, c.r);
            updateSlider(ColorPickerPanel.g, c.g);
            updateSlider(ColorPickerPanel.b, c.b);

            updateSlider(ColorPickerPanel.value, c);

            var pmap = ColorPickerPanel.__alias('pickermap'),
                sz = pmap.__size;



            var newHSV = c.getHSV(lastHSV);

            if (!lastHSV.disableHChange) lastHSV.h = newHSV.h;
            if (!lastHSV.disableSChange) lastHSV.s = newHSV.s;
            if (!lastHSV.disableVChange) lastHSV.v = newHSV.v;

            lastHSV.disableHChange = 0;
            lastHSV.disableSChange = 0;
            lastHSV.disableVChange = 0;

            var c = new Color(lastHSV.h, lastHSV.s, lastHSV.v);

            pmap.thumb.__x = clamp(c.g * sz.x - 4, -4, sz.x);
            pmap.thumb.__y = clamp(sz.y - c.b * sz.y - 4, -4, sz.y);

            pmap.value.__color =
                pmap.saturation.__color =
                pmap.hue.__color =
                pmap.__color = c;

            updateSliderHSV(pmap.hue, lastHSV.h);
            updateSliderHSV(pmap.saturation, lastHSV.s);
            updateSliderHSV(pmap.value, 1.0 - lastHSV.v);

        }
    }

    BUS.__addEventListener({
        __ON_NODE_SELECTED: looperPostOne(updateColorPicker),
        __OBJECT_CHANGED_set: function (e, c) {
            if (c && c.prop && c.prop.indexOf('color' > 0))
                updateColorPicker();
        }
    })

    function getColorFromScreen() {

        var oldGM = gestures.move;
        var oldGT = gestures.tap;
        options.__gesturesTapNotFirst = 0;

        proxyColorObject.withHistoryStack = 1;

        gestures.tap = function () {
            proxyColorObject.withHistoryStack = 0;
            looperPost(function () {
                options.__gesturesTapNotFirst = 1;
            });
            gestures.tap = oldGT;
            gestures.move = oldGM;
            return 1;
        }

        gestures.move = function () {

            Editor.__afterFrame = function () {
                var b = new Uint8Array(4);
                gl.readPixels(mouse.x, __realScreenSize.y - mouse.y, 1, 1, gl.RGB, gl.UNSIGNED_BYTE, b);
                looperPost(function () {
                    proxyColorObject.value = new Color(b[0] / 255, b[1] / 255, b[2] / 255);
                });
                Editor.__afterFrame = 0;
            }

        }

    }

    addEditorEvents('ColorPicker', {

        getImgColorFromScreen: function () {
            ColorPickerPanel.__property = '__color';
            getColorFromScreen();
        },

        getTextColorFromScreen: function () {
            ColorPickerPanel.__property = '__text.__color';
            getColorFromScreen();
        },

        getColorFromScreen: getColorFromScreen
    });

    addKeyboardMap({
        'alt+b': 'ColorPicker.getImgColorFromScreen',
        'alt+t': 'ColorPicker.getTextColorFromScreen'
    });


})();
