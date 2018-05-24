class Helper {


	/**
	 * Creates a vertex and a fragment shader based on the provided GLSL source code.
	 * Then it generates the program out of the 2 shaders and returns it.
	 * 
	 * @param {WebGL Context} gl
	 * @param {GLSL Source Code} vertex_shader_source
	 * @param {GLSL Source Code} fragment_shader_source
	 * @return {Shader Program} shader_program
	 */
	static generateProgram(gl, vertex_shader_source, fragment_shader_source) {

		// ----- Create Shaders ----- //
		/*
		 * We need 2 shaders: a vertex and a fragment shader.
		 * A vertex shader's job is to compute vertex positions, which will be used by the fragment shader to rasterize.
		 * A fragment shader's job is to compute a color for each pixel of the primitive currently being drawn.
		 *
		 * We create each of them, associate the source code (written in GLSL) to each one and them we compile.
		 */
		let vertex_shader = gl.createShader(gl.VERTEX_SHADER);
		let fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
		
		gl.shaderSource(vertex_shader, vertex_shader_source); // (shader with type, source code)
		gl.shaderSource(fragment_shader, fragment_shader_source);

		gl.compileShader(vertex_shader)
		if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
			console.error('ERROR compiling vertex shader!\n', gl.getShaderInfoLog(vertex_shader));
			return;
		}
		gl.compileShader(fragment_shader);
		if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
			console.error('ERROR compiling fragment shader!\n', gl.getShaderInfoLog(fragment_shader));
			return;
		}

		// ----- Create Program ----- //
		/*
		 * The vertex and fragment shader paired together are called a 'program'
		 * We create each of them, associate the source code to each one and them we compile them.
		 */
		let shader_program = gl.createProgram();
		gl.attachShader(shader_program, vertex_shader);
		gl.attachShader(shader_program, fragment_shader);
		gl.linkProgram(shader_program);
		if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
			console.error('ERROR linking program!\n', gl.getProgramInfoLog(shader_program));
			return;
		}
		gl.validateProgram(shader_program);
		if (!gl.getProgramParameter(shader_program, gl.VALIDATE_STATUS)) {
			console.error('ERROR validating program!\n', gl.getProgramInfoLog(shader_program));
			return;
		}
		// we now have a working program, we don't need the shaders on their own
		gl.deleteShader(vertex_shader);
		gl.deleteShader(fragment_shader);

		return shader_program;
	}


	static createVBO(gl, data){
		let vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW); 
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		return vbo;
	}

	static createEBO(gl, indices){
		let ebo = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		return ebo;
	}

	static configureAttrib(gl, shader_program, vbo, attribName, attribSize) {
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

		let attrib_location = gl.getAttribLocation(shader_program, attribName);
		gl.vertexAttribPointer(
			attrib_location, // Attribute location
			attribSize, // Number of elements per attribute
			gl.FLOAT, // Type of elements
			gl.FALSE, // whether or not the data should be normalized
			0, // 0 = move forward size * sizeof(type) each iteration to get the next position.
			0 // Offset from the beginning of a single vertex to this attribute
		);
		gl.enableVertexAttribArray(attrib_location); 

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	/**
	 * Upload the image texture to the GPU by binding it to a texture object.
	 * 
	 * @param gltexture  the texture object obtained via gl.createTexture()
	 * @param imgtexture the image to be used as texture
	 */
	static create2DTexture(imgtexture) {
		
		let gltexture = gl.createTexture(); 

		// bind the texture that we are going to work on
		gl.bindTexture(gl.TEXTURE_2D, gltexture);

		// texture coordinates (U,V) take the origin (0,0) at a different, opposite location,
		// causing the textures to appear upside down. To remediate, we tell webgl to flip
		// them so they match the screen cordinates.
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

		// Texture coordinates are resolution independent, they won't always match a pixel exactly.
		// We can choose from different methods to decide on the sampled color when this happens:
		// GL_NEAREST: Returns the pixel that is closest to the coordinates.
		// GL_LINEAR: Returns the weighted average of the 4 pixels surrounding the given coordinates.
		// You choose one of this methods for the 2 cases of having to scale the texture down or up [MINIFY/MAGNIFY]
		// This process is called Filtering
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		
		// Specify the information the texture will use, including the actual image
		gl.texImage2D(
			gl.TEXTURE_2D, 		// Type of texture
			0, 					// level-of-detail. 0 for base image
			gl.RGBA, 			// the format in which pixels should be stored on the graphics card
			gl.RGBA, 			// just match the previous parameter
			gl.UNSIGNED_BYTE, 	// the format of the pixels in the array that will be loaded
			imgtexture			// the array itself, i.e the image to be used as texture
		);

		// clean up
		gl.bindTexture(gl.TEXTURE_2D, null);

		return gltexture;
	}

}