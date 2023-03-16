varying vec2 vUv;
uniform sampler2D map;
uniform sampler2D sub;
uniform vec3 color;
uniform vec4 rect;

void main() {
    vec4 tc = texture2D( map, vUv );
    
    vec2 subuv = vUv;
    
    subuv.x = subuv.x * rect.x + rect.y;
    
    subuv.y = subuv.y * rect.z + rect.w;
    
    vec4 color2 = texture2D( sub, subuv );
    
    tc.rgb = mix( tc.rgb, 
        mix ( color2.rgb, color, 1.0 - color2.a),
        tc.a * ( 1.0 - tc.r ) * 2.0 );
        
    gl_FragColor = tc;
} 
