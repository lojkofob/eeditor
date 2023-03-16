varying vec2 v_texcoord;
varying vec4 v_color;
attribute vec4 a_color;

void main() { 
    v_texcoord = uv;
    v_color = a_color;
    gl_Position = projectionMatrix * matrixWorld * vec4( position,  1.0, 1.0 );
}
