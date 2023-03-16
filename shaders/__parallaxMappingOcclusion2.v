varying vec2 vUv;
varying vec2 vUv2;
varying vec2 v_mouse;
varying vec4 glpos;
varying float pushCoeff;
uniform vec2 mouse;

void main() {

    pushCoeff = 1.2;
    vUv = uv;

    vec4 p = matrixWorld * vec4( position * pushCoeff, 1.0, 1.0 );
    vUv2 = p.xy / vec2(1920.0, 1600.0) + vec2(0.5, 0.5);
    
    v_mouse = mouse; // (mouse - 0.5) * 2.0 + 1.0;

    
    vUv = (vUv - 0.5) * pushCoeff + 0.5;
    
    gl_Position = projectionMatrix * matrixWorld * vec4( position * pushCoeff,  1.0, 1.0 );
    
    glpos = gl_Position;
}
