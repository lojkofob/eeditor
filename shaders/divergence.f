
uniform sampler2D velocity;

uniform float time;
uniform vec2 px;

varying vec2 vUv;


uniform vec2 force;
uniform vec2 center;
uniform vec2 scale;

void main(){
    
    vec2 c = vUv - center;
    float d = 1.0 - min( length(c / scale), 2.0) / 2.0;
    
    float fl = length(force) * d;
    
    
    float x0 = texture2D(velocity, vUv - vec2( px.x, 0 )).x;
    float x1 = texture2D(velocity, vUv + vec2( px.x, 0 )).x;
    float y0 = texture2D(velocity, vUv - vec2( 0, px.y )).y;
    float y1 = texture2D(velocity, vUv + vec2( 0, px.y )).y;
        
    float divergence = (x1-x0 + y1-y0) * 0.6 + 0.5;
    
    divergence = mix ( divergence, 0.5, clamp( fl, 0.0, 1.0 ));
        
    gl_FragColor = vec4(divergence, divergence, divergence, 1.0);
}
