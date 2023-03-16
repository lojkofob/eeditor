#ifdef GL_ES
#define LOWP lowp
precision lowp float;
#else
#define LOWP
#endif

uniform sampler2D map;
varying LOWP vec2 vUv;
uniform LOWP vec3 color;
uniform LOWP float opacity;
uniform LOWP float alpha;
uniform LOWP vec2 v1;
uniform LOWP vec2 v2;
uniform LOWP vec2 focus;
uniform LOWP float scratio;
uniform LOWP float part;

// vec4 sepia(vec4 color){
//     vec4 outputColor;
    // outputColor.r = (color.r * 0.393) + (color.g * 0.769) + (color.b * 0.189);
    // outputColor.g = (color.r * 0.349) + (color.g * 0.686) + (color.b * 0.168);    
    // outputColor.b = (color.r * 0.272) + (color.g * 0.534) + (color.b * 0.131);
    // return outputColor;
//  }

void main() {
    float d = distance( vec2( vUv.x * scratio, vUv.y) - vec2(0.5 * scratio, 0.5), focus);
    float f = pow( d, 1.5 );
    //vec2 uv = (vUv - vec2(0.5)) * (1.0 - clamp( f * 0.1 * part, 0.0, 1.0 ) ) + vec2(0.5);
    vec2 uv = vUv;
    vec4 c = 0.25 * (
        texture2D( map, uv + v1 * f ) +
        texture2D( map, uv - v1 * f ) +
        texture2D( map, uv + v2 * f ) +
        texture2D( map, uv - v2 * f ));
        
   
    // c = mix(oc, sepia(oc - c), cm);
        
    vec4 oc = texture2D( map, uv );
    float dd = alpha * clamp( pow(d * 8.0, 0.2), 0.0, 1.0);
    c = mix(oc, c * opacity, dd );
    
    // c = mix( c, max(c, oc), clamp( pow( distance(c, oc) * 2.6, 10.0 ), 0.0, 1.0 ) );

    float cm = clamp( pow( d * 1.6, 2.0 ), 0.0, 1.0 ) * alpha;
    c.rgb *= mix( vec3(1.0), color, cm );
    
    // c = vec4(dd,dd,dd, 1.0);
    gl_FragColor = c;
} 
