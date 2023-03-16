varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;
uniform float time;
uniform float f1;
uniform float imgh;
uniform float height;
uniform vec2 frcnt;

uniform float uviy;
    
void main() {
    float fcy = frcnt.y;
    float f = fract(( fcy - vUv.y ) * uviy + 0.5 );
    float y = ( vUv.y - fcy ) * height / imgh + fract(time / f1) / uviy;
    //clamp frame y by repeat
    y = y - floor( y * uviy + 0.5 ) / uviy + fcy;
    vec4 c = texture2D( map, vec2(vUv.x, y) ) * f;
    c.rgb *= color;
    
    gl_FragColor = c * opacity;
} 
