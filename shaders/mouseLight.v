varying vec2 vUv;
varying vec2 v_mouse;
varying vec4 glpos;
uniform vec2 mouse;
void main() {
    vUv = uv;
    v_mouse = (mouse - 0.5) * 2.0 + 1.0;   
    gl_Position = projectionMatrix * matrixWorld * vec4( position,  1.0, 1.0 );
    glpos = gl_Position;    
}
