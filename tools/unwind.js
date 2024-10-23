
function unwindMagicVariables(data, src, dst, tmp) {

    //     console.log('unwindMagicVariables', data, src, dst);
    if (data) {

        if (!src) {

            $each(data.additionalArguments, function (v, i) {
                data = unwindMagicVariables(data, i, v, tmp);
            });

            $each(data.buildFlags, function (v, i) {
                data = unwindMagicVariables(data, i, v, tmp);
            });

        }
        else if (isObject(data) || isArray(data)) {
            $each(data, function (d, i) {
                data[i] = unwindMagicVariables(d, src, dst, tmp);
            });
        } else if (isString(data)) {


            data = data.replace(new RegExp('\\$' + src + "\\?([^:]*):([^;]*);", 'g'), function (g, a, b) {
                tmp.changed++;
                return (isNumeric(dst) ? Number(dst) : dst) ? a : b;
            });

            data = data.replace(new RegExp('\\$' + src, 'g'), function () {
                tmp.changed++;
                return dst;
            })

        }

    }
    //     console.log('result', data );
    return data;

}

function _unwindObject(o) {
    if (isObject(o)) {
        //TODO ?

    } else
        if (isArray(o)) {
            o = $map(o, _unwindObject);
        }

    return o;

}

function unwindCommands(data) {

    if (isObject(data) || isArray(data)) {
        return $map(data, unwindCommands);
    } else {
        if (isString(data)) {
            var dd = data.indexOf('`');
            if (dd >= 0) {
                if (data[dd - 1] == '\\') {
                    return data.replace(/\\`/g, '`');
                } else {
                    return data.replace(/`([^`]*)`/g, function (d, command) {
                        var d = spawn([command], 1)
                        return d;
                    });
                }
            }
        }
    }
    return data;

}


function getDeepFieldFromObject() {
    var r = arguments[0];
    var a = [];
    for (var i = 1; i < arguments.length; i++) {
        if (isString(arguments[i]) || isNumber(arguments[i])) {
            a.push(arguments[i]);
        } else
            if (isArray(arguments[i])) {
                a = a.concat(arguments[i]);
            }
    }

    for (var i = 0; i < a.length; i++) {
        r = r[a[i]];
        if (r === undefined) return;
    }
    return r;
}


function unwindLinks(data, basedata) {
    basedata = basedata || data;

    var changed = 0;
    var founded = 0;
    if (data) {

        if (isObject(data)) {

            var subchanged = 0;

            //TODO: may be infinite loop!

            do {
                subchanged = 0;
                for (var i in data) {
                    var d = data[i];

                    var ud = unwindLinks(d, basedata);
                    if (ud.changed) {
                        subchanged = ud.changed;
                        changed += subchanged;
                        data[i] = ud.data;
                    }
                    //founded += ud.founded;

                    ud = unwindLinks(i, basedata);
                    if (ud.changed) {
                        subchanged = ud.changed;
                        changed += subchanged;
                        data[ud.data] = data[i];
                        delete data[i];
                    }
                    //founded += ud.founded;

                }

            } while (subchanged);

        } else if (isArray(data)) {
            var subchanged = 0;

            //TODO: may be infinite loop!

            do {
                subchanged = 0;
                for (var i = 0; i < data.length; i++) {
                    var d = data[i];

                    var ud = unwindLinks(d, basedata);
                    if (ud.changed) {
                        subchanged = ud.changed;
                        changed += subchanged;
                        if (isArray(ud.data)) {
                            data.splice.apply(data, [i, 1].concat(ud.data));
                        } else {
                            data[i] = ud.data;
                        }
                    }
                    //founded += ud.founded;

                };

            } while (subchanged);

        } else {

            //now only from root
            if (isString(data)) {

                var di = data.indexOf('@');
                if (di >= 0) {


                    var foundedObject = 0;
                    var newdata = data.replace(/@\/([\w\d_\-\/\$]+)(\\@)?/g, function (d, key) {
                        //                         console.log(key);

                        var r = getDeepFieldFromObject.apply(this, [basedata].concat(explodeString(key, '/', 1)));
                        if (r === undefined) {
                            return d;
                        }

                        //                         r = _unwindObject(r);
                        founded++;

                        if (isObject(r) || isArray(r)) {
                            foundedObject = r;
                        }

                        // Arrays transforms into String ( [1,2].toString() == "1,2"  )
                        return r;
                    });


                    //only one object founded!
                    if (founded == 1 && isObject(foundedObject) || isArray(foundedObject)) {
                        data = foundedObject;
                        changed = 1;
                    }
                    else
                        if (newdata != data) {
                            data = newdata;
                            changed = 1;
                        }

                }

            }

        }
    }

    return {
        changed: changed,
        data: data
        // , founded: founded
    }

}


function unwind(data) {
    var changed = 0;
    //  var founded = 0;

    var lch = -1;

    while (lch != changed) {
        lch = changed

        var tmp = { changed: 0 };
        data = unwindMagicVariables(data, undefined, undefined, tmp);
        changed += tmp.changed;
        //  founded += ud.founded;

        var ud = unwindLinks(data);
        changed += ud.changed;
        // founded += ud.founded;

        data = ud.data;
    }

    data = unwindCommands(data);

    // if (founded > changed) {
    /// ???
    // }

    return data;
}

//debug
if (typeof module != typeof undefined) {
    module.exports = {
        unwind: unwind
    }
}
//undebug