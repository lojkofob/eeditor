varying vec2 vUv;
uniform sampler2D map;
uniform float time;

void main() {
    vec2 px = vec2(0.03,0.03);
    
    vec4 k = texture2D(map, vUv);
    vec4 x0 = texture2D(map, vUv - vec2( px.x, 0.0 ));
    vec4 x1 = texture2D(map, vUv + vec2( px.x, 0.0 ));
    vec4 y1 = texture2D(map, vUv + vec2( 0.0, px.y ));
    vec4 y0 = texture2D(map, vUv - vec2( 0.0, px.y ));
     
    float divergence = (x1.x - x0.x + y1.y - y0.y);
    
    gl_FragColor = mix(k, vec4(0.5,0.5,0.5,1.0), 0.2 + divergence );
}


