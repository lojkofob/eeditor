varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;
uniform float progress;

void main() {
    vec4 c = texture2D( map, vUv );
    c.rgb *= mix( color, vec3(0.4), step( progress, vUv.y ) );
    gl_FragColor = c * opacity;
    
} 
