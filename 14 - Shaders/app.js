/*
* Universidad Nacional del Sur
* Computacion Grafica - 2018
*
* Andres Frank
* _____________________________
*
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
	//parsedOBJ = OBJParser.parseFile(texturedboxOBJSource);
	parsedOBJ = OBJParser.parseFile(teapotOBJSource);
	indices_length = parsedOBJ.indices.length;


	// ----- Create the shaders and program ----- //

	// shader_program = Helper.generateProgram(gl, Phong_Phong_vsSource, Phong_Phong_fsSource);
	// shader_program = Helper.generateProgram(gl, BlinnPhong_Gouraud_vsSource, BlinnPhong_Gouraud_fsSource);
	// shader_program = Helper.generateProgram(gl, CookTorrance_Phong_vsSource, CookTorrance_Phong_fsSource);
	// shader_program = Helper.generateProgram(gl, Toon_Phong_vsSource, Toon_Phong_fsSource);
	shader_program = Helper.generateProgram(gl, Ward_Phong_vsSource, Ward_Phong_fsSource);
	// shader_program = Helper.generateProgram(gl, Border_Phong_vsSource, Border_Phong_fsSource);
	// shader_program = Helper.generateProgram(gl, ProceduralTexture_vsSource, ProceduralTexture_fsSource);

	// Material and uniforms specifically for the Phong Lighting Model
	// setupPhong();
	// setupToonShading();
	setupWard();
	// setupBorderShading();
	// setupProceduralTexture();

/*
	var material = {};
	gl.useProgram(shader_program);

	switch (shader_type) {
		case PHONG:
			shader_program = Helper.generateProgram(gl, PhongPhong_texture_vertexShaderSource, PhongPhong_texture_fragmentShaderSource);
			setupPhong();
			break;


		case BLINNPHONG_GOURAUD:
			break;


		case COOKTORRANCE:
			shader_program = Helper.generateProgram(gl, CookTorrance_Phong_vsSource, CookTorrance_Phong_fsSource);
			setupCookTorrance();
			break;


		case TOON:
			shader_program = Helper.generateProgram(gl, Toon_Phong_vsSource, Toon_Phong_fsSource);

			let material = {
				ka: [0.2, 0.2, 0.2],
				kd: [1, 1, 1]
			}
			let toonlevels = 3; // (Integer) Defines how many distinct values will be used in the diffuse calculation. (i.e: how many "brush strokes")

			gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.ka'), material.ka);
			gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.kd'), material.kd);
			gl.uniform1i(gl.getUniformLocation(shader_program, 'toonlevels'), toonlevels);

			console.info("Toon Levels: "+ toonlevels);
			break;


		case BORDER:
			material = {
				ka: [0.2, 0.2, 0.2],
				kd: [1, 1, 1],
				borderColor: [1, 0, 0]
			}
			
			gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.ka'), material.ka);
			gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.kd'), material.kd);
			gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.borderColor'), material.borderColor);

			break;


		default:
			throw ("Error: Invalid Shader Type selected.");
			break;
	}
	gl.useProgram(null);

	console.info("------ Material Information ------");
	console.table(material);
	console.log("");
*/




	// ----- Create Buffers ----- //
	
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
	SC.setCameraTarget(0, 0.5, 0);
	SC.setCameraPosition(3.5, 51, 60);
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
	
	updateMVP(); // update the uniform values


	// ----- Lighting ----- //

	let light = {
		position: Utils.SphericalToCartesian(30, 100, 25), // spherical: radius, theta, phi
		color: [1, 1, 1] // float RGB
	}

	lightPos_location = gl.getUniformLocation(shader_program, 'light.position');
	lightColor_location = gl.getUniformLocation(shader_program, 'light.color');

	gl.useProgram(shader_program);
	gl.uniform3fv(lightPos_location, light.position);
	gl.uniform3fv(lightColor_location, light.color);
	gl.useProgram(null);

	console.info("------ Light Information ------");
	console.table(light);
	console.log("");
	

	// ----- Rendering configurations ----- //
	// Enable the needed rendering tests and configs so it draws correctly	
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);
	gl.clearColor(0.18, 0.18, 0.18, 1.0); // Background Color (R, G, B, Alpha)

	render();	


	var dragging = false
	var dragFactor = 180 / canvas.width		// para que el mover el mouse de un lado al otro del canvas siempre equivalga a 180º
	var insideCanvas = false
	var leftClick = 1
	var lastX = 0
	var lastY = 0
	var mouseChangeX = 0
	var mouseChangeY = 0

	window.onmousedown = (event) => {
		insideCanvas = (document.elementFromPoint(event.clientX, event.clientY) === canvas)
		if (insideCanvas && event.which === leftClick) {
			dragging = true
			lastX = event.clientX
			lastY = event.clientY
		}
	}
	window.onmousemove = (event) => {
		if (dragging) {
			mouseChangeX = (event.clientX - lastX) * dragFactor
			mouseChangeY = (event.clientY - lastY) * dragFactor
			SC.moveHorizontally(mouseChangeX)
			SC.moveVertically(-mouseChangeY)
			lastX = event.clientX
			lastY = event.clientY
			updateMVP();
			render();
		}
	}
	window.onmouseup = () => {
		dragging = false
	}
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


/**
 * Draw on the screen
 */
function render() {

	gl.useProgram(shader_program);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelEBO);

	gl.drawElements(gl.TRIANGLES, indices_length, gl.UNSIGNED_SHORT, 0);

	// Best practices: clean-up.
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.useProgram(null); 
}


///////////////////////////////////////////////////////////////////////////
/////////  S H A D E R S

/**
 * Phong Lighting Model
 */
function setupPhong() {

	let material = {
		ka: [0.2, 0.2, 0.2],
		kd: [1, 1, 1],
		ks: [1, 0, 0],
		sf: 5
	}

	// Update the uniform values
	gl.useProgram(shader_program);
	gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.ka'), material.ka);
	gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.kd'), material.kd);
	gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.ks'), material.ks);
	gl.uniform1f (gl.getUniformLocation(shader_program, 'material.sf'), material.sf);
	gl.useProgram(null);

	console.info("------ Material Information ------");
	console.table(material);
	console.log("");
}

/**
 * Cook & Torrance Lighting Model
 */
function setupCookTorrance() {

	let material = {
		ka: [0.2, 0.2, 0.2],
		kd: [1, 1, 1],
		ks: [1, 1, 1],
		roughness: 7,
		fresnel: 0.2
	}

	// Update the uniform values
	gl.useProgram(shader_program);
	gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.ka'), material.ka);
	gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.kd'), material.kd);
	gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.ks'), material.ks);
	gl.uniform1f(gl.getUniformLocation(shader_program, 'material.roughness'), material.roughness);
	gl.uniform1f(gl.getUniformLocation(shader_program, 'material.fresnel'), material.fresnel);
	gl.useProgram(null);
	
	console.info("------ Material Information ------");
	console.table(material);
	console.log("");
}

/**
 * Toon Shading is a non-photorealistic technique that is intended to mimic the style of shading often used in hand-drawn animation.
 * It only uses ambient and diffuse factors.
 */
function setupToonShading() {

	let material = {
		ka: [0.2, 0.2, 0.2],
		kd: [1, 1, 1]
	}

	let toonlevels = 3; // (Integer) Defines how many distinct values will be used in the diffuse calculation. (i.e: how many "brush strokes")

	// Update the uniform values
	gl.useProgram(shader_program);
	gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.ka'), material.ka);
	gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.kd'), material.kd);
	gl.uniform1i(gl.getUniformLocation(shader_program, 'toonlevels'), toonlevels);
	gl.useProgram(null);
	
	console.info("------ Material Information ------");
	console.table(material);
	console.log("");

	console.info("Toon Levels: "+ toonlevels);

}

function setupBorderShading() {

	let material = {
		ka: [0.2, 0.2, 0.2],
		kd: [1, 1, 1],
		borderColor: [1, 0, 0]
	}

	// Update the uniform values
	gl.useProgram(shader_program);
	gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.ka'), material.ka);
	gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.kd'), material.kd);
	gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.borderColor'), material.borderColor);
	gl.useProgram(null);

	console.info("------ Material Information ------");
	console.table(material);
	console.log("");
}

function setupProceduralTexture() {
	let vboTexture = Helper.createVBO(gl, parsedOBJ.textures);
	Helper.configureAttrib(gl, shader_program, vboTexture, 'vertTexture', 2);
}

function setupWard() {

	let material = {
		ka: [0.2, 0.2, 0.2],
		kd: [1, 1, 1],
		alphaX: 0.5,
		alphaY: 0.13
	}

	// Update the uniform values
	gl.useProgram(shader_program);
	gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.ka'), material.ka);
	gl.uniform3fv(gl.getUniformLocation(shader_program, 'material.kd'), material.kd);
	gl.uniform1f(gl.getUniformLocation(shader_program, 'material.alphaX'), material.alphaX);
	gl.uniform1f(gl.getUniformLocation(shader_program, 'material.alphaY'), material.alphaY);
	gl.useProgram(null);

	console.info("------ Material Information ------");
	console.table(material);
	console.log("");

}








///////////////////////////////////////////////////////////////////////////
/////////  K E Y B O A R D  L I S T E N E R S 

// Global event listener
document.onkeydown = onKeyPress;

// Main HTML Keyboard handler: Entry point
function onKeyPress(event) {
	SC.keyPress(event); // pass the listener event to the camera (Required for SphericalCamera Module)
	updateMVP(); // re-generate the MVP matrix and update it
	render();
}



