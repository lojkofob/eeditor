// https://www.shadertoy.com/view/WtdSzr

varying vec2 vUv;
uniform sampler2D map1;
uniform sampler2D map2;
uniform vec3 color;
uniform vec2 sc;
uniform float opacity;
uniform float part;
uniform float kx;
uniform float ky;
uniform float q;
uniform float scratio;
uniform int geomType;
uniform int inv;
vec2 scfix;
vec2 uv;
float p;

float lineMix()
{
    return smoothstep( 0.1, 0.0, fract( q* kx * uv.x + q * ky * uv.y ) - p );
}

float circleMix()
{
    return p * p + smoothstep( 0.1, 0.0, fract( p * (1.0-ky) * q * distance( uv * scfix, 0.5 * scfix ) + kx ) - p + ky);
}


float spiralMix()
{
    vec2 m = uv - vec2(0.5);
    float l = length(m);
    float a = atan(m.x, m.y);
	float v = sin(6.28318530718 * q * (pow(l, kx)- p) - a) * cos( ky * a );
	return clamp( v * p, p * p, 1.0) / l;
}

float quadMixH()
{
	return 1.0 - (floor( kx * q * (uv.x * scratio - 5.0 * (p - 0.4))) + floor(ky * q * uv.y));
}

float quadMixV()
{
	return 1.0 - (floor( kx * q * uv.x  * scratio ) + floor(ky * q * (uv.y - 5.0 * (p - 0.4))));
}


void main() {
    p = part;
    scfix = vec2(scratio, 1.0);
    uv = vUv;
    if (inv == 1)
        p = 1.0 - p;
        
    float pp;
    if (geomType == 0)
    	pp = lineMix();
    else 
    if (geomType == 1)
        pp = quadMixH();
    else 
    if (geomType == 2)
        pp = quadMixV();
    else 
    if (geomType == 3)
        pp = circleMix();
    else
    if (geomType == 4)
        pp = spiralMix();
              
    pp = mix(0.0, 1.0, clamp(pp, 0.0, 1.0));  
    if (inv == 1) {
        pp = 1.0 - pp;
    }
    
    vec4 c1 = texture2D( map1, (uv + vec2(0.5)) * (1.0 + 10.0 * vec2(pp) / sc) - vec2(0.5) );
    vec4 c2 = texture2D( map2, uv  ) * opacity;
    c2.rgb *= color;
    
    gl_FragColor = mix(c1, c2, pp);
} 
 
