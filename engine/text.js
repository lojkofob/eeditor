var globalTextCache = []
    , globalTextCleaner

    , colorStringProperty = {
        get() { return color_to_string(this.__color); },
        set(v) { this.__color = v; }
    };
    
// gcc shim
String.prototype.trimEnd = String.prototype.trimEnd || get1(String.prototype, 'trimEnd');
String.prototype.trimStart = String.prototype.trimStart || get1(String.prototype, 'trimStart');

function TextPParameters() {
    Object.apply(this);
    mergeObj(this, __defaultTextProperties);
}
TextPParameters.prototype = ObjectCreate(Object.prototype);
ObjectDefineProperties(TextPParameters.prototype, { __colorString: colorStringProperty });

function Text() {
    var t = this;
    t.__selfProperties = {};
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
    d = d.toLowerCase();
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



var TextToken = makeClass(function(value) {
    this.__v = value;
}, {
    __calc(t, ctx) {

    },

    __draw(t, x, y, bySymbol) {
        var text = this.v;
        if (!text) return x;
        var sf = t.__scaleFactor, fontspacing = t.__fontspacing * sf, charw = t.__charw * sf;
        if (bySymbol) {
            var metricsCache = {}, c, symbol_align_factor = t.__symbol_align / 2, bb_align_factor = t.__bb_align;
            for (var k = 0; k < text.length; k++) {
                c = text.charAt(k);
                var metrics = metricsCache[c] || (metricsCache[c] = new TextMetrics(t, t.__ctx, c)), cw = metrics.w;
                t.__fill(c, x + (charw ? (charw - cw) * symbol_align_factor : 0) + bb_align_factor * (-metrics.r * symbol_align_factor + metrics.l * (1 - symbol_align_factor)), y * sf);
                x += (charw ? charw : cw) + fontspacing;
            }
        } else {
            t.__fill(text, x, y * sf);
            var m = this.__getMetrics(t, t.__ctx);
            x += round(m.w + (text.length - 1) * t.__fontspacing * sf + 1);
        }
        return x;
    },

    __getMetrics(t, ctx) { 
        return this.__metrics || (this.__metrics = new TextMetrics(t, ctx, this.v))
    }
}, {
    v: { get() { return this.__v }, set(v) { this.__v = v; this.__metrics = undefined; } },
});

var ColorToken = makeClass(function(c, d) {
    this.c = c;
    this.d = d;
}, { 
    __calc(t, ctx) {

    },
    __draw(t, x, y, bySymbol) {
        var color = this.c, currentColor;
        if (color == 0xDEAD) {
            currentColor = t.__color;
        } else {
            if (this.d) {
                currentColor = t.____color == undefined ? t.__color : t.____color;
            } else {
                currentColor = color;
            }
        }
        if (!currentColor.__isColor) currentColor = new Color(currentColor);
        switch (this.d) {
            case '+': currentColor.add(color); break;
            case '-': currentColor.sub(color); break;
            case '*': currentColor.__multiply(color); break;
            case '/': currentColor.__divide(color); break;
        }
        t.____color = currentColor.__clone();
        t.__ctx.fillStyle = color_to_string(currentColor);
        return x;
}});

var FontSizeToken = makeClass(function(fs) {
    this.fs = fs;
}, {
    __calc(t, ctx) {
        ctx.font = t.__getFont(this.fs);
        t.__currentLineHeight = mmax(this.fs, t.__currentLineHeight);
    },

    __draw(t, x, y, bySymbol) {
        t.__ctx.font = t.__getFont(this.fs);
        return x;
    }
});

var LineHeightToken = makeClass(function(h) {
    this.h = h;
}, {
    __calc(t, ctx) {
        t.__currentLineHeight = this.h;
    },
    __draw(t, x, y, bySymbol) {
        return x;
    }
});

var NewLineToken = makeClass(function() {}, { 
    __draw(t, x, y, bySymbol) {
    return x;
}});

var TextMetrics = makeClass(function(t, ctx, txt) {
    if (isString(txt)) {
        this.t = txt;
        var fallback = t.__fontsize * t.__bbMult
            , metrics = ctx.measureText(txt)
        this.w = get1(metrics, 'width') || 0;
        this.l = ifdef(get1(metrics, 'actualBoundingBoxLeft'), fallback)
        this.r = ifdef(get1(metrics, 'actualBoundingBoxRight'), fallback + this.w) - this.w;
    } else {
        this.l = this.r = this.w = 0;
    }
    
}, {
    
}, {
    
});

// Full tokenization: one flat array including newline tokens. Used from the start of update().
function tokenizeFullText(text) {
    var re = /\\([^;]+;)/;
    var parts = text.split(re);
    var out = [];
    for (var i = 0; i < parts.length; i++) {
        var tokenText = parts[i];
        if (tokenText.endsWith(';')) {
            switch (tokenText.charAt(0)) {
                case '#':
                    var c = parseTextColor(tokenText, 1);
                    if (c) { out.push(new ColorToken(c.c, c.d)); }
                    break;
                case 's':
                    var fontSize = numeric(tokenText.substr(1));
                    if (fontSize) { out.push(new FontSizeToken(fontSize)); }
                    break;
                case 'h':
                    var lineHeight = numeric(tokenText.substr(1));
                    if (lineHeight) { out.push(new LineHeightToken(lineHeight)); }
                    break;
            }
        } else {
            var segments = tokenText.split('\n');
            for (var j = 0; j < segments.length; j++) {
                if (j > 0) out.push(new NewLineToken());
                if (segments[j].length) out.push(new TextToken(segments[j]));
            }
        }
    }
    return out;
}

// Split tokens into lines (ranges). Returns array of { __start, __end }.
function getLinesFromTokens(tokens) {
    var lines = [], start = 0;
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i] instanceof NewLineToken) {
            lines.push({ __start: start, __end: i });
            start = i + 1;
        }
    }
    lines.push({ __start: start, __end: tokens.length });
    return lines;
}

// Trim a line (token range) to maxWidth. Mutates the last overflowing text token: trims it and appends "...".
// Returns newEnd — line is tokens[start..newEnd).
function trimLineTokensToWidth(t, tokens, line, dotsWidth) {
    var ctx = t.__ctx
        , sf = t.__scaleFactor
        , fontspacing = t.__fontspacing * sf
        , charw = t.__charw * sf
        , start = line.__start
        , end = line.__end
        , maxWidth = line.__availableWidth;

    dotsWidth = dotsWidth != null ? dotsWidth : measureLineTokens(t, [new TextToken("...")], { __start: 0, __end: 1 }).w;
    maxWidth -= dotsWidth;
    var totalW = 0;
    for (var i = start; i < end; i++) {
        var tok = tokens[i];
        if (!tok) break;

        tok.__calc(t, ctx);
        if (tok.v) {
            var txt = tok.v, len = txt.length;
            var segW = charw ? charw * len : (tok.__getMetrics(t, ctx).w + (len - 1) * fontspacing + (len ? 1 : 0));
            if (totalW + segW <= maxWidth) {
                totalW += segW;
                continue;
            }
            if (charw) {
                var fitChars = mmin(len, floor((maxWidth - totalW) / charw));
                tok.v = (fitChars > 0 ? txt.substring(0, fitChars) : "") + "...";
            } else {
                var lo = 0, hi = len;
                while (hi - lo > 1) {
                    var mid = (lo + hi) >> 1;
                    var sub = txt.substring(0, mid);
                    var m = new TextMetrics(t, ctx, sub).w + (mid - 1) * fontspacing + (mid ? 1 : 0);
                    if (totalW + m <= maxWidth) lo = mid; else hi = mid;
                }
                tok.v = (lo > 0 ? txt.substring(0, lo) : "") + "...";
            }
            return i + 1;
        }
    }
    return end;
}

/*

  , wraptext = function (text, availableWidth) {

                                //  consoleLog(text);

                                var newlines = split2(text, availableWidth);

                                if (newlines) {
                                    var line1 = newlines[0];
                                    var line2 = newlines[1];
                                    // consoleLog('splitted to:', '\nline1: ',line1,'\n\nline2: ', line2, '\n\n');

                                    var width = t.__calcWidthReturnObj(line1).w;

                                    // consoleLog(width , availableWidth);

                                    if (width < availableWidth) {

                                        var findFirstSpace = autowrapMap ? line => {
                                            for (var i = 1, l = mmax(1, mmin(line.length - 2, 5)); i < l; i++) {
                                                if (canWrapSymbol(line, i))
                                                    return i;
                                            }
                                        } : line => line.indexOf(' ');


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

                                        var findLastSpace = autowrapMap ? line => {
                                            for (var i = line.length - 1; i > 1; i--) {
                                                if (canWrapSymbol(line, i))
                                                    return i;
                                            }
                                        } : line => line.lastIndexOf(' ');

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

                                    if (line2.length) {
                                        wraptext(line2, availableWidth);
                                    }

                                } else {
                                    pushtocache(text);
                                }
                            };
                            */

// Split a line at needWidth. Mutates tokens: replaces split token with prefix, inserts suffix after it.
// Returns { __start, __end, __metrics [, __trimStart ] } — first line = tokens[start..__start), next line = tokens[__start..__end).
function splitLineTokens(t, tokens, opts) {
    var ctx = t.__ctx
        , start = opts.__start
        , end = opts.__end
        , needWidth = opts.__availableWidth
        , sf = t.__scaleFactor
        , fontspacing = t.__fontspacing * sf
        , charw = t.__charw * sf
        , autowrapMap = (options.__localization||{}).__autowrapMap || 0
        , totalW = 0
        , chks = s => autowrapMap.ns.indexOf(s) < 0 && autowrapMap.__canWrapSymRegexp.test(s)
        , chkse = s => autowrapMap.ne.indexOf(s) < 0 && autowrapMap.__canWrapSymRegexp.test(s)
        , isSmallKana = s => autowrapMap.__smallKana.indexOf(s) >= 0
        , canWrapSymbol = autowrapMap ? ((txt, idx) => {
            var prev = txt.charAt(idx - 1);
            if (prev == ' ') return 1;
            cur = txt.charAt(idx), next = txt.charAt(idx + 1);
            return chks(cur) && chkse(prev) && !isSmallKana(prev) && !isSmallKana(cur) && !isSmallKana(next);
        }) :
        ((txt, idx) => {
            return txt.charAt(idx - 1) == ' ';
        })
        , lastTextTokenIdx = -1;

    trimLineTokens(tokens, opts);

    for (var i = start; i < end; i++) {
        var tok = tokens[i];
        
        tok.__calc(t, ctx);

        if (tok.v) {
            var txt = tok.v
                , len = txt.length
                , m = charw ? { l: 0, r: 0, w: charw * len } : tok.__getMetrics(t, ctx)
                , segW = m.w + (len - 1) * fontspacing + (len ? 1 : 0);

            if (totalW + segW <= needWidth) {
                totalW += segW;
                lastTextTokenIdx = i;
                continue;
            }

            var need = needWidth - totalW
                , l = 0
                , suffixStart = -1;

            if (charw) {
                l = mmin(len, floor(need / charw));
                if (l >= len) { 
                    totalW += charw * len;
                    lastTextTokenIdx = i;
                    continue; 
                }
            } else {
                if (segW <= need) {
                    totalW += segW;
                    lastTextTokenIdx = i;
                    continue;
                }
                var koeff = need / segW;
                l = floor(koeff * len);
            }
            
            var i0 = l + 1, j = l - 1, lc = txt.charAt(l), kk = 0;

            if (lc == ' ') suffixStart = l + 1;
            else if (canWrapSymbol(txt, l)) suffixStart = l;
            else {
                for (; kk < 20; kk++, i0++, j--) {
                    if (canWrapSymbol(txt, i0)) { suffixStart = i0; break; }
                    if (canWrapSymbol(txt, j)) { suffixStart = j; break; }
                }
            }

            if (suffixStart <= 0 || suffixStart >= len) {
                if (lastTextTokenIdx < 0){
                    lastTextTokenIdx = i;
                }
                return [{ __start: start, __end: lastTextTokenIdx + 1, __trimEnd: 1 },
                        { __start: lastTextTokenIdx + 1, __end: end,  __trimStart: 1 }];
            }

            lastTextTokenIdx = i;

            var prefix = txt.substring(0, suffixStart)
                , suffix = txt.substring(suffixStart)
                , prefixToken = new TextToken(prefix)
                , prefixMetrics = prefixToken.__getMetrics(t, ctx)
                , prefixW = prefixMetrics.w
                , firstEndIdx = i + 1
                , nextEndIdx = end + 1
                , suffixToken = new TextToken(suffix)                
                , findFirstSpace = line => {
                    var ii = 0, len = line.length, L = mmax(1, mmin(len - 2, 5));
                    for (; ii < len; ii++) if (line.charAt(ii) != ' ') break; // skip first N spaces
                    L = mmin(len - 2, L + ii);
                    for (; ii < L; ii++) if (canWrapSymbol(line, ii)) return ii;
                    return -1;
                }            
                , findLastSpace = line => {
                    var ii = line.length - 1;
                    for (; ii > 1; ii--) if (line.charAt(ii) != ' ') break; // skip last N spaces
                    for (; ii > 1; ii--) if (canWrapSymbol(line, ii)) return ii;
                    return -1;
                }
                , width = totalW + prefixW;
            
            tokens.splice(i + 1, 0, suffixToken);
            tokens[i] = prefixToken;

            if (width < needWidth) {
                while (suffix) {
                    var firstSpace = findFirstSpace(suffix);
                    if (firstSpace <= 0) break;
                    var newSuffix = suffix.substring(firstSpace).trimStart();
                    if (!newSuffix) break;

                    var firstWorld = suffix.substring(0, firstSpace - 1);
                    prefix += firstWorld;
                    
                    var newPrefixToken = new TextToken(prefix);
                    var metrics = newPrefixToken.__getMetrics(t, ctx);

                    if (width - prefixW + metrics.w > needWidth) {
                        break;
                    }

                    width = width - prefixW + metrics.w;
                    tokens[i] = newPrefixToken;
                    suffixToken.v = newSuffix;

                    suffix = newSuffix;
                }
            } else if (width > needWidth) { 
                var lastSpace = findLastSpace(prefix);
                while (lastSpace > 0) {
                    var lastWorld = prefix.substring(lastSpace);
                    if (!lastWorld.trim()) break;
                    prefix = prefix.substring(0, lastSpace);
                    prefixToken.v = prefix;
                    suffixToken.v = lastWorld + suffixToken.v;
                    var metrics = prefixToken.__getMetrics(t, ctx);
                    width -= prefixW;
                    prefixW = metrics.w;
                    width += prefixW;
                    if (width <= needWidth) break;
                    lastSpace = findLastSpace(prefix);
                }
            }        

            return [ 
                { __start: start, __end: firstEndIdx, __trimEnd: 1 }, 
                { __start: firstEndIdx, __end: nextEndIdx, __trimStart: 1 },
            ];
        }
    
    }
    return null;
}


function trimLineTokensStart(tokens, start, end) {
    for (var i = start; i < end; i++) {
        var tok = tokens[i];
        if (tok && isString(tok.v)) {
            tok.v = tok.v.trimStart();
            break;
        } 
    }
}

function trimLineTokensEnd(tokens, start, end) {
    for (var i = end - 1; i >= start; i--) {
        var tok = tokens[i];
        if (tok && isString(tok.v)) {
            tok.v = tok.v.trimEnd();
            break;
        } 
    }
}
function trimLineTokens(tokens, opts) {
    if (opts.__trimStart) {
        trimLineTokensStart(tokens, opts.__start, opts.__end);
    }
    if (opts.__trimEnd) {
        trimLineTokensEnd(tokens, opts.__start, opts.__end);
    }
}

// Measure a line (token range). Returns TextMetrics
function measureLineTokens(t, tokens, opts) {
    var ctx = t.__ctx
        , start = opts.__start
        , end = opts.__end
        , sf = t.__scaleFactor
        , fontspacing = t.__fontspacing * sf
        , charw = t.__charw * sf
        , m = new TextMetrics(t, ctx)
        , firstSet = 0
        , totalChars = 0;
    
    if (start == 0) {
        ctx.font = t.__getFont(t.__fontsize);
    }

    trimLineTokens(tokens, opts);

    for (var i = start; i < end; i++) {
        var tok = tokens[i];
        if (!tok) break;
        tok.__calc(t, ctx);
        if (tok.v) {
            var txt = tok.v, len = txt.length;
            if (len) {
                if (charw) {
                    m.w += charw * len;
                } else {
                    var tm = tok.__getMetrics(t, ctx);
                    m.w += tm.w;
                    m.l = ifdef(m.l, tm.l); 
                    m.r = tm.r;
                }
                totalChars += len;
            }
        }
    }
    m.w += (totalChars - 1) * fontspacing + (totalChars ? 1 : 0);
    m.h = t.__currentLineHeight;
    
    return m;
} 

function addTextProp(props, obj, p) {

    if (isObject(props[p])) {
        obj[p] = props[p];
    } else
        obj[p] = {
            get() {
                return this.__p[p];
            },
            set(v) {
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
            ____alpha: { get() { return this.__parent.____alpha }, set() { } },
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
    ____notNormalNode: 1,

    __clone() {
        return deepclone(this.__p);
    },

    __init(parameters) {
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

    __render() {
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

    __clearTexture() {
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

    __destruct() {
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

    __getFontMod() {
        return (this.__italic ? 'italic ' : '') + (this.__smallCaps ? 'small-caps ' : '') + (this.__fontWeight ? fontWeights[this.__fontWeight] + ' ' : '');
    },

    __getFont(fs) {
        var t = this, ff = t.__fontface || __defaultTextProperties.__fontface;
        if (!ff || !globalConfigsData[ff] || globalConfigsData[ff] == 1) {
            ff = __defaultTextProperties.__safeFontFace;
        }
        return this.__getFontMod() + fs * t.__scaleFactor + "px \"" + ff + '"';
    },

    raycast() {

    },

    __fill(text, x, y) {
        var t = this;
        if (t.__lineWidth > 0) {
            t.__ctx.lineCap = t.__ctx.lineJoin = 'round';
            t.__ctx.miterLimit = 2;
            t.__ctx.strokeText(text, x, y);
        }

        t.__ctx.fillText(text, x, y);
    },
    
    __drawString(tokens, begin, end, x, y, bySymbol) {
        var t = this;
        for (var i = begin; i < end; i++) {
            var token = tokens[i];
            if (token && token.__draw) {
                x = token.__draw(t, x, y, bySymbol);
            }
        }
        return x;
    },

    update(deep) {
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

        if (t.__autowrap || t.__autodots) {
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
            var cachedSize = t.__cachedSize;
            if (!cachedSize) {
                cachedSize = t.__cachedSize = size;
            }
            if (cachedSize.x != size.x || cachedSize.y != size.y) {
                t.__needUpdate = 1;
                t.__cachedSize = size;
            }
        }


        if (t.__needUpdate) {

            var text = t.__text;
            if (text == undefined) return;

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

                    t.____visible = t.__matrixNeedsUpdate = 1;

                    var fs = t.__fontsize
                        , linespacing = t.__lineSpacing + t.__addedLineSpacing * t.__addedLineSpacingMultiplier
                        , textTokens = tokenizeFullText(text)
                        , tokenLines = getLinesFromTokens(textTokens)
                        , charw = t.__charw
                        , lineWidth = t.__lineWidth || 0
                        , w = 0
                        , rw = 0
                        , h = 0
                        , rh = 0
                        , sf = t.__scaleFactor
                        , cachedlines = []
                        , startedX = lineWidth
                        , startedY = 0
                        , shadow = t.__shadow
                        , shadowBlur = 0
                        , shadowX = 0
                        , shadowY = 0
                        , rwDiff = 0
                        , rhDiff = 0
                        , canvas = t.__canvas || __document.createElement('canvas')
                        , ctx = t.__ctx = canvas.getContext('2d');
                     
                    t.__currentLineHeight = fs;

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

                    if (t.__autowrap) {
                        console.clear();
                    }
                    
                    var pushtocache = function (line) {
                        var metrics = line.__metrics || measureLineTokens(t, textTokens, line);
                        var entry = {
                            start: line.__start,
                            end: line.__end,
                            w: metrics.w / sf,
                            l: metrics.l,
                            r: metrics.r,
                            h: metrics.h
                        };
                        w = mmax(w, entry.w);
                        cachedlines.push(entry);
                        if (t.__autowrap) {
                            var str = '';
                            for (var i = line.__start; i < line.__end; i++) {
                                var tok = textTokens[i];
                                if (tok && tok.v) str += tok.v;
                            }
                            console.log("'" + str + "'", ' w:', entry.w);
                        }
                    };

                    var availableWidth = size.x * sf;

                    if (t.__autodots && !t.__autowrap) {
                        
                        for (var i = 0; i < tokenLines.length; i++) {
                            var line = tokenLines[i];
                            line.__availableWidth = availableWidth;
                            line.__metrics = measureLineTokens(t, textTokens, line);
                            if (line.__metrics.w > availableWidth) {
                                var newEnd = trimLineTokensToWidth(t, textTokens, line);
                                line.__end = newEnd;
                                line.__metrics = measureLineTokens(t, textTokens, line);
                            }
                            pushtocache(line);
                        }
                    } else if (t.__autowrap) {
                        
                        var insertOffset = 0;
                        var wraptext = function (opts) {
                            var start = opts.__start, end = opts.__end;
                            if (end <= start) return 0;
                            opts.__availableWidth = availableWidth;
                            opts.__metrics = measureLineTokens(t, textTokens, opts);

                            if (opts.__metrics.w <= availableWidth) {
                                pushtocache(opts);
                                return 0;
                            }
                            
                            var split = splitLineTokens(t, textTokens, opts);
                            if (!split) {
                                pushtocache(opts);
                                return 0;
                            }

                            pushtocache(split[0]);
                            if (split[1]) {
                                return 1 + wraptext(split[1]);
                            } else {
                                return 1;
                            }
                        };
                        for (var i = 0; i < tokenLines.length; i++) {
                            var line = tokenLines[i];
                            line.__start += insertOffset;
                            line.__end += insertOffset;
                            insertOffset += wraptext(line);
                        }
                    } else {
                        for (var i = 0; i < tokenLines.length; i++) {
                            pushtocache(tokenLines[i]);
                        }
                    }

                    var left = 0, right = 0, align_factor = t.__align / 2;
                    for (var i = 0; i < cachedlines.length; i++) {
                        var cl = cachedlines[i];
                        cl.x = (-cl.w + w) * align_factor * sf
                            + t.__bb_align * (-cl.r * align_factor + cl.l * (1 - align_factor));
                        left = mmax(cl.l, left);
                        right = mmax(cl.r, right);
                    }

                    var linesCount = cachedlines.length;
                    h = 0;
                    for (var hi = 0; hi < cachedlines.length; hi++) {
                        h += cachedlines[hi].h + (hi < cachedlines.length - 1 ? linespacing : 0);
                    }
                    var lastLineH = linesCount ? cachedlines[linesCount - 1].h : fs;
                    rh = round(h + getFontDescent() * lastLineH + rhDiff);
                    rw = round(w + lineWidth * 2 + (t.__italic ? fs * 0.1 : 0) + rwDiff);

                    var lwDiff = left + right;

                    canvas.width = rw * sf + lwDiff;
                    canvas.height = rh * sf;

                    var ctx = canvas.getContext('2d');
                    t.__ctx = ctx;

                    if (shadow) {
                        set(ctx, 
                            'shadowColor', color_to_string(shadow.__color, shadow.__alpha),
                            'shadowOffsetX', shadowX * sf,
                            'shadowOffsetY', shadowY * sf,
                            'shadowBlur', shadowBlur / shadowBlurTextureSizeMultiplier * sf
                        );
                    }

                    if (lineWidth > 0) {
                        set(ctx, 
                            'lineWidth', lineWidth * sf,
                            'strokeStyle', color_to_string(t.__lineColor, t.__lineAlpha)
                        );
                    }

                    set(ctx, 
                        'font', t.__getFont(fs),
                        'fillStyle', t.__gradient ? createTextGradientStyle(t.__gradient, ctx, canvas) : color_to_string(t.__color /* TODO: t.__alpha */)
                    );

                    t.__currentLineHeight = fs;

                    // drawing text
                    var bySymbol = (t.__fontspacing || charw)
                        , texture_w = rw * sf + lwDiff
                        , texture_h = rh * sf;

                    startedX += left;
                    
                    for (var i = 0; i < cachedlines.length; i++) {
                        var cl = cachedlines[i];
                        startedY += cl.h;
                        t.__drawString(textTokens, cl.start, cl.end, cl.x + startedX, startedY, bySymbol);
                        startedY += linespacing
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
                            'w', texture_w,
                            'h', texture_h,
                            'fs', fs,
                            'lw', lineWidth);

                        looperPost(function () {
                            delete t.__notReady;
                            t.__updateGeometry().__updateMatrixWorld();
                            var bufferTexture = renderOverTexture(texture_w, texture_h, shaderOpts);
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

                    t.__size = [rw + lwDiff / sf, rh];

                    if (t.__cacheCanvas) {
                        t.__canvas = canvas;
                    }

                }

        }

        var pos = t.__ofs, sa = t.____sizeToAdjustment;
        if (sa) {
            // TODO: regenerate texture, modify fontsize, not scaleF
            var scale = 1;

            if (t.__autoscale) {
                scale = mmin(1, mmin(size.x / sa.w, size.y / sa.h));
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

