uniform vec2 force;
uniform vec2 center;
uniform vec2 cursorSize;
uniform vec2 px;

varying vec2 vUv;
uniform float dt;
uniform float time;

uniform vec2 px1;

uniform sampler2D source;

vec2 pix1;
vec2 pix2;
vec2 pix3;
vec2 pix4;

vec4 tpix0;
vec4 tpix1;
vec4 tpix2;
vec4 tpix3;
vec4 tpix4;

vec2 velocity(){
    vec2 c = vUv - center;
    
    float d = (1.4 - min( length( c / cursorSize / 2.0 ), 1.4 )) / 2.6;
    
    d = d * d * d;
    
    vec2 strength = force;
    
    float fl = length(strength);
    
    vec2 f = strength * d;
    
    vec2 sv = tpix0.xy;
    
    vec2 svadj = sv - vec2(0.5);
    
    vec2 newUv = vUv - (svadj + f) * dt * px1 * cos(d * 30.0);
    
    vec2 newv = texture2D( source, clamp ( newUv, 0.001, 0.999 )).xy;

    f = ( f + vec2(1.0,1.0) ) / 2.0;
    
    //noise
    float cc = abs(newv.x - sv.x) + abs(newv.y - sv.y);
    cc = cc * cc;
    
    f = mix(f, newv, 1.0 - fl * d * 15.1 * cc);
    
    return f;

}

float divergence(){
    
    vec2 c = vUv - center;
    float d = 1.0 - min( length(c / cursorSize), 2.0) / 2.0;
    
    float fl = length(force) * d * d* d;
    
    float x0 = tpix1.x;
    float x1 = tpix2.x;
    float y0 = tpix3.y;
    float y1 = tpix4.y;
    
    float div = (x1-x0 + y1-y0) * 0.4 + 0.5;
    
    div = mix(div, tpix0.b, 0.1);
    
    return div;
}


float jacobi(){

    float x0 = tpix1.a;
    float x1 = tpix2.a;
    float y0 = tpix3.a;
    float y1 = tpix4.a;
    
    float x = tpix0.a;
    float d = tpix0.b;
    
    float relaxed = (x + x0 + x1 + y0 + y1 + (0.5 - d) * 0.2) / 5.0;
    
    return relaxed;
    
}


vec4 blur(){
    return (tpix1 + tpix2 + tpix3 + tpix4 + tpix0) / 5.0;
}


float modpress(float jac){

    vec2 c = vUv - center;
    float d = length(c);
    float k = 1.0 + 0.1 * sin(time * 10.0);
    float distance_ = (k - min( length( c / cursorSize / k ), k )) / k;
    
    distance_ = distance_ * distance_;
    
    vec2 strength = force;
    // float a = cos( atan(c.x, c.y) * 4.0 + 50.0 * (d + center.x + center.y) - 20.0 * time );
    
    jac += length(strength) * distance_;
    jac = clamp(mix(jac, 0.1, 0.007), 0.0, 1.0);
    jac = mix(jac, tpix0.a, 0.5);
    return jac;
    
}


vec2 subtract(vec2 vel){
    
    float x0 = tpix1.a;
    float x1 = tpix2.a;
    float y0 = tpix3.a;
    float y1 = tpix4.a;
    
    return vel - (vec2(x1, y1)-vec2(x0, y0));
}

uniform float step;

void main(){

    float cc = 4.0;
    
    pix1 = clamp(vUv - cc * vec2(px.x, 0), px.x, 1.0 - px.x);
    pix2 = clamp(vUv + cc * vec2(px.x, 0), px.x, 1.0 - px.x);
    pix3 = clamp(vUv - cc * vec2(0, px.y), px.y, 1.0 - px.y);
    pix4 = clamp(vUv + cc * vec2(0, px.y), px.y, 1.0 - px.y);
    
    tpix0 = texture2D(source, vUv);
    tpix1 = texture2D(source, pix1);
    tpix2 = texture2D(source, pix2);
    tpix3 = texture2D(source, pix3);
    tpix4 = texture2D(source, pix4);
    
    tpix0 = blur();
    
    vec2 vel = velocity();
    float div = divergence();
    float jac = jacobi();
    
    jac = modpress(jac);
    
    vel = subtract(vel);
    
    gl_FragColor = vec4(vel, div, jac);
}
