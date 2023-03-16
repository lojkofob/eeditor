varying vec2 vUv;
uniform sampler2D refractmap;
uniform sampler2D map;

void main() {
    vec4 c_refract = texture2D( refractmap, vUv );
    vec2 rfix = (vec2(0.5) - c_refract.br) * c_refract.a * 0.05 ;
    vec4 c_scene = texture2D( map, vUv + rfix);
    gl_FragColor = c_scene * c_scene.a;
} 
