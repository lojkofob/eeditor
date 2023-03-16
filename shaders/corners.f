varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;

uniform float f1;
uniform float f2;
uniform float f3;
uniform vec2 imgsz;
uniform vec2 size;
uniform vec2 uval;
uniform vec2 uvsz;

float udRoundBox( vec2 p, vec2 b, float r )
{
    return length(max(abs(p)-b+r,0.0))-r;
}

void main() {
    vec2 halfRes = 0.5 * size;
    vec4 c = texture2D( map, vUv ) * vec4(color, opacity * step( udRoundBox( ( vUv + uval ) * imgsz - halfRes, halfRes, f1 ), 0.0) ); 
    gl_FragColor = c * c.a;
} 


