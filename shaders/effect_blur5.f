#ifdef GL_ES
#define LOWP lowp
precision lowp float;
#else
#define LOWP
#endif

uniform sampler2D map;
varying LOWP vec2 vUv;
uniform LOWP vec3 color;
uniform LOWP float opacity;
uniform LOWP vec2 v1;
uniform LOWP vec2 v2;

void main() {
    vec4 c = texture2D( map, vUv + v1 ) * 0.0702702703 +
        texture2D( map, vUv - v1 ) * 0.0702702703 +
        texture2D( map, vUv + v2 ) * 0.3162162162 +
        texture2D( map, vUv - v2 ) * 0.3162162162 +
        texture2D( map, vUv ) * 0.2270270270;
    c.rgb *= color;
    gl_FragColor = c * opacity;
} 
