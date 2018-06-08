// 
// Phong Lighting Model but the borders of the model are colored, giving it a "drawing" look
// 
var Border_Phong_vsSource = `

precision mediump float;

attribute vec3 vertPosition;
attribute vec3 vertNormal;

varying vec3 fragPosition;
varying vec3 fragNormal;

uniform mat4 modelViewProjectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat3 normalMatrix; // inverse transpose of the modelViewMatrix

void main() {

	fragPosition =  vec3(modelViewMatrix * vec4(vertPosition, 1.0));
	fragNormal = normalMatrix * vertNormal;

	gl_Position = modelViewProjectionMatrix * vec4(vertPosition, 1.0);
}

`