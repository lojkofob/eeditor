varying vec2 vUv;
uniform sampler2D map;

uniform vec3 color;
uniform float opacity;

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 k = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(vec3(c.r)+k.xyz)*6.0-k.www);
    return c.b * mix(k.xxx, clamp(p-k.xxx, 0.0, 1.0), c.g);
}

void main() {
    vec4 col = texture2D( map, vUv );
    col.rgb = hsv2rgb( rgb2hsv(col.rgb) + color * 2.0 - 1.0 );
    gl_FragColor = col * opacity * col.a;
} 
