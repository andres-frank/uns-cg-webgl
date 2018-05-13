/*
* Universidad Nacional del Sur
* Computacion Grafica - 2018
*
* Andres Frank
* _____________________________
*
* We are now pulling the gl-matrix library from the '99-resources' folder.
* 
* We also have created a helper class in that folder and put all the code 
* for program generation there, since that doesn't need to change.
* _____________________________
*
* >> Rotating Cube <<
* New additions:
* 	- we now have a huge list of vertices and indices to form the cube.
* 	- we are rotating in both X and Y 
*
*/

// ----- Global Variables ----- //
var gl = null; // The webgl context
var shader_program = null; // Shader program to use.
var cubeEBO = null; // ElementBufferObject
var cube_indices_length = 0; // Array length to draw

var worldMatrix_location, worldMatrix_value;
var viewMatrix_location, viewMatrix_value;
var projMatrix_location, projMatrix_value;

// ----- Vertex Shader ----- //
function getVertexShaderSource() {
	return `
		// an attribute will receive data from a buffer
		attribute vec3 vertPosition; // [x, y, z] coordinates
		
		// Varyings are a way for a vertex shader to pass data to a fragment shader. 
		varying vec3 fragColor;

		// matrices mat4= 4x4 matrix
		uniform mat4 worldM; 
		uniform mat4 viewM;
		uniform mat4 projM;

		void main() {
		 
		  fragColor = vertPosition;
		  gl_Position = projM * viewM * worldM * vec4(vertPosition, 1.0);

		  //fragColor = vec3(0, 0.6, 1.0);
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
	shader_program = Helper.generateProgram(gl, getVertexShaderSource(), getFragmentShaderSource());

	// ----- Create Buffers ----- //

	// -- Create Vertex Buffer Object (VBO): Contains information on positions, colors, textures, etc.
	let cube_vertices = [
	//	X 		Y 		Z 	
	// Top
		-1.0,	1.0, 	-1.0,  
		-1.0,	1.0, 	1.0,   
		1.0, 	1.0, 	1.0,    
		1.0, 	1.0, 	-1.0,   
	// Left
		-1.0,	1.0, 	1.0,   
		-1.0,	-1.0,	1.0,  
		-1.0,	-1.0,	-1.0, 
		-1.0,	1.0, 	-1.0,  
	// Right
		1.0,	1.0, 	1.0,    
		1.0, 	-1.0,	1.0,   
		1.0, 	-1.0,	-1.0,  
		1.0, 	1.0, 	-1.0,   
	// Front
		1.0, 	1.0, 	1.0,    
		1.0, 	-1.0,	1.0,   
		-1.0,	-1.0,	1.0,  
		-1.0,	1.0, 	1.0,   
	// Back
		1.0, 	1.0, 	-1.0,   
		1.0, 	-1.0,	-1.0,  
		-1.0,	-1.0,	-1.0, 
		-1.0,	1.0, 	-1.0,  
	// Bottom
		-1.0,	 -1.0,	-1.0, 
		-1.0,	 -1.0,	1.0,  
		1.0, 	-1.0, 	1.0,   
		1.0, 	-1.0, 	-1.0,  
	];


	let vboPosition = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vboPosition);
	// We provide the position data to the buffer.
	// Javascript generates 64bit floating point precision numbers, but OpenGL expects them in 32bit, so we convert them
	// gl.STATIC_DRAW tells WebGL we are not likely to change this data, so it's a hint for WebGL to try and optimize certain things. 
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube_vertices), gl.STATIC_DRAW); 

	// We have now "uploaded" the data(vertices) to the GPU, but the vertex shader doesn't know about it yet.
	// So let's tell the shader where and how to get the vertPosition attribute
	let vertPositionAttribLocation = gl.getAttribLocation(shader_program, 'vertPosition');
	gl.vertexAttribPointer(
		vertPositionAttribLocation, // Attribute location
		3, // Number of elements per attribute (here is a vec3=[x,y,z])
		gl.FLOAT, // Type of elements
		gl.FALSE, // whether or not the data should be normalized
		0, // 0 = move forward size * sizeof(type) each iteration to get the next position.
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.enableVertexAttribArray(vertPositionAttribLocation); 
	gl.bindBuffer(gl.ARRAY_BUFFER, null); // Best practices: clean-up.

	// -- Create Element Buffer Object (EBO): Contains the indices
	
	// each face of the cube is composed of 2 triangles, so each face needs 6 vertices
	let cube_indices = [ 
		// Top
		0, 1, 2,
		0, 2, 3,

		// Left
		5, 4, 6,
		6, 4, 7,

		// Right
		8, 9, 10,
		8, 10, 11,

		// Front
		13, 12, 14,
		15, 14, 12,

		// Back
		16, 17, 18,
		16, 18, 19,

		// Bottom
		21, 20, 22,
		22, 20, 23,
	];

	cube_indices_length = cube_indices.length;

	cubeEBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeEBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube_indices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); // Best practices: clean-up.


	// ----- Define World/View/Projection Matrices ----- //

	worldMatrix_location = gl.getUniformLocation(shader_program, 'worldM');
	viewMatrix_location = gl.getUniformLocation(shader_program, 'viewM');
	projMatrix_location = gl.getUniformLocation(shader_program, 'projM');

	// initialize them with the identity matrix. They don't perform any transformation yet.
	worldMatrix_value = mat4.create();
	viewMatrix_value = mat4.create();
	projMatrix_value = mat4.create();

	mat4.lookAt(
		viewMatrix_value, 	// the matrix that will be edited
		[0, 0, 6],			// eye: Where we are
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

	let angle = 0;
	let xRotationMatrix = mat4.create();
	let yRotationMatrix = mat4.create();

	// Enable the Depth test, which will make it so the shader doesn't render pixels that
	// would be "overlayed" or "hidden" by another pixel
	gl.enable(gl.DEPTH_TEST);
	// but even with DepthTest, the shader is still doing all the math, it's just not showing it.
	// that's why we also enable culling, and we tell it how it should cull. 
	// (check out what happens if you tell it to cullFace(gl.FRONT))
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);

	// Tell OpenGL state machine which program should be active.
	gl.useProgram(shader_program);
	// Since we are going to use drawElements, we need to have the index buffer
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeEBO);

	//
	// MAIN RENDER LOOP
	//
	var loop = function() {

		angle = (
			performance.now() 	// ms since the window started
			/ 1000 				// convert from ms to sec
			/ 6 				// every 6 seconds...
			* 2 * Math.PI 		// 2PI = 360º
		);

		mat4.fromYRotation(yRotationMatrix, angle); // obtain matrix for rotation over Y axis
		mat4.fromXRotation(xRotationMatrix, angle/2); // obtain matrix for rotation over X axis. (angle /3 so it goes slower)
		mat4.mul(worldMatrix_value, yRotationMatrix, xRotationMatrix); // generate the final world matrix by multiplying them together

		// update the matrices. 
		// (technically the only one that changed is worldMatrix, so we don't need the others here)
		gl.uniformMatrix4fv(worldMatrix_location, gl.FALSE, worldMatrix_value);
		gl.uniformMatrix4fv(viewMatrix_location, gl.FALSE, viewMatrix_value);
		gl.uniformMatrix4fv(projMatrix_location, gl.FALSE, projMatrix_value);

		// clear everything that was on the screen
		gl.clearColor(0.18, 0.18, 0.18, 1.0); // Background Color (R, G, B, Alpha)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
		gl.drawElements(gl.TRIANGLES, cube_indices_length, gl.UNSIGNED_SHORT, 0);

		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);
}

