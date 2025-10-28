module.exports = function () {

    var fs = require('fs')

    this.isNumeric = function (n) { return !isNaN(parseFloat(n)) && isFinite(n) && !isArray(n); }
    this.inArray = function (obj, arr) { return isArray(arr) && (arr.indexOf(obj) != -1); }
    this.removeFromArray = function (obj, arr) { var ax; while ((ax = arr.indexOf(obj)) !== -1) arr.splice(ax, 1); };
    this.objectSize = function (o) { var size = 0, key; for (key in o) if (o.hasOwnProperty(key)) size++; return size; };

    this.isFunction = function (o) { return Object.prototype.toString.call(o) == '[object Function]'; }
    this.isArray = Array.isArray;
    this.isObject = function (a) { return Object.prototype.toString.call(a) == "[object Object]"; }
    this.isString = function (a) { return typeof a === 'string' || a instanceof String; }
    this.isNumber = function (a) { return (typeof a === 'number') && isFinite(a); }
    this.isArrayOrObject  = function (a) { return this.isArray(a) || this.isObject(a); }

    this.overrideNotEnumerableProperty = function (f) { return { enumerable: false, value: f } }

    function override$(a, ef, ff, mf, Ff, cf) {
        Object.defineProperties(a, {
            e$: this.overrideNotEnumerableProperty(ef),
            f$: this.overrideNotEnumerableProperty(ff),
            m$: this.overrideNotEnumerableProperty(mf),
            F$: this.overrideNotEnumerableProperty(Ff),
            c$: this.overrideNotEnumerableProperty(cf),
        });
    }
    this.ArrayPrototype = Array.prototype;
    this.ObjectPrototype = Object.prototype;

    var __$countProto = function (f) {
        var r = 0, c;
        this.e$(function (ei, i) {
            c = f(ei, i);
            if (isNumber(c)) r += c;
            else if (c) r++;
        });
        return r;
    }

    override$(this.ArrayPrototype,
        this.ArrayPrototype.forEach,
        this.ArrayPrototype.filter,
        this.ArrayPrototype.map,
        this.ArrayPrototype.find,
        __$countProto
    );

    override$(this.ObjectPrototype,
        function (f) { for (i in this) f(this[i], i); }, // $each
        function (f) { var a = [], i; for (i in this) if (f(this[i], i)) a.push(this[i]); return a; }, // $filter
        function (f) { var a = {}, i; for (i in this) a[i] = f(this[i], i); return a; }, // $map
        function (f) { for (var i in this) { var r = f(this[i], i); if (r) return this[i]; } }, // $find
        __$countProto // $count
    );

    this.$each = function (a, f) { return a && isFunction(a.e$) ? a.e$(f) : [] }
    this.$filter = function (a, f) { return a && isFunction(a.f$) ? a.f$(f) : [] }
    this.$map = function (a, f) { return a && isFunction(a.m$) ? a.m$(f) : [] }
    this.$find = function (a, f) { return a && isFunction(a.F$) ? a.F$(f) : [] }
    this.$count = function (a, f) { return a && isFunction(a.c$) ? a.c$(f) : 0 }

    this.explodeString = function (str, delimeter, noempty) {
        if (!str) return [];
        str = str.split(delimeter || ',');
        if (noempty) {
            var j = 0;
            for (var i = 0; i < str.length; i++) {
                var ss = str[i].trim();
                if (ss) {
                    str[j++] = ss;
                }
            }
            if (i != j) {
                str.length = j;
            }
        } else {
            for (var i in str) str[i] = str[i].trim();
        }

        return str;
    }



    this.deepclone = function (a) {
        if (this.isArrayOrObject(a)) {
            if (a.__clone) return a.__clone();
            //debug
            if (a.constructor !== Object && a.constructor !== Array) {
                throw "can't copy non real objects by deepclone!"
                return a;
            }
            //undebug
            return $map(a, a => {
                return this.deepclone(a);
            });
        }
        return a;
    }



    this.deepCloneNotNull = function (data) {
        if (isObject(data)) {
            var temp = {};
            for (var key in data)
                if (data[key] != null)
                    temp[key] = deepCloneNotNull(data[key]);
            return temp;
        }

        if (isArray(data)) {
            var temp = [];
            for (var i = 0; i < data.length; i++)
                if (data[key] != null)
                    temp[key] = deepCloneNotNull(data[key]);
            return temp;
        }
        return data;
    }

    this.objectHasKeys = function (obj) { for (var i in obj) { return 1 } }
    this.objectKeys = function (obj) { var data = []; for (var key in obj) data.push(key); return data; }
    this.mergeObj = function (data, merged) { for (var key in merged) { data[key] = merged[key]; } return data; }
    this.mergeObjExclude = function (data, merged) { for (var key in merged) if (!data.hasOwnProperty(key)) data[key] = merged[key]; return data; }

    this.mergeObjects = function (data, base) { base = base || {}; for (var i in data) mergeObj(base, data[i]); return base; }

    this.mergeObjectsBy = function (objects, mod) { for (var i in objects) mergeObj(objects[i], mod); }

    this.mergeObjectDeep = function (data, merged) {
        if (isObject(merged)) {
            if (isObject(data)) {
                for (var key in merged) {
                    data[key] = mergeObjectDeep(data[key], merged[key]);
                }
            } else {
                return merged;
            }
        } else {
            return merged;
        }
        return data;
    }

    this.getJson = function(filename){
        return JSON.parse(fs.readFileSync(filename, 'utf8'));        
    }

    this.readFileSync = function(filename){
        return fs.readFileSync(filename, 'utf8')
    }

}