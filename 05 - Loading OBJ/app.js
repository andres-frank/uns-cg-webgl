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

// ----- Global Variables ----- //
var gl = null; // The webgl context
var shader_program = null; // Shader program to use.
var modelEBO = null; // ElementBufferObject
var indices_length = 0; // Array length to draw
var parsedOBJ = null; // Our parsed OBJ model

// Uniforms
var worldMatrix_location, worldMatrix_value;
var viewMatrix_location, viewMatrix_value;
var projMatrix_location, projMatrix_value;
var fragColor_location, fragColor_value;

// Aux variables modified by HTML elements
var angle = 0;
var modelColor = hexToRgbFloat("#FFFFFF"); // Model starts white

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
	
	parsedOBJ = OBJParser.parseFile(ironmanOBJSource); // 'ironmanOBJSource' is imported from file "ironman.obj.js" in folder
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

	mat4.lookAt(
		viewMatrix_value, 	// the matrix that will be edited
		[2, 2, 2],			// eye: Where we are
		[0, 1, 0], 			// target. Where we are looking
		[0, 1, 0], 			// up. Where is UP. (here the Y coordinate is up)
	);

	mat4.perspective(
		projMatrix_value, 		// the matrix that will be edited
		glMatrix.toRadian(45), 	// fovy: vertical field of view in radians
		1, 						// aspect ratio
		0.1, 					// zNear
		10.0, 					// zFar
	);

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

	// Get the latest values of the matrices and uniforms
	mat4.fromYRotation(worldMatrix_value, glMatrix.toRadian(angle));
	fragColor_value = vec3.fromValues(modelColor.r, modelColor.g, modelColor.b);
	gl.uniform3fv(fragColor_location, fragColor_value);

	gl.uniformMatrix4fv(worldMatrix_location, gl.FALSE, worldMatrix_value);
	gl.uniformMatrix4fv(viewMatrix_location, gl.FALSE, viewMatrix_value);
	gl.uniformMatrix4fv(projMatrix_location, gl.FALSE, projMatrix_value);

	// clear everything that was on the screen
	gl.clearColor(0.18, 0.18, 0.18, 1.0); // Background Color (R, G, B, Alpha)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.drawElements(gl.TRIANGLES, indices_length, gl.UNSIGNED_SHORT, 0);

	// Best practices: clean-up.
	gl.useProgram(null); 
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}


// ----- HTML Elements Listeners ----- //

function sliderRotationY(slider) {
	angle = parseFloat(slider.value);
	document.getElementById("lblRotationY").innerText = slider.value;
	render();
}

function colorPicker(picker) {
	color_hex = picker.value;
	modelColor = hexToRgbFloat(color_hex);
	document.getElementById("lblColor").innerText = color_hex;
	render();
}

/**
 * Returns the passed HEX color value in Integer form
 * @param  Color written in HEX form.
 * @return The R G B values in a vector, in integer form in that order.
 */
function hexToRgbInt(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	};
}

/**
 * Returns the passed HEX color value in float form
 * @param  Color written in HEX form.
 * @return The R G B values in a vector, in float form in that order.
 */
function hexToRgbFloat(hex) {
	let rgbInt = hexToRgbInt(hex);
	return {
		r: parseFloat(rgbInt.r) / 255.0,
		g: parseFloat(rgbInt.g) / 255.0,
		b: parseFloat(rgbInt.b) / 255.0,
	};
}