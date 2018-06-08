// 
// Ward Lighting Model, with Phong Shading (per fragment)
// 
var Ward_Phong_vsSource = `

precision mediump float;

attribute vec3 vertPosition;
attribute vec3 vertNormal;
attribute vec3 vertTangent;
attribute vec3 vertBitangent;

varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec3 fragTangent;
varying vec3 fragBitangent;

uniform	mat3 normalMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelViewProjectionMatrix;

void main() {

	fragPosition = vec3(modelViewMatrix * vec4(vertPosition, 1.0));
	fragNormal = normalMatrix * vertNormal;
	fragTangent = normalMatrix * vertTangent;
	fragBitangent = normalMatrix * vertBitangent;

	gl_Position = modelViewProjectionMatrix * vec4(vertPosition, 1.0);
}

`