varying vec2 vUv;
uniform vec3 color;
uniform sampler2D u_texture;
uniform sampler2D u_texture1;
uniform sampler2D u_texture2;
uniform float opacity;

uniform float f1;
uniform float f2;
uniform float f3;
uniform float f4;
uniform float f5;
uniform float f6;
 
void main() {
    vec4 c_sand1 = texture2D( u_texture1, vUv );
    vec4 c_sand2 = texture2D( u_texture2, vUv );
    float c_sand2m = texture2D( u_texture, vUv ).r;
    
    float a = smoothstep(0.4, 0.8, length( 2.0 * vUv - 1.0 ));
    float b = smoothstep(0.88, 0.9, length( 2.0 * vUv - 1.0 ));

    float m = (1.0 - b) * clamp(pow( c_sand2m * f1  + a * f2, f3 ), 0.0, 1.0);
    
    gl_FragColor = mix(c_sand1, c_sand2, clamp(m, 0.0, 1.0) );

} 
