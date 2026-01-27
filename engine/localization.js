
var localizationDict,
    localizationOptions = set({},

        'ru', {
            __pluralizeForm: function (d, n, f) { f = floor(d); n = f % 10; return (d > 19 || d < 11) ? (n > 0 ? n > 1 ? n > 4 ? 2 : 1 : (f != d ? 1 : 0) : 2) : 2; },


            // под нормальными буквами мы понимаем \w, т.е. символы [A-Za-z0-9_]
            // для не латинских буков надо дописывать. особенно если слова состоят из одних символов вроде î, которые не считаются за \w
            __normalSymbolRegexp: new RegExp(/[\wa-яёА-ЯЁ]/),
            __doubleNormalSymbolRegexp: new RegExp(/[\wa-яёА-ЯЁ][\wa-яёА-ЯЁ]/),
            __notNormalSymbolRegexp: new RegExp(/[^\wa-яёА-ЯЁ]/),

            __thousandsSeparator: ' ',
            __decimalMark: ','
        },

        'en', {
            __pluralizeForm: function (d) { return d == 1 ? 0 : 1; },
            __thousandsSeparator: ',',
            __decimalMark: '.'
        },

        'pt', {
            __pluralizeForm: function (d) { return d < 1.5 ? 0 : 1; },
            __thousandsSeparator: ',',
            __decimalMark: '.'
        },

        'fr', {
            __pluralizeForm: function (d) { return d < 1.5 ? 0 : 1; },
            __thousandsSeparator: ',',
            __decimalMark: '.'
        },

        'ja', {
            __pluralizeForm: function (d, n, f) { return 0; },

            // 3040-309F : hiragana
            // 30A0-30FF : katakana
            // FF66-FF9D : half-width katakana
            // 4E00-9FAF : Common and uncommon kanji
            // 3005 : 々

            __normalSymbolRegexp: new RegExp(/[\w\u3040-\u309F\u30A0-\u30FA\u30FC-\u30FF\uFF66-\uFF9D\u4E00-\u9FAF\u3005]/),
            __doubleNormalSymbolRegexp: new RegExp(/[\w\u3040-\u309F\u30A0-\u30FA\u30FC-\u30FF\uFF66-\uFF9D\u4E00-\u9FAF\u3005]{2}/),
            __notNormalSymbolRegexp: new RegExp(/[^\w\u3040-\u309F\u30A0-\u30FA\u30FC-\u30FF\uFF66-\uFF9D\u4E00-\u9FAF\u3005]/),

            __thousandsSeparator: ' ',
            __decimalMark: '.',

            // NotEndLine & NotStartLine
            __autowrapMap: {
                ne: "「",
                ns: "」・！。%、/―：？…（）Ｘ.:$,～-+#＠＄％＾＆＊＿＝ー",
                __smallKana: 'ァィゥェォッャュョヶぁぅぇぉっゃゅょ々',
                __canWrapSymRegexp: new RegExp(/[^\w;\\#]/)
            }
        });


var localizationLang
, __loc_cache = {}
, __check_lang_o = l => options.__supportedLangs[l] ? __loc_cache[l] = options.__supportedLangs[l] : 0
, __check_lang_a = l => inArray(l, options.__supportedLangs) ? __loc_cache[l] = l : 0
, getUserSavedLanguage = a => get1(PlayerState, 'lang') || LocalGetKey('lang')
, setUserSavedLanguage = lang => { set(PlayerState, 'lang', lang); LocalSetKey('lang', lang) }

, __checkUserLanguage = l => {
    if (l) {
        var __check_lang = isObject(options.__supportedLangs) ? __check_lang_o : __check_lang_a
            , subs = l.indexOf('_') > 0, defis = l.indexOf('_') > 0;

        l = l.toLowerCase();
        
        return __loc_cache[l] || __check_lang(l) ||
            (defis ? __check_lang(l.replace('-', '_')) : 0) ||
            (subs ? __check_lang(l.replace('_', '-')) : 0) ||
            (defis ? __check_lang(l.split('-')[0]) : 0) ||
            (subs ? __check_lang(l.split('_')[0]) : 0);
    }
}
,  __checkUserLanguages = languages => $findResult(languages, __checkUserLanguage)


function getUserLanguage() {
    var nav = __window.navigator;
    return __checkUserLanguage(getUserSavedLanguage()) ||
        __checkUserLanguage(options.__lang) ||
        __checkUserLanguages(get1(nav, 'languages')) ||
        __checkUserLanguage(get1(nav, 'language') || get1(nav, 'browserLanguage') || get1(nav, 'userLanguage')) ||
        __checkUserLanguage(options.__defaultLang || 'en');
}

function setLocalization(l, force, lname) {

    localizationLang = l;

    localizationDict = getCachedData(lname || (options.__localesDir + l + '.json'));
    //debug
    if (!localizationDict) {
        localizationDict = {};
        if (!force)
            throw "can't set localization " + l;
    }
    //undebug

    if (!localizationDict && force)
        localizationDict = {};

    options.__localization = get1(localizationOptions, l) ||  get1(localizationOptions, 'en');
    options.__localization.__thousandsSeparator = ifdef(get(localizationDict, 'thousands_separator'), options.__localization.__thousandsSeparator);
    options.__localization.__decimalMark = ifdef(get(localizationDict, 'decimal_mark'), options.__localization.__decimalMark);

    __defaultTextProperties.__addedLineSpacing = l == 'ja' ? 8 : 0;

}


function setTempLocalization(lang, cb) {

    TASKS_RUN([[TASKS_LOCALIZATION, lang]], function () {
        setLocalization(lang);
        cb();
        setLocalization(getUserLanguage());
    });

}

function __pluralize(d, a, i) { if (a) { d = d + a.t; if (a.a[i]) d = d + a.a[i]; } return d; }

function autoReplaceLocalsInLocals(k, dict, str, recursive) {
    if (dict && str && str.replace) {
        var i = 0;
        str = str.replace(/{(\w+[\d_\w]*)}/gm, (wordSk, word) => {
            var localized = dict[word];
            if (localized) {
                localized = localized.replace(/{@}/, (a, b) => {
                    if (!dict.__autoreplaces) dict.__autoreplaces = {};
                    if (!dict.__autoreplaces[k]) dict.__autoreplaces[k] = [];
                    dict.__autoreplaces[k].push({ i: i + 1, w: word });
                    return '{'+ (i++) + '}'
                });
                return recursive ? autoReplaceLocalsInLocals(k, dict, localized, 1) : localized
            }
            return wordSk;
        }); 
    }
    return str;
}

function prepareLocalizationDict(dict) {
  
    dict = plainArrayToObject(dict);
 
    if (dict.__plurales)
        return dict;

    var localizationPlurales = {}
        , defb = ['', '', ''];

    function prepareForms(b) {
        if (b) {
            b = b.split('|');
            if (b.length) {
                if (b.length < 2) b.push(b[0]);
                if (b.length < 3) b.push(b[1]);
                return b;
            }
        }
    }

    function initPForm(i, num, b, t) {
        var lpi = localizationPlurales[i];
        if (!lpi) lpi = localizationPlurales[i] = {};
        if (!lpi[num]) lpi[num] = { t: '', a: defb };
        b = prepareForms(b);
        if (b) lpi[num].a = b;
        if (t) lpi[num].t = t;
    }

    for (var i in dict) {
        dict[i] = autoReplaceLocalsInLocals(i, dict, dict[i])
            .replace(/{(\d+)\|([^{}]*)}/g,  (match, num, b) => (initPForm(i, num, b), '{' + num + '}'))
            .replace(/{{(\d+)}([^}]*)}/g, (match, num, b) => {
                b = prepareForms(b);
                if (b) {
                    var lpi = localizationPlurales[i];
                    if (!lpi) lpi = localizationPlurales[i] = {};
                    if (!lpi.__variableOrderForms) lpi.__variableOrderForms = [];
                    var index = lpi.__variableOrderForms.length;
                    lpi.__variableOrderForms.push({ n: Number(num), a: b });
                    return '@' + index + '@';
                }
                return match;
            })
            .replace(/{(\d+)}([^{]*){([^\d}]*\|[^{}]*)}/g, (match, num, txt, b) => (initPForm(i, num, b, txt), '{' + num + '}'))
    }

    dict.__plurales = localizationPlurales;
    return dict;
}

function __TR(k) {
    var t = localizationDict[k], args = arguments;
    if (t && t.replace) {
        // Since 1592 Duncan MacLeod kills {0} mans, {1} womans, {2} childs and {3} dogs
        if (localizationDict.__autoreplaces && localizationDict.__autoreplaces[k]){
            var aargs = [];
            for (var i = 0; i < args.length; ++i) {
                aargs.push(args[i]);
            }
            $each(localizationDict.__autoreplaces[k], (vv) => {
                aargs[vv.i] = ifdef(aargs[vv.i], localizationDict.__autoreplaces[vv.w])
            });
            args = aargs;
        }
        if (args.length > 1) {
            var keyPlurales = localizationDict.__plurales ? localizationDict.__plurales[k] : 0;
            if (keyPlurales && options.__localization) {

                $each(keyPlurales.__variableOrderForms, function (vof, i) {
                    t = t.replace(new RegExp('@' + i + '@', 'g'), function (match) {
                        var r = args[vof.n + 1];
                        if (isNumeric(r)) {
                            return vof.a[options.__localization.__pluralizeForm(r)];
                        }
                        return match;
                    });
                });

                t = t.replace(/{(\d+)}/g, function (match, number) {
                    var r = args[Number(number) + 1];
                    if (r != undefined) {
                        if (isNumeric(r)) {
                            r = __pluralize(r, keyPlurales[number], options.__localization.__pluralizeForm(r));
                        }
                        return r;
                    }
                    return match;
                });
            } else {
                t = t.replace(/{(\d+)}/g, function (match, number) {
                    var r = args[Number(number) + 1];
                    return r == undefined ? match : r;
                });
            }
        }
    };
    return t;    
}

function TR(k) {
    if (localizationDict && localizationDict.hasOwnProperty(k)) {
        return __TR.apply(this, arguments);     
    }
    return k;
};

function localizeNumberInt(d, thousandSeparator, zeroPadding) {

    if (isNumber(d)) {

        if (thousandSeparator == undefined)
            thousandSeparator = (options.__localization || 0).__thousandsSeparator || '';

        d = round(d);

        var absD = abs(d), dStr;

        if (absD < 1000) {
            dStr = d.toString();
        }
        else {

            dStr = absD > 1e20 ? convertExpNumberViewToNormalView(absD) : absD.toString();
            var i = dStr.length,
                s = "";

            while (i > 3) {
                s = thousandSeparator + dStr.slice(i - 3, i) + s;
                i -= 3;
            }

            dStr = dStr.slice(0, i) + s;
        }

        while (dStr.length < zeroPadding) {
            dStr = '0' + dStr;
        }

        if (d < 0)
            dStr = "-" + dStr;

        return dStr;
    }
    else {
        if (!d) {
            return "0";
        }
    }

    return d;
}


function localizeNumberFloat(d, digitsAfterDot, thousandSeparator, decimalMark, intZeroPadding) { //digitsAfterDot - now it is min and max

    if (isNumber(d)) {

        //TODO: 
        // known bug: localizeNumberFloat(-0.5) == 0 ; (-0.5).toLocaleString('ru', { maximumFractionDigits: 0, minimumFractionDigits: 0 }) == -1;

        if (thousandSeparator == undefined)
            thousandSeparator = (options.__localization || 0).__thousandsSeparator || '';

        if (decimalMark == undefined)
            decimalMark = (options.__localization || 0).__decimalMark || '';

        if (digitsAfterDot == 0) {
            return localizeNumberInt(d, thousandSeparator, intZeroPadding);
        }

        var absD = abs(d),
            fractpart = fract(absD).toFixed(digitsAfterDot == undefined ? 3 : digitsAfterDot).split('.')[1];

        if (digitsAfterDot == undefined)
            fractpart = fractpart.replace(/0*$/, '');

        if (+fractpart == 0) {
            var fractp = fract(d);
            d += fractp >= 0.5 ? 0.5 : fractp <= -0.5 ? -0.5 : 0;
        }

        var intpart = localizeNumberInt(trunc(d), thousandSeparator, intZeroPadding);

        if (fractpart) {
            return intpart + decimalMark + fractpart;
        }
        else {
            return intpart;
        }

    }

    return d;
}


function convertExpNumberViewToNormalView(num) {

    var numSign = num < 0 ? "-" : "";
    num = abs(num);

    return numSign + num.toString().replace(/^(\d+)\.*(\d*)e.(\d+)$/, function ($0, $1, $2, $3) {
        return num > 1 ? ($1 + $2 + "0".repeat($3 - $2.length)) : ("0." + "0".repeat($3 - $1.length) + $1 + $2);
    });
}