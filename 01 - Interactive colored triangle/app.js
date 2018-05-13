/*
* Universidad Nacional del Sur
* Computacion Grafica - 2018
*
* Andres Frank
* _____________________________
*
* >> Interactive colored triangle <<
*
*/

// ----- Global Variables ----- //
var gl = null; // The webgl context
var shader_program = null; // Shader program to use.
var triangleEBO = null; // ElementBufferObject
var triangle_indeces_length = 0; // Array length to draw

var color_red_location = null;
var color_green_location = null;
var color_blue_location = null;
var color_red_value = 0.0;
var color_green_value = 0.0;
var color_blue_value = 0.0;

// ----- Vertex Shader ----- //
function getVertexShaderSource() {
	return `
		// an attribute will receive data from a buffer
		attribute vec2 vertPosition; // only x and y coordinates
		
		// Varyings are a way for a vertex shader to pass data to a fragment shader. 
		varying vec3 fragColor;

		// colors
		uniform float vertColorR;
		uniform float vertColorG;
		uniform float vertColorB;

		// all shaders have a main function
		void main() {
		 
		  // gl_Position is a special variable a vertex shader is responsible for setting
		  gl_Position = vec4(vertPosition, 0.0, 1.0); // get x,y coord from vertPos, set z to 0, set omega to 1

		  // we pass to the fragment shader the colors that we received
		  fragColor = vec3(vertColorR, vertColorG, vertColorB);
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
	
	gl.shaderSource(vertex_shader, getVertexShaderSource()); // (shader with type, source code)
	gl.shaderSource(fragment_shader, getFragmentShaderSource());

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
	shader_program = gl.createProgram();
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


	// ----- Create Buffers ----- //

	// -- Create Vertex Buffer Object (VBO): Contains information on positions, colors, textures, etc.
	let triangle_vertices = [
	//	X 		Y 	
		-0.5,	0.5,
		-0.5,	-0.5,
		0.5,	-0.5,
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
		2, // Number of elements per attribute (here is a vec2=[x,y])
		gl.FLOAT, // Type of elements
		gl.FALSE, // whether or not the data should be normalized
		0, // 0 = move forward size * sizeof(type) each iteration to get the next position.
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.enableVertexAttribArray(vertPositionAttribLocation); 
	gl.bindBuffer(gl.ARRAY_BUFFER, null); // Best practices: clean-up.

	// Obtain the location of the uniform items to be used when drawing
	color_red_location = gl.getUniformLocation(shader_program, "vertColorR");
	color_green_location = gl.getUniformLocation(shader_program, "vertColorG");
	color_blue_location = gl.getUniformLocation(shader_program, "vertColorB");

	// -- Create Element Buffer Object (EBO): Contains the indices
	let triangle_indeces = [ 0, 1, 2 ];
	triangle_indeces_length = triangle_indeces.length;

	triangleEBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleEBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle_indeces), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); // Best practices: clean-up.

	
	render();	
}

/*
 * These are the actual drawing processes that should be run on every screen refresh
 * This would be on a loop in a moving scene.
 */
function render() {

	gl.clearColor(0.18, 0.18, 0.18, 1.0); // Background Color (R, G, B, Alpha)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Tell OpenGL state machine which program should be active.
	gl.useProgram(shader_program);
	
	gl.uniform1f(color_red_location, color_red_value);
	gl.uniform1f(color_green_location, color_green_value);
	gl.uniform1f(color_blue_location, color_blue_value);

	// Since we are going to use drawElements, we need to have the index buffer
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleEBO);

	// The type (primitive) here will influence how you set up your indeces array because depending on what type you choose,
	// it will grab the data from the array in different ways.
	//
	// TRIANGLES will grab the vertex specified in the index and join it with following 2 vertices.
	//
	// POINTS; LINES; LINE_LOOP; LINE_STRIP; TRIANGLE_FAN
	gl.drawElements(gl.TRIANGLES, triangle_indeces_length, gl.UNSIGNED_SHORT, 0);
	
	gl.useProgram(null); // Best practices: clean-up.
}

// ---- HTML Elements Listeners ----

function redSlider(slider) {
	color_red_value = parseFloat(slider.value) /100;
	render();
}

function greenSlider(slider) {
	color_green_value = parseFloat(slider.value) /100;
	render();
}

function blueSlider(slider) {
	color_blue_value = parseFloat(slider.value) /100;
	render();
}