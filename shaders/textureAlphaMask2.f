// шейдер смешивания текстур по третьей текстуре. изначально для форзаца сезонов
// смешивание по одному каналу, имеется ввиду чб-картинка
varying vec2 vUv;
uniform sampler2D u_texture;
uniform sampler2D u_texture2;
uniform sampler2D u_texture3;

void main(void)
{
  gl_FragColor = mix(
                    texture2D(u_texture, vUv), 
                    texture2D(u_texture2, vUv), 
                    texture2D(u_texture3, vUv).r);
}
