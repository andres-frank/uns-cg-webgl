/*
* Universidad Nacional del Sur
* Computacion Grafica - 2018
*
* Andres Frank
* _____________________________
*
* >> Loading OBJ Models <<
* New concepts:
* 	- Using the OBJParser helper class to load external models.
* 	- Playing with HTML color picker and passing its value to the fragment shader.
*/

// ----- Vertex Shader ----- //
function getVertexShaderSource() {
	return `
		// an attribute will receive data from a buffer
		attribute vec3 vertPosition; // [x, y, z] coordinates
		attribute vec3 vertColor; // [r, g, b]
		
		// matrices mat4= 4x4 matrix
		uniform mat4 worldM; 
		uniform mat4 viewM;
		uniform mat4 projM;

		void main() {
			gl_Position = projM * viewM * worldM * vec4(vertPosition, 1.0);
		}
	`;
}

// ----- Fragment Shader ----- //
function getFragmentShaderSource() {
	return `
		precision mediump float;

		uniform vec3 fragColor;
		 
		void main() {
			gl_FragColor = vec4(fragColor, 1);
		}
	`;
}

// ----- Global Variables ----- //
var gl = null; // The webgl context
var shader_program = null; // Shader program to use.
var modelEBO = null; // ElementBufferObject
var indices_length = 0; // Array length to draw
var parsedOBJ = null; // Our parsed OBJ model

// Uniforms and helpers
var worldMatrix_location, worldMatrix_value;
var viewMatrix_location, viewMatrix_value;
var projMatrix_location, projMatrix_value;
var camera_eye = {x:2, y:2, z:2};

var fragColor_location, fragColor_value;
var modelColor = {r:0.8, g:0.8, b:0.8} // Model starts white-ish

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
	
	// ----- Parse OBJ File ----- //
	// We are using a helper class that takes in the exported OBJ source.
	// In this case we are doing it through a little hack which is defining all the source code as a JS variable
	// so as to not deal with file permission issues. (Open the 'ironman.obj.js' file for more info)
	// This is basically the same idea as the one we are currently using for the Shaders source above.
	
	parsedOBJ = OBJParser.parseFile(ironmanOBJSource); // 'ironmanOBJSource' is imported from file "ironman.obj.js"
	let parsedOBJ_indices = parsedOBJ.indices;
	indices_length = parsedOBJ_indices.length;
	let parsedOBJ_positions = parsedOBJ.positions;

	// ----- Create the shaders and program ----- //
	shader_program = Helper.generateProgram(gl, getVertexShaderSource(), getFragmentShaderSource());


	// ----- Create Buffers ----- //

	// -- Create Vertex Buffer Object (VBO): Contains information on positions, colors, textures, etc.

	let vboPosition = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vboPosition);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(parsedOBJ_positions), gl.STATIC_DRAW); 

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
	gl.bindBuffer(gl.ARRAY_BUFFER, null);


	// -- Fragment Shader Uniform Color
	fragColor_location = gl.getUniformLocation(shader_program, 'fragColor');
	fragColor_value = vec3.fromValues(modelColor.r, modelColor.g, modelColor.b);
	

	// -- Create Element Buffer Object (EBO): Contains the indices
	
	modelEBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelEBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(parsedOBJ_indices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); // Best practices: clean-up.


	// ----- Define World/View/Projection Matrices ----- //

	worldMatrix_location = gl.getUniformLocation(shader_program, 'worldM');
	viewMatrix_location = gl.getUniformLocation(shader_program, 'viewM');
	projMatrix_location = gl.getUniformLocation(shader_program, 'projM');

	// creates them with the identity matrix, so they don't perform any transform yet.
	worldMatrix_value = mat4.create();
	viewMatrix_value = mat4.create();
	projMatrix_value = mat4.create();

	mat4.perspective(
		projMatrix_value, 		// the matrix that will be edited
		glMatrix.toRadian(45), 	// fovy: vertical field of view in radians
		1, 						// aspect ratio
		0.1, 					// zNear
		100.0, 					// zFar
	);

	// -- Defining the camera (viewMatrix)
	updateCamera();

	// ----- Set up rendering -----
	gl.clearColor(0.18, 0.18, 0.18, 1.0); // Background Color (R, G, B, Alpha)

	// Enable the needed rendering tests so it draws correctly	
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);

	render();	
}



/**
 * Draw on the screen
 */
function render() {

	// Tell OpenGL state machine which program should be active.
	gl.useProgram(shader_program);
	// Since we are going to use drawElements, we need to have the index buffer
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelEBO);

	gl.uniformMatrix4fv(worldMatrix_location, gl.FALSE, worldMatrix_value);
	gl.uniformMatrix4fv(viewMatrix_location, gl.FALSE, viewMatrix_value);
	gl.uniformMatrix4fv(projMatrix_location, gl.FALSE, projMatrix_value);

	gl.uniform3fv(fragColor_location, fragColor_value);

	// clear everything that was on the screen
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.drawElements(gl.TRIANGLES, indices_length, gl.UNSIGNED_SHORT, 0);

	// Best practices: clean-up.
	gl.useProgram(null); 
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

/**
 * Updates the ViewMatrix with the new camera values.
 */
function updateCamera() {

	// transform the "component-based" variable into an array to pass to lookAt.
	let _camera_eye = [camera_eye.x, camera_eye.y, camera_eye.z];

	mat4.lookAt(
		viewMatrix_value, // Where to store the resulting matrix
		_camera_eye,// Eye: Where is the camera
		[0, 1, 0], 	// Target: Where is it looking
		[0, 1, 0] 	// UP: Which side is up (here the Y+ coord means up)
	);

}

// ----- HTML Elements Listeners ----- //

function onKeyDown(evt) {

	switch(evt.code) {

		case "KeyQ":
			if (camera_eye.z < 20) { // limit of where the camera can move
				camera_eye.z = camera_eye.z + 0.5;
				document.getElementById("lblZ").innerText = camera_eye.z;
			}
			break;

		case "KeyE":
			if (camera_eye.z > -20) {
				camera_eye.z = camera_eye.z - 0.5;
				document.getElementById("lblZ").innerText = camera_eye.z;
			}
			break;

		case "KeyD":
			if (camera_eye.x < 20) {
				camera_eye.x = camera_eye.x + 0.5;
				document.getElementById("lblX").innerText = camera_eye.x;
			}
			break;

		case "KeyA":
			if (camera_eye.x > -20) {
				camera_eye.x = camera_eye.x - 0.5;
				document.getElementById("lblX").innerText = camera_eye.x;
			}
			break;

		case "KeyW":
			if (camera_eye.y < 20) {
				camera_eye.y = camera_eye.y + 0.5;
				document.getElementById("lblY").innerText = camera_eye.y;
			}
			break;

		case "KeyS":
			if (camera_eye.y > -20) {
				camera_eye.y = camera_eye.y - 0.5;
				document.getElementById("lblY").innerText = camera_eye.y;
			}
			break;
	}

	updateCamera();
	render();
}