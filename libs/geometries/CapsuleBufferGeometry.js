THREE.CapsuleBufferGeometry = function( Radius, Height, SRadius, H) {

    THREE.BufferGeometry.call( this );

    this.type = 'CapsuleBufferGeometry';

    

    var radius = Radius || 1;
    var height = Height || 1;

    var sRadius = SRadius || 12;
    var sHeight = ~~ sRadius*0.5;// SHeight || 6;
    var h = H || 1;
    var o0 = Math.PI * 2;
    var o1 = Math.PI * 0.5;
    var g = new THREE.Geometry();
    var m0 = new THREE.CylinderGeometry(radius, radius, height, sRadius, h, true);
    var m1 = new THREE.SphereGeometry(radius, sRadius, sHeight, 0, o0, 0, o1);
    var m2 = new THREE.SphereGeometry(radius, sRadius, sHeight, 0, o0, o1, o1);
    var mtx0 = new THREE.Matrix4().makeTranslation(0,0,0);
    var mtx1 = new THREE.Matrix4().makeTranslation(0, height*0.5,0);
    var mtx2 = new THREE.Matrix4().makeTranslation(0, -height*0.5,0);
    g.merge( m0, mtx0);
    g.merge( m1, mtx1);
    g.merge( m2, mtx2);
    g.mergeVertices();

    this.fromGeometry( g );

    /*

    var i, n, n2, n3, face, vertice, uv, uv2, norm;
    var faceVertexUvs = g.faceVertexUvs;

    var hasFaceVertexUv = faceVertexUvs[ 0 ] && faceVertexUvs[ 0 ].length > 0;
    var hasFaceVertexUv2 = faceVertexUvs[ 1 ] && faceVertexUvs[ 1 ].length > 0;

    var v = g.vertices.length;
    var f = g.faces.length;
    var u = g.faceVertexUvs[0].length;

    console.log(v, g.faceVertexUvs[0].length);

    var vertices = new Float32Array( v * 3 );
    var normals = new Float32Array( f * 9 );
    var uvs = new Float32Array( u * 6 );
    //var uvs2 = new Float32Array( v * 2 );

    // get vertice
    i = v;
    while(i--){
        
        n3 = i*3;
        vertice = g.vertices[i]
        vertices[n3] = vertice.x;
        vertices[n3+1] = vertice.y;
        vertices[n3+2] = vertice.z;
    }

    i = u;
    while(i--){
        n = i*6;
        uv = g.faceVertexUvs[0][i];
        uvs[n] = uv[0].x;
        uvs[n+1] = uv[0].y;
        uvs[n+2] = uv[1].x;
        uvs[n+3] = uv[1].y;
        uvs[n+4] = uv[2].x;
        uvs[n+5] = uv[2].y;
    }

    // get indices of faces
    var indices = new ( ( f ) > 65535 ? Uint32Array : Uint16Array )( f * 3 );
    //var normals = new Float32Array( f * 3 );
    i = f;
    while(i--){
        n3 = i*3;
        face = g.faces[i];
        indices[n3] = face.a;
        indices[n3+1] = face.b;
        indices[n3+2] = face.c;

        n=i*9;
        norm = face.vertexNormals;
        normals[n] = norm[0].x;
        normals[n+1] = norm[0].y;
        normals[n+2] = norm[0].z;
        normals[n+3] = norm[1].x;
        normals[n+4] = norm[1].y;
        normals[n+5] = norm[1].z;
        normals[n+6] = norm[2].x;
        normals[n+7] = norm[2].y;
        normals[n+8] = norm[2].z;


        

        //uv2 = g.faceVertexUvs[1][i];
    }

    console.log(g.faces[3]);

    


   
    this.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    this.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
    this.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
     this.setIndex( new THREE.BufferAttribute( indices, 1 ) );
    //this.addAttribute( 'uv2', new THREE.BufferAttribute( uvs, 2 ) )
    //this.computeVertexNormals();
    this.computeBoundingSphere();

    g.dispose();*/

}

THREE.CapsuleBufferGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
THREE.CapsuleBufferGeometry.prototype.constructor = THREE.CapsuleBufferGeometry;