varying vec2 vUv;
uniform sampler2D map;

void main() {
    gl_FragColor = vec4(texture2D( map, vUv ).r, 0.0, 0.0, 1.0);
} 
