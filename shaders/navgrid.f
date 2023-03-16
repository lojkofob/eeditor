varying vec2 vUv;
varying vec4 wrld;
uniform vec2 sv;
uniform vec2 size;
uniform vec2 sc;
uniform float gz;
uniform float scratio;

void main() {
    float s = 5.0 * gz;
    vec2 uv = (vUv - vec2(0.5, 0.5 ))* 1.1;
    vec2 svv = vec2(-sv.x, sv.y) * gz;
    vec2 k = (uv * size - svv) / s;
    float c = clamp(sin(k.x)*0.5 + cos(k.y)*0.5 - 0.94, 0.0, 1.0);
    c += clamp(sin(k.x/10.0+0.17)*0.5 + cos(k.y / 10.0)*0.5 - 0.975, 0.0, 1.0);
    
    c = clamp( pow(c * 7.0, 4.0) + 0.01, 0.0, 1.0 );
    
    //float ds = distance( vec2(wrld.x, wrld.y) * scratio - 0.1* svv / size, vec2(0.0, -0.7) );
    c = 2.0 * c / (0.1 + clamp( 0.1 * distance(vUv * 0.8 - vec2(0.5), svv / size * 0.4), 0.0, 0.1 )) - 0.1;
    vec4 color = vec4(c,c,c,0.6);
    color *= color.a;
    
    vec2 uuv = vUv * (1.0 - vUv.yx);
    float vig = pow(uuv.x * uuv.y * 5.0, 0.55);
    color.rgb *= (vig + 0.3);
    color.a += 0.05 - vig;
    gl_FragColor = color;
} 
