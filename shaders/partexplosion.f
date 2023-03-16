varying vec2 vUv;
varying vec4 vColor;

uniform sampler2D map;
uniform float f1;
uniform float f2;
uniform float f3;
uniform float f4;
uniform float f5;
uniform float f6;
uniform float f7;
uniform float f8;

void main() {
    vec4 c = texture2D( map, vUv );
    
    //c = texture2D( map, vUv + 0.03 * f1 * vec2( c.b, c.b * f2 ) );
    
    c.r = smoothstep(f1, 1.0, c.r);
    c.g = smoothstep(f2, 1.2, c.g);
    c.b = smoothstep(f3, 1.0, c.b);
    
    gl_FragColor = (
        vec4( c.r, c.r, 0, 1.0 ) +
        vec4( c.g, c.g, c.g, 0.0 ) 
    ) * c.a * c.b;
    
}
