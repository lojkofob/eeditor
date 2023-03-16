varying vec2 vUv;
varying vec2 vUv2;
uniform vec3 color;
uniform sampler2D map;
uniform sampler2D map2;
uniform float opacity;
uniform vec2 v1;
uniform vec2 v2;
uniform vec2 v3;
uniform vec2 v4;
uniform float time;
void main() {
    vec2 vv1 = v1 / 100.0;
    vec2 vv2 = v2 / 100.0;
    vec2 vv3 = v3 / 100.0;
    vec2 vv4 = v4 / 100.0;
    
    vec4 c1 = texture2D( map, vUv + vv1 + vv3 );
    vec4 c2 = texture2D( map, vUv - vv1 + vv3 );
    vec4 c3 = texture2D( map, vUv + vv2 + vv4 );
    vec4 c4 = texture2D( map, vUv - vv2 + vv4 );
    
    vec4 c5 = texture2D( map, vUv );
    
    vec4 cc = 0.2 *(c5 + c1 + c2 + c3 + c4);
    vec4 c = c5;
        
    if (cc.b > 0.6 * (cc.g + cc.r) ){
    
        float f1 = sin(time * 100.0* vUv.y) + cos(time * 148.0 * vUv.y) + cos(time * 1248.0 * vUv.y) + cos(time * 48.0 * vUv.y);
        
        float f2 = sin(time * 935.0* vUv.y) + cos(time * 208.0 * vUv.y) + cos(time * 195.0 * vUv.y) + cos(time * 941.0 * vUv.y);
        
        vec4 c30 = texture2D( map, vUv + vv2 * 4.0 * (c2.r - c3.g) + vv4 );
        vec4 c40 = texture2D( map, vUv - vv2 * 4.0 * (c2.r - c3.g) + vv4 );
        vec4 c31 = texture2D( map, vUv + vv2 * 5.0 + vv4 ) * (c2.b - c3.b);
        vec4 c41 = texture2D( map, vUv - vv2 * 5.0 + vv4 ) * (c2.b - c3.b);
                
        c = c + f1 * (c3 * 0.52 + c30 * 0.32 + c31 * 0.22 +
                 c4 * 0.52 + c40 * 0.32 + c41 * 0.22
                 ) * 0.3;
                 
        c = c - f2 * ( c1 * 0.15 + c2 * 0.15 );
        
    } 
    
        
    c.rgb *= color;
    gl_FragColor = c * opacity;
    
} 
