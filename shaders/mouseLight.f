varying vec2 vUv;

uniform sampler2D map;
uniform vec3 color;
uniform float time;

uniform float opacity;
varying vec2 v_mouse;

varying vec4 glpos;

void main() {
    vec2 pp = glpos.xy / glpos.w;
    vec4 c = texture2D( map, vUv ); 
    vec4 c2 = texture2D( map, vUv - ( pp-v_mouse ) * 0.014 ); 
    c.rgb -= c2.rgb * smoothstep(distance(v_mouse, pp), 0.0, 0.3);
    
    
    
    
    gl_FragColor = c * opacity;
    
} 
