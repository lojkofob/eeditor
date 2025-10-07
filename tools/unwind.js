var _spawnFunction;

function unwindMagicVariables(env, data, src, dst, tmp) {

    //     console.log('unwindMagicVariables', data, src, dst);
    if (data) {

        if (!src) {
            $each(objectKeys(env).sort((a, b) => b.length - a.length), key => {
                data = unwindMagicVariables(env, data, key, env[key], tmp);
            });
        }
        else if(isArray(data)) {
            data = $map(data, d => unwindMagicVariables(env, d, src, dst, tmp));
        }
        else if (isObject(data)) {
            var o = {};
            for (var i in data) {
                o[ unwindMagicVariables(env, i, src, dst, tmp) ] = unwindMagicVariables(env, data[i], src, dst, tmp);
            }
            data = o;
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

function unwindCommands(data, ud) {
    
    if (isObject(data) || isArray(data)) {
        return $map(data, (v, k) => {
            return unwindCommands(v, ud)
        });
    } else {
        if (isString(data)) {
            var dd = data.indexOf('`');
            if (dd >= 0) {
                if (data[dd - 1] == '\\') {
                    return data.replace(/\\`/g, '`');
                } else {
                    if (_spawnFunction) {
                        var opts;
                        data = data.replace(/`([^`]*)`(\?[^;]+;)?/g, function(d, command, ooo) {
                            var d = _spawnFunction([command], 1)
                            ud.changed = ud.changed + 1;
                            opts = ooo;
                            return d;
                        });

                        if (isString(opts)){
                            opts = opts.substr(1, opts.length - 2);
                            opts = new URLSearchParams(opts);
                            opts = Object.fromEntries(opts.entries());
                            if (opts.format == "json"){
                                data = JSON.parse(data);                                
                            }
                        }

                        return data

                    } else {
                        return data;
                    }
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

                        var r = getDeepFieldFromObject.apply(this, [basedata].concat(explodeString(key, '/', 1)));
                        if (r === undefined) {
                            return d;
                        }

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
                    else {
                        if (newdata != data) {
                            data = newdata;
                            changed = 1;
                        }
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


function unwind(data, env, spawnFunction, basedata) {
    var changed = 0;
    
    _spawnFunction = spawnFunction;
    var lch = -1, tmp;

    while (lch != changed) {

        while (lch != changed) {
            lch = changed

            tmp = { changed: 0 };
            env = env || data.buildFlags;
            data = unwindMagicVariables(env, data, undefined, undefined, tmp);
            changed += tmp.changed;
            //  founded += tmp.founded;

            tmp = unwindLinks(data, basedata);
            changed += tmp.changed;

            // founded += tmp.founded;

            data = tmp.data;

        }

        var tmp = { changed: 0 };
        data = unwindCommands(data, tmp);
        if (tmp.changed) {
            lch = -1;            
        }
    }
 

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