varying vec2 vUv;
varying vec2 vUv2;
uniform vec3 color;
uniform sampler2D map;
uniform sampler2D map2;
uniform float opacity;
 
void main() {
    vec4 c_refract = texture2D( map2, vUv2 );
    vec2 rfix = (vec2(0.5) - c_refract.br) * c_refract.a * 0.05 * opacity;
    vec4 c_scene = texture2D( map, vUv + rfix );
    c_scene.rgb *= color;
    gl_FragColor = c_scene * c_scene.a;
} 
