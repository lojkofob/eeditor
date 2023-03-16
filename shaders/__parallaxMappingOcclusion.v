varying vec2 vUv;
varying vec2 vUv2;
varying vec2 v_mouse;
varying vec4 glpos;
varying float pushCoeff;
uniform vec2 mouse;
void main() {

    pushCoeff = 2.0;
    vUv = uv;
    vUv2 = (uv - 0.5) * pushCoeff + 0.5;
    
    v_mouse = (mouse - 0.5) * 2.0 + 1.0;
    
    gl_Position = projectionMatrix * matrixWorld * vec4( position * pushCoeff,  1.0, 1.0 );
    
    glpos = gl_Position;
    
}
