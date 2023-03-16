varying vec2 vUv;
uniform sampler2D map;
uniform float opacity;
uniform vec3 color;
uniform vec3 dor;
uniform vec3 dors;

void main() {
    
    vec4 c = texture2D( map, vUv );
    c.a *= opacity; 
    c.rgb *= color;
    
    float yellow = (c.r + c.g) * c.a / ((c.b * 2.0)*(c.b * 2.0) + 0.7);
    
    float a = PI * ((vUv.x - vUv.y / 2.0) * 6.0 + dor.z / 30.0);
    
    c *= 1.0 + abs(dors.z) * clamp( yellow * yellow * sin( a + c.g * 2.0 - c.r * 2.0 ) * cos( a * 3.0 ) / (vUv.x * 2.0 + 1.0) + cos( a * 13.0 ) * 0.1, 0.0, 1.0 );
    
    gl_FragColor = c * c.a;
} 
