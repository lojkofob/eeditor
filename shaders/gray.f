varying vec2 vUv;
uniform sampler2D map;
uniform float opacity;

void main() {
    vec4 color = texture2D( map, vUv );
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor = vec4(gray, gray, gray, 1.0) * color.a * opacity;
} 
