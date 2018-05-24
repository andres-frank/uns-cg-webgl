/*
* Universidad Nacional del Sur
* Computacion Grafica - 2018
*
* Andres Frank
* _____________________________
*
* >> Normals <<
* New concepts:
* - Using normals
* - Improving efficiency by calculating matrices out of the shader. (setting up the field for ligthing)
* - More Modular code (VAO generation, Object Parsing, HTML generation, Separate Shaders)
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
	SC.setCameraPosition(3, 69, 60);
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
	
	// With these matrices we create a single ModelViewProj matrix
	mvpMatrix_location = gl.getUniformLocation(shader_program, 'MVP');
	updateMVP();

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
 */
function updateMVP() {

	mvpMatrix_value = mat4.create(); // Reset it to the identity

	mat4.multiply(mvpMatrix_value, mvpMatrix_value, projMatrix_value);
	mat4.multiply(mvpMatrix_value, mvpMatrix_value, viewMatrix_value);
	mat4.multiply(mvpMatrix_value, mvpMatrix_value, worldMatrix_value);

	// Update the graphics card with the latest value
	gl.useProgram(shader_program);
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
