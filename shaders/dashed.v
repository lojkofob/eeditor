varying vec2 vUv; 
void main() { 
    gl_Position = projectionMatrix * matrixWorld * vec4( position, 1.0,1.0 );
    vUv = gl_Position.xy;
}
