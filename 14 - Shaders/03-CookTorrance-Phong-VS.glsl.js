// 
// Cook & Torrance Lighting Model, with Phong Shading (per fragment)
// 
var CookTorrance_Phong_vsSource = `

precision mediump float;

attribute vec3 vertPosition;
attribute vec3 vertNormal;


void main() {

	gl_Position = vec4(vertPosition, 1.0);
}

`