// Cook and Torrance Lighting Model, with Phong Shading (per-fragment)

var CookTorrance_Phong_fragmentShaderSource =
`
	precision mediump float;
	#define PI 3.14159265

	struct Material {
		vec3 ka; // Ambient Reflectivity
		vec3 kd; // Diffuse Reflectivity
		vec3 ks; // Specular Reflectivity
		float roughness; // Roughness Factor
		float f; // Fresnel at normal incidence
	};

	struct Light {
		vec3 position;
		vec3 color;
	};

	varying vec3 fragPosition;
	varying vec3 fragPositionModel;
	varying vec3 fragNormal;
	varying vec2 fragTexture;

	uniform Light light, light2;
	uniform Material material;
	uniform mat4 viewMatrix;

	uniform float maxY;
	uniform float minY;

	uniform sampler2D mysampler;
	
	vec3 N;

	vec3 calculateDiffuse(Light mylight){

		vec3 lightPosition_EyeSpace = vec3(viewMatrix * vec4(mylight.position, 1.0)); // Obtain the light pos in eye space coordinates
		vec3 L = normalize(lightPosition_EyeSpace - fragPosition); // Light Vector. Both need to be in same coord space (eye)

		float NdotL = max(dot(N, L), 0.0); // We don't want negative values

		vec3 diffuse = mylight.color * material.kd * NdotL;

		return diffuse;
	}

	vec3 calculateSpecular(Light mylight){

		vec3 lightPosition_EyeSpace = vec3(viewMatrix * vec4(mylight.position, 1.0)); // Obtain the light pos in eye space coordinates
		vec3 L = normalize(lightPosition_EyeSpace - fragPosition); // Light Vector. Both need to be in same coord space (eye)

		float NdotL = max(dot(N, L), 0.0); // We don't want negative values

		vec3 specular = vec3(0.0, 0.0, 0.0); // we start assuming light is not hitting the object


		// Only calculate if light is actually hitting the object.
		if (NdotL > 0.0) {
			// Cook-Torrance calculations for specular component
		
			vec3 cameraPosition_EyeSpace = vec3(0.0, 0.0, 0.0); // In Eye-Space the camera is always located at the origin (0,0,0)
			vec3 V = normalize( cameraPosition_EyeSpace - fragPosition); // View Vector

			vec3 H = normalize(L + V);
			float NdotH = max(dot(N, H), 0.0);
			float NdotV = max(dot(N, V), 0.0);
			float VdotH = max(dot(V, H), 0.0);

			// F: Fresnel (Schlick approximation)
			float F = pow(1.0 - VdotH, 5.0);
			F *= 1.0 - material.f;
			F += material.f;

			// D: Microfacet distribution by Beckmann
			float m_squared = material.roughness * material.roughness;
			float d1 = 1.0 / (4.0 * m_squared * pow(NdotH, 4.0));
			float d2  = (NdotH * NdotH - 1.0) / (m_squared * NdotH * NdotH);
			float D = d1 * exp(d2);

			// G: Geometric shadowing
			float Ge = (2.0 * NdotH * NdotV) / VdotH;
			float Gs = (2.0 * NdotH * NdotL) / VdotH;
			float G = min(1.0, min(Ge, Gs));
			
			float CTFactor = (F * D * G) / (PI * NdotV * NdotL);

			specular = material.ks * CTFactor;
		};

		return specular;
	}




	void main() {

		N = normalize(fragNormal); // normal

		vec3 ambient = mix(light.color, light2.color, 0.5) * material.ka;

		vec3 diffuse_light1 = calculateDiffuse(light);
		vec3 diffuse_light2 = calculateDiffuse(light2);
		vec3 diffuse = mix(diffuse_light1, diffuse_light2, 0.5);

		vec3 specular_light1 = calculateSpecular(light);
		vec3 specular_light2 = calculateSpecular(light2);
		vec3 specular = mix(specular_light1, specular_light2, 0.5);

		vec4 texel = texture2D(mysampler, fragTexture); // Texture handling

		float w = (fragPositionModel.y - minY) / (maxY - minY);
		gl_FragColor = vec4(ambient,1.0) +  mix(vec4(diffuse, 1.0), texel, w) + vec4(specular,1.0);




		// gl_FragColor = vec4(ambient, 1.0) + texel * vec4(diffuse, 1.0) + vec4(specular, 1.0);
		//gl_FragColor = texel * (vec4(ambient,1.0) +  vec4(light.color, 1.0) * vec4(diffuse, 1.0)) + vec4(specular,1.0);
		// gl_FragColor = vec4(fragNormal, 1.0);
	}
`;