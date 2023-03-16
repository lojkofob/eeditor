 

uniform sampler2D pressure;
uniform sampler2D divergence;

uniform vec2 force;
uniform vec2 center;
uniform vec2 cursorSize;

uniform vec2 px;

uniform float time;

varying vec2 vUv;

float generateSmoke(float r, vec2 v, float t){

    float fl = distance(vUv,v) * 10.0 + sin(time * 10.0) * 0.05;
    if ( fl < 1.0) {
        float s = sin(time / 3.0 + t);
        s = s * s * s;
        s = clamp( mix(0.0, s, (1.2 - fl)), 0.0, 1.0);
        if (s>0.75) {
            float m = sin(vUv.x * 200.0 + time * 5.0) + sin(vUv.y * 200.0+ time* 5.0);
            s = s + m;
            s = s * s;
            s = clamp( s, 0.0, 1.0);
            r = mix( r, 1.0, s);
        } else if (s>0.7) {
            r = mix( r, 0.0, s);
        }
    }
    return r;
}

void main(){

    vec2 c = vUv - center;
    float d = length(c);
    float k = 1.0 + 0.1 * sin(time * 10.0);
    float distance_ = (k - min( length( c / cursorSize / k ), k )) / k;
    
    distance_ = distance_ * distance_;
    
    vec2 strength = force;

    float relaxed = texture2D(pressure, vUv).r;
    
    //relaxed = generateSmoke( relaxed, vec2(0.05,0.05), 1.0 );
    //relaxed = generateSmoke( relaxed, vec2(0.95,0.05), 2.0 );
    //relaxed = generateSmoke( relaxed, vec2(0.05,0.95), 3.0 );
    //relaxed = generateSmoke( relaxed, vec2(0.95,0.95), 4.0 );
    
    relaxed += length(strength) * distance_;
    relaxed = clamp(mix(relaxed, 0.1, 0.007), 0.0,1.0);
    
    gl_FragColor = vec4(relaxed, relaxed, relaxed, 1.0);
    
}
