varying vec2 vUv; 
uniform vec2 parallaxOffset;

void main() { 
    vUv = uv;
    gl_Position = projectionMatrix * matrixWorld * vec4( position,  1.0, 1.0 );
    gl_Position.xy += parallaxOffset;
}
