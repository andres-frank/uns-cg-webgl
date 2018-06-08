// 
// Calculate texture via a function instead of an image.
// 
var ProceduralTexture_vsSource = `

precision mediump float;

attribute vec3 vertPosition;
attribute vec3 vertNormal;
attribute vec2 vertTexture;

varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec2 fragTexture;

uniform mat4 modelViewMatrix;
uniform mat4 modelViewProjectionMatrix;
uniform mat3 normalMatrix;


void main() {

	fragPosition = vec3(modelViewMatrix * vec4(vertPosition, 1.0));
	fragNormal = normalMatrix * vertNormal;
	fragTexture = vertTexture;

	gl_Position = modelViewProjectionMatrix * vec4(vertPosition, 1.0);
}




`