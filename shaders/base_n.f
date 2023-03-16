varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;
uniform float cmod;
void main() {
    vec4 c = texture2D( map, vUv );
    c.rgb = mix(c.rgb, color, cmod);
    gl_FragColor = c * opacity;
} 
