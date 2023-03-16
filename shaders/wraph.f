varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;
uniform float atlasw;
uniform float imgw;
uniform float width;

void main() {
    
    vec2 uv = vUv;
    vec4 c = texture2D( map, uv ); 
    c.rgb *= color; 
    c.a *= opacity;
    gl_FragColor = c;
    
} 
