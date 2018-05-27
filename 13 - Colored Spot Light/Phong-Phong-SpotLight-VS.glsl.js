// Phong Lighting Model, with Phong Shading (per-fragment)
var PhongPhong_SpotLight_vertexShaderSource =
`
	attribute vec3 vertPosition;
	attribute vec3 vertNormal;
	attribute vec2 vertTexture;

	varying vec3 fragPosition;
	varying vec3 fragNormal;
	varying vec2 fragTexture;

	uniform mat4 modelViewProjectionMatrix;
	uniform mat4 modelViewMatrix;
	uniform mat3 normalMatrix; // inverse transpose of the modelView matrix

	void main() {
		fragPosition = vec3(modelViewMatrix * vec4(vertPosition, 1.0)); // put it in Eye Coordinates
		fragNormal = normalMatrix * vertNormal; // put it in Eye Coordinates
		fragTexture = vertTexture;

		gl_Position = modelViewProjectionMatrix * vec4(vertPosition, 1.0);
	}
`;
