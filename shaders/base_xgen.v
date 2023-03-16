varying vec2 v_texcoord;
void main() { 
    v_texcoord = uv;
    gl_Position = projectionMatrix * matrixWorld * vec4( position,  1.0, 1.0 );
}
