 

uniform sampler2D pressure;
uniform sampler2D divergence;

uniform vec2 px;

varying vec2 vUv;


void main(){

    float c = 1.0;
    
    float x0 = texture2D(pressure, vUv-c * vec2(px.x, 0)).r;
    float x1 = texture2D(pressure, vUv+c * vec2(px.x, 0)).r;
    float y0 = texture2D(pressure, vUv-c * vec2(0, px.y)).r;
    float y1 = texture2D(pressure, vUv+c * vec2(0, px.y)).r;
    
    float x = texture2D(pressure, vUv + vec2(0, 0)).r;
    
    float d = texture2D(divergence, vUv).r;
    
    float relaxed = (x + x0 + x1 + y0 + y1 + (0.5 - d) * 0.4)  / 5.0;
    
    gl_FragColor = vec4(relaxed, relaxed, relaxed, 1.0);
    
}
