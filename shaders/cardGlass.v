varying vec2 vUv;
varying vec2 vUv2;
varying vec2 vUv3;

uniform vec2 sc;
uniform vec4 glassParams;
uniform vec2 glassParams2;

void main() {
    vUv = uv;
    vec4 pos = matrixWorld * vec4( position, 1.0, 1.0 );
    gl_Position = projectionMatrix * pos;
    vUv2 = (gl_Position.xy / gl_Position.w) / vec2(815.0, 380.0) * sc / 4.0  + vec2(0.5,0.5);
    vUv3 = (pos.xy / pos.w - glassParams2 - glassParams.xy) / glassParams.zw;
}
