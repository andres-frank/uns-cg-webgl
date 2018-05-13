/*
* Universidad Nacional del Sur
* Computacion Grafica - 2018
*
* Andres Frank
* _____________________________
*
* >> Texture <<
* New concepts:
* - Loading an image
* - Applying texture
*/

/**
 *
 * Loading an image file is unfortunately not trivial.
 * Modern browsers refuse to load resources that do not provide from the same origin and throw a security error when attempted.
 * This is a similar issue that we ran into when trying to load the shaders from external files. 
 * In that case we chose to perform a little hack and define the shader code as a javascript variable, so it can be loaded from a <script> tag.
 * 
 * Now though, we are dealing with an image, so we are going to use a different hack:
 * We will re-encode the image into a Base64 format and put that directly into our HTML. 
 * This avoids having to load an actual file from the computer, so the browser won't complain.
 * 
 * In order to do this, just google any base64 encoder that can take files and encode your image into base64.
 * You can also do this in the terminal with openssl:
 * $ openssl base64 -in texture.jpg -out texture.base64
 * If you want to have it in a single line so it doesn't occupy a thousand lines in your html file you can use instead:
 * $ cat texture.jpg | openssl base64 | tr -d '\n' > texture.singleline.base64
 * 
 * Once you have the base64 encoded image, define an <img> tag in the html with the folloning format:
 * <img id="mytexture" src="data:image/jpg;base64, <encoded image string>">
 *
 * Then we can obtain that image by just doing:
 * var mytextureimg = document.getElementById("mytexture");
 *
 * 
 * At the moment of writing (2018-05-11), firefox does allows for an image to be simply grabbed. Chrome does not.
 * If you want to see how that would look like, it's as easy as this:
 		var mytextureimg = new Image();
		mytextureimg.crossOrigin = "anonymous";
		mytextureimg.src = "texture1_256.jpg";
 * You don't event need to add anything to the HTML.
 * We want our app to work on any browser, so we will use the base64 method.
 *
 * 
 * Yes, all these hacks are annoying but they allow us to execute the app without having to run a webserver.
 * Webservers also introduce some other annoyances, like the browser caching the page and not updating with your changes, so it's a compromise.
 * 
 */


// ----- Global Variables ----- //
var gl = null; // The webgl context
var shader_program = null; // Shader program to use.
var modelEBO = null; // ElementBufferObject
var indices_length = 0; // Array length to draw
var parsedOBJ = null; // Our parsed OBJ model

var mytexture1, mytexture2;
var active_texture = 1; // aux var to swap between textures

var SC; // SphericalCamera

// Uniforms
var worldMatrix_value;
var viewMatrix_value;
var projMatrix_value;
var mvpMatrix_location, mvpMatrix_value;


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
	
	// With these matrices we create a single ModelViewProj matrix
	mvpMatrix_location = gl.getUniformLocation(shader_program, 'MVP');
	updateMVP();


	// ----- Texture ----- //

	// a model will have texture coordinates that we need to pass to the vertex shader.
	let vboTexture = Helper.createVBO(gl, parsedOBJ.textures);
	Helper.configureAttrib(gl, shader_program, vboTexture, 'vertexTexture', 2);

	//u_sampler_location = gl.getUniformLocation(shader_program, 'sampler');

	//mytexture1 = gl.createTexture(); // create the gl texture object. The variable is defined globally because we need it for drawing.
	
	// Obtain the image that will act as texture. 
	// Take a look at the README to understand the hack we are using to be able to load the image.
	let mytexture1img = document.getElementById("texture1"); 

	// We pass the image that will be used as texture to this helper function which will bind it to a gl texture object and return it.
	// We will use that texture for drawing later, that's why the variable is global.
	mytexture1 = create2DTexture(mytexture1img);

	// we do the same for the other texture
	let mytexture2img = document.getElementById("texture2"); 
	mytexture2 = create2DTexture(mytexture2img);


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
 * Upload the image texture to the GPU by binding it to a texture object.
 * 
 * @param gltexture  the texture object obtained via gl.createTexture()
 * @param imgtexture the image to be used as texture
 */
function create2DTexture(imgtexture) {
	
	let gltexture = gl.createTexture(); 

	// bind the texture that we are going to work on
	gl.bindTexture(gl.TEXTURE_2D, gltexture);

	// texture coordinates (U,V) take the origin (0,0) at a different, opposite location,
	// causing the textures to appear upside down. To remediate, we tell webgl to flip
	// them so they match the screen cordinates.
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	// Texture coordinates are resolution independent, they won't always match a pixel exactly.
	// We can choose from different methods to decide on the sampled color when this happens:
	// GL_NEAREST: Returns the pixel that is closest to the coordinates.
	// GL_LINEAR: Returns the weighted average of the 4 pixels surrounding the given coordinates.
	// You choose one of this methods for the 2 cases of having to scale the texture down or up [MINIFY/MAGNIFY]
	// This process is called Filtering
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	
	// Specify the information the texture will use, including the actual image
	gl.texImage2D(
		gl.TEXTURE_2D, 		// Type of texture
		0, 					// level-of-detail. 0 for base image
		gl.RGBA, 			// the format in which pixels should be stored on the graphics card
		gl.RGBA, 			// just match the previous parameter
		gl.UNSIGNED_BYTE, 	// the format of the pixels in the array that will be loaded
		imgtexture			// the array itself, i.e the image to be used as texture
	);

	// clean up
	gl.bindTexture(gl.TEXTURE_2D, null);

	return gltexture;
} // note: this function will be moved to the Helper class

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

	// clear everything that was on the screen
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// Tell OpenGL state machine which program should be active.
	gl.useProgram(shader_program);

	// buffer containing indices for drawing with drawElements()
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelEBO);
	
	// texture binding. We choose between the 2 available textures depending on user selection
	if (active_texture == 1) gl.bindTexture(gl.TEXTURE_2D, mytexture1);
	else if (active_texture == 2) gl.bindTexture(gl.TEXTURE_2D, mytexture2);
	else throw ("Invalid active texture on render method.");
	
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

// Listeners for the buttons, we simply change the active texture and re-draw

function clicktexture1(){
	active_texture = 1;
	render();
}

function clicktexture2(){
	active_texture = 2;
	render();
}

// Required Function for SphericalCamera Module //
function onKeyPress(event) {
	SC.keyPress(event); // pass the listener event to the camera
	viewMatrix_value = SC.getViewMatrix(); // obtain the new view matrix from camera
	updateMVP(); // re-generate the MVP matrix and update it
	render(); // draw with the new view
}


