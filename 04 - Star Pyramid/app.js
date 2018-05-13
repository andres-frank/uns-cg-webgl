/*
* Universidad Nacional del Sur
* Computacion Grafica - 2018
*
* Andres Frank
* _____________________________
*
* >> Star Pyramid <<
* New concepts:
* 	- Use extension: VAO-Extension. (supported natively in WebGL2 but not WebGL1)
* 	- As a variant, include both position and color in the same Array, instead of having 2 arrays.
* 	- Render multiple objects in one scene using only transformations.
*/

// ----- Global Variables ----- //
var gl = null; // The webgl context
var vaoExtension = null; // Extension to support VAOs in webgl1. (In webgl2, functions are called directly to gl object.)
var shader_program = null; // Shader program to use.

var pyramidEBO = null; // ElementBufferObject
var pyramid_indices_length = 0; // Array length to draw
var pyramidVAO = null; // Vertex Array Object

var worldMatrix_location, worldMatrix_value;
var viewMatrix_location, viewMatrix_value;
var projMatrix_location, projMatrix_value;

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

	// -- Create Vertex Array Object (VAO): Contains the EBO and multiple VBOs
	vaoExtension = gl.getExtension('OES_vertex_array_object');
	pyramidVAO = vaoExtension.createVertexArrayOES(); //create
	vaoExtension.bindVertexArrayOES(pyramidVAO); //begin setting up
	

	// -- Create Vertex Buffer Object (VBO): Contains information on positions, colors, textures, etc.
	let pyramid_vertices_colors = [
	//	X 		Y 		Z 			R 		G 		B
		-0.5, 	0.0, 	-0.5,		1.0, 	0.0, 	0.0,
		0.5, 	0.0, 	-0.5,		1.0, 	0.0, 	0.0,
		0.5, 	0.0, 	0.5,		0.0, 	1.0, 	0.0,
		-0.5, 	0.0, 	0.5,		0.0, 	0.0, 	1.0,
		0.0, 	2.0, 	0.0,		0.0, 	0.0, 	1.0,
	];

	let vboPositionColor = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vboPositionColor);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pyramid_vertices_colors), gl.STATIC_DRAW); 

	// Configure the VBO to tell it how to access the attributes
	let vertPositionAttribLocation = gl.getAttribLocation(shader_program, 'vertPosition');
	gl.vertexAttribPointer(
		vertPositionAttribLocation, // Attribute location
		3, // Number of elements per attribute (here is a vec3=[x,y,z])
		gl.FLOAT, // Type of elements
		gl.FALSE, // whether or not the data should be normalized
		6 * Float32Array.BYTES_PER_ELEMENT, 
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.enableVertexAttribArray(vertPositionAttribLocation); 

	let vertColorAttribLocation = gl.getAttribLocation(shader_program, "vertColor");
	gl.vertexAttribPointer(
		vertColorAttribLocation, // Attribute location
		3, // [r, g, b]
		gl.FLOAT, // Type of elements
		gl.FALSE, // whether or not the data should be normalized
		6 * Float32Array.BYTES_PER_ELEMENT, // how much to move to find next step?
		3 * Float32Array.BYTES_PER_ELEMENT // Offset -> There are 3[x,y,z] values before these ones
	);
	gl.enableVertexAttribArray(vertColorAttribLocation);

	// -- Create Element Buffer Object (EBO): Contains the indices
	let pyramid_indices = [ 
		0,	4,	1,
		1,	4,	2,
		2,	4,	3,
		3,	4,	0,
		1,	3,	0,
		1,	2,	3,
	];
	pyramid_indices_length = pyramid_indices.length;

	pyramidEBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramidEBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(pyramid_indices), gl.STATIC_DRAW);
	
	// clean-up
	// IMPORTANT: Don't null the Array and Element buffer BEFORE the VAO or everything will break.
	vaoExtension.bindVertexArrayOES(null);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); 

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
		[6, 6, 6],			// eye: Where we are
		[0, 0, 0], 			// target. Where we are looking (at the origin here)
		[0, 1, 0], 			// up. Where is UP. (here the Y coordinate is up)
	);

	mat4.perspective(
		projMatrix_value, 		// the matrix that will be edited
		glMatrix.toRadian(45), 	// fovy: vertical field of view in radians
		1, 						// aspect ratio
		0.01, 					// zNear
		100.0, 					// zFar
	);


	// --- Enable the needed rendering tests so it draws correctly	
	
	gl.clearColor(0.18, 0.18, 0.18, 1.0); // Background Color (R, G, B, Alpha)
	
	// Enable the Depth test, which will make it so the shader doesn't render pixels that
	// would be "overlayed" or "hidden" by another pixel
	gl.enable(gl.DEPTH_TEST);
	// but even with DepthTest, the shader is still doing all the math, it's just not showing it.
	// that's why we also enable culling, and we tell it how it should cull. 
	// (check out what happens if you tell it to cullFace(gl.FRONT))
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);

	renderStar();	
}


function renderStar() {

	gl.useProgram(shader_program);
	vaoExtension.bindVertexArrayOES(pyramidVAO);
	//gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramidEBO); //No need for this, we are using VAO

	// clear everything that was on the screen
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// update the matrix uniforms
	gl.uniformMatrix4fv(viewMatrix_location, gl.FALSE, viewMatrix_value);
	gl.uniformMatrix4fv(projMatrix_location, gl.FALSE, projMatrix_value);

	// Top Spike
	mat4.translate(worldMatrix_value, mat4.create(), [0, 0.5, 0]); // Move it 0.5 units up
	gl.uniformMatrix4fv(worldMatrix_location, gl.FALSE, worldMatrix_value); // update the unform with the new value
	gl.drawElements(gl.TRIANGLES, pyramid_indices_length, gl.UNSIGNED_SHORT, 0); // draw it
	

	// Right, Bottom and Left Spikes
	// This cycle will grab the first Top Spike and keep rotating it 90º over the Z axis, 
	// effectively drawing the 4 lateral spikes of the star
	var matrixaux;
	for (var i = 0; i < 3; i++) {
		matrixaux = mat4.create(); // identity matrix
		mat4.rotateZ(matrixaux, mat4.create(), glMatrix.toRadian(90)); // create a basic rotation matrix (from a new identity one)
		mat4.multiply(worldMatrix_value, matrixaux, worldMatrix_value); // accumulate the transformations my multiplying our previous world matrix to the new rotation
		gl.uniformMatrix4fv(worldMatrix_location, gl.FALSE, worldMatrix_value); // update the shader uniform with the new matrix
		gl.drawElements(gl.TRIANGLES, pyramid_indices_length, gl.UNSIGNED_SHORT, 0); // draw it
	}

	// Front Spike
	mat4.translate(worldMatrix_value, mat4.create(), [0, 0.5, 0]); // "reset" the world matrix to be the identity translated 0.5u up, same as the Top Spike
	matrixaux = mat4.create();
	mat4.rotateX(matrixaux, mat4.create(), glMatrix.toRadian(90)); // now instead of rotating over the Z axis, we do it over X
	mat4.multiply(worldMatrix_value, matrixaux, worldMatrix_value); // we combine the matrices
	gl.uniformMatrix4fv(worldMatrix_location, gl.FALSE, worldMatrix_value); // update the GPU
	gl.drawElements(gl.TRIANGLES, pyramid_indices_length, gl.UNSIGNED_SHORT, 0); // draw

	// Back Spike
	// we continue rotating from the point we were before (i.e: +90º in X).
	// If we were to "reset" the world matrix again, we would specifiy -90º rotation instead of 180
	matrixaux = mat4.create();
	mat4.rotateX(matrixaux, mat4.create(), glMatrix.toRadian(180)); 
	mat4.multiply(worldMatrix_value, matrixaux, worldMatrix_value);
	gl.uniformMatrix4fv(worldMatrix_location, gl.FALSE, worldMatrix_value);
	gl.drawElements(gl.TRIANGLES, pyramid_indices_length, gl.UNSIGNED_SHORT, 0);
	
	// clean up
	gl.useProgram(null);
	vaoExtension.bindVertexArrayOES(null);
}
