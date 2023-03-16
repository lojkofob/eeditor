varying vec2 vUv;
uniform sampler2D map;

uniform vec3 color;

vec3 hsv2rgb(vec3 c) {
    vec4 k = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(vec3(c.r)+k.xyz)*6.0-k.www);
    return c.b * mix(k.xxx, clamp(p-k.xxx, 0.0, 1.0), c.g);
}

void main() {
    vec4 col;
    col.a = 1.0;
    col.rgb = hsv2rgb( vec3(1.0 - vUv.y, 1.0, 1.0 ) );
    gl_FragColor = col;
} 
