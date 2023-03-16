#version 300 es
precision highp float;
precision highp int;
uniform mat4 matrixWorld;
uniform mat4 projectionMatrix;
uniform vec3 iResolution;
in vec2 position;
in vec2 uv;
out vec2 fragCoord; 
void main() { 
    fragCoord = uv * iResolution.xy;
    gl_Position = projectionMatrix * matrixWorld * vec4( position,  1.0, 1.0 );
}
