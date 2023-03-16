varying vec2 vUv;
uniform sampler2D map;

void main() {
    float a = texture2D( map, vUv ).a;
    gl_FragColor = vec4(a, a, a, 1.0);
}
