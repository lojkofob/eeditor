// TODO: refactoring with adding __

var _buffersCache = {}, currentBufferId = 0;

function MyBufferAttribute(name, arrayType, itemSize, type, array, notDestruct, instansingDivisor, stride) {

    var sz = array ? array.length : 0;

    mergeObj(this, {
        __stride: stride || 0,
        __instansingDivisor: instansingDivisor || 0,
        __notDestruct: notDestruct,
        __arrayType: arrayType,
        __array: new arrayType(sz),
        __size: sz,
        __realsize: sz,
        __itemSize: itemSize,
        __name: name,
        __type: type,
        __needNewBuffer: 1,
        id: currentBufferId
    });

    if (sz) {
        this.__array.set(array);
    }

    _buffersCache[currentBufferId] = this;
    currentBufferId++;

    if (type == GL_ELEMENT_ARRAY_BUFFER) {
        this.__passToGL = this.__bindBuffer;
    }
}

makeClass(MyBufferAttribute, {

    __concat(anotherBufferAttribute) {

        var array = anotherBufferAttribute.__array || anotherBufferAttribute
            , sz = this.__realsize
            , l = sz + array.length
            , arr = this.__getArrayOfSize(l);

        for (var i = sz; i < l; i++) { arr[i] = array[i - sz]; }

    },

    __getArrayOfSize(sz, directSize, copyLastArray) {
        var t = this;
        sz = round(sz);
        t.__sizeIncreased = t.__size < sz;
        t.__realsize = sz;
        if (t.__sizeIncreased) {
            t.__needNewBuffer = 1;
            if (!directSize)
                sz = floor(1 + sz / 128) * 256;

            if (copyLastArray) {
                var arr = t.__array;
                t.__array = new t.__arrayType(sz);
                t.__array.set(arr);
            } else {
                t.__array = new t.__arrayType(sz);
            }

            t.__size = sz;
        } else {
            t.__changed = 1;
        }

        if (directSize && t.__size > sz) { //size decreased
            t.__size = sz;
        }

        return this.__array;
    },

    __destruct() {
        if (this.__notDestruct){
            return;
        }
        delete _buffersCache[this.id];
        if (this.__webglBuffer) {
            //cheats
            renderInfo.totalBuffersCount--;
            //endcheats
            gl.deleteBuffer(this.__webglBuffer);
            this.__webglBuffer = 0;
        }
    },

    __onContextLost() {
        this.__needNewBuffer = 1;
        if (this.__webglBuffer) {
            //cheats
            renderInfo.totalBuffersCount--;
            //endcheats
            if (gl) gl.deleteBuffer(this.__webglBuffer);
            this.__webglBuffer = 0;
            this.__needNewBuffer = 1;
        }
    },

    __bindBuffer() {
        var t = this;

        if (t.__needNewBuffer) {
            t.__needNewBuffer = 0;

            if (t.__webglBuffer) {
                gl.deleteBuffer(t.__webglBuffer);

                //cheats
                renderInfo.totalBuffersCount--;
                //endcheats
            }


            //cheats
            renderInfo.totalBuffersCount++;
            //endcheats

            t.__webglBuffer = gl.createBuffer();
            gl.bindBuffer(t.__type, t.__webglBuffer);
            gl.bufferData(t.__type, t.__array, t.__dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
            t.__changed = 0;
        } else {
            gl.bindBuffer(t.__type, t.__webglBuffer);
            if (t.__changed) {
                gl.bufferSubData(t.__type, 0, t.__array, 0, t.__realsize);
                t.__changed = 0;
            }
        }

        return t.__webglBuffer;
    },

    __passToGL(programAttributes) {

        var t = this;
        t.__bindBuffer();
       
        var programAttribute = programAttributes[t.__name];
        if (programAttribute !== undefined) {

            //debug
            if (t.__debugDrawing) {
                consoleLog('attribute passed', t.__name, t.__realsize + '/' + t.__size, t.__itemSize, t);
            }
            //undebug

            renderer.__enableAttribute(programAttribute, t.__instansingDivisor);

            gl.vertexAttribPointer(programAttribute, t.__itemSize, gl.FLOAT, false, t.__stride, 0);
            
            return t.__webglBuffer !== undefined
        } else {
            //debug
            if (t.__debugDrawing) {
                consoleDebug('no attribute in program ', t.__name);
            }
            //undebug
        } 
    },

    __clone() {
        var t = this;
        return new MyBufferAttribute(
            t.__name, t.__arrayType,
            t.__itemSize, t.__type,
            t.__array, t.__notDestruct,
            t.__instansingDivisor, t.__stride
        );
    }

});


function Color(r, g, b) {

    if (g === undefined) {
        return this.set(r);
    }
    return this.__setRGB(r, g, b);

}

function hsv2hsl(a, b, c) { return [a, b * c / ((a = (2 - b) * c) < 1 ? a : 2 - a), a / 2] }
function hsl2hsv(a, b, c) { b *= c < .5 ? c : 1 - c; return [a, 2 * b / (c + b), c + b] }


function colorToJson(color, defValue) {
    return jsonToColor(color, defValue).__toJson(defValue);
}

function jsonToColor(j, defValue) {
    return ((defValue && defValue.__isColor) ? defValue : new Color(1, 1, 1)).__fromJson(j);
}

makeClass(Color, {

    __isColor: true,

    __toJson(defValue) {
        var r = this.r, g = this.g, b = this.b;
        if (r <= 1 && g <= 1 && b <= 1) {
            if (r == g && g == b && r != 1) return Number(r.toFixed(4));
            if (r != 1 || g != 1 || b != 1) {
                r = '#' + this.getHexString();
                g = this.getHex();
                return (String(g).length < r.length) ? g : r;
            }
        }
        else {
            return [Number(r.toFixed(4)), Number(g.toFixed(4)), Number(b.toFixed(4))];
        }
        return defValue;
    },

    __fromJson(j) {
        if (isString(j)) j = parseHexColor(j.replace('#', ''));
        if (j != undefined) {
            if (j.__isColor || isObject(j)) return this.__setRGB(j.r, j.g, j.b);
            if (isArray(j)) return this.__setRGB(j[0], j[1], j[2]);
            if (isNumeric(j)) return j <= 1 ? this.__setScalar(j) : this.setHex(j);
        }
        return this;
    },

    __fromJsonRGBA(j) {
        if (isString(j)) j = parseHexColor(j.replace('#', ''));
        if (j != undefined) {
            if (j.__isColor || isObject(j)) return this.__setRGBA(j.r, j.g, j.b, j.a);
            if (isArray(j)) return this.__setRGBA(j[0], j[1], j[2], j[3]);
            if (isNumeric(j)) return j <= 1 ? this.__setScalar(j) : this.setHex(j);
        }
        return this;
    },

    __fromJsonSRGB(j, i) {
        i = i || 0;
        if (isArray(j)) return this.__setRGBA(j[i], j[i + 1], j[i + 2], j[i + 3]);
        return this;
        // convertSRGBToLinear
    },

    set(value) {

        if (value && value.__isColor) {

            this.__copy(value);

        } else if (typeof value === 'number') {

            this.setHex(value);

        } else if (isString(value)) {

            this.setStyle(value);

        }

        return this;

    },

    __setScalar(scalar) {

        this.r = scalar;
        this.g = scalar;
        this.b = scalar;

        return this;

    },

    setHex(hex) {

        hex = floor(hex);

        this.r = (hex >> 16 & 255) / 255;
        this.g = (hex >> 8 & 255) / 255;
        this.b = (hex & 255) / 255;

        return this;

    },
    __setRGBA(r, g, b, a) {

        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return this;

    },
    __setRGB(r, g, b) {

        this.r = r;
        this.g = g;
        this.b = b;

        return this;

    },

    setHSL() {

        function hue2rgb(p, q, t) {

            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * 6 * (2 / 3 - t);
            return p;

        }

        return function setHSL(h, s, l) {

            // h,s,l ranges are in 0.0 - 1.0
            h = euclideanModulo(h, 1);
            s = clamp(s, 0, 1);
            l = clamp(l, 0, 1);

            if (s === 0) {

                this.r = this.g = this.b = l;

            } else {

                var p = l <= 0.5 ? l * (1 + s) : l + s - (l * s);
                var q = (2 * l) - p;

                this.r = hue2rgb(q, p, h + 1 / 3);
                this.g = hue2rgb(q, p, h);
                this.b = hue2rgb(q, p, h - 1 / 3);

            }

            return this;

        };

    },

    setStyle(style) {


        var m;

        if (m = /^((?:rgb|hsl)a?)\(\s*([^\)]*)\)/.exec(style)) {

            // rgb / hsl

            var color;
            var name = m[1];
            var components = m[2];

            switch (name) {

                case 'rgb':
                case 'rgba':

                    if (color = /^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec(components)) {

                        // rgb(255,0,0) rgba(255,0,0,0.5)
                        this.r = mmin(255, parseInt(color[1], 10)) / 255;
                        this.g = mmin(255, parseInt(color[2], 10)) / 255;
                        this.b = mmin(255, parseInt(color[3], 10)) / 255;


                        return this;

                    }

                    if (color = /^(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec(components)) {

                        // rgb(100%,0%,0%) rgba(100%,0%,0%,0.5)
                        this.r = mmin(100, parseInt(color[1], 10)) / 100;
                        this.g = mmin(100, parseInt(color[2], 10)) / 100;
                        this.b = mmin(100, parseInt(color[3], 10)) / 100;


                        return this;

                    }

                    break;

                case 'hsl':
                case 'hsla':

                    if (color = /^([0-9]*\.?[0-9]+)\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec(components)) {

                        // hsl(120,50%,50%) hsla(120,50%,50%,0.5)
                        var h = parseFloat(color[1]) / 360;
                        var s = parseInt(color[2], 10) / 100;
                        var l = parseInt(color[3], 10) / 100;

                        return this.setHSL(h, s, l);

                    }

                    break;

            }

        } else if (m = /^\#([A-Fa-f0-9]+)$/.exec(style)) {

            // hex color

            var hex = m[1];
            var size = hex.length;

            if (size === 3) {

                // #ff0
                this.r = parseInt(hex.charAt(0) + hex.charAt(0), 16) / 255;
                this.g = parseInt(hex.charAt(1) + hex.charAt(1), 16) / 255;
                this.b = parseInt(hex.charAt(2) + hex.charAt(2), 16) / 255;

                return this;

            } else if (size === 6) {

                // #ff0000
                this.r = parseInt(hex.charAt(0) + hex.charAt(1), 16) / 255;
                this.g = parseInt(hex.charAt(2) + hex.charAt(3), 16) / 255;
                this.b = parseInt(hex.charAt(4) + hex.charAt(5), 16) / 255;

                return this;

            }

        }

        return this;

    },

    __clone() {

        return new Color(this.r, this.g, this.b);

    },

    __copy(color) {

        this.r = color.r;
        this.g = color.g;
        this.b = color.b;

        return this;

    },

    getHex() {

        return (this.r * 255) << 16 ^ (this.g * 255) << 8 ^ (this.b * 255) << 0;

    },

    getHexString() {

        return ('000000' + this.getHex().toString(16)).slice(- 6);

    },

    setHSV(h, s, v) {
        var r, g, b;
        var i = floor(h * 6);
        var f = h * 6 - i;
        var p = v * (1 - s);
        var q = v * (1 - f * s);
        var t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        this.r = r; this.g = g; this.b = b;
        return this;
    },

    getHSV(optionalTarget) {

        var hsv = optionalTarget || { h: 0, s: 0, v: 0 };

        var r = this.r, g = this.g, b = this.b;

        var max = mmax(r, g, b), min = mmin(r, g, b);
        var h, s, v = max;

        var d = max - min;
        s = max == 0 ? 0 : d / max;

        if (max == min) {
            h = hsv.h; // achromatic
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        if (hsv.h == 1 && h == 0) h = 1;
        hsv.h = h;
        hsv.s = s;
        hsv.v = v;
        return hsv;
    },

    getHSL(optionalTarget) {

        // h,s,l ranges are in 0.0 - 1.0

        var hsl = optionalTarget || { h: 0, s: 0, l: 0 };

        var r = this.r, g = this.g, b = this.b;

        var max = mmax(r, g, b);
        var min = mmin(r, g, b);

        var hue, saturation;
        var lightness = (min + max) / 2.0;

        if (min === max) {

            hue = hsl.h;
            saturation = 0;

        } else {

            var delta = max - min;

            saturation = lightness <= 0.5 ? delta / (max + min) : delta / (2 - max - min);

            switch (max) {

                case r: hue = (g - b) / delta + (g < b ? 6 : 0); break;
                case g: hue = (b - r) / delta + 2; break;
                case b: hue = (r - g) / delta + 4; break;

            }

            hue /= 6;

        }

        hsl.h = hue;
        hsl.s = saturation;
        hsl.l = lightness;

        return hsl;

    },

    getStyle() {
        return 'rgb(' + ((this.r * 255) | 0) + ',' + ((this.g * 255) | 0) + ',' + ((this.b * 255) | 0) + ')';
    },

    offsetHSL(h, s, l) {
        var hsl = this.getHSL();
        hsl.h += h; hsl.s += s; hsl.l += l;
        this.setHSL(hsl.h, hsl.s, hsl.l);
        return this;
    },

    add(color) {
        this.r += color.r;
        this.g += color.g;
        this.b += color.b;
        return this;

    },

    addColors(color1, color2) {
        this.r = color1.r + color2.r;
        this.g = color1.g + color2.g;
        this.b = color1.b + color2.b;
        return this;
    },

    sub(color) {
        this.r = mmax(0, this.r - color.r);
        this.g = mmax(0, this.g - color.g);
        this.b = mmax(0, this.b - color.b);
        return this;
    },

    __multiply(color) {
        this.r *= color.r;
        this.g *= color.g;
        this.b *= color.b;
        return this;
    },

    __divideScalar(s) {
        this.r /= s;
        this.g /= s;
        this.b /= s;
        return this;
    },

    __multiplyScalar(s) {

        this.r *= s;
        this.g *= s;
        this.b *= s;

        return this;

    },

    lerp(color, alpha) {

        this.r += (color.r - this.r) * alpha;
        this.g += (color.g - this.g) * alpha;
        this.b += (color.b - this.b) * alpha;

        return this;

    },


    __lerpComponents(r, g, b, alpha) {
        this.r += (r - this.r) * alpha;
        this.g += (g - this.g) * alpha;
        this.b += (b - this.b) * alpha;
        return this;
    },


    __equals(c) {

        return (c.r === this.r) && (c.g === this.g) && (c.b === this.b);

    },

    __divide(color) {
        this.r /= color.r;
        this.g /= color.g;
        this.b /= color.b;
        return this;
    }


});



function Matrix4(e, is3D) {
    // 2d copy!
    this.e = e ? [
        e[0], e[1], e[2], e[3],
        e[4], e[5], e[6], e[7],
        e[8], e[9], e[10], e[11],
        e[12], e[13], e[14], e[15]
    ] : [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];

    if (is3D)
        this.__is3D = 1;

}


makeClass(Matrix4, {

    __isMatrix4: true,
 
	__makePerspective( left, right, top, bottom, near, far) {

		const te = this.e;
		const x = 2 * near / ( right - left );
		const y = 2 * near / ( top - bottom );

		const a = ( right + left ) / ( right - left );
		const b = ( top + bottom ) / ( top - bottom );

		let c, d;
 
        c = - ( far + near ) / ( far - near );
        d = ( - 2 * far * near ) / ( far - near ); 

		te[ 0 ] = x;	te[ 4 ] = 0;	te[ 8 ] = a; 	te[ 12 ] = 0;
		te[ 1 ] = 0;	te[ 5 ] = y;	te[ 9 ] = b; 	te[ 13 ] = 0;
		te[ 2 ] = 0;	te[ 6 ] = 0;	te[ 10 ] = c; 	te[ 14 ] = d;
		te[ 3 ] = 0;	te[ 7 ] = 0;	te[ 11 ] = - 1;	te[ 15 ] = 0;

		return this;

	},

    set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {

        var te = this.e;

        te[0] = n11; te[4] = n12; te[8] = n13; te[12] = n14;
        te[1] = n21; te[5] = n22; te[9] = n23; te[13] = n24;
        te[2] = n31; te[6] = n32; te[10] = n33; te[14] = n34;
        te[3] = n41; te[7] = n42; te[11] = n43; te[15] = n44;

        return this;

    },

    __identity() {

        this.set(

            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1

        );

        return this;

    },

    __clone() {

        return new Matrix4(this.e, this.__is3D);

    },

    __copy(m) {
        var te = this.e, me = m.e;
        te[0] = me[0]; te[1] = me[1]; te[2] = me[2]; te[3] = me[3];
        te[4] = me[4]; te[5] = me[5]; te[6] = me[6]; te[7] = me[7];
        te[8] = me[8]; te[9] = me[9]; te[10] = me[10]; te[11] = me[11];
        te[12] = me[12]; te[13] = me[13]; te[14] = me[14]; te[15] = me[15];
        return this;
    },

    __multiply(m) {
        return this.__multiplyMatrices(this, m);
    },
    __premultiply(m) {
        return this.__multiplyMatrices(m, this);
    },

    __moveByVector2(v) {
        var te = this.e;
        te[12] += te[0] * v.x;
        te[13] += te[5] * v.y;
        return this;
    },

    __getPosition() {
        var te = this.e;
        return new Vector3(te[12], te[13], te[14]);
    },

    __setPosition(x, y, z) {

        var te = this.e;

        if (x.__isVector3) {

            te[12] = x.x;
            te[13] = x.y;
            te[14] = x.z;

        } else {

            te[12] = x;
            te[13] = y;
            te[14] = z;

        }

        return this;

    },


    /*
    __rotateAroundX: function( a ){
        
        var c = cos(a)
            , s = sin(a)
            , te = this.e

            , a12 = te[ 4 ], a13 = te[ 8 ] 
            , a22 = te[ 5 ], a23 = te[ 9 ] 
            , a32 = te[ 6 ], a33 = te[ 10 ] 
            , a42 = te[ 7 ], a43 = te[ 11 ];

           
        te[ 4 ] = a12 * c + a13 * s;
        te[ 8 ] = -a12 * s + a13 * c;

        te[ 5 ] = a22 * c + a23 * s;
        te[ 9 ] = -a22 * s + a23 * c;
        
        te[ 6 ] = a32 * c + a33 * s;
        te[ 10 ] = -a32 * s + a33 * c;
        
        te[ 7 ] = a42 * c + a43 * s;
        te[ 11 ] = - a42 * s + a43 * c;
        

    },
    */

    __multiplyMatrices(a, b) {
        if (a.__is3D || b.__is3D) {
            this.__is3D = 1;
            return this.__multiplyMatrices4(a, b);
        } else {
            return this.__multiplyMatrices3(a, b);
        }
    },

    __multiplyMatrices3(a, b) {

        var ae = a.e,
            be = b.e,
            te = this.e,

            a11 = ae[0], a12 = ae[4], a14 = ae[12],
            a21 = ae[1], a22 = ae[5], a24 = ae[13],
            a34 = ae[14],

            b11 = be[0], b12 = be[4], b14 = be[12],
            b21 = be[1], b22 = be[5], b24 = be[13],
            b34 = be[14];

        te[0] = a11 * b11 + a12 * b21;
        te[4] = a11 * b12 + a12 * b22;
        te[12] = a11 * b14 + a12 * b24 + a14;
        te[1] = a21 * b11 + a22 * b21;
        te[5] = a21 * b12 + a22 * b22;
        te[13] = a21 * b14 + a22 * b24 + a24;
        te[14] = b34 + a34;

        return this;

    },

    __multiplyMatrices4(a, b) {

        var ae = a.e;
        var be = b.e;
        var te = this.e;

        var a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
        var a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
        var a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
        var a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

        var b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
        var b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
        var b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
        var b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

        te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
        te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
        te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
        te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

        te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
        te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
        te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
        te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

        te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
        te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
        te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
        te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

        te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
        te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
        te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
        te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

        return this;

    },

    __multiplyScalar(s) {

        var te = this.e;

        te[0] *= s; te[4] *= s; te[8] *= s; te[12] *= s;
        te[1] *= s; te[5] *= s; te[9] *= s; te[13] *= s;
        te[2] *= s; te[6] *= s; te[10] *= s; te[14] *= s;
        te[3] *= s; te[7] *= s; te[11] *= s; te[15] *= s;

        return this;

    },


    determinant() {
        //TODO: do Matrix3 if needed

        var te = this.e;

        var n11 = te[0], n12 = te[4], n13 = te[8], n14 = te[12];
        var n21 = te[1], n22 = te[5], n23 = te[9], n24 = te[13];
        var n31 = te[2], n32 = te[6], n33 = te[10], n34 = te[14];
        var n41 = te[3], n42 = te[7], n43 = te[11], n44 = te[15];

        //( based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm )

        return (
            n41 * (
                + n14 * n23 * n32
                - n13 * n24 * n32
                - n14 * n22 * n33
                + n12 * n24 * n33
                + n13 * n22 * n34
                - n12 * n23 * n34
            ) +
            n42 * (
                + n11 * n23 * n34
                - n11 * n24 * n33
                + n14 * n21 * n33
                - n13 * n21 * n34
                + n13 * n24 * n31
                - n14 * n23 * n31
            ) +
            n43 * (
                + n11 * n24 * n32
                - n11 * n22 * n34
                - n14 * n21 * n32
                + n12 * n21 * n34
                + n14 * n22 * n31
                - n12 * n24 * n31
            ) +
            n44 * (
                - n13 * n22 * n31
                - n11 * n23 * n32
                + n11 * n22 * n33
                + n13 * n21 * n32
                - n12 * n21 * n33
                + n12 * n23 * n31
            )

        );

    },

    __invert() {
        return this.__getInverseMatrix(this)
    },

    __getInverseMatrix(m) {
        m = m || new Matrix4();
        if (this.__is3D) {

            var te = m.e, me = this.e,

                n11 = me[0], n21 = me[1], n31 = me[2], n41 = me[3],
                n12 = me[4], n22 = me[5], n32 = me[6], n42 = me[7],
                n13 = me[8], n23 = me[9], n33 = me[10], n43 = me[11],
                n14 = me[12], n24 = me[13], n34 = me[14], n44 = me[15],

                t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
                t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
                t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
                t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

            var det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

            if (det) {
                var detInv = 1 / det;

                te[0] = t11 * detInv;
                te[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv;
                te[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv;
                te[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv;

                te[4] = t12 * detInv;
                te[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv;
                te[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv;
                te[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv;

                te[8] = t13 * detInv;
                te[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv;
                te[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv;
                te[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv;

                te[12] = t14 * detInv;
                te[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv;
                te[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv;
                te[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv;
            }
            m.__is3D = 1;

        } else {

            var te = m.e
                , me = this.e

                , n11 = me[0]
                , n21 = me[1]
                , n12 = me[4]
                , n22 = me[5]
                , n14 = me[12]
                , n24 = me[13]
                , n34 = me[14]

                , det = n11 * n22 - n21 * n12;

            if (det) {

                var detInv = 1 / det;

                te[0] = n22 / det;
                te[1] = -n21 / det;

                te[4] = -n12 / det;
                te[5] = n11 / det;

                te[12] = (n12 * n24 - n14 * n22) / det;
                te[13] = (n14 * n21 - n11 * n24) / det;
                te[14] = (n12 * n21 * n34 - n11 * n22 * n34) / det;

            }

        }

        return m;
    },


    __scale(v) {

        var te = this.e;
        var x = v.x, y = v.y, z = v.z;

        te[0] *= x; te[4] *= y; te[8] *= z;
        te[1] *= x; te[5] *= y; te[9] *= z;
        te[2] *= x; te[6] *= y; te[10] *= z;
        te[3] *= x; te[7] *= y; te[11] *= z;

        return this;

    },

    __equals(m) {

        var te = this.e, me = m.e;

        for (var i = 0; i < 16; i++) {

            if (te[i] !== me[i]) return false;

        }

        return true;

    }

});






function Vector2(x, y) {

    this.x = x || 0;
    this.y = y || 0;

}

makeClass(Vector2, {

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    },

    __setScalar(scalar) {
        return this.set(scalar, scalar);
    },

    __clone() { return new Vector2(this.x, this.y); },

    __copy(v) { this.x = v.x; this.y = v.y; return this; },

    add(v) { this.x += v.x; this.y += v.y; return this; },
    __add(v) { this.x += v.x; this.y += v.y; return this; },
    sub(v) { this.x -= v.x; this.y -= v.y; return this; },
    __sub(v) { this.x -= v.x; this.y -= v.y; return this; },


    __subVectors(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        return this;
    },


    __addScaledVector(v, s) {
        this.x += v.x * s;
        this.y += v.y * s;
        return this;
    },

    __multiply(v) {

        this.x *= v.x;
        this.y *= v.y;

        return this;

    },

    __multiplyScalar(scalar) {

        this.x *= scalar;
        this.y *= scalar;

        return this;

    },

    __divide(v) {

        this.x /= v.x;
        this.y /= v.y;

        return this;

    },

    __divideScalar(scalar) {
        return this.__multiplyScalar(1 / scalar);
    },

    min(v) {
        this.x = mmin(this.x, v.x);
        this.y = mmin(this.y, v.y);
        return this;

    },

    max(v) {
        this.x = mmax(this.x, v.x);
        this.y = mmax(this.y, v.y);
        return this;
    },

    clamp(min, max) {
        // assumes min < max, componentwise
        this.x = clamp(this.x, min.x, max.x);
        this.y = clamp(this.y, min.y, max.y);
        return this;
    },

    dot(v) {
        return this.x * v.x + this.y * v.y;
    },

    __length() {
        return sqrt(this.x * this.x + this.y * this.y);
    },

    __manhattanLength() {
        return abs(this.x) + abs(this.y);
    },

    __normalize() {
        return this.__divideScalar(this.__length() || 1);
    },
    __angle() {
        // computes the angle in radians with respect to the positive x-axis
        var angle = atan2(this.y, this.x);
        if (angle < 0) angle += 2 * PI;
        return angle;
    },

    __angleTo(v) {
        var ret = atan2(v.y, v.x) - atan2(this.y, this.x);
        while (ret < -PI) ret += PI * 2.0;
        while (ret > Math.PI) ret -= PI * 2.0;
        return ret;
    },

    __distanceTo(v) {
        return sqrt(this.__distanceToSquared(v));
    },

    __randomize() {
        return new Vector2(
            random() * this.x,
            random() * this.y
        );
    },
    __randomizeSpread() {
        return new Vector2(
            randomFloatSpread(this.x),
            randomFloatSpread(this.y)
        );
    },

    __distanceToSquared(v) {

        var dx = this.x - v.x, dy = this.y - v.y;
        return dx * dx + dy * dy;

    },

    lerp(v, alpha) {

        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;

        return this;

    },

    __lerpComponents(x, y, alpha) {
        this.x += (x - this.x) * alpha;
        this.y += (y - this.y) * alpha;
        return this;
    },


    __equals(v) {

        return ((v.x === this.x) && (v.y === this.y));

    },

    __rotateAroundZ0(angle) {
        var c = cos(angle), s = sin(angle), x = this.x, y = this.y;
        this.x = x * c - y * s;
        this.y = x * s + y * c;
        return this;
    },

    //debug
    rotate(a) { this.__rotateAroundZ0(a); },
    multiplyScalar(a) { this.__multiplyScalar(a); },
    //undebug

    __applyMatrix4(m) {

        var x = this.x, y = this.y;
        var e = m.e;

        var w = 1 / (e[3] * x + e[7] * y + e[15]);

        this.x = (e[0] * x + e[4] * y + e[12]) * w;
        this.y = (e[1] * x + e[5] * y + e[13]) * w;


        return this;

    },

    __cross(v) {

        return this.x * v.y - this.y * v.x;

    },

    __fromArray(a, o) {
        o = o || 0;
        this.x = a[o];
        this.y = a[o + 1];
        return this;
    }

}, {
    __isVector2: { enumerable: false, value: true }
});



function Vector3(x, y, z) {

    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;

}

makeClass(Vector3, {

    __project(cam) {

        return this.__applyMatrix4(cam.mw.im).__applyMatrix4(cam.__projectionMatrix);

    },

    __unproject(cam) {

        return this.__applyMatrix4(cam.__projectionMatrix.im).__applyMatrix4(camera.mw);

    },


    __cross(v) {
        return this.__crossVectors(this, v);
    },
    __crossVectors(a, b) {
        const ax = a.x, ay = a.y, az = a.z;
        const bx = b.x, by = b.y, bz = b.z;
        this.x = ay * bz - az * by;
        this.y = az * bx - ax * bz;
        this.z = ax * by - ay * bx;
        return this;
    },
    __fromArray(a, o) {
        o = o || 0;
        this.x = a[o];
        this.y = a[o + 1];
        this.z = a[o + 2];
        return this;
    },
    __toVector2() { return new Vector2(this.x, this.y); },
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; },
    __setScalar(scalar) { return this.set(scalar, scalar, scalar); },
    __clone() { return new Vector3(this.x, this.y, this.z); },
    __randomize() {
        return new Vector3(
            random() * this.x,
            random() * this.y,
            random() * this.z
        );
    },

    __randomizeSpread() {
        return new Vector3(
            randomFloatSpread(this.x),
            randomFloatSpread(this.y),
            randomFloatSpread(this.z)
        );
    },

    __copy(v) {

        this.x = v.x;
        this.y = v.y;
        this.z = v.z;

        return this;

    },

    add(v) {

        this.x += v.x;
        this.y += v.y;
        this.z += v.z;

        return this;

    },


    __subVectors(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        return this;
    },


    __addScaledVector(v, s) {
        this.x += v.x * s;
        this.y += v.y * s;
        this.z += v.z * s;
        return this;
    },

    sub(v) {

        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;

        return this;

    },

    __multiply(v) {


        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;

        return this;

    },

    __multiplyScalar(scalar) {

        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;

        return this;

    },


    __rotateAroundZ0(angle) {
        var c = cos(angle), s = sin(angle), x = this.x, y = this.y;
        this.x = x * c - y * s;
        this.y = x * s + y * c;
        return this;
    },


    __applyMatrix4(m) {

        var x = this.x, y = this.y, z = this.z;
        var e = m.e;

        var w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

        this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
        this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
        this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;

        return this;

    },

    __divide(v) {

        this.x /= v.x;
        this.y /= v.y;
        this.z /= v.z;

        return this;

    },

    __divideScalar(scalar) {

        return this.__multiplyScalar(1 / scalar);

    },

    min(v) {

        this.x = mmin(this.x, v.x);
        this.y = mmin(this.y, v.y);
        this.z = mmin(this.z, v.z);

        return this;

    },

    max(v) {

        this.x = mmax(this.x, v.x);
        this.y = mmax(this.y, v.y);
        this.z = mmax(this.z, v.z);

        return this;

    },

    clamp(min, max) {

        // assumes min < max, componentwise
        this.x = clamp(this.x, min.x, max.x);
        this.y = clamp(this.y, min.y, max.y);
        this.z = clamp(this.z, min.z, max.z);

        return this;

    },

    dot(v) {

        return this.x * v.x + this.y * v.y + this.z * v.z;

    },

    __length() {

        return sqrt(this.x * this.x + this.y * this.y + this.z * this.z);

    },

    __manhattanLength() {
        return abs(this.x) + abs(this.y) + abs(this.z);
    },

    __normalize() {
        return this.__divideScalar(this.__length() || 1);
    },

    lerp(v, alpha) {

        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        this.z += (v.z - this.z) * alpha;
        return this;

    },

    __lerpComponents(x, y, z, alpha) {
        this.x += (x - this.x) * alpha;
        this.y += (y - this.y) * alpha;
        this.z += (z - this.z) * alpha;
        return this;
    },


    __distanceTo(v) {

        return sqrt(this.__distanceToSquared(v));

    },

    __distanceToSquared(v) {

        var dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;

        return dx * dx + dy * dy + dz * dz;

    },

    __equals(v) {

        return ((v.x === this.x) && (v.y === this.y) && (v.z === this.z));

    }

}, {
    __isVector3: { enumerable: false, value: true }
});

function Vector4(x, y, z, w) {

    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.w = (w !== undefined) ? w : 1;

}

makeClass(Vector4, {

    set(x, y, z, w) {

        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;

        return this;

    },

    __fromArray(a, o) {
        o = o || 0;
        this.x = a[o];
        this.y = a[o + 1];
        this.z = a[o + 2];
        this.w = a[o + 3];
        return this;
    },

    __setScalar(scalar) {
        return this.set(scalar, scalar, scalar, scalar);
    },

    __randomize() {
        return new Vector4(
            random() * this.x,
            random() * this.y,
            random() * this.z,
            random() * this.w
        );
    },

    __randomizeSpread() {
        return new Vector4(
            randomFloatSpread(this.x),
            randomFloatSpread(this.y),
            randomFloatSpread(this.z),
            randomFloatSpread(this.w)
        );
    },

    __clone() {
        return new Vector4(this.x, this.y, this.z, this.w);
    },

    __copy(v) {

        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        this.w = (v.w !== undefined) ? v.w : 1;

        return this;

    },

    add(v, w) {

        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        this.w += v.w;

        return this;

    },


    __subVectors(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        this.w = a.w - b.w;
        return this;
    },

    __addScaledVector(v, s) {

        this.x += v.x * s;
        this.y += v.y * s;
        this.z += v.z * s;
        this.w += v.w * s;

        return this;

    },

    sub(v) {

        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        this.w -= v.w;

        return this;

    },

    __multiplyScalar(scalar) {

        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        this.w *= scalar;

        return this;

    },

    __applyMatrix4(m) {

        var x = this.x, y = this.y, z = this.z, w = this.w;
        var e = m.e;

        this.x = e[0] * x + e[4] * y + e[8] * z + e[12] * w;
        this.y = e[1] * x + e[5] * y + e[9] * z + e[13] * w;
        this.z = e[2] * x + e[6] * y + e[10] * z + e[14] * w;
        this.w = e[3] * x + e[7] * y + e[11] * z + e[15] * w;

        return this;

    },

    __divideScalar(scalar) {

        return this.__multiplyScalar(1 / scalar);

    },

    min(v) {

        this.x = mmin(this.x, v.x);
        this.y = mmin(this.y, v.y);
        this.z = mmin(this.z, v.z);
        this.w = mmin(this.w, v.w);

        return this;

    },

    max(v) {

        this.x = mmax(this.x, v.x);
        this.y = mmax(this.y, v.y);
        this.z = mmax(this.z, v.z);
        this.w = mmax(this.w, v.w);

        return this;

    },

    clamp(min, max) {

        // assumes min < max, componentwise

        this.x = clamp(this.x, min.x, max.x);
        this.y = clamp(this.y, min.y, max.y);
        this.z = clamp(this.z, min.z, max.z);
        this.w = clamp(this.w, min.w, max.w);

        return this;

    },

    dot(v) {

        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;

    },

    __length() {

        return sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);

    },

    __manhattanLength() {
        return abs(this.x) + abs(this.y) + abs(this.z) + abs(this.w);
    },

    __normalize() {
        return this.__divideScalar(this.__length() || 1);
    },

    lerp(v, alpha) {

        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        this.z += (v.z - this.z) * alpha;
        this.w += (v.w - this.w) * alpha;

        return this;

    },

    __lerpComponents(x, y, z, w, alpha) {
        this.x += (x - this.x) * alpha;
        this.y += (y - this.y) * alpha;
        this.z += (z - this.z) * alpha;
        this.w += (w - this.w) * alpha;
        return this;
    },


    __equals(v) {

        return ((v.x === this.x) && (v.y === this.y) && (v.z === this.z) && (v.w === this.w));

    }

},
    {
        __isVector4: { enumerable: false, value: true },
    }

);



var defaultZeroVector3 = new Vector3(0, 0, 0)
    , defaultZeroVector2 = new Vector2()
    , defaultZeroVector4 = new Vector4(0, 0, 0, 0)
    , defaultOneVector2 = new Vector2(1, 1)
    , default10Vector2 = new Vector2(10, 10)
    , defaultHalfVector2 = new Vector2(0.5, 0.5)
    , defaultOneVector3 = new Vector3(1, 1, 1)
    , defaultOneVector4 = new Vector4(1, 1, 1, 1)
    , default255Vector4 = new Vector4(255, 255, 255, 255)

    , defaultIdentityMatrix = new Matrix4();
