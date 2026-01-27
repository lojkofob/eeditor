varying vec2 vUv;
uniform vec3 color;
uniform float opacity;
uniform vec2 u_frcnt;
void main() {
    float a = smoothstep( 1.0 - min(0.5, distance( vUv, u_frcnt ) ), 0.499, 0.5 ) * opacity; 
    gl_FragColor = vec4(color * a, a);
} 
