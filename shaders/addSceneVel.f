uniform sampler2D scene; 
uniform sampler2D velocity;
varying vec2 vUv;
uniform float time;

void main(){
    vec2 vel = texture2D(velocity, vUv).xy - vec2(0.502);
    vec4 c = texture2D(scene, vUv - (vel) * 0.01);
    c = mix(c, texture2D(scene, vUv), 0.1);
    //c.rgb = mix(c.rgb * c.a, vec3(0.5), 0.1 * c.a);
    c = c * (1.0 - length(vel) * 0.1);
    gl_FragColor = c;
}
