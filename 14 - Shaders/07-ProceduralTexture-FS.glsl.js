// 
// Calculate texture via a function instead of an image.
// 
var ProceduralTexture_fsSource = `

precision mediump float;

varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec2 fragTexture;

uniform mat4 viewMatrix;

float calculateProceduralTexture(vec2 textCoord) {
	float s = textCoord.x;
	float t = textCoord.y;

	float r = sqrt((s - 0.5) * (s - 0.5) + (t - 0.5) * (t - 0.5));

	if (r <= 0.3)
		return 1.0 - r/0.3;
	else 
		return 0.2; // background
}


void main() {

	float texel = calculateProceduralTexture(fragTexture);

	gl_FragColor = vec4(texel * fragNormal, 1.0);
}

`