// 
// Ward Lighting Model, with Phong Shading (per fragment)
// 
var Ward_Phong_fsSource = `

precision mediump float;

struct Material {
	vec3 ka;
	vec3 kd;
	float alphaX;
	float alphaY;
};

struct Light {
	vec3 position;
	vec3 color;
};

varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec3 fragTangent;
varying vec3 fragBitangent;

uniform Material material;
uniform Light light;

uniform mat4 viewMatrix;


vec3 calculateWard(Light light) {

	vec3 N = normalize(fragNormal);

	vec3 lightPosition_EyeSpace = vec3(viewMatrix * vec4(light.position, 1.0));
	vec3 L = lightPosition_EyeSpace - fragPosition;

	vec3 cameraPosition_EyeSpace = vec3(0.0, 0.0, 0.0);
	vec3 V = cameraPosition_EyeSpace - fragPosition;

	float LdotN = max(dot(L, N), 0.0);

	vec3 ambient = material.ka;
	vec3 diffuse = material.kd * LdotN * light.color;
	vec3 specular = vec3(0.0, 0.0, 0.0);

	if (LdotN > 0.0) {
		
		vec3 H = normalize(L + V);
		vec3 T = normalize(fragTangent);
		vec3 B = normalize(fragBitangent);

		float HdotT = max(dot(H, T), 0.0);
		float HdotB = max(dot(H, B), 0.0);
		float HdotN = max(dot(H, N), 0.0);
		float VdotN = max(dot(V, N), 0.0);

		float W; // Ward model equation
		W = -2.0 * ((HdotT/material.alphaX) * (HdotT/material.alphaX) + (HdotB/material.alphaY) * (HdotB/material.alphaY));
		W /= 1.0 + HdotN;
		W = exp(W);
		W *= 1.0/sqrt(LdotN * VdotN);
		W *= 1.0/(4.0 * 3.14159265 * material.alphaX * material.alphaY);

		specular = light.color * W * LdotN;
	}

	return ambient + diffuse + specular;
}

void main() {

	gl_FragColor = vec4(calculateWard(light), 1.0);
}

`