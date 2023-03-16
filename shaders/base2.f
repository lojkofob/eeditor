varying vec2 vUv;
uniform sampler2D t1;
uniform sampler2D t2;
uniform sampler2D t3;

vec4 getC(vec2 uvu) {
    uvu = clamp(uvu,0.0,1.0);
    vec4 velocity = texture2D( t1,  uvu);
    vec4 divergence = texture2D( t2, uvu );
    float press = texture2D( t3, uvu ).r;
    
    vec4 color = velocity;
    float a = 1.0 - distance(color.rg, vec2(0.5,0.5));
    color.a = min( press * 4.0 + a * 0.3, 0.9 );
    
    color.rgb = mix (color.rgb, vec3( ( (color.r - color.b) + color.a + 4.0 * (divergence.r - 0.5))), 0.4 );
    
    color.rgb = clamp(color.rgb, 0.2,0.8);
    color.b = color.b + 0.04;
    return color;
}

void main() {

    vec4 c2 = getC((vUv - vec2(0.5,0.5)) * 1.02 + vec2(0.5,0.5));
    c2.rgb = vec3(0.0);
    vec4 c3 = getC((vUv - vec2(0.5,0.5)) * 1.05 + vec2(0.5,0.5));
    c3.rgb = vec3(1.0);
    gl_FragColor = mix( getC(vUv), mix( c2, c3, 0.6 ), 0.5 );
    

} 
