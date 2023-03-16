varying vec2 vUv;
varying vec2 vUv2;
varying vec2 vUv3;
uniform sampler2D u_texture;
uniform sampler2D u_texture2;
uniform sampler2D u_texture3;
 
uniform vec3 color;

void main(void)
{
  vec4 col = texture2D(u_texture, vUv);
  vec4 col3 = texture2D(u_texture3, vUv3);

  float mask = 1.0 - smoothstep(col.a, 0.015, 1.0);
  vec4 mask4 = vec4(1.0, 1.0, 1.0, 0.6) * mask;
  vec2 refract = vec2(col.g + col3.a * 0.5, col.b) * (vUv2 - vec2(0.5, 0.5)) * 0.5;
  vec4 col2 = texture2D(u_texture2, vUv2 + refract);

  col2.rgb *= color;

  // col2 = vec4(0.0,0.0,0.0,1.0);

  vec4 col4 = mix(col, mask4 * col2, 1.0 - col.a);

  col4.rgb = mix(col4.rgb, col3.rgb / col3.a, col3.a * mask * (1.0 - col4.a) * 2.3);
  
  col4.a += mask;

  gl_FragColor = col4;
}
