varying vec2 vUv;
varying vec2 vUv2;

uniform sampler2D map;
uniform sampler2D m_u_texture2;
uniform vec3 color;
uniform float time;

uniform float opacity;
varying vec2 v_mouse;

varying float pushCoeff;
uniform int filter;
uniform vec2 imgsz;
varying vec4 glpos;
uniform float f1;
uniform float f2;
void main() {
    
    float power = 50.0 + f1;
    vec4 pcc = texture2D( m_u_texture2, vUv2 );
    
    vec2 coeff = power * v_mouse / imgsz;
    
    vec2 vUv3 = vUv2;
    
    
    vec2 pp = glpos.xy / glpos.w;
    
    vec4 c = texture2D( map, vUv );
    float lamp = 1.0; // distance( pp, vec2(-0.1, 0.7) );
     
     
    vec4 c2 = texture2D( map, vUv3 );
    float cent = 0.0;
    //for (int i=0;i<3;i++) {
        
        vUv3 = vUv3 - (pcc.r - cent) * coeff;
       // float r1 = texture2D( m_u_texture2, vUv3).r;
       // float rc1 = length( texture2D( map, vUv3 ) );
       // float rc2 = length( texture2D( map, vUv3 + 5.0 * ( v_mouse - pp ) / imgsz ) );
        
//         pcc.r = mix( pcc.r, r1, 0.5 / (c2.a + 0.5) );
        
        //pcc.r = mix( pcc.r, texture2D( m_u_texture2, vUv3).r, 0.5 / (c2.a + 0.5) );
       // pcc = texture2D( m_u_texture2, vUv3);
       // vUv3 = vUv3 - (pcc.r - cent) * coeff;
        pcc.r += f2;
        
        if (filter == 2) {
        
            //c2.rgb *= 1.2;
            
            
        
            c2 = texture2D( map, vUv3 );
        
            c2.rgb -=  ( smoothstep( distance( v_mouse * (pcc.r + 3.0) * 0.3, pp), 0.0, 0.01 + 0.1 / (pcc.r + 0.5)) ) * lamp;
        
            //c2 = mix(c2,texture2D( map, vUv3 ), 0.5);
            
            
        } else
        if (filter == 1) {
            c2.rgb *= 1.2;
            
            // c2.rgb -= 0.5 * ( smoothstep( distance( v_mouse * (pcc.r + 2.0) * 0.4, pp), 0.0, 0.01 + 0.2 * (pcc.r + 0.01)) ) * lamp;
        
            c2 = mix(c2,texture2D( map, vUv3 ), 0.8);
            // float cf = 0.5 * ( smoothstep( distance( v_mouse, pp ), 0.0, 0.01 + 0.1 / (pcc.r + 0.02)) ) * lamp;
            // c2.rgb -= cf;
            
        // c2.rgb *= c2.a;
            float ff = sin(time * 1.0 + pcc.r * 3.0 );
            c2.rgb = mix(c2.rgb, (1.0-c2.rgb) * c2.a, ff );
            c2.rgb *= ff;
         } 
        else 
        if (filter == 0)
        {
            c2 = texture2D( map, vUv3 );
        }
        else
        {
            c2 = pcc;
        }
        

    //}

    //vUv3 = vUv3 - pcc.r * coeff;
    //c2 = texture2D( map, vUv3 );
    
    if (length(pcc.r * c2) == 0.0)
        c2 = vec4( 0.0 );
        
//     c.rgb = max(c.rgb, c2.rgb);
//     c.a = max(c.a, c2.a);
    //c2.rgb += 0.3;
    
    
    gl_FragColor = c2 * opacity;
    
} 
