var vertexShaderSource =
`
	// an attribute will receive data from a buffer
	attribute vec3 vertPosition; // [x, y, z] coordinates
	attribute vec3 vertNormal;
	
	uniform mat4 MVP;
	//uniform mat4 MV;

	varying vec3 fragNormal;

	void main() {
		fragNormal = vertNormal;
		gl_Position = MVP * vec4(vertPosition, 1.0);
		
		// Old method, does 3 multiplications PER VERTEX. Not efficient
		// gl_Position = projM * viewM * worldM * vec4(vertPosition, 1.0);
	}
`;
