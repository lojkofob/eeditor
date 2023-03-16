varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;

void main()
{
     
    vec4 white = vec4(1.0, 1.0, 1.0, 1.0);
    vec4 shadow = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 tcolor = texture2D(map, vUv);
    vec4 real = vec4(color.rgb * tcolor.r, 1.0);
    vec4 color = mix(real, white, tcolor.g);
    color = mix(color, shadow, tcolor.b);
    color.a = tcolor.a * opacity;
    gl_FragColor = color * color.a;
}
