#ifdef GL_ES
#define LOWP lowp
precision lowp float;
#else
#define LOWP
#endif

uniform sampler2D map1;
uniform sampler2D map2;
uniform sampler2D map3;
uniform sampler2D map4;
varying LOWP vec2 vUv;
uniform LOWP vec3 color;
uniform LOWP float opacity;
uniform LOWP float part;

void main() {
    vec4 c = mix( texture2D( map4, vUv ), 
                mix( texture2D( map3, vUv ), 
                    mix( texture2D( map2, vUv ),
                         texture2D( map1, vUv ), 
                         clamp( (part * 4.0 - 3.0), 0.0, 1.0 ))
                    , clamp( (part * 3.0 - 2.0), 0.0, 1.0 ) )
                , clamp( (part * 2.0 - 1.0), 0.0, 1.0 ) );
                
    c.rgb *= color;
    gl_FragColor = c * opacity;
} 
