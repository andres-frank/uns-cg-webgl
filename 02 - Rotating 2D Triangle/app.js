/*
* Universidad Nacional del Sur
* Computacion Grafica - 2018
*
* Andres Frank
* _____________________________
*
* We will start doing some more modular work and start creating 
* helper functions to aid us in the set up of the workspace.
* In the future we will move these proceses out of this main source
* and into a resource app.
* _____________________________
* 
* >> Rotating 2D Triangle <<
* New additions:
* 	- Using the glMatrix library we define rotation.
* 	- We allow interacting with the rotation.
* 	- A new attribute was defined to get a more colorful triangle.
*/

// ----- Global Variables ----- //
var gl = null; // The webgl context
var shader_program = null; // Shader program to use.
var triangleEBO = null; // ElementBufferObject
var triangle_indeces_length = 0; // Array length to draw

var worldMatrix_location, worldMatrix_value;
var viewMatrix_location, viewMatrix_value;
var projMatrix_location, projMatrix_value;

var angle = 0;
var identityMatrix = mat4.create();

// ----- Vertex Shader ----- //
function getVertexShaderSource() {
	return `
		// an attribute will receive data from a buffer
		attribute vec3 vertPosition; // [x, y, z] coordinates
		attribute vec3 vertColor; // [r, g, b]
		
		// Varyings are a way for a vertex shader to pass data to a fragment shader. 
		varying vec3 fragColor;

		// matrices mat4= 4x4 matrix
		uniform mat4 worldM; 
		uniform mat4 viewM;
		uniform mat4 projM;

		void main() {

		  fragColor = vertColor;
		  gl_Position = projM * viewM * worldM * vec4(vertPosition, 1.0);
		}
	`;
}

// ----- Fragment Shader ----- //
function getFragmentShaderSource() {
	return `
		// fragment shaders don't have a default precision so we need to pick one.
		// mediump (medium precision) is a good default.
		precision mediump float;

		varying vec3 fragColor;
		 
		void main() {
		  // gl_FragColor is a special variable a fragment shader is responsible for setting
		  gl_FragColor = vec4(fragColor, 1);
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
	
	// ----- Create the shaders and program ----- //
	shader_program = generateProgram(gl, getVertexShaderSource(), getFragmentShaderSource());

	// ----- Create Buffers ----- //

	// -- Create Vertex Buffer Object (VBO): Contains information on positions, colors, textures, etc.
	let triangle_vertices = [
	//	X 		Y 		Z 	
		-0.5,	0.5,	0.0,
		-0.5,	-0.5,	0.0,
		0.5,	-0.5,	0.0,
	];

	
	let triangle_colors = [
	//	R 		G 		B
		1.0,	0.0,	0.0,
		0.0,	1.0,	1.0,
		0.0,	0.0,	0.0,
	];
	

	let vboPosition = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vboPosition);
	// We provide the position data to the buffer.
	// Javascript generates 64bit floating point precision numbers, but OpenGL expects them in 32bit, so we convert them
	// gl.STATIC_DRAW tells WebGL we are not likely to change this data, so it's a hint for WebGL to try and optimize certain things. 
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangle_vertices), gl.STATIC_DRAW); 

	// We have now "uploaded" the data(vertices) to the GPU, but the vertex shader doesn't know about it yet.
	// So let's tell the shader where and how to get the vertPosition attribute
	let vertPositionAttribLocation = gl.getAttribLocation(shader_program, 'vertPosition');
	gl.vertexAttribPointer(
		vertPositionAttribLocation, // Attribute location
		3, // Number of elements per attribute (here is a vec2=[x,y])
		gl.FLOAT, // Type of elements
		gl.FALSE, // whether or not the data should be normalized
		0, // 0 = move forward size * sizeof(type) each iteration to get the next position.
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.enableVertexAttribArray(vertPositionAttribLocation); 
	gl.bindBuffer(gl.ARRAY_BUFFER, null); // Best practices: clean-up.


	let vboColor = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vboColor);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangle_colors), gl.STATIC_DRAW); 
	let vertColorAttribLocation = gl.getAttribLocation(shader_program, 'vertColor');
	gl.vertexAttribPointer(
		vertColorAttribLocation, // Attribute location
		3, // Number of elements per attribute (here is a vec3=[r,g,b])
		gl.FLOAT, // Type of elements
		gl.FALSE, // whether or not the data should be normalized
		0, // 0 = move forward size * sizeof(type) each iteration to get the next position.
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.enableVertexAttribArray(vertColorAttribLocation); 
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	// -- Create Element Buffer Object (EBO): Contains the indices
	let triangle_indeces = [ 0, 1, 2 ];
	triangle_indeces_length = triangle_indeces.length;

	triangleEBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleEBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle_indeces), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); // Best practices: clean-up.


	// ----- Define World/View/Projection Matrices ----- //

	worldMatrix_location = gl.getUniformLocation(shader_program, 'worldM');
	viewMatrix_location = gl.getUniformLocation(shader_program, 'viewM');
	projMatrix_location = gl.getUniformLocation(shader_program, 'projM');

	// creates them with the identity matrix, so they don't perform any transform yet.
	worldMatrix_value = mat4.create();
	viewMatrix_value = mat4.create();
	projMatrix_value = mat4.create();

	mat4.lookAt(
		viewMatrix_value, 	// the matrix that will be edited
		[0, 0, 2],			// eye: Where we are
		[0, 0, 0], 			// target. Where we are looking (at the origin here)
		[0, 1, 0], 			// up. Where is UP. (here the Y coordinate is up)
	);

	mat4.perspective(
		projMatrix_value, 		// the matrix that will be edited
		glMatrix.toRadian(45), 	// fovy: vertical field of view in radians
		1, 						// aspect ratio
		0.1, 					// zNear
		10.0, 					// zFar
	);

	render();	
}

/**
 * Draw on the screen
 */
function render() {
	
	// Tell OpenGL state machine which program should be active.
	gl.useProgram(shader_program);
	// Since we are going to use drawElements, we need to have the index buffer
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleEBO);

	mat4.rotate(
		worldMatrix_value, 	// output matrix
		identityMatrix,		// the matrix to rotate
		glMatrix.toRadian(angle), // the angle to rotate the matrix by (in rad)
		[0, 1, 0]			// the axis to rotate around
	);
	// instead of doing all that, we can just use:
	//mat4.fromYRotation(worldMatrix_value, glMatrix.toRadian(angle));

	gl.uniformMatrix4fv(worldMatrix_location, gl.FALSE, worldMatrix_value);
	gl.uniformMatrix4fv(viewMatrix_location, gl.FALSE, viewMatrix_value);
	gl.uniformMatrix4fv(projMatrix_location, gl.FALSE, projMatrix_value);

	// clear everything that was on the screen
	gl.clearColor(0.18, 0.18, 0.18, 1.0); // Background Color (R, G, B, Alpha)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.drawElements(gl.TRIANGLES, triangle_indeces_length, gl.UNSIGNED_SHORT, 0);

	// Best practices: clean-up.
	gl.useProgram(null); 
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}


/**
 * Creates a vertex and a fragment shader based on the provided GLSL source code.
 * Then it generates the program out of the 2 shaders and returns it.
 * 
 * @param {WebGL Context} gl
 * @param {GLSL Source Code} vertex_shader_source
 * @param {GLSL Source Code} fragment_shader_source
 * @return {Shader Program} shader_program
 */
function generateProgram(gl, vertex_shader_source, fragment_shader_source) {

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
	let shader_program = gl.createProgram();
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

	return shader_program;
}

function rotationSlider(slider) {
	angle = parseFloat(slider.value) ;
	render();
}