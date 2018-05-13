/**
 * 
 * OBJ Model Parser (modified a bit by Gabi)
 * source code: https://github.com/vorg/geom-parse-obj
 * 
 * Notes:
 * - this parser support multiple meshes in one file via g sections in the OBJ file
 * - we return only vertex data, so no face normals and face tex coords
 * 
 */

class OBJParser2{
    /**
     * Parse an OBJ file
     * this parser support multiple meshes in one file via g sections in the OBJ file
     * we return only vertex data, so no face normals and face tex coords
     * @param  {string} text - UTF8 encoded string with the contents of OBJ file
     * @return {Array of geometry} [geometry, geometry, ...]
     *      geometry = {
     *          name: nombre del grupo de poligonos
     *          positions: [x1, y1, z1, x2, y2, z2, ...], // array of positions
     *          normals: [[x, y, z], [x, y, z], ...], // array of normals. undefined if not.
     *          uvs: [[u, v], [u, v], ...], // array of texture coords. If not has then undefined.
     *          indices: [i1, j1, k1, i2, j2, k2, ...] // array of triangles or polygons (indices)
     *      }
     */
    static parseFile(text) {

        function emptyGroupInfo() {
            return {
                name: "",
                triangleVertices: [],
                hasUVs: false,
                hasNormals: false,
                needsReindexing: false,
                positionOffset: 0,
                uvOffset: 0,
                normalOffset: 0
            };
        }

        var lines = text.trim().split('\n');

        var g = null;

        var groups = [];

        var positions = [];
        var uvs = []; //Array of tex coords [[u, v], [u, v], ...]
        var normals = [];

        for(var i=0, len=lines.length; i<len; i++) {
            var line = lines[i].replace(/[\s]+/, ' ');
            var tokens = line.trim().split(' ');

            //skip commment
            if (tokens[0][0] == '#') continue;

            //skip empty lines
            if (!tokens[0]) continue;

            switch(tokens[0]) {
                //vertices x, y, z
                case 'v':
                    positions.push([ Number(tokens[1]), Number(tokens[2]), Number(tokens[3]) ]);
                    break;
                //vertex tex coords s, t
                //skipping 3rd coordinate even if present
                case 'vt':
                    uvs.push([ Number(tokens[1]), Number(tokens[2]) ]);
                    break;
                //vertex normals
                case 'vn':
                    normals.push([ Number(tokens[1]), Number(tokens[2]), Number(tokens[3]) ]);
                    break;
                //face:  indices v/vt/vn
                case 'f':
                    if (!g) {
                        g = emptyGroupInfo();
                        g.positionOffset = positions.length;
                        g.uvOffset = uvs.length;
                        g.normalOffset = normals.length;
                        groups.push(g);
                    }
                    var vertices = [];
                    for(var j=1; j<tokens.length; j++) {
                        var tokenValues = tokens[j].split('/');
                        var val0 = tokenValues[0];
                        var val1 = tokenValues[1];
                        var val2 = tokenValues[2];
                        tokenValues[0] = (val0 && val0.length > 0) ? Number(val0) : null;
                        tokenValues[1] = (val1 && val1.length > 0) ? Number(val1) : null;
                        tokenValues[2] = (val2 && val2.length > 0) ? Number(val2) : null;
                        vertices.push(tokenValues);
                    }

                    //make a triangle fan (para cuando la cara no es un triangulo)
                    for(var v=1, vertexCount=vertices.length; v<vertexCount-1; v++) {
                        if (vertices[0][1] != undefined) g.hasUVs = true;
                        if (vertices[0][2] != undefined) g.hasNormals = true;

                        g.triangleVertices.push([ vertices[0], vertices[v], vertices[v+1]]);
                    }
                    break;
                //group
                case 'g':
                    g = emptyGroupInfo();
                    g.positionOffset = positions.length;
                    g.uvOffset = uvs.length;
                    g.normalOffset = normals.length;
                    g.name = line.slice(1).trim();
                    groups.push(g);
                    break;
                //skipping material reference
                case 'usemtl':
                    break;
                //skipping material reference
                case 'mtllib':
                    break;
                //skipping smoothing group
                case 's':
                    break;
                //skipping ???
                case 'o':
                    break;
                default:
                    console.log('loadObj: skipping unrecognized line', line);

            }
        }
        var geometries = [];
        for(var i=0, len=groups.length; i<len; i++) {
            var g = groups[i];
            var geom = {
                name: g.name,
                positions: [],
                uvs: g.hasUVs ? [] : undefined,
                normals: g.hasNormals ? [] : undefined,
                //cells: [],
                indices: [],
            };
            geometries.push(geom);

            var vertexIndexMap = [];

            var numVertices = 0;
            var index = 0;
            for(var t=0, triangleCount=g.triangleVertices.length; t<triangleCount; t++) {
                var triangle = g.triangleVertices[t];
                var face = [];
                for(var v=0; v<3; v++) {
                    var hash = triangle[v].join('-');
                    var index = vertexIndexMap[hash]
                    if (index === undefined) {
                        index = numVertices;
                        vertexIndexMap[hash] = index;
                        numVertices++;

                        var pi = triangle[v][0]; //pi: position index
                        pi = (pi > 0) ? (pi - 1) : (g.positionOffset + pi); //el pi-1 es porque las posiciones para los indices arrancan en 1 y los arreglos en 0.

                        var ti = triangle[v][1]; //ti: texture index
                        ti = (ti > 0) ? (ti - 1) : (g.uvOffset + ti );

                        var ni = triangle[v][2]; //ni: normal index
                        ni = (ni > 0) ? (ni - 1) : (g.normalOffset + ni);

                        //geom.positions[index] = positions[pi];
                        let aux = positions[pi]; //aux = [x,y,z]
                        geom.positions.push(aux[0]);
                        geom.positions.push(aux[1]);
                        geom.positions.push(aux[2]);
                        
                        if (g.hasUVs) geom.uvs[index] = uvs[ti];
                        if (g.hasNormals) geom.normals[index] = normals[ni];
                    }

                    face.push(index);

                }
                //geom.cells.push(face);
                /***/
                geom.indices.push(face[0]);
                geom.indices.push(face[1]);
                geom.indices.push(face[2]);
                
            }
        } 
        return geometries;
       
    };
}

