

var base64coderWithKitten = (function () {

    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
        a256 = '',
        r64 = [256],
        r256 = [256],
        i = 0;

    var UTF8 = {

        /**
         * Encode multi-byte Unicode string into utf-8 multiple single-byte characters
         * (BMP / basic multilingual plane only)
         *
         * Chars in range U+0080 - U+07FF are encoded in 2 chars, U+0800 - U+FFFF in 3 chars
         *
         * @param {String} strUni Unicode string to be encoded as UTF-8
         * @returns {String} encoded string
         */
        encode: function (strUni) {
            // use regular expressions & String.replace callback function for better efficiency
            // than procedural approaches
            var strUtf = strUni.replace(/[\u0080-\u07ff]/g, // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
                function (c) {
                    var cc = c.charCodeAt(0);
                    return String.fromCharCode(0xc0 | cc >> 6, 0x80 | cc & 0x3f);
                })
                .replace(/[\u0800-\uffff]/g, // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
                    function (c) {
                        var cc = c.charCodeAt(0);
                        return String.fromCharCode(0xe0 | cc >> 12, 0x80 | cc >> 6 & 0x3F, 0x80 | cc & 0x3f);
                    });
            return strUtf;
        },

        /**
         * Decode utf-8 encoded string back into multi-byte Unicode characters
         *
         * @param {String} strUtf UTF-8 string to be decoded back to Unicode
         * @returns {String} decoded string
         */
        decode: function (strUtf) {
            // note: decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char!
            var strUni = strUtf.replace(/[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g, // 3-byte chars
                function (c) { // (note parentheses for precence)
                    var cc = ((c.charCodeAt(0) & 0x0f) << 12) | ((c.charCodeAt(1) & 0x3f) << 6) | (c.charCodeAt(2) & 0x3f);
                    return String.fromCharCode(cc);
                })
                .replace(/[\u00c0-\u00df][\u0080-\u00bf]/g, // 2-byte chars
                    function (c) { // (note parentheses for precence)
                        var cc = (c.charCodeAt(0) & 0x1f) << 6 | c.charCodeAt(1) & 0x3f;
                        return String.fromCharCode(cc);
                    });
            return strUni;
        }
    };

    while (i < 256) {
        var c = String.fromCharCode(i);
        a256 += c;
        r256[i] = i;
        r64[i] = b64.indexOf(c);
        ++i;
    }

    function code(s, discard, alpha, beta, w1, w2) {
        s = String(s);
        var buffer = 0,
            i = 0,
            length = s.length,
            result = '',
            bitsInBuffer = 0;

        while (i < length) {
            var c = s.charCodeAt(i);
            c = c < 256 ? alpha[c] : -1;

            buffer = (buffer << w1) + c;
            bitsInBuffer += w1;

            while (bitsInBuffer >= w2) {
                bitsInBuffer -= w2;
                var tmp = buffer >> bitsInBuffer;
                result += beta.charAt(tmp);
                buffer ^= tmp << bitsInBuffer;
            }
            ++i;
        }
        if (!discard && bitsInBuffer > 0) result += beta.charAt(buffer << (w2 - bitsInBuffer));
        return result;
    }


    return {
        encode: function (plain, utf8encode) {
            plain = UTF8.encode(plain);
            plain = code(plain, false, r256, b64, 8, 6);
            return plain + '===='.slice((plain.length % 4) || 4);
        },

        decode: function (coded, utf8decode) {
            coded = coded.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            coded = String(coded).split('=');
            var i = coded.length;
            do {
                --i;
                coded[i] = code(coded[i], true, r64, a256, 6, 8);
            } while (i > 0);
            coded = coded.join('');
            return UTF8.decode(coded);
        }
    }
})();


function aj(data, onLoad, onProgress, onUploadProgress, _onError) {

    var o = new XMLHttpRequest();
    o.open('POST', (Editor.options.__allServerPath || '') + 'ajax.php', true);

    o.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    o.onload = function (e) {
        if (onLoad) {
            switch (o.responseType) {
                case "arraybuffer": onLoad(new Uint8Array(this.response)); return;
                case "blob": onLoad(this.response); return;
                default: onLoad(this.responseText); return;
            }
        }
    }

    if (onProgress) {
        o.onprogress == function (e) {
            onProgress(e.position || e.loaded, e.totalSize || e.total)
        }
    }

    if (onUploadProgress) {
        o.upload.onprogress = function (e) {
            onUploadProgress(e.position || e.loaded, e.totalSize || e.total);
        }
    }

    o.onerror = _onError;

    o.send(JSON.stringify(data));

}

function escapeHtml(text) { return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }

var onError = consoleError;

function ajjson(data, onLoad, onProgress, onUploadProgress, _onError) {
    if (Editor.currentProject) {
        data.project = Editor.currentProject.name;
        data.projectDir = Editor.currentProject.options.__projectServerPath;
    }

    _onError = _onError || onError;
    aj(data, function (r) {
        if (onLoad) {
            try {
                r = JSON.parse(r);
                if (r.ok && r.result != undefined) {
                    onLoad(r.result);
                }
                else {
                    _onError(r.error || 'some error');
                }
            } catch (e) {
                _onError(e);
                consoleLog(r);
            }
        }
    }, onProgress, onUploadProgress, _onError);

}


function serverCommand(data, onLoad, onProgress, _onError, onUploadProgress) {
    return ajjson(data, onLoad, onProgress, onUploadProgress, _onError);
}

