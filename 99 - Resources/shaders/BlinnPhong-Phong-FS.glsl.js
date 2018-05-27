// Blinn Phong Lighting Model, with Phong Shading (per-fragment)
var BlinnPhongPhong_fragmentShaderSource =
`
	precision mediump float;

	struct Material {
		vec3 ka; // Ambient Reflectivity
		vec3 kd; // Diffuse Reflectivity
		vec3 ks; // Specular Reflectivity
		float sf; // Specular Shininess Factor
	};

	struct Light {
		vec3 position;
		vec3 intensity;
	};

	varying vec3 fragPosition; // Comes from the vertex shader in eye-coordinates
	varying vec3 fragNormal; // Comes from the vertex shader in eye-coordinates

	uniform Light light;
	uniform Material material;
	uniform mat4 viewMatrix;
	
	vec3 blinnPhongLightingModel() {

		vec3 N = normalize(fragNormal); // normal

		vec3 lightPosition_EyeSpace = vec3(viewMatrix * vec4(light.position, 1.0)); // Obtain the light pos in eye space coordinates
		vec3 L = normalize(lightPosition_EyeSpace - fragPosition); // Light Vector. Both need to be in same coord space (eye)
		
		vec3 cameraPosition_EyeSpace = vec3(0.0, 0.0, 0.0); // In Eye-Space the camera is always located at the origin (0,0,0)
		vec3 V = normalize( cameraPosition_EyeSpace - fragPosition); // View Vector

		// Blinn's addition, the Halfway vector, between the eye and the light vectors.
		vec3 H = normalize( (L + (cameraPosition_EyeSpace - fragPosition) ) / 2.0 ); 

		// R vector gets replaced by the H vector which is much faster to compute
		// vec3 R = reflect(-L, N); // calculates the reflected vector based on the normal.
		// float RdotV = max(dot(R, V), 0.0);
		// vec3 specular2 = material.ks * pow(RdotV, material.sf);

		float LdotN = max(dot(L, N), 0.0); // We don't want negative values
		float NdotH = max(dot(N, H), 0.0); 

		vec3 ambient = material.ka;
		vec3 diffuse = material.kd * LdotN;
		vec3 specular = material.ks * pow(NdotH, material.sf);

		if (LdotN <= 0.0) specular = vec3(0.0, 0.0, 0.0); // if the light is opposite to the model we don't show it

		return ambient + diffuse + specular;
	}

	void main() {
		gl_FragColor = vec4(blinnPhongLightingModel(), 1.0);
		// gl_FragColor = vec4(fragNormal, 1.0);
	}
`;