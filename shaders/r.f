uniform vec3 color;
uniform float opacity;
varying vec2 vUv; 
varying vec2 f; 

void main() {
    float a = smoothstep(f.x, f.y, length( 2.0 * vUv - 1.0 ));
    gl_FragColor = vec4( color * a, a ) * opacity;
} 
