varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float w;
uniform float h;
uniform float fs;
uniform float lw;

float clampd(float fl, float p){
    float d = floor(fl) * (fract(fl) - vUv.y * fs / h);
    return clamp( pow( abs(d), p ), 0.0 ,1.0);
}

void main() {
    vec4 c = texture2D( map, vUv );
    
    vec4 y = vec4( color, c.a );
    float st = step(1.0, c.a) * smoothstep(0.7, 0.8, c.r);
    c = mix(c, y, st);
    
    c.rgb = mix(c.rgb * vec3(0.76, 0.56, 0.33), c.rgb, clampd(6.22, 1.0));
    
    c.rgb = mix(c.rgb, vec3(1.0), clamp( st * 1.0 - texture2D( map, vUv + vec2( (lw / 1.6 + 1.0) / w, 0.0)).a, 0.0, 1.0) );
    
    gl_FragColor = c * c.a;
} 
