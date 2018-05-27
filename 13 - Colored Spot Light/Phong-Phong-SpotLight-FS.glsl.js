// Phong Lighting Model, with Phong Shading
var PhongPhong_SpotLight_fragmentShaderSource =
`
	precision mediump float;

	struct Material {
		vec3 ka; // Ambient Reflectivity
		vec3 kd; // Diffuse Reflectivity
		vec3 ks; // Specular Reflectivity
		float sf; // Specular Shininess Factor
	};

	struct SpotLight {
		vec3 position; // Pos in eye coordinates
		vec3 direction; // normalized direction of the spotlight
		vec3 color;
		float cutOffAngle; // cutoff angle - between 0º and PI/2 (90º in radians)
		float angularAttenuation; // attenuation exponent
	};

	varying vec3 fragPosition;
	varying vec3 fragNormal;
	varying vec2 fragTexture;

	uniform SpotLight light;
	uniform Material material;
	uniform mat4 viewMatrix;

	uniform sampler2D mysampler;
	

	vec3 calculateSpotLighting(SpotLight light){

		vec3 N = normalize(fragNormal); // normal
		
		vec3 lightPosition_EyeSpace = vec3(viewMatrix * vec4(light.position, 1.0)); // Obtain the light pos in eye space coordinates
		vec3 L = normalize(lightPosition_EyeSpace - fragPosition); // Light Vector. Both need to be in same coord space (eye)

		vec3 R = reflect(-L, N); // calculates the reflected vector based on the normal. We need -L because L points outwards, and we need it to point to the position

		vec3 cameraPosition_EyeSpace = vec3(0.0, 0.0, 0.0); // In Eye-Space the camera is always located at the origin (0,0,0)
		vec3 V = normalize( cameraPosition_EyeSpace - fragPosition); // View Vector

		vec3 lightDirection_EyeSpace = vec3(viewMatrix * vec4(light.direction, 1.0));
		vec3 D = normalize(lightDirection_EyeSpace); // Direction Vector

		float LdotN = max(dot(L, N), 0.0); // We don't want negative values
		float RdotV = max(dot(R, V), 0.0); 
		float LdotD = max(dot(-L, D), 0.0);	// -L so it points in the same direction as D (coming off the light source)

		float angle = acos(LdotD);
		float mapToCutOff = radians(90.0) / light.cutOffAngle; // mapping from [0, cutOff] to [0, 90], so that at the border cos(90) = 0
		float angularAttenuationFactor = pow(cos(angle * mapToCutOff), light.angularAttenuation);
		bool insideSpot = angle < light.cutOffAngle;

		vec3 ambient = material.ka;
		vec3 diffuse = vec3(0.0, 0.0, 0.0);
		vec3 specular = vec3(0.0, 0.0, 0.0);

		if (insideSpot) {
			diffuse = material.kd * LdotN;
			diffuse *= light.color;
			specular = material.ks * pow(RdotV, material.sf);
			specular *= light.color;
		}

		return ambient + angularAttenuationFactor * (diffuse + specular);
	}

	void main() {

		// Texture handling
		vec3 texel = texture2D(mysampler, fragTexture).rgb; 
		
		//gl_FragColor = vec4(texel * (ambient + att * light.color * (diffuse + specular)), 1.0);

		gl_FragColor = vec4(texel * calculateSpotLighting(light), 1.0);

		// gl_FragColor = texel * (vec4(ambient,1.0) +  att * (vec4(diffuse, 1.0)) + vec4(specular,1.0));
		// gl_FragColor = vec4(ambient,1.0) +  mix(vec4(diffuse, 1.0), texel, 0.5) + vec4(specular,1.0);
		// gl_FragColor = vec4(fragNormal, 1.0);
	}
`;