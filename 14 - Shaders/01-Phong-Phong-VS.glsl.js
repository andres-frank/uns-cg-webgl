// 
// Phong Lighting Model, with Phong Shading (per fragment)
// 
var Phong_Phong_vsSource = `

attribute vec3 vertPosition;
attribute vec3 vertNormal;

varying vec3 fragPosition;
varying vec3 fragNormal;

uniform mat3 normalMatrix; // inverse transpose of the MV matrix
uniform mat4 modelViewMatrix;
uniform mat4 modelViewProjectionMatrix;

void main() {

	fragPosition = vec3(modelViewMatrix * vec4(vertPosition, 1.0)); // put it in Eye Coordinates
	fragNormal = normalMatrix * vertNormal; // Put it in eye coord

	gl_Position = modelViewProjectionMatrix * vec4(vertPosition, 1.0);
}

`