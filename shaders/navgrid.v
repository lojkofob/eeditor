varying vec2 vUv;
varying vec4 wrld; 
void main() { 
    vUv = uv;
    gl_Position = projectionMatrix * matrixWorld * vec4( position, 1.0,1.0 );
    wrld = gl_Position;
}
