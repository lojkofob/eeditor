varying vec2 vUv;
uniform sampler2D map;
uniform float opacity;
uniform vec3 color;
void main() {
    vec4 c = texture2D( map, vUv );
    float g = dot(color * c.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor = vec4(g, g, g, c.a) * opacity;
} 
