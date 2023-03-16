varying vec2 vUv;
uniform sampler2D map;

void main() {
    gl_FragColor = vec4(0.0, texture2D( map, vUv ).g, 0.0, 1.0);
} 
