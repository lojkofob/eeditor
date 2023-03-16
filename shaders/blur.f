varying vec2 vUv;
uniform sampler2D map;
uniform vec3 c;
uniform float a;
uniform float b;
uniform vec2 r;
uniform vec2 d;

float blur13() {
  float k = 0.0;
  vec2 p = d / r;
  vec2 off1 = vec2(1.412) * p;
  vec2 off2 = vec2(3.294) * p;
  vec2 off3 = vec2(5.176) * p;
  k += texture2D(map, vUv).a * 0.196;
  k += texture2D(map, vUv + off1).a * 0.297;
  k += texture2D(map, vUv - off1).a * 0.297;
  k += texture2D(map, vUv + off2).a * 0.094;
  k += texture2D(map, vUv - off2).a * 0.094;
  k += texture2D(map, vUv + off3).a * 0.01;
  k += texture2D(map, vUv - off3).a * 0.01;
  k -= abs(1.0 - b * vUv.x * vUv.y * (1.0 - vUv.x) * (1.0 - vUv.y)) / 100.0;
  return k * a;
}

void main() {
    gl_FragColor = vec4( c, blur13() );
}


