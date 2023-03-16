varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;
uniform float time;

void main() {
    vec4 c = texture2D( map, vUv );
    float t = fract( time ) * PI * 2.0;
    c = texture2D( map, vUv + 0.0005 * clamp( c.a - 0.3, 0.0, 1.0 ) * vec2(
        sin( vUv.y * 1000.0 + cos( vUv.x * 500.0 ) + t ),
        cos( vUv.y * 1000.0 - cos( vUv.x * 100.0 ) + t )
    ) );
    
    c.rgb *= color / c.a;
    
    c.a = 1.0;
    gl_FragColor = c * opacity;
    
}
