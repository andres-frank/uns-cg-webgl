// 
// Phong Lighting Model but the borders of the model are colored, giving it a "drawing" look
// 
var Border_Phong_fsSource = `

precision mediump float;

struct Light {
	vec3 position;
	vec3 color;
};

struct Material {
	vec3 ka;
	vec3 kd;
	vec3 borderColor;
};

varying vec3 fragPosition; // Comes in eye coordinates from the vertex shader
varying vec3 fragNormal; // Comes in eye coordinates from the vertex shader

uniform Light light;
uniform Material material;

uniform mat4 viewMatrix;


vec3 calculateDiffuseBorder(Light light) {

	vec3 N = normalize(fragNormal);

	vec3 cameraPosition_EyeSpace = vec3(0.0, 0.0, 0.0);
	vec3 V = normalize(cameraPosition_EyeSpace - fragPosition);

	vec3 lightPosition_EyeSpace = vec3(viewMatrix * vec4(light.position, 1.0));
	vec3 L = lightPosition_EyeSpace - fragPosition;

	float NdotL = max(dot(N, L), 0.0);

	vec3 diffuse = light.color * NdotL * material.kd;

	// Up until this point it's basic Phong. This is the actual border magic:
	// If the angle with the Normal is close to 90º it means it's a border.
	float NdotV = dot(N, V);
	if (NdotV < 0.3) diffuse = material.borderColor;

	return diffuse;
}


void main() {

	vec3 ambient = material.ka;
	vec3 diffuse = calculateDiffuseBorder(light);

	gl_FragColor = vec4(ambient + diffuse, 1.0);
}

`