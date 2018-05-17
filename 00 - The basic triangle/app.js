/*
* Universidad Nacional del Sur
* Computacion Grafica - 2018
*
* Andres Frank
* _____________________________
*
* >> Basic Triangle <<
* This is the bare minimum needed to draw the most basic thing using WebGL:
* A triangle in 2D space with solid color.
*/

// ----- Global Variables ----- //
var gl = null; // The webgl context
var shader_program = null; // Shader program to use.
var triangleEBO = null; // ElementBufferObject
var triangle_indices_length = 0; // Array length to draw

// ----- Vertex Shader ----- //
function getVertexShaderSource() {
	return `
		// an attribute will receive data from a buffer
		attribute vec2 vertPosition; // only x and y coordinates
		
		// Varyings are a way for a vertex shader to pass data to a fragment shader. 
		// varying vec3 fragColor;

		// all shaders have a main function
		void main() {
		 
		  // gl_Position is a special variable a vertex shader is responsible for setting
		  gl_Position = vec4(vertPosition, 0.0, 1.0); // get x,y coord from vertPos, set z to 0, set omega to 1
		}
	`;
}

// ----- Fragment Shader ----- //
function getFragmentShaderSource() {
	return `
		// fragment shaders don't have a default precision so we need to pick one.
		// mediump (medium precision) is a good default.
		precision mediump float;
		 
		void main() {
		  // gl_FragColor is a special variable a fragment shader is responsible for setting
		  gl_FragColor = vec4(0.0, 0.6, 1, 1); // return light blue color
		}
	`;
}

/*
 * We specified in the html <body> tag that this function is to be loaded as soon as the HTML loads.
 * This is all "initialization code", since it runs only once at load time to set up the workspace.
 */
function onLoad() {

	// ----- Set up the webgl environment ----- //
	let canvas = document.getElementById("webglcanvas");
	gl = canvas.getContext('webgl');
	if (!gl) {
		console.log('WebGL not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}
	if (!gl) alert('Your browser does not support WebGL');
	
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
	
	gl.shaderSource(vertex_shader, getVertexShaderSource()); // (shader with type, source code)
	gl.shaderSource(fragment_shader, getFragmentShaderSource());

	gl.compileShader(vertex_shader)
	if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertex_shader));
		return;
	}
	gl.compileShader(fragment_shader);
	if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragment_shader));
		return;
	}

	// ----- Create Program ----- //
	/*
	 * The vertex and fragment shader paired together are called a 'program'
	 * We create each of them, associate the source code to each one and them we compile them.
	 */
	shader_program = gl.createProgram();
	gl.attachShader(shader_program, vertex_shader);
	gl.attachShader(shader_program, fragment_shader);
	gl.linkProgram(shader_program);
	if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
		console.error('ERROR linking program!', gl.getProgramInfoLog(shader_program));
		return;
	}
	gl.validateProgram(shader_program);
	if (!gl.getProgramParameter(shader_program, gl.VALIDATE_STATUS)) {
		console.error('ERROR validating program!', gl.getProgramInfoLog(shader_program));
		return;
	}
	// we now have a working program, we don't need the shaders on their own
	gl.deleteShader(vertex_shader);
	gl.deleteShader(fragment_shader);


	// ----- Create Buffers ----- //

	// - Create Vertex Array Objects (VAO): Contains one or more VBOs and up to one EBO.
	//vaoExtension = gl.getExtension('OES_vertex_array_object');
	// I'm not using this.

	// -- Create Vertex Buffer Object (VBO): Contains information on positions, colors, textures, etc.
	let triangle_vertices = [
		//	X 		Y 	
			-0.5,	0.5,
			-0.5,	-0.5,
			0.5,	-0.5,
	];

	let triangleVBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVBO);
	// We provide the position data to the buffer.
	// Javascript generates 64bit floating point precision numbers, but OpenGL expects them in 32bit, so we convert them
	// gl.STATIC_DRAW tells WebGL we are not likely to change this data, so it's a hint for WebGL to try and optimize certain things. 
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangle_vertices), gl.STATIC_DRAW); 

	// We have now "uploaded" the data(vertices) to the GPU, but the vertex shader doesn't know about it yet.
	// So let's tell the shader where and how to get the vertPosition attribute
	let vertPositionAttribLocation = gl.getAttribLocation(shader_program, 'vertPosition');
	gl.vertexAttribPointer(
		vertPositionAttribLocation, // Attribute location
		2, // Number of elements per attribute (here is a vec2=[x,y])
		gl.FLOAT, // Type of elements
		gl.FALSE, // whether or not the data should be normalized
		0, // 0 = move forward size * sizeof(type) each iteration to get the next position.
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.enableVertexAttribArray(vertPositionAttribLocation); 
	gl.bindBuffer(gl.ARRAY_BUFFER, null); // Best practices: clean-up.

	// -- Create Element Buffer Object (EBO): Contains the indices
	let triangle_indices = [ 0, 1, 2 ];
	triangle_indices_length = triangle_indices.length;

	triangleEBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleEBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle_indices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); // Best practices: clean-up.

	render();	
}

/*
 * These are the actual drawing processes that should be run on every screen refresh
 * This would be on a loop in a moving scene.
 */
function render() {

	gl.clearColor(0.18, 0.18, 0.18, 1.0); // Background Color (R, G, B, Alpha)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Tell OpenGL state machine which program should be active.
	gl.useProgram(shader_program);

	// If you use drawArrays you are not using any indeces, so the EBO is not needed at all.
	// You can try removing all the EBO-creation section above and it will render just fine.
	/*
	gl.drawArrays(
		gl.TRIANGLES, // Type of drawing (triangles, line, point, fan, etc.)
		0, // offset. i.e: how many vertices we skip
		3 // count. i.e: how many times we will draw. We have 3 vertices here.
	); 
	*/

	// Since we are going to use drawElements, we need to have the index buffer
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleEBO);

	// The type (primitive) here will influence how you set up your indeces array because depending on what type you choose,
	// it will grab the data from the array in different ways.
	//
	// TRIANGLES will grab the vertex specified in the index and join it with following 2 vertices.
	//
	// POINTS; LINES; LINE_LOOP; LINE_STRIP; TRIANGLE_FAN
	gl.drawElements(gl.TRIANGLES, triangle_indices_length, gl.UNSIGNED_SHORT, 0);
	
	gl.useProgram(null); // Best practices: clean-up.
}


