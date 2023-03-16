 varying vec4 vColor;
 attribute vec4 c;
 void main() { 
  vColor = c;
  gl_Position = projectionMatrix *  matrixWorld * vec4( position,  1.0, 1.0 );
 }
