varying vec2 vUv;
varying vec2 vUv2;

uniform sampler2D map;
uniform sampler2D map2;
uniform vec3 color;
uniform float time;

uniform float opacity;
varying vec2 v_mouse;

varying float pushCoeff;

uniform vec2 imgsz;
varying vec4 glpos;
uniform float f1;
uniform float f2;
uniform int uvfilter;
uniform int lightfilter;
uniform int depthfilter;

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

void main() {
 
    float power = 80.0 + f1;
    
    vec2 coeff = power * v_mouse / imgsz;
    vec2 vUv3 = vUv;
    vec2 _vUv2 = vUv2; // (vUv2 - 0.5) * 0.99 + 0.5;

    vec4 depthColor = texture2D( map2, _vUv2 );
    float depth = 0.0;
    vec2 st = power * v_mouse / vec2(1920.0, 1600.0) / 4.0;
    for (int i = 0; i < 4; i++) {
        _vUv2 = _vUv2 - st;
        depthColor = texture2D( map2, _vUv2 );
        depth = mix(depth, max(depth, depthColor.r), depthColor.a);
    }

    vec2 pp = glpos.xy / glpos.w;
    
    vec4 c = texture2D( map, vUv );
    float lamp = 0.4; // distance( pp, vec2(-0.1, 0.7) );
    
    vUv3 = vUv3 - depth * coeff;

    vec4 c2;

    vec2 uv1;
    if (uvfilter == 1)
    {
        uv1 = vec2(
            vUv3.x - vUv3.y * vUv3.y * (
                0.05 * sin( -time * 0.5 + vUv3.y * 10.0) +
                0.004 * cos( -time * 4.5 + vUv3.y * 50.0)),
            vUv3.y
        );

        c2 = texture2D( map, uv1 );
    } else 
    if (uvfilter == 2) {
        float speed = fract(time * 0.5);
        uv1 = vec2(
            vUv3.x - vUv3.y * vUv3.y * (
                0.02 * sin( -time * 0.3 + vUv3.y * 10.0) +
                0.01 * cos( -time * 0.5 + vUv3.y * 50.0)),

            clamp(vUv3.y - speed, 0.0, 1.0)
        );

        c2 = 4.0 * (1.0 - vUv3.y) * texture2D( map, uv1 ) * speed;
        
 
    } else
    if (depthfilter == 1)
    {
        c2 = vec4(depth,depth,depth, 1.0);
    } else {
        c2 = texture2D( map, vUv3 );
    }

    if (lightfilter == 0) {
        vec2 ms = (v_mouse) * 5.0 - vec2(0.0, 1.0);

        c2.rgb = mix(c2.rgb, 
                c2.rgb / (c2.a * clamp( distance(ms * depth, pp * vec2(1.0, 2.0)) * 1.5 / (depth*0.1  + 1.0), 0.3, 10.0))
                , c2.a / clamp(pow(c2.b * 2.0, 4.0), 1.0, 3.0)
            );

    } else
    if (lightfilter == 2) {
        float ff = sin(time * 3.0 + depth * 2.56);
        c2.rgb = mix(c2.rgb, (1.0 - c2.rgb), ff * c2.a * depth);
        c2.rgb *= ff;
    } else
    if (lightfilter == 3) {
        float ff = sin(time * 2.0 + depth * 4.0 );
        c2.rgb = mix(c2.rgb, c2.rgb * c2.a, abs(ff) );
        c2.rgb *= ff;
    } 


    
    gl_FragColor = c2 * opacity;
    
} 
