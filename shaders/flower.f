varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;

uniform float f1;
uniform float f2;
uniform float f3;
uniform float f4;
uniform float f5;
uniform float f6;
uniform float f7;
uniform float f8;

vec2 rotate(vec2 v, float a, float sc) {

	float s = sin(a);
	float c = cos(a);
	float x = (v.x - 0.5) * (sc + 1.0);
	float y = (v.y - 0.5) * (sc + 1.0);
	return vec2( x * c + y * s + 0.5, y * c - x * s  + 0.5);
}

float radd1(vec2 v){
    float x = v.x - 0.5;
	float y = v.y - 0.5;
    return 0.5 - (x * x + y * y);
}

float angle(vec2 v){
    float x = v.x - 0.5;
	float y = v.y - 0.5;
    return atan(x,y);
}

float radd2(vec2 v, float f){
    float a = angle(v) * f;
    return sin(a);
}

void main() {

 // texture2D( map, vUv )
 
    vec4 c = vec4(color, 1.0);
    
    vec2 uv = rotate(vUv, f1, f2);
    c.a += radd1(uv) * f3;
    c.a += radd2(uv, f4) * f5;
    
    c.a += radd2(rotate(vUv, f6, 1.0), f7) * f8;
    
    c.a *= opacity;
    
    
    gl_FragColor = c;
} 

