// 
// Cartoon Model, with Phong Shading (per fragment)
// 
var Toon_Phong_fsSource = `

precision mediump float;

struct Light {
	vec3 position;
	vec3 color;
};

struct Material {
	vec3 ka;	// Ambient Reflectivity
	vec3 kd;	// Diffuse Reflectivity
};

varying vec3 fragPosition; // Comes in eye coordinates from the vertex shader
varying vec3 fragNormal; // Comes in eye coordinates from the vertex shader

uniform mat4 viewMatrix;
uniform int toonlevels; // defines how many distinct values will be used in the diffuse calculation. (i.e: how many "brush strokes")

uniform Light light;
uniform Material material;


vec3 calculateToon(Light light) {

	vec3 N = normalize(fragNormal);

	vec3 lightPosition_EyeSpace = vec3(viewMatrix * vec4(light.position, 1.0));
	vec3 L = normalize(lightPosition_EyeSpace - fragPosition);

	float NdotL = max(dot(N, L), 0.0); // as L and N are normalized, NdotL equals the cosine of the angle they form

	float flevels = float(toonlevels); // I must convert it to float to use it or else it won't compile -_-
	float scaleFactor = 1.0 / flevels;
	float toon = floor(NdotL * flevels) * scaleFactor;

	// This stuff adds some sort of specular effect. I don't like it much so it's commented, try it out.
	// vec3 cameraPosition_EyeSpace = vec3(0.0, 0.0, 0.0); // camera is always at 0,0,0 in eye coordinates
	// vec3 V = normalize(cameraPosition_EyeSpace - fragPosition);
	// float VdotN = max(dot(V, N), 0.0);
	// if (VdotN < 0.2) toon = 0.0;

	vec3 ambient = material.ka;
	vec3 diffuse = toon * material.kd;
	// no specular factor in cartoon shading

	return light.color * (ambient +  diffuse);
}


void main() {

	gl_FragColor = vec4(calculateToon(light), 1.0);
}

`