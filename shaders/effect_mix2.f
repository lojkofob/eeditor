#ifdef GL_ES
#define LOWP lowp
precision lowp float;
#else
#define LOWP
#endif

uniform sampler2D map1;
uniform sampler2D map2;
varying LOWP vec2 vUv;
uniform LOWP float part;

void main() {
    gl_FragColor = mix( texture2D( map1, vUv ), texture2D( map2, vUv ), part );
} 
