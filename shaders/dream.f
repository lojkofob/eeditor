varying vec2 vUv;
uniform sampler2D map;
uniform float opacity;

uniform float time;

uniform vec2 c;


float random(float p) {
  return fract(sin(p)*10000.);
}

float noise(vec2 p) {
  return random(p.x + p.y*10000.);
}

vec2 sw(vec2 p) {return vec2( floor(p.x) , floor(p.y) );}
vec2 se(vec2 p) {return vec2( ceil(p.x)  , floor(p.y) );}
vec2 nw(vec2 p) {return vec2( floor(p.x) , ceil(p.y)  );}
vec2 ne(vec2 p) {return vec2( ceil(p.x)  , ceil(p.y)  );}

float smoothNoise(vec2 p) {
  vec2 inter = smoothstep(0., 1., fract(p));
  float s = mix(noise(sw(p)), noise(se(p)), inter.x);
  float n = mix(noise(nw(p)), noise(ne(p)), inter.x);
  return mix(s, n, inter.y);
}

float movingNoise(vec2 p, float t) {
  float total = 0.0;
  
    total += smoothNoise(p*8.  + t) / 8.;
    total += smoothNoise(p*16. - t) / 16.;
  
  return total;
}

 
void main(  ) {

    vec4 co = texture2D( map, vUv );
    vec2 p = (vUv - c) * 6.;
    float t = time * 2.0;
    float x = movingNoise(p, t / 5.0);
    float y = movingNoise(p + 100., t / 6.0);
    
    co.b += movingNoise(p + vec2(x+co.b, y+co.r + x - t / 7.0), t / 5.0);
    co.g -= movingNoise(p + vec2(y * 0.3 +co.r - t / 13.0, x), t / 8.0);
    
    gl_FragColor = co * co.a * opacity;
 
}
