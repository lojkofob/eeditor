varying vec2 vUv;
uniform vec3 color;
uniform float opacity;
uniform float time;

void main() {
    vec4 c = vec4(color * floor( fract( (vUv.x - vUv.y) * 50.0 - time + 0.5) +0.5), 1.0 );
    
    gl_FragColor = c * opacity;
} 
