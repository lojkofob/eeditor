varying vec2 vUv;
uniform vec3 color;
uniform float opacity;

uniform float f1;
uniform float f2;

uniform float f3;
uniform float f4;

uniform float q1;
uniform float q2;

uniform float p1;
uniform float p2;

void main() {
    float al = smoothstep(f1, f2, length( 2.0 * vUv - 1.0 )) - smoothstep(f3, f4, length( 2.0 * vUv - 1.0 ));
    
    vec2 m = vUv - vec2(0.5);
    float l = length(m);
    float a = atan(m.x, m.y);
	al = al * sin(a * q1) * cos(q2 * a);
    
    al = smoothstep(p1, p2, al);
    
    gl_FragColor = vec4(color * al, al) * opacity;
} 
