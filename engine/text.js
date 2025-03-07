var globalTextCache = [];
var globalTextCleaner;

function TextPParameters() {
    Object.apply(this);
    mergeObj(this, __defaultTextProperties);
}
TextPParameters.prototype = ObjectCreate(Object.prototype);
var colorStringProperty = {
    get: function () { return color_to_string(this.__color); },
    set: function (v) { this.__color = v; }
};

ObjectDefineProperties(TextPParameters.prototype, { __colorString: colorStringProperty });

function Text() {
    var t = this;
    Object3D.call(t);
    t.____anchor = new Vector3(0, 0, 0);
    t.__needUpdate = 1;
    t.__p = new TextPParameters();

    if (!options.__disableGlobalTextCache)
        globalTextCache.push(t);
    //cheats
    renderInfo.texts++;
    //endcheats

}


Text.prototype = Object.create(NodePrototype);
var TextPrototype = Text.prototype;


function rgb_color_string(r, g, b) {
    return "#" + d2h(r) + d2h(g) + d2h(b);
}

function srgbad(d) {
    return d < 1 ? d ? round(d * 1000) / 1000 : 0 : 1;
}

function color_to_string(c, alpha) {
    if (alpha == undefined) alpha = 1;
    if (c) {
        if (!c.__isColor) {
            c = jsonToColor(c);
        }
        if (alpha != 1) {
            return "rgba(" + round(c.r * 255) + "," + round(c.g * 255) + "," + round(c.b * 255) + "," + srgbad(alpha) + ")";
        }
        return rgb_color_string(c.r * 255, c.g * 255, c.b * 255);
    }

    if (alpha != 1) {
        return "rgba(0,0,0," + srgbad(alpha) + ")";
    }

    return '#000000';


}

function getFontAscent() { return (options.__defaultTextProperties || 0).__fontAscent || 0.7; }

// -----------------
//           
//         _______
//      aa     ^
//     a a     |
//    aaaa     | 0.7  ascent
//   a   a     |
// -a----a-----v----

function getFontDescent() { return (options.__defaultTextProperties || 0).__fontDescent || 0.3; }

// ------------
//         
//     *
//     
//     j
//     j   
// ----j------^
//     j      | 0.3 descent
//   jj   ____v

var shadowBlurTextureSizeMultiplier = 0.6;
function parseHexColor(text, k, index, d) {
    text = text.toLowerCase();
    k = k || 0; index = index || 0; d = d || text.charAt(k);
    var color = new Color(1, 1, 1);

    if (d == ';') return color;
    if (((d >= 'a') && (d <= 'f')) || ((d >= '0') && (d <= '9'))) {
        var l = 0, c = 0, s = '', ll = index + 8;
        for (; k <= ll; k++) {
            c = text.charAt(k);
            if (!c || k == ll || c == ';' || c == ' ') {

                switch (l) {
                    case 1:
                        color.__setScalar(parseInt(s + s, 16) / 255);
                        break;
                    case 2:
                        color.__setScalar(parseInt(s, 16) / 255);
                        break;
                    case 3:
                        color.r = parseInt(s.charAt(0) + s.charAt(0), 16) / 255;
                        color.g = parseInt(s.charAt(1) + s.charAt(1), 16) / 255;
                        color.b = parseInt(s.charAt(2) + s.charAt(2), 16) / 255;
                        break;
                    case 4:
                        color.r = parseInt(s.charAt(0) + s.charAt(0), 16) / 255;
                        color.g = parseInt(s.charAt(1) + s.charAt(1), 16) / 255;
                        color.b = parseInt(s.charAt(2) + s.charAt(2), 16) / 255;
                        color.a = parseInt(s.charAt(3) + s.charAt(3), 16) / 255;
                        break;
                    case 6:
                        color.r = parseInt(s.charAt(0) + s.charAt(1), 16) / 255;
                        color.g = parseInt(s.charAt(2) + s.charAt(3), 16) / 255;
                        color.b = parseInt(s.charAt(4) + s.charAt(5), 16) / 255;
                        break;
                    case 8:
                        color.r = parseInt(s.charAt(0) + s.charAt(1), 16) / 255;
                        color.g = parseInt(s.charAt(2) + s.charAt(3), 16) / 255;
                        color.b = parseInt(s.charAt(4) + s.charAt(5), 16) / 255;
                        color.a = parseInt(s.charAt(6) + s.charAt(7), 16) / 255;
                        break;
                }

                return color;

            }
            s += c;
            l++;
        }

        return color;

    }


}

function parseTextColor(text, k, index) {

    var d = text.charAt(k)
        , index = k;

    if (!d || d == ';') return { c: 0xDEAD };

    var color = new Color(1, 1, 1);

    if (d == '.') {
        color.__setScalar(parseFloat(text.substring(k)));
        return { c: color };
    }

    var hc = parseHexColor(text, k, index, d);
    if (hc) {
        return { c: hc };
    } else
        switch (d) {
            case '+': case '-':
            case '*': case '/':
                var s = parseTextColor(text, k + 1);
                if (s)
                    return { c: s.c, d: d }
        }

}


function tokenizeText(text) {

    var re = /\\([^;]+;)/;
    return $map(text.split(re), function (tokenText) {
        if (tokenText.endsWith(';')) {
            switch (tokenText.charAt(0)) {
                case '#':
                    var c = parseTextColor(tokenText, 1);
                    if (c) {
                        return c;
                    }
                    break;
                case 's':
                    var fontSize = numeric(tokenText.substr(1));
                    if (fontSize) {
                        return { fs: fontSize };
                    }
                    break;
            }
        }
        return { v: tokenText };
    });
}

var tempCalcCanvasContext;


function addTextProp(props, obj, p) {

    if (isObject(props[p])) {
        obj[p] = props[p];
    } else
        obj[p] = {
            get: function () {
                return this.__p[p];
            },
            set: function (v) {
                var t = this;
                if (t[p] != v) {
                    t.__p[p] = v;
                    t.__needUpdate = 1;
                }
            }
        }

}


ObjectDefineProperties(TextPrototype,

    addProps(__defaultTextProperties,
        {
            __alpha: { get() { return this.__parent.__alpha }, set() { } },
            __colorString: colorStringProperty,
            __shadow: ShadowPropertyPrototype(1)
        },
        addTextProp
    )

);

function updateAllTextsThenFontLoaded(face) {
    globalTextCache.forEach(function (t) {
        if (t.__fontface == face)
            t.__needUpdate = 1;
    });
}

var fontWeights = ['', 'bold', 'bolder', 'lighter', 100, 200, 300, 400, 500, 600, 700, 800, 900];

function createTextGradientStyle(v, ctx, canvas) {
    if (isArray(v)) {
        //warning: now just height gradient
        if (v.length > 1) {
            var gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            for (var len = v.length, i = 0; i < len; i++) {
                gradient.addColorStop(i / (len - 1), color_to_string(v[i]));
            }
            return gradient;
        }
        return color_to_string(v[0]);
    }

}

mergeObj(TextPrototype, {

    constructor: Text,

    ____validToSave: 0,
    __notNormalNode: 1,

    __clone: function () {
        return deepclone(this.__p);
    },

    __init: function (parameters) {
        var t = this;

        if (!isObject(parameters)) {
            parameters = { __text: parameters == undefined ? '' : parameters }
        }

        if (parameters.hasOwnProperty('__shadow')) {
            t.__shadow = parameters.__shadow;
        }
        mergeObj(t.__p, parameters);

        if (t.__p.__shadow)
            t.__shadow = t.__p.__shadow;

        t.__needUpdate = 1;

        return t;
    },

    __isText: 1,

    //     __canBeFrustummed: 1,

    __render: function () {
        var t = this;
        t.__lastRenderTime = TIME_NOW;
        t.__rendered = 1;


        //cheats
        renderInfo.textsRendered++;
        //endcheats

        var t = this;
        // debugger;
        if (t.__needUpdate) {
            t.update();
            if (t.__matrixWorldNeedsUpdate || t.__matrixNeedsUpdate)
                t.__updateMatrixWorld();
        }

        if (t.__parent) { t.__opacityDeep = t.__alphaDeep * t.__parent.__opacityDeep; }

        if (t.__indecesBuffer) {
            renderer.__draw(t, t.__indecesBuffer.__realsize, 'base');
        }

        return 1;
    },

    __clearTexture: function () {
        var t = this;

        if (t.__bufferTexture) {
            //             consoleLog( 'clear ', TR(this.__p.__text) );

            //cheats
            renderInfo.textsTextures--;
            //endcheats

            t.__bufferTexture.__destruct();
            t.__bufferTexture = 0;
        }

        //cheats
        else if (t.map) {
            renderInfo.textsTextures--;
        }
        //endcheats

        if (t.map) {
            //debug
            if (t.map.txt == this) t.map.txt = undefined; else debugger;
            //undebug
            //         consoleLog( 'clear ', TR(this.__p.__text) );

            t.map.__destruct();
            t.map = 0;
        }

        t.__ctx = undefined;

    },

    __destruct: function () {
        var t = this;
        t.__clearTexture();

        t.__killAllAnimations();

        for (var i in t.__buffers)
            t.__buffers[i].__destruct();

        removeFromArray(this, globalTextCache);

        //cheats
        renderInfo.texts--;
        //endcheats
        return Object3DPrototype.__destruct.call(t.__clearChildNodes());

    },

    __getFontMod: function () {
        return (this.__italic ? 'italic ' : '') + (this.__smallCaps ? 'small-caps ' : '') + (this.__fontWeight ? fontWeights[this.__fontWeight] + ' ' : '');
    },

    __getFont: function (fs) {
        var t = this, ff = t.__fontface || __defaultTextProperties.__fontface;
        if (!ff || !globalConfigsData[ff] || globalConfigsData[ff] == 1) {
            ff = __defaultTextProperties.__safeFontFace;
        }
        return this.__getFontMod() + fs * t.__scaleFactor + "px \"" + ff + '"';
    },

    raycast: function () {

    },

    __fill: function (text, x, y) {
        var t = this;
        if (t.__lineWidth > 0) {
            t.__ctx.lineCap = t.__ctx.lineJoin = 'round';
            t.__ctx.miterLimit = 2;
            t.__ctx.strokeText(text, x * t.__scaleFactor, y * t.__scaleFactor);
        }

        t.__ctx.fillText(text, x * t.__scaleFactor, y * t.__scaleFactor);
    },

    // find needed texture size and cache lines params for drawing
    
    __calcWidthReturnObj: function (txt) {
        var t = this;
        txt = txt.replace(/\\[^;]*;/g, '');
        return {
            w: floor((t.__charw > 0 ? t.__charw * txt.length : tempCalcCanvasContext.measureText(txt).width) + (txt.length - 1) * t.__fontspacing + 1),
            t: txt
        }
    },

    __drawString: function (text, x, y, bySymbol) {
        var t = this
            , tokens = tokenizeText(text)
            , lastDrawToken = 0
            , charw = t.__charw / t.__scaleFactor;

        for (var i in tokens) {
            var token = tokens[i];
            text = token.v;

            if (text) {
                if (bySymbol) {
                    var c = 0
                    if (t.__symbol_align == ALIGN_CENTER && charw){
                        for (var k = 0; k < text.length; k++) {
                            c = text.charAt(k);
                            var cw = (t.__ctx.measureText(c).width + t.__fontspacing) / t.__scaleFactor
                            t.__fill(c, x + (charw - cw) / 2, y);
                            //Increment X by wChar + spacing
                            x += charw;
                        }
                    } else { 
                        // todo: ALIGN_RIGHT?
                        for (var k = 0; k < text.length; k++) {
                            c = text.charAt(k);
                            t.__fill(c, x, y);
                            //Increment X by wChar + spacing
                            x += charw > 0 ? charw : (t.__ctx.measureText(c).width + t.__fontspacing) / t.__scaleFactor;
                        }
                    }
                } else {
                    if (i > 0 && lastDrawToken) {
                        x += t.__calcWidthReturnObj(lastDrawToken.v).w / t.__scaleFactor;
                    }
                    t.__fill(text, x, y);
                    lastDrawToken = token;
                }
            }
            else if (token.c) { // color

                var color = token.c;
                var currentColor;
                if (color == 0xDEAD) {
                    currentColor = t.__color;
                } else {
                    if (token.d) {
                        currentColor = t.____color == undefined ? t.__color : t.____color;
                    } else {
                        currentColor = color;
                    }
                }

                if (!currentColor.__isColor) currentColor = new Color(currentColor);

                switch (token.d) {
                    case '+': currentColor.add(color); break;
                    case '-': currentColor.sub(color); break;
                    case '*': currentColor.__multiply(color); break;
                    case '/': currentColor.__divide(color); break;

                }

                t.____color = currentColor.__clone();

                t.__ctx.fillStyle = color_to_string(currentColor);

            }
            else if (token.fs) { // fontsize

                t.__ctx.font = t.__getFont(token.fs);


            }
        }

    },

    update: function (deep) {
        var t = this, parent = t.__parent;
        //debug
        if (t.__debugUpdate)
            debugger;
        //undebug

        if (!parent) return;

        if (parent.__needUpdate) {
            parent.update();
        }

        if (!t.__scaleFactor) {
            t.__scaleFactor = scaleFactor || 1;
        }

        var size = parent.__contentSize.__clone();

        if (t.__autowrap) {
            var aosz = parent.____size;
            var msz = parent.__maxsize;
            if (msz && aosz) {
                if (aosz.px == 'o') {
                    size.x = mmax(msz.x, size.x);
                }

                if (aosz.py == 'o') {
                    size.y = mmax(msz.y, size.y);
                }
            }
        }

        if (t.__autoRecalcOnResize) {

            if (!t.__cachedSize) {
                t.__cachedSize = size;
            }

            if (t.__cachedSize.x != size.x || t.__cachedSize.y != size.y) {
                t.__needUpdate = 1;
            }

        }


        if (t.__needUpdate) {

            var text = t.__text;
            if (text === undefined) return;

            text = t.__dontLocalize ? text : "" + TR(text);
            //              consoleLog( 'generate ', text);
            if (text == undefined || !text.length) {
                t.____visible = 0;
                return;
            } else
                if (text) {

                    //cheats
                    renderInfo.textsGenerated++;
                    //endcheats

                    t.____visible = 1;
                    t.__matrixNeedsUpdate = 1;


                    if (!tempCalcCanvasContext) {
                        tempCalcCanvasContext = __document.createElement('canvas').getContext('2d');
                    }

                    var fs = t.__fontsize
                        , linespacing = t.__lineSpacing + t.__addedLineSpacing * t.__addedLineSpacingMultiplier
                        , textLines = text.split('\n')
                        , charw = t.__charw
                        , lineWidth = t.__lineWidth || 0
                        , w = 0
                        , rw = 0
                        , h = 0
                        , rh = 0
                        , cachedlines = []
                        , startedX = lineWidth
                        , startedY = fs
                        , shadow = t.__shadow
                        , shadowBlur = 0
                        , shadowX = 0
                        , shadowY = 0
                        , rwDiff = 0
                        , rhDiff = 0
                        , canvas = t.__canvas || __document.createElement('canvas');

                    tempCalcCanvasContext.font = t.__getFont(fs);

                    if (shadow) {
                        shadowX = shadow.x;
                        shadowY = shadow.y;
                        shadowBlur = shadow.__blur * shadowBlurTextureSizeMultiplier;

                        startedX += mmax(0, shadowBlur - shadowX);
                        startedY += mmax(0, shadowBlur - shadowY);
                    }

                    rwDiff = rhDiff = shadowBlur;

                    rwDiff += mmax(shadowBlur, abs(shadowX));
                    rhDiff += mmax(shadowBlur, abs(shadowY));

                    var pushtocache = function (text) {

                        var textWidth;

                        if (isObject(text)) {
                            textWidth = text.w;
                            text = text.t;
                        }
                        else {
                            textWidth = t.__calcWidthReturnObj(text).w / t.__scaleFactor;
                        }
                        var realTextWidth = textWidth + rwDiff;

                        w = mmax(w, textWidth);
                        rw = mmax(rw, realTextWidth);

                        cachedlines.push({
                            t: text,
                            w: textWidth,
                            y: (fs + linespacing) * cachedlines.length
                        });

                    }


                    if (this.__autowrap) {

                        //debug
                        if (this.__parent.__debugWrap)
                            debugger;
                        //undebug

                        var availableWidth = size.x * t.__scaleFactor
                            , localizationOptions = options.__localization || 0
                            , autowrapMap = localizationOptions.__autowrapMap || 0
                            //можно перенести на новую строку если есть autowrapMap
                            , chks = function (s) {
                                return autowrapMap.ns.indexOf(s) < 0 && autowrapMap.__canWrapSymRegexp.test(s);
                            }
                            , chkse = function (s) {
                                return autowrapMap.ne.indexOf(s) < 0 && autowrapMap.__canWrapSymRegexp.test(s);
                            }
                            , isSmallKana = function (s) {
                                return autowrapMap.__smallKana.indexOf(s) >= 0
                            }
                            , canWrapSymbol = function (txt, i) {
                                if (i > 0 && i < txt.length) {
                                    var prev = txt.charAt(i - 1), cur = txt.charAt(i), next = txt.charAt(i + 1);
                                    return chks(cur) && chkse(prev) && !isSmallKana(prev) && !isSmallKana(cur) && !isSmallKana(next);
                                }
                            }

                            , split2 = function (txt, needWidth) {

                                var textWidth;

                                if (isObject(txt)) {
                                    textWidth = txt.w;
                                    txt = txt.t;
                                }
                                else {
                                    textWidth = t.__calcWidthReturnObj(txt).w;
                                }

                                function rtn(l, k) {
                                    return [txt.substring(0, l), txt.substring(l + (k || 0))];
                                }

                                if (textWidth > needWidth) {

                                    var koeff = needWidth / textWidth
                                        , len = txt.length
                                        , l = floor(koeff * len)
                                        , i = l + 1, j = l - 1
                                        , lc = txt.charAt(l)
                                        , kk = 0;

                                    if (lc == ' ') return rtn(l, 1);

                                    if (autowrapMap) {

                                        if (canWrapSymbol(txt, l)) { return rtn(l, 0); }

                                        for (; kk < 20; kk++, i++, j--) {
                                            if (canWrapSymbol(txt, i)) return rtn(i, 0);
                                            if (txt.charAt(i) == ' ') return rtn(i, 1);
                                            if (canWrapSymbol(txt, j)) return rtn(j, 0);
                                            if (txt.charAt(j) == ' ') return rtn(j, 1);
                                        }
                                    } else {

                                        for (; kk < 20; kk++, j--, i++) {
                                            if (i < len && txt.charAt(i) == ' ') return rtn(i, 1);
                                            if (j > 0 && txt.charAt(j) == ' ') return rtn(j, 1);
                                        }
                                    }

                                }
                            }

                        var wraptext = function (text, availableWidth) {

                            //  consoleLog(text);
                            
                            var newlines = split2(text, availableWidth);

                            if (newlines) {
                                var line1 = newlines[0];
                                var line2 = newlines[1];
                                // consoleLog('splitted to:', '\nline1: ',line1,'\n\nline2: ', line2, '\n\n');

                                var width = t.__calcWidthReturnObj(line1).w;

                                // consoleLog(width , availableWidth);

                                if (width < availableWidth) {

                                    var findFirstSpace = autowrapMap ? function (line) {
                                        for (var i = 1, l = mmax(1, mmin(line.length - 2, 5)); i < l; i++) {
                                            if (canWrapSymbol(line, i))
                                                return i;
                                        }
                                    } : function (line) {
                                        return line.indexOf(' ');
                                    }

                                    var firstSpace = findFirstSpace(line2);
                                    while (firstSpace > 0) {

                                        var firstWorld = (autowrapMap ? '' : ' ') + line2.substring(0, firstSpace)
                                            , addedWidth = t.__calcWidthReturnObj(firstWorld).w;

                                        if (width + addedWidth < availableWidth) {
                                            line1 += firstWorld;
                                            line2 = line2.substring(firstSpace + (autowrapMap ? 0 : 1));
                                            width += addedWidth;
                                        } else {
                                            break;
                                        }

                                        var firstSpace = findFirstSpace(line2);
                                    }

                                } else {

                                    var findLastSpace = autowrapMap ? function (line) {
                                        for (var i = line.length - 1; i > 1; i--) {
                                            if (canWrapSymbol(line, i))
                                                return i;
                                        }
                                    } : function (line) {
                                        return line.lastIndexOf(' ');
                                    }

                                    var lastSpace = findLastSpace(line1);

                                    while (lastSpace > 0) {
                                        var lastWorld = line1.substring(lastSpace + (autowrapMap ? 0 : 1)) + (autowrapMap ? '' : ' ');
                                        var removedWidth = t.__calcWidthReturnObj(lastWorld).w

                                        line2 = lastWorld + line2;
                                        line1 = line1.substring(0, lastSpace);
                                        width -= removedWidth;

                                        if (width <= availableWidth)
                                            break;

                                        lastSpace = findLastSpace(line1);
                                    }

                                }

                                pushtocache(line1);

                                if (line2.length)
                                    wraptext(line2, availableWidth);

                            } else {
                                pushtocache(text);

                            }

                        }

                        for (var i = 0; i < textLines.length; i++) {
                            wraptext(textLines[i], availableWidth);
                        }

                    }
                    else {
                        for (var i in textLines) {
                            pushtocache(textLines[i]);
                        }
                    }


                    for (var i in cachedlines) {
                        cachedlines[i].x = t.__align * (-cachedlines[i].w + w) / 2;
                    }

                    var linesCount = cachedlines.length;

                    h = linesCount * fs + (linesCount - 1) * linespacing;
                    rh = floor((linesCount + getFontDescent()) * fs + (linesCount - 1) * linespacing + rhDiff);
                    rw = floor(rw + lineWidth * 2 + (t.__italic ? fs * 0.1 : 0));

                    canvas.width = rw * t.__scaleFactor;
                    canvas.height = rh * t.__scaleFactor;

                    var ctx = canvas.getContext('2d');
                    t.__ctx = ctx;

                    if (shadow) {
                        mergeObj(ctx, {
                            shadowColor: color_to_string(shadow.__color, shadow.__alpha),
                            shadowOffsetX: shadowX,
                            shadowOffsetY: shadowY,
                            shadowBlur: shadowBlur / shadowBlurTextureSizeMultiplier
                        });
                    }

                    if (lineWidth > 0) {
                        mergeObj(ctx, {
                            lineWidth: lineWidth,
                            strokeStyle: color_to_string(t.__lineColor, t.__lineAlpha)
                        });
                    }

                    mergeObj(ctx, {
                        font: t.__getFont(fs),
                        fillStyle: t.__gradient ? createTextGradientStyle(t.__gradient, ctx, canvas) : color_to_string(t.__color /* TODO: t.__alpha */)
                    });


                    // drawing text
                    var bySymbol = (t.__fontspacing != 0 || charw != 0);

                    for (var i in cachedlines) {

                        var cachedLine = cachedlines[i];
                        t.__drawString(cachedLine.t, cachedLine.x + startedX, cachedLine.y + startedY, bySymbol);

                    }


                    // generate texture from surface. canvas contents will be used for a texture
                    //cheats
                    renderInfo.textsTextures++
                    //endcheats
                    var texture = new Texture(canvas, { v: 1 });

                    var textShader = t.__shader;
                    //debug
                    texture.txt = t;
                    //undebug
                    t.__ctx = undefined;
                    if (textShader) {

                        t.__notReady = 1;
                        if (!t.map) {
                            t.__clearTexture();
                            t.map = texture;
                        }

                        var shaderOpts = set({
                            __shader: textShader,
                            map: texture,
                            color: jsonToColor(t.__color)
                        },
                            'w', rw * t.__scaleFactor,
                            'h', rh * t.__scaleFactor,
                            'fs', fs,
                            'lw', lineWidth);

                        looperPost(function () {
                            delete t.__notReady;
                            t.__updateGeometry().__updateMatrixWorld();
                            var bufferTexture = renderOverTexture(rw * t.__scaleFactor, rh * t.__scaleFactor, shaderOpts);
                            t.__clearTexture();
                            //cheats
                            renderInfo.textsTextures++
                            //endcheats
                            t.map = bufferTexture.__texture;
                            //debug
                            t.map.txt = t;
                            //undebug
                            t.__bufferTexture = bufferTexture;
                        });

                    } else {
                        t.__clearTexture();
                        t.map = texture;
                        //debug
                        t.map.txt = t;
                        //undebug
                    }

                    t.____sizeToAdjustment = {
                        w: w,
                        h: h,
                        a: (h / 2 - fs * getFontAscent() / 4),
                        x: 0.5 * rw - lineWidth,
                        x1: mmax(0, shadowBlur - shadowX),
                        x2: mmax(0, shadowBlur + shadowX),
                        y: -mmax(0, shadowBlur + shadowY) + rh / 2 - fs * getFontDescent()
                    };

                    t.__size = [rw, rh];

                    if (t.__cacheCanvas)
                        t.__canvas = canvas;

                }

        }

        var pos = t.__ofs, sa = t.____sizeToAdjustment;
        if (sa) {
            // TODO: regenerate texture, modify fontsize, not scaleF
            var scale = 1;

            if (t.__autoscale) {
                scale *= mmin(1, mmin(size.x / sa.w, size.y / sa.h));
            }

            t.__scaleF = scale;

            var parentPadding = parent.__padding || [0, 0, 0, 0],
                halign = ifdef(parent.ha, ALIGN_CENTER),
                valign = ifdef(parent.va, ALIGN_CENTER);

            var hpad = ((parentPadding[1] || 0) - (parentPadding[3] || 0)) / 2;
            switch (halign) {
                case ALIGN_CENTER: pos.x = hpad; break;
                case ALIGN_START: pos.x = -size.x / 2 + (sa.x + hpad - sa.x1) * scale; break;
                case ALIGN_END: pos.x = size.x / 2 - (sa.x - hpad - sa.x2) * scale; break;
            }
            var vpad = ((parentPadding[2] || 0) - (parentPadding[0] || 0)) / 2;
            switch (valign) {
                case ALIGN_CENTER: pos.y = sa.y * scale - sa.a * scale + vpad; break;
                case ALIGN_START: pos.y = size.y / 2 + (sa.y - 2 * sa.a) * scale + vpad; break;
                case ALIGN_END: pos.y = -size.y / 2 + sa.y * scale + vpad; break;
            }

        }

        pos.y = -pos.y;
        pos.z = -0.1;
        if (parent.__stableZ && parent.z) {
            t.__stableZ = 1; t.z = parent.z + 0.1;
        }

        if (!globalTextCleaner) {
            globalTextCleaner = 1;
            _setInterval(function () {
                for (var i = 0; i < globalTextCache.length; i++) {
                    var t = globalTextCache[i];
                    //                     if (!t.__needUpdate) {
                    if (t.__lastRenderTime < TIME_NOW - 6) {
                        if (!t.__rendered) {
                            t.__clearTexture();
                            t.__needUpdate = 1;
                        }
                    } else
                        if (t.__lastRenderTime < TIME_NOW - 5) {
                            t.__rendered = 0;
                        }
                    //                     }
                }

            }, 2);
        }

        t.__updateGeometry();
        t.__needUpdate = 0;
        t.__needUpdateDeep = 0;

    }
});

// experimental mem usage hack
Text.prototype.__cacheCanvas = 1;

