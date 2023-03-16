varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;
uniform float f1;
uniform vec2 frcnt;

void main() {
    vec4 j = texture2D( map, vUv ) * vec4(color, opacity);
    float v = distance( vUv, frcnt + vec2( sin(f1), cos(f1) ) * 100.0 / 2048.0 ) * 15.0;
    v = v * v * v;
    gl_FragColor = j * min(1.0, v * v + j.r) * j.a;
} 
