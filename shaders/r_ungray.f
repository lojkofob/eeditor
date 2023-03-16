varying vec2 vUv;
varying vec2 vUv2;
uniform vec3 color;
uniform sampler2D map;
uniform sampler2D map2;
uniform float opacity;
 
void main() {
    vec4 c_refract = texture2D( map2, vUv2 );
    vec2 rfix = c_refract.br * opacity;
    vec4 c_scene1 = texture2D( map, vUv );
    vec4 c_scene = texture2D( map, vUv + sin(rfix.x * rfix.y * 10.0) * 0.002 );
    c_scene.rgb *= color;
    
    float g = dot(c_scene.rgb, vec3(0.2, 0.387, 0.0414));
    vec4 col2 = mix( vec4(g, g, g, c_scene.a), c_scene, clamp( abs(rfix.y * rfix.x * 2.0 ), 0.0, 1.0) ) * c_scene.a;
    
    gl_FragColor = col2 + (c_scene - c_scene1) * sin(rfix.x * rfix.y) * 2.0;
    
} 
