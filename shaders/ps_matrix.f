// универсальный шейдер с матрицей трансформации для цветов

varying vec2 v_texcoord;
uniform sampler2D u_texture;
uniform vec4 u_color;
uniform float u_brightness;

// накладываемый цвет
uniform vec4 u_ps_color;    // rgba

// hsl-множитель результата
uniform vec3 u_mult;        // 1.0   1.0   1.0

// добавочный hsl-цвет 
uniform vec3 u_add;         // 0.0   0.0   0.0

// степень смешивания hsl-компонент цвет
uniform vec3 u_mix;         // 0.0   0.0   1.0


float hue2rgb(float f1, float f2, float hue) {
    hue = abs(fract(hue));
    if ((6.0 * hue) < 1.0) return f1 + (f2 - f1) * 6.0 * hue;
    else if ((2.0 * hue) < 1.0) return f2;
    else if ((3.0 * hue) < 2.0) return f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
    return f1;
}

vec3 hsl2rgb(vec3 hsl) {
    if (hsl.y == 0.0) {
        return vec3(hsl.z); // Luminance
    } else {
        float f2;
        if (hsl.z < 0.5) f2 = hsl.z * (1.0 + hsl.y);
        else f2 = hsl.z + hsl.y - hsl.y * hsl.z;
        float f1 = 2.0 * hsl.z - f2;
        return vec3(
            hue2rgb(f1, f2, hsl.x + (1.0/3.0)),
            hue2rgb(f1, f2, hsl.x),
            hue2rgb(f1, f2, hsl.x - (1.0/3.0))
        );
    }
}

vec3 rgb2hsl(vec3 color) {
    vec3 hsl; // init to 0 to avoid warnings ? (and reverse if + remove first part)

    float fmin = min(min(color.r, color.g), color.b); //Min. value of RGB
    float fmax = max(max(color.r, color.g), color.b); //Max. value of RGB
    float delta = fmax - fmin; //Delta RGB value

    // Luminance
    hsl.z = (fmax + fmin) / 2.0;

    if (delta == 0.0) //This is a gray, no chroma...
    {
        hsl.x = 0.0; // Hue
        hsl.y = 0.0; // Saturation
    } else //Chromatic data...
    {
        // Saturation
        if (hsl.z < 0.5) hsl.y = delta / (fmax + fmin);
        else hsl.y = delta / (2.0 - fmax - fmin);

        // Hue
        vec3 dv = (vec3(fmax) - color) / 6.0 / delta + 0.5;
        if (color.r == fmax) hsl.x = dv.b - dv.g; 
        else if (color.g == fmax) hsl.x = (1.0 / 3.0) + dv.r - dv.b;
        else if (color.b == fmax) hsl.x = (2.0 / 3.0) + dv.g - dv.r;

        hsl.x = abs(fract(hsl.x)); // Hue
    }

    return hsl;
}

void main(void) {
    vec4 color = u_color;
    color.rgb *= color.a;
    
    vec4 tcolor = color * texture2D(u_texture, v_texcoord.xy);
    
    tcolor.rgb = mix(tcolor.rgb, hsl2rgb(
        mix(rgb2hsl(u_ps_color.rgb *  tcolor.a), 
            rgb2hsl(tcolor.rgb), u_mix) * u_mult + u_add),
            u_ps_color.a) * u_brightness;
    
    gl_FragColor = tcolor;
}
