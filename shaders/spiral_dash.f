varying vec2 vUv;
uniform vec3 color;
uniform float opacity;
uniform float f1;
uniform float f2;

uniform float q;
uniform float kx;
uniform float ky;
uniform float p;

void main() {
    float al = smoothstep(f1, f2, length( 2.0 * vUv - 1.0 ));
    
    vec2 m = vUv - vec2(0.5);
    float l = length(m);
    float a = atan(m.x, m.y);
	al = al * sin(6.28318530718 * q * (pow(l, kx)- p) - a) * cos( ky * a );
    
    gl_FragColor = vec4(color * al, al) * opacity;
} 
