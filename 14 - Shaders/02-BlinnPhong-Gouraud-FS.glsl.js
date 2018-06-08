// 
// Blinn Phong Lighting Model, with Gouraud shading (per vertex)
// 
var BlinnPhong_Gouraud_fsSource = `

precision mediump float;

varying vec3 fragColor;

void main() {
	gl_FragColor = vec4(fragColor, 1.0);
}

`