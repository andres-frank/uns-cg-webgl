/*
* Universidad Nacional del Sur
* Computacion Grafica - 2018
*
* Andres Frank
* _____________________________
*
* >> Lighting <<
* New concepts:
* - Phong Lighting Model
*/

// ----- Global Variables ----- //
var gl = null; // The webgl context
var shader_program = null; // Shader program to use.
var modelEBO = null; // ElementBufferObject
var indices_length = 0; // Array length to draw
var parsedOBJ = null; // Our parsed OBJ model

// Uniforms
var worldMatrix_value;
var viewMatrix_value;
var projMatrix_value;
var mvMatrix_location, mvMatrix_value;
var mvpMatrix_location, mvpMatrix_value;

var SC; // SphericalCamera

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

	parsedOBJ = OBJParser.parseFile(ironmanOBJSource); // 'ironmanOBJSource' is imported from file "ironman.obj.js" in folder "../99 - Resources/obj_models_js/"
	indices_length = parsedOBJ.indices.length;


	// ----- Create the shaders and program ----- //
	shader_program = Helper.generateProgram(gl, vertexShaderSource, fragmentShaderSource);


	// ----- Create Buffers ----- //
	// I put most of the creation process in the Helper class.
	// It would be better to have it even more modular, but it's quite complex to have something functional and modular,
	// without sending a ton of parameters, etc.
	
	let vboPosition = Helper.createVBO(gl, parsedOBJ.positions);
	Helper.configureAttrib(gl, shader_program, vboPosition, 'vertPosition', 3);

	let vboNormal = Helper.createVBO(gl, parsedOBJ.normals);
	Helper.configureAttrib(gl, shader_program, vboNormal, 'vertNormal', 3);
	
	modelEBO = Helper.createEBO(gl, parsedOBJ.indices);


	// ----- Define World/View/Projection Matrices ----- //

	// World Matrix
	worldMatrix_value = mat4.create(); // Initialize with identity matrix

	// View Matrix
	SC = new SphericalCamera(); // External module for camera control
	SC.setCameraTarget(0, 1, 0);
	viewMatrix_value = mat4.create(); // Initialize with identity matrix
	viewMatrix_value = SC.getViewMatrix();

	// Projection Matrix
	projMatrix_value = mat4.create(); // Initialize with identity matrix
	mat4.perspective(
		projMatrix_value, 		// the matrix that will be edited
		glMatrix.toRadian(45), 	// fovy: vertical field of view in radians
		1, 						// aspect ratio
		0.1, 					// zNear
		10.0, 					// zFar
	);
	
	// single ModelView matrix
	mvMatrix_location = gl.getUniformLocation(shader_program, 'MV');

	// single ModelViewProj matrix
	mvpMatrix_location = gl.getUniformLocation(shader_program, 'MVP');
	
	// Obtain the values
	updateMVP();

	// ----- Lighting Uniforms ----- //
	/*
	uniform vec3 ka; 
	uniform vec3 kd; 
	uniform vec3 ks;
	uniform vec3 lightPosition;
	uniform float CoefEsp; 
	*/
	ka_location = gl.getUniformLocation(shader_program, 'ka');
	kd_location = gl.getUniformLocation(shader_program, 'kd');
	ks_location = gl.getUniformLocation(shader_program, 'ks');
	lightPos_location = gl.getUniformLocation(shader_program, 'lightPosition');
	CoefEsp_location = gl.getUniformLocation(shader_program, 'CoefEsp');

	ka_value = vec3.fromValues(2, 2, 2);
	kd_value = [2,2,2];
	ks_value = vec3.fromValues(2, 2, 2);
	lightPos_value = vec3.fromValues(2, 2, 2);
	CoefEsp_value = 50;

	gl.useProgram(shader_program);
	
	gl.uniform3fv(ka_location, ka_value);
	gl.uniform3fv(kd_location, kd_value);
	gl.uniform3fv(ks_location, ks_value);
	gl.uniform3fv(lightPos_location, lightPos_value);
	gl.uniform1f(CoefEsp_location, CoefEsp_value);

	gl.useProgram(null);

	// ----- Rendering configurations ----- //
	// Enable the needed rendering tests and configs so it draws correctly	
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);
	gl.clearColor(0.18, 0.18, 0.18, 1.0); // Background Color (R, G, B, Alpha)

	render();	
}


/**
 * Creates a single MVP (ModelViewProjection Matrix) for use on the VertexShader.
 * We do this multiplication out of the VS because it is not efficient to
 * perform it for every single vector (it's the same matrix every time!)
 *
 * We also upload a MV matrix since that will be used for all lighting calculations.
 */
function updateMVP() {

	// Reset to identity matrix
	mvMatrix_value = mat4.create();
	mvpMatrix_value = mat4.create();

	// Obtain the ModelView Matrix
	mat4.multiply(mvMatrix_value, mvMatrix_value, viewMatrix_value);
	mat4.multiply(mvMatrix_value, mvMatrix_value, worldMatrix_value);

	// Based on MV, obtain MVP
	mat4.multiply(mvpMatrix_value, mvpMatrix_value, projMatrix_value);
	mat4.multiply(mvpMatrix_value, mvpMatrix_value, mvMatrix_value);

	// Update the graphics card with the latest values
	gl.useProgram(shader_program);
	gl.uniformMatrix4fv(mvMatrix_location, gl.FALSE, mvMatrix_value);
	gl.uniformMatrix4fv(mvpMatrix_location, gl.FALSE, mvpMatrix_value);
	gl.useProgram(null);
}

/**
 * Draw on the screen
 */
function render() {

	// Tell OpenGL state machine which program should be active.
	gl.useProgram(shader_program);

	// clear everything that was on the screen
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Since we are going to use drawElements, we need to have the index buffer
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelEBO);
	gl.drawElements(gl.TRIANGLES, indices_length, gl.UNSIGNED_SHORT, 0);

	// Best practices: clean-up.
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.useProgram(null); 
}


// Required Function for SphericalCamera Module //
function onKeyPress(event) {
	SC.keyPress(event); // pass the listener event to the camera
	viewMatrix_value = SC.getViewMatrix(); // obtain the new view matrix from camera
	updateMVP(); // re-generate the MVP matrix and update it
	render(); // draw with the new view
}

var testing;
function myFunction(event) {
	testing=event;


	var element = document.getElementById(event.id);
	var column = event.parentElement.id;
	var row = event.parentElement.parentElement.id;

	switch(event.id) {

		case column + "_range":
			document.getElementById(column + "_number").value = event.value;
			updateColorPicker(row);
			break;

		case column + "_number":
			document.getElementById(column + "_range").value = event.value;
			updateColorPicker(row);
			break;

		case row + "_color":
			
			let rgb = hexToRgbInt(element.value);
			let rgbf = hexToRgbFloat(element.value);

			document.getElementById(row + "_x_number").value = rgb.r;
			document.getElementById(row + "_x_range").value = rgb.r;

			document.getElementById(row + "_y_number").value = rgb.g;
			document.getElementById(row + "_y_range").value = rgb.g;

			document.getElementById(row + "_z_number").value = rgb.b;
			document.getElementById(row + "_z_range").value = rgb.b;

			break;
	}
	
}

function updateColorPicker(row) {

	var label = {
		x: row + "_x_number",
		y: row + "_y_number",
		z: row + "_z_number",
		color: row + "_color"
	};

	let x = document.getElementById(label.x).value;
	let y = document.getElementById(label.y).value;
	let z = document.getElementById(label.z).value;

	document.getElementById(label.color).value = toHexColor(x, y, z);
}

function toHexColor(r, g, b) {

	let rhex = ("0" + Number(r).toString(16)).slice(-2);
	let ghex = ("0" + Number(g).toString(16)).slice(-2);
	let bhex = ("0" + Number(b).toString(16)).slice(-2);

    return "#" + rhex + ghex + bhex;
}

function hexToRgbInt(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	};
}

function hexToRgbFloat(hex) {
	let rgbInt = hexToRgbInt(hex);
	return {
		r: parseFloat(rgbInt.r) / 255.0,
		g: parseFloat(rgbInt.g) / 255.0,
		b: parseFloat(rgbInt.b) / 255.0,
	};
}



///////////////////////////////////////////////////////////////////////



function myFunction2(event) {

	var numberbox = document.getElementById("kd_x_number");
	numberbox.value = event.value;

	var slider = document.getElementById("kd_x_range");
	slider.value = event.value;

	var colorpicker = document.getElementById("kd_color");
	colorpicker.value = toHex2(event.value);
		console.log(colorpicker.value);
		console.log(toHex2(event.value));

}



function colorpicker(event) {
	var colorpicker = document.getElementById("kd_color");
	testing = event;
	var myfloat = hexToRgbFloat(colorpicker.value);

	var numberbox = document.getElementById("kd_x_number");
	numberbox.value = myfloat.r;

	var slider = document.getElementById("kd_x_range");
	slider.value = myfloat.r;

	console.log(colorpicker.value);
	console.log(myfloat.r);
}






