varying vec2 vUv; 
uniform vec2 size;
uniform vec2 sc;
varying vec2 f; 
uniform float s; 


void main() {

    float scale = projectionMatrix[0][0] * sc.x;
    float x = max(size.x, size.y);
    f.x = 1.0 - 0.1 / x;
    f.y = f.x - (0.1 / x + 2.2 / scale / sqrt(x)) * (1.0 - s);

    vUv = vec2((uv.x -0.5) * 1.01 +0.5, uv.y);
    gl_Position = projectionMatrix * matrixWorld * vec4( position,  1.0, 1.0 );
}
