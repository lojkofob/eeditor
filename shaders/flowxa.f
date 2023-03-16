varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;
uniform float time;
uniform float f1;
uniform float imgw;
uniform float width;
uniform vec2 frcnt;

uniform float uvix;
    
void main() {
    float fcx = frcnt.x;
    float x = ( vUv.x - fcx ) * width / imgw - fract(time / f1) / uvix;
    //clamp frame x by repeat
    x = x - floor( x * uvix + 0.5 ) / uvix + fcx;
    float a = texture2D( map, vUv ).a;
    vec4 c = texture2D( map, vec2(x, vUv.y) ) * a;
    c.rgb *= color;
    gl_FragColor = c * opacity;
} 
