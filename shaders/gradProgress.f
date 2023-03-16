varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;

uniform float u_progress;

void main() {
    vec4 c = texture2D( map, vUv ) * 
      smoothstep(
      sign(u_progress) * vUv.x + u_progress, 
      sign(u_progress) * vUv.x + u_progress + 0.1, 1.0);
      
    c.rgb *= color;
    
    gl_FragColor = c * opacity;
} 
