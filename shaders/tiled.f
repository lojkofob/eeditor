varying vec2 vUv;
uniform sampler2D map;
uniform vec2 size;
uniform vec2 rep;
uniform float beta;
uniform float gamma;
uniform float opacity;
uniform vec3 color;

void main() {
    
    vec2 pix = size / rep;
    vec2 uv = vUv * pix;
    float s = sign( sin(uv.x * PI)) * sign( sin( uv.y * PI));
    uv.x = abs ( fract( uv.x * s ) ); 
    uv.y = fract( uv.y ); 
    
    vec4 c = texture2D( map, uv );
    
    vec4 c2 = texture2D( map, uv - 10.0 * vec2( s * cos( beta * 30.0 * PI ), sin(beta * 30.0 * PI )) / size );
    
    float d = min( 2.0 + 50.0 * vUv.x * (1.0 - vUv.x) * vUv.y * (1.0 - vUv.y), 4.0);
    
    float r = c.r + c.g + c.b - 0.4;
    
    c = mix(c, c - c2 / 1.1 + vec4( 0.05 ), 0.6);
    
    c.rgb *= color * d * d;
    c.rgb += clamp( r * r * sin( (vUv.x - vUv.y / 2.0) * 10.0 + gamma * 20.0 * PI ), 0.0, 0.3 );
    
    c.a = opacity;
    
    gl_FragColor = c;
} 
