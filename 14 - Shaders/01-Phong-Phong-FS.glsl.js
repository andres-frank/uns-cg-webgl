// 
// Phong Lighting Model, with Phong Shading (per fragment)
// 
var Phong_Phong_fsSource = `

precision mediump float;

struct Light {
	vec3 position;
	vec3 color;
};

struct Material {
	vec3 ka;	// Ambient Reflectivity
	vec3 kd;	// Diffuse Reflectivity
	vec3 ks;	// Specular Reflectivity
	float sf;	// Specular Shininess Factor
};

varying vec3 fragPosition; // Comes in eye coordinates from the vertex shader
varying vec3 fragNormal; // Comes in eye coordinates from the vertex shader

uniform Material material;
uniform Light light;

uniform mat4 viewMatrix;


vec3 calculatePhong(Light light) {

	vec3 N = normalize(fragNormal);
	
	vec3 lightPosition_EyeCoord = vec3(viewMatrix * vec4(light.position, 1.0));
	vec3 L = normalize(lightPosition_EyeCoord - fragPosition);
	 
	// calculates the reflected vector based on the normal. We need -L because L points outwards, and we need it to point to the position
	vec3 R = reflect(-L, N);

	vec3 cameraPosition_EyeCoord = vec3(0.0, 0.0, 0.0); // Camera in eye coordinates is always at (0,0,0)
	vec3 V = normalize(cameraPosition_EyeCoord - fragPosition); // View or Camera vector
 
	float NdotL = max(dot(N, L), 0.0);
	float RdotV = max(dot(R, V), 0.0);

	// Attenuation Factor (based on light distance)
	float a = 0.1;
	float b = 0.01;
	float c = 0.001;
	float d = distance(fragPosition, lightPosition_EyeCoord);
	float att = 1.0 / (a + b*d + c*d*d);

	vec3 ambient = material.ka;
	vec3 diffuse = material.kd * NdotL;
	vec3 specular = material.ks * pow(RdotV, material.sf);

	if (NdotL == 0.0) specular = vec3(0.0, 0.0, 0.0); // if the light is opposite to the model we don't show it

	return ambient + light.color * att * (diffuse + specular);
}

void main() {

	gl_FragColor = vec4(calculatePhong(light), 1.0);

}

`