// 
// Blinn Phong Lighting Model, with Gouraud shading (per vertex)
// 
var BlinnPhong_Gouraud_vsSource = `

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

attribute vec3 vertPosition;
attribute vec3 vertNormal;

varying vec3 fragColor;

uniform Material material;
uniform Light light;

uniform mat3 normalMatrix; // inverse transpose of the MV matrix
uniform mat4 viewMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelViewProjectionMatrix;

vec3 normal_EyeCoord; // vertNormal in Eye Space
vec3 position_EyeCoord; // vertPosition in Eye Space

vec3 calculateBlinnPhong(Light light) {
	
	vec3 N = normalize(normal_EyeCoord);
	
	vec3 lightPosition_EyeCoord = vec3(viewMatrix * vec4(light.position, 1.0));
	vec3 L = normalize(lightPosition_EyeCoord - position_EyeCoord);
	
	vec3 cameraPosition_EyeCoord = vec3(0.0, 0.0, 0.0); // Camera in eye coordinates is always at (0,0,0)
	vec3 V = normalize(cameraPosition_EyeCoord - position_EyeCoord); // View or Camera vector

	// Blinn's addition, the Halfway vector, between the eye and the light vectors. Replaces the more expensive to compute R vector.
	vec3 H = normalize(L + V);
 
	float NdotL = max(dot(N, L), 0.0);
	float NdotH = max(dot(N, H), 0.0);

	// Attenuation Factor (based on light distance)
	float a = 0.1;
	float b = 0.01;
	float c = 0.001;
	float d = distance(position_EyeCoord, lightPosition_EyeCoord);
	float att = 1.0 / (a + b*d + c*d*d);

	vec3 ambient = material.ka;
	vec3 diffuse = material.kd * NdotL;
	vec3 specular = material.ks * pow(NdotH, material.sf);

	if (NdotL == 0.0) specular = vec3(0.0, 0.0, 0.0); // if the light is opposite to the model we don't show it

	return  ambient + light.color * att * (diffuse + specular);
}

void main() {

	normal_EyeCoord = normalMatrix * vertNormal;
	position_EyeCoord = vec3(modelViewMatrix * vec4(vertPosition, 1.0));

	fragColor = calculateBlinnPhong(light);
	gl_Position = modelViewProjectionMatrix * vec4(vertPosition, 1.0);

}








`