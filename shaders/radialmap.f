varying vec2 vUv;
uniform vec3 color;
uniform float opacity;
uniform float f1;
uniform float f2;
uniform sampler2D map;
uniform vec2 frcnt;
uniform float uvix;
uniform float uviy;

void main() {
    vec4 c = texture2D( map, vUv );
    c.rgb *= color;
    gl_FragColor = smoothstep(f1, f2, length( 2.0 * vec2(uvix,uviy) * ( vUv - frcnt ))) * c * c.a * opacity;
}
