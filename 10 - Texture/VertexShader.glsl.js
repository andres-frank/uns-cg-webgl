var vertexShaderSource =
`
	// an attribute will receive data from a buffer
	attribute vec3 vertPosition; // [x, y, z] coordinates
	attribute vec2 vertexTexture;
	
	uniform mat4 MVP;

	varying vec2 fragTextureCoord;

	void main() {

		fragTextureCoord = vertexTexture;
		gl_Position = MVP * vec4(vertPosition, 1.0);
		
	}
`;
