


function getFontFaceFromFontFile(file) {
    return file.split('.')[0].replace(/[^\w\d]/g, '_');
}

var _fontTestString = "AVWBESbswy/*-1";


var shouldUseNativeLoader = (function () {
    if (__document.fonts && __document.fonts.add && isFunction(__window.FontFace)) {
        if (/Apple/.test(__window.navigator.vendor)) {
            var match = /AppleWebKit\/([0-9]+)(?:\.([0-9]+))(?:\.([0-9]+))/.exec(__window.navigator.userAgent);
            return match ? parseInt(match[1], 10) >= 603 : 1;
        }
        return 1;
    }
})();

function loadNative(fontFaceName, url, success, fail) {

    var ff = new __window.FontFace(fontFaceName, "url('" + url + "')", {});
    __document.fonts.add(ff);
    if (ff.load) ff.load();
    if (ff.loaded) {
        ff.loaded.then(success, fail);
        return fail;
    } else {
        return loadNotNative(fontFaceName, url, success, fail);
    }

}


function loadNotNative(family, url, success, fail) {

    function fontruler(fface1, fface2) {

        var span = __document.createElement('span');
        var body = document.body || document.getElementsByTagName('body')[0];
        span.setAttribute("aria-hidden", "true");
        span.innerHTML = _fontTestString;

        function setFF(face, d) {
            span.style = "display:block;position:absolute;top:-9999px;left:-9999px;"+
            "font-size:300px;width:auto;height:auto;line-height:normal;margin:0;"+
            "padding:0;font-variant:normal;white-space:nowrap;font-style:normal;font-weight:400;font-family:" + face;
            return d;
        }

        body.appendChild(span);

        return ({
            __change: function () {
                this.c = setFF(this.c ? fface1 + ',' + fface2 : fface2, !this.c);
                if (this.c) {
                    this.w = span.offsetWidth;
                    this.__change();
                }
                return this;
            },
            __isChanged: function () {
                var w = this.w || this.__change().w;
                return w && w != span.offsetWidth;
            },
            __remove: function () { if (!this.r) body.removeChild(span); this.r = 1; }
        }).__change();
    }

    var fontRulerA = fontruler(family, 'serif');
    var fontRulerB = fontruler(family, 'sans-serif');
    var fontRulerC = fontruler(family, 'monospace');
    var interval;

    function finish(callback) {
        if (interval) {
            fontRulerA.__remove();
            fontRulerB.__remove();
            fontRulerC.__remove();
            interval = _clearInterval(interval);
            callback();
        }
    };

    interval = _setInterval(function () {
        if (fontRulerA.__isChanged() || fontRulerB.__isChanged() || fontRulerC.__isChanged()) {
            finish(success);
        }
    }, 0.1);

    return function () { finish(fail) };

}


function loadFont(fontName, cb, timeout) {

    var tmout;
    var family = getFontFaceFromFontFile(fontName);

    var callback = wrapFunctionInTryCatch(function () {
        _clearTimeout(tmout);
        cb(family);
    });

    timeout = timeout || 2;

    var url = modUrl(fontName + (fontName.indexOf('.') > 0 ? '' : '.ttf'), options.__baseFontsFolder);

    var data_base64 = getCachedData(url);

    // consoleLog('loadFont', fontName, shouldUseNativeLoader);

    if (data_base64) {

        url = data_base64;
    }

    html.__addCSSStyle("@font-face{font-family:'" + family + "';src:url('" + url + "');} ." + family + "{font:24px " + family + ";}");
    tmout = _setTimeout(
        (shouldUseNativeLoader ? loadNative : loadNotNative)(family, url, callback, callback), timeout
    );


}
