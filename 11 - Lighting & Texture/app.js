/*
* Universidad Nacional del Sur
* Computacion Grafica - 2018
*
* Andres Frank
* _____________________________
*
* >> Lighting & Texture <<
*/

// ----- Global Variables ----- //
var gl = null; // The webgl context
var shader_program = null; // Shader program to use.
var modelEBO = null; // ElementBufferObject
var indices_length = 0; // Array length to draw
var parsedOBJ = null; // Our parsed OBJ model

// Uniforms
var modelMatrix_value;
var viewMatrix_location, viewMatrix_value;
var projMatrix_value;
var mvMatrix_location, mvMatrix_value;
var mvpMatrix_location, mvpMatrix_value;
var normalMatrix_location, normalMatrix_value;

var boxtexture;
var lightPositionSpherical;
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
	//parsedOBJ = OBJParser.parseFile(ironmanOBJSource); // imported from file "ironman.obj.js" in folder "../99 - Resources/obj_models_js/"
	parsedOBJ = OBJParser.parseFile(texturedboxOBJSource);
	indices_length = parsedOBJ.indices.length;


	// ----- Create the shaders and program ----- //
	shader_program = Helper.generateProgram(gl, PhongPhong_texture_vertexShaderSource, PhongPhong_texture_fragmentShaderSource);


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

	// Model/World Matrix
	modelMatrix_value = mat4.create(); // Initialize with identity matrix

	// View Matrix
	SC = new SphericalCamera(); // External module for camera control
	SC.setCameraTarget(0, 0, 0);
	SC.setCameraPosition(5, 33, 60);
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

	// matrix uniforms
	viewMatrix_location = gl.getUniformLocation(shader_program, 'viewMatrix');
	mvMatrix_location = gl.getUniformLocation(shader_program, 'modelViewMatrix');
	mvpMatrix_location = gl.getUniformLocation(shader_program, 'modelViewProjectionMatrix');
	normalMatrix_location = gl.getUniformLocation(shader_program, 'normalMatrix');
	
	// update the uniform values
	updateMVP();


	// ----- Lighting Uniforms ----- //

	ka_location = gl.getUniformLocation(shader_program, 'material.ka');
	kd_location = gl.getUniformLocation(shader_program, 'material.kd');
	ks_location = gl.getUniformLocation(shader_program, 'material.ks');
	specCoef_location = gl.getUniformLocation(shader_program, 'material.sf');
	lightPos_location = gl.getUniformLocation(shader_program, 'light.position');

	// set the default starter values
	updateHTMLRow("ka", 0.2, 0.2, 0.2);
	updateHTMLRow("kd", 1, 1, 1);
	updateHTMLRow("ks", 1, 1, 1);
	updateHTMLRow("specCoef", 7);

	lightPositionSpherical = {
		radius: 11,
		theta: 100,
		phi: 75
	};
	document.getElementById("lblPhi_light").innerText = lightPositionSpherical.phi;
	document.getElementById("lblTheta_light").innerText = lightPositionSpherical.theta;
	document.getElementById("lblRadius_light").innerText = lightPositionSpherical.radius;

	// update the uniforms with these values
	updateCoefficients();
	updateLightPosition();


	// ----- Texture ----- //

	// a model will have texture coordinates that we need to pass to the vertex shader.
	let vboTexture = Helper.createVBO(gl, parsedOBJ.textures);
	Helper.configureAttrib(gl, shader_program, vboTexture, 'vertTexture', 2);
	//u_sampler_location = gl.getUniformLocation(shader_program, 'sampler');

	// Obtain the image that will act as texture. 
	let boxtextureimg = document.getElementById("boxtexture"); 

	// We pass the image that will be used as texture to this helper function which will bind it to a gl texture object and return it.
	// We will use that texture for drawing later, that's why the variable is global.
	boxtexture = Helper.create2DTexture(boxtextureimg);


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

	viewMatrix_value = SC.getViewMatrix(); // obtain the new view matrix from camera
	mvMatrix_value = mat4.create(); // Reset to identity matrix
	mvpMatrix_value = mat4.create();
	normalMatrix_value = mat3.create();

	// Obtain the ModelView Matrix
	mat4.multiply(mvMatrix_value, modelMatrix_value, mvMatrix_value);
	mat4.multiply(mvMatrix_value, viewMatrix_value, mvMatrix_value);

	// Based on MV, obtain MVP
	mat4.multiply(mvpMatrix_value, mvMatrix_value, mvpMatrix_value);
	mat4.multiply(mvpMatrix_value, projMatrix_value, mvpMatrix_value);

	// Based on MV, obtain Normal Matrix
	mat3.fromMat4(normalMatrix_value, mvMatrix_value);
	mat3.invert(normalMatrix_value, normalMatrix_value);
	mat3.transpose(normalMatrix_value, normalMatrix_value);

	// Update the graphics card with the latest values
	gl.useProgram(shader_program);
	gl.uniformMatrix4fv(viewMatrix_location, gl.FALSE, viewMatrix_value);
	gl.uniformMatrix4fv(mvMatrix_location, gl.FALSE, mvMatrix_value);
	gl.uniformMatrix4fv(mvpMatrix_location, gl.FALSE, mvpMatrix_value);
	gl.uniformMatrix3fv(normalMatrix_location, false, normalMatrix_value);
	gl.useProgram(null);
}


// Update the shader uniforms with the latest position
function updateLightPosition() {
	
	lightPos_value = Utils.SphericalToCartesian(
		lightPositionSpherical.radius,
		lightPositionSpherical.theta,
		lightPositionSpherical.phi
	);

	gl.useProgram(shader_program);
	gl.uniform3fv(lightPos_location, lightPos_value);
	gl.useProgram(null);
}

// Update the lighting/material uniforms with the values obtained from the HTML
function updateCoefficients() {
	let x,y,z;

	// Get the new values from the HTML. This is such ugly code.
	
	x = document.getElementById("ka_x_number").value;
	y = document.getElementById("ka_y_number").value;
	z = document.getElementById("ka_z_number").value;
	ka_value = vec3.fromValues(x, y, z);

	x = document.getElementById("kd_x_number").value;
	y = document.getElementById("kd_y_number").value;
	z = document.getElementById("kd_z_number").value;
	kd_value = vec3.fromValues(x, y, z);
	//kd_value = [x, y, z];

	x = document.getElementById("ks_x_number").value;
	y = document.getElementById("ks_y_number").value;
	z = document.getElementById("ks_z_number").value;
	ks_value = vec3.fromValues(x, y, z);
	
	specCoef_value = document.getElementById("specCoef_number").value;
	
	// Update the uniforms
	gl.useProgram(shader_program);
	
	gl.uniform3fv(ka_location, ka_value);
	gl.uniform3fv(kd_location, kd_value);
	gl.uniform3fv(ks_location, ks_value);
	gl.uniform1f(specCoef_location, specCoef_value);

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
	
	// We are using texture for drawing
	gl.bindTexture(gl.TEXTURE_2D, boxtexture);
	// Load the binded texture into the sampler in position 0. WebGL can load many textures at once,
	// but we only have one sampler defined in the fragment shader, so it will always be 0.
	gl.activeTexture(gl.TEXTURE0); 
	//gl.uniform1i(shader_program.samplerUniform, 0); // don't know what this does, but doesn't seem necessary

	gl.drawElements(gl.TRIANGLES, indices_length, gl.UNSIGNED_SHORT, 0);

	// Best practices: clean-up.
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.useProgram(null); 
}

///////////////////////////////////////////////////////////////////////////
/////////
/////////  K E Y B O A R D  L I S T E N E R S 
/////////

// Global event listener
document.onkeydown = onKeyPress;

// Main HTML Keyboard handler: Entry point
function onKeyPress(event) {
	
	switch (event.key) {
		
		// Light Keys
		case "ArrowDown":
		case "ArrowUp":
		case "ArrowRight":
		case "ArrowLeft":
		case "+":
		case "-":
			lightEventHandler(event);
			break;

		// Camera keys
		case "w":
		case "s":
		case "d":
		case "a":
		case "q":
		case "e":
			SC.keyPress(event); // pass the listener event to the camera (Required for SphericalCamera Module)
			updateMVP(); // re-generate the MVP matrix and update it
			break;
	}

	render(); // draw with the new view
}

/**
 * Keyboard handler for the light position
 * @param  event: the event generated by the HTML
 */
function lightEventHandler(event) {

	switch(event.key) {
		case "ArrowUp":
			lightPositionSpherical.phi = (lightPositionSpherical.phi + 5) % 360;
			document.getElementById("lblPhi_light").innerText = lightPositionSpherical.phi;
			break;

		case "ArrowDown":
			lightPositionSpherical.phi = (lightPositionSpherical.phi - 5) % 360;
			document.getElementById("lblPhi_light").innerText = lightPositionSpherical.phi;
			break;

		case "ArrowRight":
			lightPositionSpherical.theta = (lightPositionSpherical.theta + 5) % 360;
			document.getElementById("lblTheta_light").innerText = lightPositionSpherical.theta;
			break;

		case "ArrowLeft":
			lightPositionSpherical.theta = (lightPositionSpherical.theta - 5) % 360;
			document.getElementById("lblTheta_light").innerText = lightPositionSpherical.theta;
			break;

		case "+":
			lightPositionSpherical.radius += 1;
			document.getElementById("lblRadius_light").innerText = lightPositionSpherical.radius;
			break;

		case "-":
			lightPositionSpherical.radius -= 1;
			document.getElementById("lblRadius_light").innerText = lightPositionSpherical.radius;
			break;
	}

	updateLightPosition();
}

/**
 * Handler for all the events generated by interacting with the lighting table elements,
 * such as sliders, color pickers, etc.
 * @param  event: the event generated by the HTML
 */
function coefficientsEventHandler(event) {
	var column = event.parentElement.id;
	var row = event.parentElement.parentElement.id;

	switch(event.id) {

		case column + "_range":
			document.getElementById(column + "_number").value = event.value;
			updateHTMLColorPicker(row);
			break;

		case column + "_number":
			document.getElementById(column + "_range").value = event.value;
			updateHTMLColorPicker(row);
			break;

		case row + "_color":

			let pickerHexValue = document.getElementById(event.id).value;
			let rgbf = Utils.hexToRgbFloat(pickerHexValue);
			updateHTMLRow(row, rgbf.r, rgbf.g, rgbf.b);
			break;

		case "specCoef_range":
			document.getElementById("specCoef_number").value = event.value;
			break;

		case "specCoef_number":
			document.getElementById("specCoef_range").value = event.value;
			break;
	}

	updateCoefficients();
	render();
}

/**
 * Helper function for the handling of the coefficients table
 * Given a row, update the color picker based on the values from the number fields
 * @param  {String} row The row where the color picker should be updated (valid options: "ka", "kd", "ks")
 */
function updateHTMLColorPicker(row) {
	let x = document.getElementById(row + "_x_number").value;
	let y = document.getElementById(row + "_y_number").value;
	let z = document.getElementById(row + "_z_number").value;

	document.getElementById(row + "_color").value = Utils.rgbFloatToHex(x, y, z);
}

/**
 * Helper function for the handling of the coefficients table
 * Given a row and a group of values, update the HTML element sliders, numbers, and color pickers.
 * @param  {String} row The row that should be updated (valid options: "ka", "kd", "ks", "specCoef")
 */
function updateHTMLRow(row, x, y ,z) {

	if (row == "specCoef"){
		document.getElementById(row + "_number").value = x;
		document.getElementById(row + "_range").value = x;

	} else {
		document.getElementById(row + "_x_number").value = x;
		document.getElementById(row + "_x_range").value = x;

		document.getElementById(row + "_y_number").value = y;
		document.getElementById(row + "_y_range").value = y;
		
		document.getElementById(row + "_z_number").value = z;
		document.getElementById(row + "_z_range").value = z;
		
		updateHTMLColorPicker(row);
	}
}





