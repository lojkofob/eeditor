varying vec2 vUv;
uniform sampler2D map;
uniform float fade;

void main() {
    vec4 c = texture2D( map, vUv ); 
    c.rgb *= fade;
    gl_FragColor = c;
} 
