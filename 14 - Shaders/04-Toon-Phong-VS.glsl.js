// 
// Cartoon Model, with Phong Shading (per fragment)
// 
var Toon_Phong_vsSource = `

precision mediump float;

attribute vec3 vertPosition;
attribute vec3 vertNormal;

varying vec3 fragPosition;
varying vec3 fragNormal;

uniform	mat3 normalMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelViewProjectionMatrix;

void main() {

	fragNormal = normalMatrix * vertNormal;
	fragPosition = vec3(modelViewMatrix * vec4(vertPosition, 1.0));

	gl_Position = modelViewProjectionMatrix * vec4(vertPosition, 1.0);
}

`