varying vec2 vUv;
uniform sampler2D map;

void main() {
    float x = vUv.x - 0.5;
    float y = vUv.y - 0.5;
    vec4 c = texture2D( map, vUv );
    gl_FragColor = (1.0 - smoothstep(0.2, 0.25, x*x + y*y)) * c * c.a;
    
} 
