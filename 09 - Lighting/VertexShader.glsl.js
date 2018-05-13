var vertexShaderSource =
`
	// an attribute will receive data from a buffer
	attribute vec3 vertPosition; // [x, y, z] coordinates
	attribute vec3 vertNormal;
	
	uniform mat4 MVP;
	uniform mat4 MV;

	uniform vec3 ka; 
	uniform vec3 kd; 
	uniform vec3 ks;
	uniform vec3 lightPosition;
	uniform float CoefEsp; 

	varying vec3 color;

	void main() {

		// Transform the input vertices from Object Space to Clipping Space
		gl_Position = MVP * vec4(vertPosition, 1.0);
		
		//color = vertNormal;
		color = (MV * vec4(vertNormal, 0.0)).xyz;


		/*

		// transformar posición de los vert de entrada del EO al EClipping   
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		
		// transf posición de los vértices de entrada del Esp.obj al Esp.ojo(vE)  
		vec3 vE =  vec3(modelViewMatrix * vec4(position,1.0));
		vec3 lightPosition =  vec3(modelViewMatrix * vec4(lightPosition, 1.0));
		
		// Calc. vector luz en Esp. ojo   
		//vec3 vLE = vec3(lightPosition - vE);    
		vec3 L = normalize(lightPosition - vE);    
		vec3 N = normalize(normalMatrix * normal);   
		vec3 H = normalize(L + vE);   
		
		// Calc térm difuso+espec de Blinn-Phong  
		float difuso = max(dot(L,N), 0.0); 
		float specBlinnPhong = pow(max(dot(N, H), 0.0), CoefEsp);
		if (dot(L,N) < 0.0) {   
		    specBlinnPhong = 0.0;  
		}
		color = ka + kd * difuso + ks * specBlinnPhong; 

		*/

	}
`;
