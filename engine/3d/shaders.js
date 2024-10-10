

function ToGLES3(sh) {

    function genvsh() {
        var vsh = getVertexShaderData(sh.v),
            vp = options.__baseShadersFolder + sh.v + '_3.v';

        vsh = "#version 300 es\n" + vsh.replace(/attribute/g, 'in').replace(/varying/g, 'out');
        globalConfigsData[vp] = vsh;
    }

    function genfsh() {
        var fsh = getFragmentShaderData(sh.f),
            fp = options.__baseShadersFolder + sh.f + '_3.f',
            fsh = "#version 300 es\n" +
                fsh.replace(/varying/g, 'in')
                    .replace(/gl_FragColor/g, 'glFragColor')
                    .replace(/texture2D/g, 'texture')
                    .replace(/void main/g, 'out vec4 glFragColor;\nvoid main');

        globalConfigsData[fp] = fsh;
    }

    getVertexShaderData(sh.v + '_3') || genvsh();
    getFragmentShaderData(sh.f + '_3') || genfsh();

    sh = deepclone(sh);
    sh.f += '_3';
    sh.v += '_3';
    return sh;
}

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
                'Uint16Array4': vec4,
                'Int16Array4': vec4,
                'Number': float,
                'Matrix4': mat4,
                'Vector3': vec3,
                'Vector2': vec2,
                'Vector4': vec4,
            }
        },
        sh_converts = {
            Float32Array2vec4(a, b, c) { return 'vec4(' + a + ',' + num(b) + ',' + num(c) + ')'; },
            Float32Array3vec4(a, b) { return 'vec4(' + a + ',' + num(b) + ')'; },
            Float32Array4vec4(a) { return a; },
            vec2vec3(a, b) { return 'vec3(' + a + ',' + num(b) + ')'; },
            vec3vec4(a, b) { return 'vec4(' + a + ',' + num(b) + ')'; },
            vec2vec4(a, b, c) { return 'vec4(' + a + ',' + num(b) + ',' + num(c) + ')'; },
            vec4vec4(a) { return a; },
            vec3vec3(a) { return a; },
            vec2vec2(a) { return a; }
        },

        code = '',

        line = function () {
            for (var i in arguments) {
                code += arguments[i] + ';';
                //cheats
                code += '\n';
                //nocheats
            }
        },

        materials = setNonObfuscatedParams({}, 'phong', {
            __uniforms_f: {
                light_position: vec3, // Позиция источника света
                light_color: vec3, // Цвет источника света
                ambient_color: vec3, // Цвет окружающего освещения
                // time: float,
                m_diffuse: vec3, // Диффузный цвет материала
                m_specular: vec3, // Спекулярный цвет материала
                m_shininess: float // Шероховатость материала
            },
            __fragment_code() {
                line(
                    'vec3 light_dir = normalize(light_position)',
                    'vec3 view_dir = normalize(-gl_FragCoord.xyz)', // Направление на камеру (приблизительно)
                    'float diff = max(dot(v_normal, light_dir), 0.0)', // Функция освещения Фонга
                    'vec3 diffuse = diff * m_diffuse * light_color',
                    'vec3 reflect_dir = reflect(-light_dir, v_normal)',
                    'float spec = pow(max(dot(view_dir, reflect_dir), 0.0), m_shininess)',
                    'vec3 specular = spec * m_specular * light_color',
                    'vec3 ambient = ambient_color * m_diffuse',
                    // 'vec4 mat_color = v_normal.x * tc_uv0'
                    'vec4 mat_color = vec4(ambient + diffuse + specular, 1.0) * tc_uv0'
                );
                return 'mat_color';
            }
        });



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
        return sh_converts[t1 + t2];
    }
    function sh_convert(t1, t2, a, b, c) {
        return sh_convertFunc(t1, t2)(a, b, c);
    }

    function declare(a, b, c) {
        return a && b && c ? a + ' ' + b + ' ' + c + ';' : undefined;
    }

    function declare_withp(a, b, c) {
        return a && b && c ? a + ' ' + _shader_precision + ' ' + b + ' ' + c + ';' : undefined;
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
        }, mat = node.__material;

        if (mat) {
            mergeObj(opts, mat[0]);
        }

        if (opts.__type) {
            mergeObjectDeep(opts, materials[opts.__type]);
        }

        if (opts.__buffers.a_position) {
            opts.__uniforms_v.mw = mat4;
            opts.__uniforms_v.pm = mat4;
        }

        if (opts.__buffers.a_color) {
            opts.__variyng.color = vec4;
        }

        if (opts.__buffers.a_normal) {
            opts.__variyng.normal = vec3;
            opts.__uniforms_v.mw_inv_trans = mat4;
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
            var main_texture_color, result_color, result_color;
            per_texture(opts, d => {
                line('vec4 tc_' + d + '=texture2D(t_' + d + ',v_' + d + ')');
                if (!main_texture_color) main_texture_color = 'tc_' + d;
            });

            if (opts.__fragment_code) {
                result_color = opts.__fragment_code();
            }
            else {
                if (opts.__variyng.color) {
                    result_color = 'v_color';
                }
                if (result_color && main_texture_color) {
                    result_color = result_color + '*' + main_texture_color;
                }
            }

            if (!result_color) {
                // result_color = 'vec4(1.0,0.0,0.0,1.0)'; // red error color
                result_color = 'v_gl_Position';
                opts.__variyng.gl_Position = vec4;
                // opts.__uniforms_v.time = float;
            }
            if (opts.__premultipliedAlpha) {
                line('vec4 rc=' + result_color,
                    'rc.rgb*=rc.a');
                result_color = 'rc';
            }
            line('gl_FragColor=' + result_color);
            return code;
        }

        computeCode();
        var chunks = concatArrays(
            [_shader_defines_str],
            // uniforms
            $mapObjectToArray(opts.__uniforms_f, (v, k) => declare_withp('uniform', sh_type(node[k]) || v.t || v, k)),
            // variyngs
            $mapObjectToArray(opts.__variyng, (v, k) => declare_withp('varying', v, 'v_' + k)),
            // textures
            $map(opts.__textures, v => declare('uniform', 'sampler2D', 't_' + v)),
            // main
            ['void main(){', code, '}']
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

            if (opts.__variyng.normal) {
                line('v_normal=normalize((mw_inv_trans * ' + sh_convert(buffer_type(opts.__buffers.a_normal), vec4, 'a_normal', 1.0, 1.0, 1.0) + ').xyz)');
            }

            if (opts.__buffers.a_position) {
                line('gl_Position=' + (opts.__uniforms_v.pm ? 'pm*' : '') + (opts.__uniforms_v.mw ? 'mw*' : '') + sh_convert(buffer_type(opts.__buffers.a_position), vec4, 'a_position', 1.0, 1.0));
            }

            if (opts.__variyng.gl_Position) {
                // line('v_gl_Position=normalize(vec4(abs(gl_Position.xyz)*(sin(time + 10.0 * sin(gl_Position.x)) + 1.01),0.8)*mw) * 1.5');
                line('v_gl_Position=normalize(vec4(abs(gl_Position.xyz)*mw)');
            }

            /// \todo: other buffers
            return code;
        }

        computeCode();
        var chunks = concatArrays(
            [_shader_defines_str],
            // attributes
            $mapObjectToArray(opts.__buffers, b => declare('attribute', buffer_type(b), b.__name)),
            // uniforms
            $mapObjectToArray(opts.__uniforms_v, (v, k) => declare('uniform', sh_type(node[k]) || v.t || v, k)),
            // variyngs
            $mapObjectToArray(opts.__variyng, (v, k) => declare('varying', v, 'v_' + k)),
            // main
            ['void main(){', code, '}']
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

        return { f: opts.f, v: opts.v, r: 1, __autogenerated: 1 };
    }

    return ComputeShaderFor;

})();