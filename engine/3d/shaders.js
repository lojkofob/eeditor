var ComputeShaderFor = (function () {


    function num(a) {
        if (isNumber(a)) {
            a = a + '';
            if (a.indexOf('.') == -1) {
                a += '.0';
            }
        }
        return a;
    }

    var mat4 = 'mat4', vec2 = 'vec2', vec3 = 'vec3', vec4 = 'vec4', float = 'float', uint = 'uint', int = 'int',
        sh_consts = {
            __jstype2atype: {
                'Float32Array1': float,
                'Float32Array2': vec2,
                'Float32Array3': vec3,
                'Float32Array4': vec4,
                'Matrix4': mat4,
                'Uint16Array4': vec4,
                'Int16Array4': vec4
            },
            __converts: {
                Float32Array2vec4(a, b, c) { return 'vec4(' + a + ',' + num(b) + ',' + num(c) + ')'; },
                Float32Array3vec4(a, b) { return 'vec4(' + a + ',' + num(b) + ')'; },
                Float32Array4vec4(a) { return a; },
                vec2vec3(a, b) { return 'vec3(' + a + ',' + num(b) + ')'; },
                vec3vec4(a, b) { return 'vec4(' + a + ',' + num(b) + ')'; },
                vec2vec4(a, b, c) { return 'vec4(' + a + ',' + num(b) + ',' + num(c) + ')'; },
                vec4vec4(a) { return a; },
                vec3vec3(a) { return a; },
                vec2vec2(a) { return a; }
            }
        },
        code = '';


    function line(txt) {
        code += txt + ';';
        //cheats
        code += '\n';
        //nocheats                
    }

    function sh_type(type, suff) {
        return sh_consts.__jstype2atype[stringifyTypeOfObject(type) + (suff || '')] ||
            //debug
            consoleDebug("no type for ", stringifyTypeOfObject(type) + (suff || ''))
        //undebug
        0
    }
    function buffer_type(buffer) {
        return sh_type(buffer.__arrayType, buffer.__itemSize)

    }
    function sh_convertFunc(t1, t2) {
        return sh_consts.__converts[t1 + t2];
    }
    function sh_convert(t1, t2, a, b, c) {
        return sh_convertFunc(t1, t2)(a, b, c);
    }

    function declare(a, b, c) {
        return a && b && c ? a + ' ' + b + ' ' + c + ';' : undefined;
    }

    function declare_lowp(a, b, c) {
        return a && b && c ? a + ' LOWP ' + b + ' ' + c + ';' : undefined;
    }

    function per_texture(opts, f) {
        $each(opts.__textures, d => { f(d) });
    }

    function GetShaderOptsFor(node) {

        var opts = {
            __buffers: $filterObject(node.__buffers, (v, k) => k.startsWith('a_')),
            __uniforms_v: {},
            __uniforms_f: {},
            __textures: [],
            __variyng: {}
        };

        if (opts.__buffers.a_position) {
            opts.__uniforms_v.mw = mat4;
            opts.__uniforms_v.pm = mat4;
        }

        if (opts.__buffers.a_color) {
            opts.__variyng.color = vec4;
        }

        $each(['uv0', 'uv1', 'uv2', 'uv3', 'uv4', 'uv5', 'uv6', 'uv7'], d => {
            if (opts.__buffers['a_' + d]) {
                opts.__textures.push(d);
            }
        });

        per_texture(opts, d => {
            opts.__variyng[d] = vec2;
        });

        // create name
        var shaderName = "_sB";
        $each(opts.__buffers, b => { shaderName += b.__name.charAt(0); });
        shaderName += 'V';
        $each(opts.__variyng, (t, k) => { shaderName += k.charAt(t.length - 1); });

        opts.f = shaderName;
        opts.v = shaderName;

        return opts;
    }

    function ComputeFShaderFor(node, opts) {

        function computeCode() {
            code = '';
            var main_texture_color;
            per_texture(opts, d => {
                if (!main_texture_color) main_texture_color = 'tc_' + d;
                line('vec4 tc_' + d + '=texture2D(t_' + d + ',v_' + d + ')');
            });

            if (opts.__variyng.color) {
                if (main_texture_color) {
                    line('gl_FragColor=v_color*' + main_texture_color);
                } else {
                    line('gl_FragColor=v_color');
                }
            } else if (main_texture_color) {
                line('gl_FragColor=' + main_texture_color);
            } else {
                line('gl_FragColor=vec4(1.0, 0.0, 0.0, 1.0)'); // red error color
            }

            line('gl_FragColor.rgb=gl_FragColor.rgb*gl_FragColor.a');
            return code;
        }

        var chunks = concatArrays(
            ["#ifdef GL_ES\n#define LOWP lowp\nprecision mediump float;\n#else\n#define LOWP\n#endif\n"],
            // uniforms
            $mapObjectToArray(opts.__uniforms_f, (v, k) => declare_lowp('uniform', sh_type(node[k]) || v.t || v, k)),
            // variyngs
            $mapObjectToArray(opts.__variyng, (v, k) => declare_lowp('varying', v, 'v_' + k)),
            // textures
            $map(opts.__textures, v => declare('uniform', 'sampler2D', 't_' + v)),
            // main
            ['void main(){', computeCode(), '}']
        ).filter(a => a);

        /// \todo: other buffers, textures and operations

        return chunks.join('\n');

    }

    function ComputeVShaderFor(node, opts) {

        function computeCode() {
            code = '';
            per_texture(opts, d => {
                line('v_' + d + '=a_' + d);
            });

            if (opts.__variyng.a_color) {
                line('v_color=' + sh_convert(opts.__variyng.color, vec4, 'a_color', 1.0, 1.0));
            }

            if (opts.__buffers.a_position) {
                line('gl_Position=' + (opts.__uniforms_v.pm ? 'pm*' : '') + (opts.__uniforms_v.mw ? 'mw*' : '') + sh_convert(buffer_type(opts.__buffers.a_position), vec4, 'a_position', 1.0, 1.0));
            }
            /// \todo: other buffers
            return code;
        }

        var chunks = concatArrays(
            [_shader_defines_str],
            // attributes
            $mapObjectToArray(opts.__buffers, b => declare('attribute', buffer_type(b), b.__name)),
            // uniforms
            $mapObjectToArray(opts.__uniforms_v, (v, k) => declare('uniform', sh_type(node[k]) || v.t || v, k)),
            // variyngs
            $mapObjectToArray(opts.__variyng, (v, k) => declare('varying', v, 'v_' + k)),
            // main
            ['void main(){', computeCode(), '}']
        ).filter(a => a);

        return chunks.join('\n');
    }

    function ComputeShaderFor(node, opts) {
        opts = opts || GetShaderOptsFor(node);
        var fp = options.__baseShadersFolder + opts.f + '.f',
            vp = options.__baseShadersFolder + opts.v + '.v';
        if (!globalConfigsData[fp]) {
            globalConfigsData[fp] = ComputeFShaderFor(node, opts);
            // consoleLog(opts.f, '=', globalConfigsData[fp])
        }

        if (!globalConfigsData[vp]) {
            globalConfigsData[vp] = ComputeVShaderFor(node, opts);
            // consoleLog(opts.v, '=', globalConfigsData[vp])
        }

        return { f: opts.f, v: opts.v, r: 1 };
    }

    return ComputeShaderFor;

})();