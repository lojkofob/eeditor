varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float u_angle;

#define M_PI 3.1415926535897932384626433832795
#define M_PI_2 1.57079632679489661923132169163
#define M_2_PI 6.28318530717958647692528676655
 
void main(void) {
    vec4 t = texture2D(map, vUv);
    vec2 d = vUv - vec2(0.5);

    float ang = M_2_PI * fract(atan(-d.x, -d.y) / M_2_PI);

    t.rgb = mix(t.rgb, vec3(0.827, 0.780, 0.694) * t.a, step(u_angle, ang));
    
    gl_FragColor = t;
}

