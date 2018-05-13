class OBJModel {

	constructor(objectSource) {
		this.source = objectSource;
		this.vao = null;
		this.indexCount = 0;
	}

	generateModel() {

		let parsedOBJ = OBJParser.parseFile(this.source);
		let indices = parsedOBJ.indices;
		this.indexCount = indices.length;
		let positions = parsedOBJ.positions;
		let normals = parsedOBJ.normals;
	
		let vboPosition = createVBO(positions, 'vertPosition', 3);
		let vboNormal = createVBO(normals, 'vertNormal', 3);
		let ebo = createEBO(indices);
	
		parsedOBJ = null;
	}

	static createVBO(data, attribName, attribSize){
		let vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW); 

		let attrib_location = gl.getAttribLocation(shader_program, attribName);
		gl.vertexAttribPointer(
			attrib_location, // Attribute location
			attribSize, // Number of elements per attribute
			gl.FLOAT, // Type of elements
			gl.FALSE, // whether or not the data should be normalized
			0, // 0 = move forward size * sizeof(type) each iteration to get the next position.
			0 // Offset from the beginning of a single vertex to this attribute
		);
		gl.enableVertexAttribArray(attrib_location); 

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		return vbo;
	}

	static createEBO(indices) {
		let ebo = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		return ebo;
	}

	draw(gl) {


		gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0);	
		
	}

}