// шейдер смешивания текстур по маске с коэффициентом. это для луны в эффекте катсцены полнолуния
varying vec2 vUv;
uniform sampler2D u_texture;
uniform sampler2D u_texture2;
uniform sampler2D u_texture3;

uniform float u_coeff;
uniform float u_smooth;

void main(void)
{
  vec4 col = mix(texture2D(u_texture, vUv), texture2D(u_texture2, vUv), 
                smoothstep(max(texture2D(u_texture3, vUv).r + u_coeff - 1.0, 0.0), 0.0, u_smooth));
  gl_FragColor = col * col.a;
}
