varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float w;
uniform float h;
uniform float fs;
uniform float lw;

float clampd(float fl, float p){
    float d = floor(fl) * (fract(fl) - vUv.y / h * fs * 1.25);
    return clamp(pow(abs(d),p), 0.0, 1.0);
}

void main() {
    vec4 c = texture2D( map, vUv );
    vec4 y = vec4( color, c.a );
    float st = smoothstep(0.8, 1.0, c.a) * smoothstep(0.5, 0.9, c.r * c.g);
    vec4 c2 = mix(c, y, st);
    c2.rgb = mix(c2.rgb * vec3(0.9, 0.6, 0.4), c2.rgb, st * clampd(5.25, 2.0));
    c2.rgb = mix(c2.rgb, color, clamp( st * 1.0 - texture2D( map, vUv + vec2( (lw / 1.6 + 1.0) / w, 0.0)).a, 0.0, 1.0) );
    c2 = mix( c, c2, st );
    gl_FragColor = c2 * c2.a;
    
} 
