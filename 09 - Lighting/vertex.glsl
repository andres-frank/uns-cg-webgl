/**
* Example Vertex Shader
* Sets the position of the vertex by setting gl_Position
*/

// Set the precision for data types used in this shader
precision highp float;
precision highp int;

// Default THREE.js uniforms available to both fragment and vertex shader
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;

uniform vec3 colorka; 
uniform vec3 kd; 
uniform vec3 ks;
uniform float CoefEsp; 
uniform vec3 lightPosition;

// Default uniforms provided by ShaderFrog.


// Default attributes provided by THREE.js. Attributes are only available in the
// vertex shader. You can pass them to the fragment shader using varyings
attribute vec3 position;
attribute vec3 normal;


varying vec3 color;


void main() {
    
    // transformar posición de los vert de entrada del EO al EClipping   
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    // transf posición de los vértices de entrada del Esp.obj al Esp.ojo(vE)  
    vec3 vE =  vec3(modelViewMatrix * vec4(position,1.0));
    vec3 lightPosition =  vec3(modelViewMatrix * vec4(lightPosition, 1.0));
    
    // Calc. vector luz en Esp. ojo   
    //vec3 vLE = vec3(lightPosition – vE);    
    vec3 L = normalize(lightPosition - vE);    
    vec3 N = normalize(normalMatrix * normal);   
    vec3 H = normalize(L + vE);   
    
    // Calc térm difuso+espec de Blinn-Phong  
    float difuso = max(dot(L,N), 0.0); 
    float specBlinnPhong = pow(max(dot(N, H), 0.0), CoefEsp);
    if (dot(L,N) < 0.0) {   
        specBlinnPhong = 0.0;  
    }
    color = colorka + kd * difuso + ks * specBlinnPhong; 
 

}