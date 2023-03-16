varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;
uniform float f1;
uniform float f2;
uniform float f3;
uniform float f4;
uniform float f5;
uniform float time;
void main() {
    vec4 c = texture2D( map, vUv );
    float x = fract( vUv.x * 123.345 );
    float y = fract( vUv.y * 456.987 );
    c.rgb *= color;
    c.rgb += c.a * vec3(
        ( f1 + f5 * sin( time * f2 ) ) *
        fract( time * 20.74 * sin( f3 * x * time + fract( f3 * cos( y )) )) *
        fract( time * 68.45 * cos( f4 * y * time + vUv.x * f4 ) )
    );
    
    gl_FragColor = c * opacity;
} 
