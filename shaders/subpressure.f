
uniform sampler2D pressure;
uniform sampler2D velocity;


uniform float scale;

uniform vec2 px;

varying vec2 vUv;

void main(){
    
    
    float x0 = texture2D(pressure, vUv-vec2(px.x, 0)).r;
    float x1 = texture2D(pressure, vUv+vec2(px.x, 0)).r;
    float y0 = texture2D(pressure, vUv-vec2(0, px.y)).r;
    float y1 = texture2D(pressure, vUv+vec2(0, px.y)).r;
    
//     float c = 1.0;
//     x0 = sin(x0 * c);
//     x1 = sin(x1 * c);
//     y0 = sin(y0 * c);
//     y1 = sin(y1 * c);
    
    vec2 v = (texture2D(velocity, vUv).xy);// - vec2(0.5,0.5)) * 2.0;
    
    //gl_FragColor = vec4(v, 1.0, 1.0);
    
    gl_FragColor = vec4((v-(vec2(x1, y1)-vec2(x0, y0))*1.0)* 1.0, 1.0, 1.0);
}
