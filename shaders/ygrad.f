varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float w;
uniform float h;

float clampd(float fl, vec4 c){
    float d = vUv.y - fl;
    return clamp(abs(10.0 * d*d*d*c.a), 0.0 ,1.0);
}

void main() {
    vec4 c = texture2D( map, vUv );
    
    vec4 y = vec4( color, c.a );
    float st = step(1.0, c.a);
    c = mix(c, y, st);
    
    c.gb = mix(c.gb / 4.0, c.gb, clampd(0.051, c));
    c.rgb = mix(c.rgb, vec3(1.0), clampd(0.2, c));
    
    c.rgb = mix(c.rgb, vec3(1.0), clamp( st * 1.0 - texture2D( map, vUv + vec2(1.0/w, 2.0/h)).a, 0.0, 1.0) );
    
    gl_FragColor = c * c.a;
} 
