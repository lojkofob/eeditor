
uniform float f1;
uniform float f2;
uniform float f3;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv -= .5;
    
    float dist = length(max(abs(uv)-vec2(0.4),0.0)) * f1;
	
    // Output to screen
    vec3 col= vec3(0.0);
    
    col = vec3(smoothstep(0.05+f3 / 10.0, 0.05 + f2 / 10.0, dist));
    fragColor = vec4(col,1.0) * col.a;
}
