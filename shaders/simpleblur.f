varying vec2 vUv;
uniform sampler2D map;
uniform float x;
uniform float y;

void main() {
    vec4 color = texture2D( map, vUv );
    vec4 color1 = 
    texture2D( map, vUv + vec2( x,  y) ) +
    texture2D( map, vUv + vec2(-x,  y) ) +
    texture2D( map, vUv + vec2( x, -y) ) +
    texture2D( map, vUv + vec2(-x, -y) );
    color1 = color1 * 0.25;
    color = mix( color, color1, 0.7 );
    gl_FragColor = color * color.a;
} 
