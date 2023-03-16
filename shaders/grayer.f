varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;

void main() {
    vec4 c = texture2D( map, vUv );
    float gray = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    c.rgb = mix(c.rgb * color * 0.8, vec3(gray * 0.8), 0.8);
    gl_FragColor = c * opacity;
} 
