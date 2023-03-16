uniform sampler2D pressure;
uniform sampler2D velocity;
uniform float time;
uniform vec2 px;
varying vec2 vUv;

void main(){
    
    
    float x0 = texture2D(pressure, vUv-vec2(px.x, 0)).r;
    float x1 = texture2D(pressure, vUv+vec2(px.x, 0)).r;
    float y0 = texture2D(pressure, vUv-vec2(0, px.y)).r;
    float y1 = texture2D(pressure, vUv+vec2(0, px.y)).r;
    
    // float c = 20.0 + 10.0 * sin( time + x0 + x1 + y0 + y1 );
    // x0 = mix(x0, sin(x0 * c), 0.05);
    // x1 = mix(x1, sin(x1 * c), 0.05);
    // y0 = mix(y0, sin(y0 * c), 0.05);
    // y1 = mix(y1, sin(y1 * c), 0.05);
    
    vec2 v = (texture2D(velocity, vUv).xy);
    
    //gl_FragColor = vec4(0.5, 0.5, 1.0, 1.0);
    
    gl_FragColor = vec4((v-(vec2(x1, y1)-vec2(x0, y0))*1.0)* 1.0, 1.0, 1.0);
}
