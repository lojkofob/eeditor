
varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;

uniform vec4 u_colorRed;
uniform vec4 u_colorBlue;

void main(void) {
    vec4 t_color = texture2D(map, vUv);
    vec4 unr = clamp( u_colorRed / 255.0, vec4(0,0,0,0), vec4(1,1,1,1));
    vec4 unb = clamp( u_colorBlue / 255.0, vec4(0,0,0,0), vec4(1,1,1,1));
    
    vec4 color1 = vec4(unb.rgb, t_color.a) * unb.a * t_color.b;
    color1 = clamp(color1 + vec4(unr.rgb, t_color.a) * unr.a * t_color.r, vec4(0,0,0,0), vec4(1,1,1,1));
    gl_FragColor = color1 * opacity;
}
