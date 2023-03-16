
uniform vec2 force;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;

varying vec2 vUv;
uniform float dt;
uniform float time;

uniform vec2 px1;

uniform sampler2D source;


void main(){
    vec2 c = vUv - center;
    float d = length(c);
    
    float distance_ = (1.4 - min( length( c / scale / 2.0 ), 1.4 )) / 1.6;
    
    distance_ = distance_ * distance_;
    
    vec2 strength = force;
    
    float fl = length(strength);
    
    vec2 f = strength * distance_;
    
    vec2 sv = texture2D( source, vUv ).xy;
    
    vec2 svadj = ( sv - vec2(0.5,0.5) ) * 1.0;
    
    vec2 cnt = vec2(1.0, 1.0) -  abs( vUv - vec2(0.5, 0.5) ) * 2.0;
    
    vec2 newUv = vUv - (svadj + f) * dt * px1;
    
    vec2 newv = texture2D( source, clamp ( newUv, 0.0, 1.0 )).xy;

    f = ( f + vec2(1.0,1.0) ) / 2.0;
    
    float cc = abs(newv.x - sv.x) + abs(newv.y - sv.y);
    cc = cc * cc;
    
    f = mix(f, newv, 0.995 - fl * distance_ * 15.1 * cc);
    
    
    gl_FragColor = vec4(f, 0.0, 1.0);

}
