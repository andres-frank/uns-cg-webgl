/**
* Example Fragment Shader
* Sets the color and alpha of the pixel by setting gl_FragColor
*/

// Set the precision for data types used in this shader
precision highp float;
precision highp int;

varying vec3 color;


void main() {

    gl_FragColor = vec4( color, 1.0 );

}