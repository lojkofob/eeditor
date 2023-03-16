varying vec2 vUv;
varying vec4 vColor;

uniform sampler2D map;

void main() {
    vec4 c = texture2D( map, vUv );
    c.rgb *= vColor.rgb;
    float g = dot(c.rgb, vec3(0.299, 0.587, 0.114)) * vColor.a;
    gl_FragColor = vec4(g, g, g, c.a * vColor.a);
}
