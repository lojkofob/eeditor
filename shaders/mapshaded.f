varying vec2 vUv;
uniform sampler2D map;
uniform sampler2D map2;
uniform vec3 color;
uniform float opacity;
uniform vec2 mapsize;
uniform float time;


vec2 rotate(vec2 point, float angle)
{
    float x = point.x;
    float y = point.y;
    float c = cos(angle);
    float s = sin(angle);
    return vec2(x * c - y * s, x * s + y * c);
}

vec2 rotateC(vec2 point, float angle, vec2 pivot)
{
    return rotate(point - pivot, angle) + pivot;
}

vec4 dep(vec4 f){
    return clamp(f * 1.3 - vec4(0.1), 0.0, 1.0);
}

void main() {
    vec4 c = texture2D( map, vUv );
    vec4 cd1 = dep(texture2D( map2, vUv ));

    vec2 dv = rotate( vec2(1.0,0.0), 6.28 / 8.0 ) / mapsize;

    vec4 cd2 = dep(texture2D( map2, vUv + dv ));
     
    if (cd1.r > cd2.r) {
        cd1.rgb = (cd1 - cd2).rgb;
        c.rgb += cd1.rgb * 10.0 * color;
    } else {
        cd1.rgb = (cd1 - cd2).rgb;
        c.rgb += cd1.rgb * 10.0 * (vec3(1.0) - color);
    }
    gl_FragColor = c * opacity;
} 
