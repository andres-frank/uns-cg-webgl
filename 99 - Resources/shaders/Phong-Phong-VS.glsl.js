// Phong Lighting Model, with Phong Shading (per-fragment)
var PhongPhong_vertexShaderSource =
`
	attribute vec3 vertPosition;
	attribute vec3 vertNormal;

	varying vec3 fragPosition;
	varying vec3 fragNormal;

	uniform mat4 modelViewProjectionMatrix;
	uniform mat4 modelViewMatrix;
	uniform mat3 normalMatrix; // inverse transpose of the modelView matrix

	void main() {
		fragPosition = vec3(modelViewMatrix * vec4(vertPosition, 1.0)); // put it in Eye Coordinates
		fragNormal = normalMatrix * vertNormal; // put it in Eye Coordinates

		gl_Position = modelViewProjectionMatrix * vec4(vertPosition, 1.0);
	}
`;
