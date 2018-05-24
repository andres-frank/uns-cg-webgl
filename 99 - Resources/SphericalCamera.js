/**
 * [---- Spherical Camera Module -----]
 * Computacion Grafica 2018
 * @author Andres Frank
 *
 * ____________________________________________________________
 * 				# #   H O W   T O   U S E   #  #
 * ____________________________________________________________
 * ### Requirements ###
 * 
 * #### In your index.html file:
 * You need to define a new table element inside your body tag with id="camera_table". 
 * Also, you need to add a keyboard listener on the body tag that calls onKeyPress();
 * 
 * Basic example:
 * 
 *  <html>
 *  	<head>
 *  		<script src="../99 - Resources/gl-matrix-min.js"></script>
 *  		<script src="../99 - Resources/SphericalCamera.js"></script>
 *  		<script src="app.js"></script>
 *  	</head>
 *  	
 *  	<body onload="onLoad();" onkeypress="onKeyPress(event);">
 *  		<canvas id="webglcanvas" width="500" height="500" ></canvas>
 *  		<table id="camera_table" cellpadding="3" border="2"></table> 
 *  	</body>
 *  </html>
 *
 * 
 * #### In your app.js source code:
 * You need to define a function called "onKeyPress()", that receives the event generated
 * by the HTML Listener and then passes it to this class so it can use it.
 * Basic Example:
 * 		function onKeyPress(event){
 * 			SC.keyPress(event);
 * 		}
 *
 * ____________________________________________________________
 * ### Usage ###
 * 
 * 1. Create a new SphericalCamera object. 
 * SC = new SphericalCamera();
 *
 * 2. Define your viewMatrix as usual, get its value from the SC object, pass it to the shader.
 * viewMatrix_location = gl.getUniformLocation(shader_program, 'viewM');
 * viewMatrix_value = SC.getViewMatrix();
 * gl.uniformMatrix4fv(viewMatrix_location, gl.FALSE, viewMatrix_value);
 * 
 * 3. Define the onKeyPress() function as was explained before, and you will probably want
 * to get the latest viewMatrix after it gets updated on the Camera, and then call your
 * render method.
 *  
 * Basic Example:
 * function onKeyPress(event){
 * 		SC.keyPress(event);
 * 		viewMatrix_value = SC.getViewMatrix();
 * 		render();
 * }
 *
 * 3. That's it!
 * You will end up with a new table in your HTMl that shows all the camera information, and
 * every time a key is pressed the view matrix gets updated, so you can get it and pass it along.
 * 
 * 
 */

// requires gl-matrix

class SphericalCamera {

	constructor() {
		
		// Check if the app is implementing the onKeyPress() function as is required
		if ( typeof onKeyPress != 'function' ) 
        	throw `* ERROR (Spherical Camera Module) *\n
        	You need to define the onKeyPress() function for the camera module to work.\n
        	See SphericalCamera.js for more information.\n`
		
		// default (starting) camera values
		this.camera_radius = 5;
		this.camera_theta = 33;//degrees
		this.camera_phi = 60;//degrees
		this.camera_target = [0, 0, 0];

		// how much to move in each key press
		this.RADIUS_STEP = 0.5;
		this.THETA_STEP = 6;
		this.PHI_STEP = 6;
	
		this.generateHTML();
	
		// initialize the ViewMatrix and update it with the default values
		this.viewMatrix = mat4.create();
		this.updateCamera();
	}
	
	/**
	 * Creates the HTML table where all the information of the Camera will be displayed
	 */
	generateHTML() {
		// obtain the table. 
		let mytable = document.getElementById("camera_table");
	
		// if the table element was not defined in the index.html file, we cannot continue
		if (!mytable) {
			throw `* ERROR (Spherical Camera Module) *\n
			You need to define an html table element with id='camera_table' for the camera module to work.\n
			See SphericalCamera.js for more information.\n`
		}
	
		mytable.innerHTML = `
			<tr><th>Param</th><th>Control</th><th>Value</th></tr>
			<tr>
				<td>Radius</td>
				<td>Press Q or E keys</td>
				<td id='lblRadius' align="center"></td>
			</tr>
			<tr>
				<td>Theta angle</td>
				<td>Press A or D keys</td>
				<td id='lblTheta' align="center"></td>
			</tr>
			<tr>
				<td>Phi angle</td>
				<td>Press W or S keys</td>
				<td id="lblPhi" align="center"></td>
			</tr>
			<tr>
				<td>Camera Target</td>
				<td>Fixed</td>
				<td id="lblTarget" align="center"></td>
			</tr>
		`;
	
		// Update the HTML tags with the default values.
		document.getElementById("lblRadius").innerText = this.camera_radius;
		document.getElementById("lblTheta").innerText = this.camera_theta;
		document.getElementById("lblPhi").innerText = this.camera_phi;
		document.getElementById("lblTarget").innerText = "[ "+this.camera_target+" ]";
	
	}
	
	/**
	 * Generates the viewMatrix based on the values stored in this Class
	 */
	updateCamera() {
		let _camera_eye = this.toCartesianArray(this.camera_radius, this.camera_theta, this.camera_phi);
	
		mat4.lookAt(
			this.viewMatrix, 	// Where to store the resulting matrix
			_camera_eye, 		// Eye: Where is the camera
			this.camera_target, // Target: Where is it looking
			[0, 1, 0] 			// UP: Which side is up (here the Y+ coord means up)
		);
	}
	
	/**
	 * Goes from spherical coordinates [r,theta,phi] into cartesians [x,y,z]
	 * params theta and phi are in degrees
	 * @return {3-component vector} A vector containing the X, Y and Z coordinates in cartesian form.
	 */
	toCartesianArray(radius, theta, phi) {
		let _theta = glMatrix.toRadian(theta);
		let _phi = glMatrix.toRadian(phi);
	
		let x = radius * Math.sin(_phi) * Math.cos(_theta);
		let z = radius * Math.sin(_phi) * Math.sin(_theta);
		let y = radius * Math.cos(_phi);
		
		return [x, y, z];
	}
	
	/**
	 * HTML Keyboard listener
	 * @param  evt: the event generated by the HTML
	 */
	keyPress(evt) {
		var aux;

		switch(evt.code) {
			case "KeyQ":
				if (this.camera_radius < 10) { // limit of where the camera can move
					this.camera_radius += this.RADIUS_STEP;
					document.getElementById("lblRadius").innerText = this.camera_radius;
				}
				break;
	
			case "KeyE":
				if (this.camera_radius > 1) {
					this.camera_radius -= this.RADIUS_STEP;
					document.getElementById("lblRadius").innerText = this.camera_radius;
				}
				break;
	
			case "KeyD":
				this.camera_theta = (this.camera_theta + this.THETA_STEP) % 360
				document.getElementById("lblTheta").innerText = this.camera_theta;
				break;
	
			case "KeyA":
				this.camera_theta = (this.camera_theta - this.THETA_STEP) % 360
				document.getElementById("lblTheta").innerText = this.camera_theta;
				break;
	
			case "KeyW":
				aux = this.camera_phi + this.PHI_STEP;
				if (aux <= 180) this.camera_phi = aux;
				document.getElementById("lblPhi").innerText = this.camera_phi;
				break;
	
			case "KeyS":
				aux = this.camera_phi - this.PHI_STEP;
				if (aux >= 1) this.camera_phi = aux;
				document.getElementById("lblPhi").innerText = this.camera_phi;
				break;
		}
	
		this.updateCamera();
	}
	
	
	// Setters and Getters
	
	getViewMatrix() {
		return this.viewMatrix;
	}
	
	setCameraTarget(x, y, z) {
		// Set the new target
		this.camera_target = [x, y, z];
		// Update the label
		document.getElementById("lblTarget").innerText = "[ "+this.camera_target+" ]";
		// Re-generate the viewMatrix with the new value
		this.updateCamera();
	}

	setCameraPosition(radius, theta, phi) {
		this.camera_radius = radius;
		this.camera_theta = theta;
		this.camera_phi = phi;

		document.getElementById("lblRadius").innerText = this.camera_radius;
		document.getElementById("lblTheta").innerText = this.camera_theta;
		document.getElementById("lblPhi").innerText = this.camera_phi;
		
		this.updateCamera();
	}
}
