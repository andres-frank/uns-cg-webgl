// Phong Lighting Model, with Phong Shading
var PhongPhong_fragmentShaderSource =
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

	varying vec3 fragPosition;
	varying vec3 fragNormal;

	uniform Light light;
	uniform Material material;
	uniform mat4 viewMatrix;
	
	vec3 phongLightingModel() {

		vec3 N = normalize(fragNormal); // normal

		vec3 lightPosition_EyeSpace = vec3(viewMatrix * vec4(light.position, 1.0)); // Obtain the light pos in eye space coordinates
		vec3 L = normalize(lightPosition_EyeSpace - fragPosition); // Light Vector. Both need to be in same coord space (eye)
		
		vec3 R = reflect(-L, N); // calculates the reflected vector based on the normal. We need -L because L points outwards, and we need it to point to the position
		
		vec3 cameraPosition_EyeSpace = vec3(0.0, 0.0, 0.0); // In Eye-Space the camera is always located at the origin (0,0,0)
		vec3 V = normalize( cameraPosition_EyeSpace - fragPosition); // View Vector

		float LdotN = max(dot(L, N), 0.0); // We don't want negative values
		float RdotV = max(dot(R, V), 0.0); 

		vec3 ambient = material.ka;
		vec3 diffuse = material.kd * LdotN;
		vec3 specular = material.ks * pow(RdotV, material.sf);

		if (LdotN <= 0.0) specular = vec3(0.0, 0.0, 0.0); // if the light is opposite to the model we don't show it

		return ambient + diffuse + specular;
	}

	void main() {
		gl_FragColor = vec4(phongLightingModel(), 1.0);
		// gl_FragColor = vec4(fragNormal, 1.0);
	}
`;