view.getSofts = function(){

        return softs;

};

view.softStep = function(){

    if( !softs.length ) return;

    var softPoints = 0;

    softs.forEach( function( b, id ) {

        var n, c, cc, p, j, k;

        var t = b.softType; // type of softBody
        var order = null;
        var isWithColor = b.geometry.attributes.color ? true : false;
        var isWithNormal = b.geometry.attributes.normal ? true : false;

        p = b.geometry.attributes.position.array;
        if(isWithColor) c = b.geometry.attributes.color.array;

        if( t == 5 || t == 4 ){ // softTriMesh // softConvex

            var max = b.geometry.numVertices;
            var maxi = b.geometry.maxi;
            var pPoint = b.geometry.pPoint;
            var lPoint = b.geometry.lPoint;

            j = max;
            while(j--){
                n = (j*3) + softPoints;
                if( j == max-1 ) k = maxi - pPoint[j];
                else k = pPoint[j+1] - pPoint[j];
                var d = pPoint[j];
                while(k--){
                    var id = lPoint[d+k]*3;
                    p[id] = Sr[n];
                    p[id+1] = Sr[n+1]; 
                    p[id+2] = Sr[n+2];
                }
            }

        }else{


            if( b.geometry.attributes.order ) order = b.geometry.attributes.order.array;
            //if( m.geometry.attributes.same ) same = m.geometry.attributes.same.array;
            j = p.length;

            n = 2;

            if( order !== null ) {

                j = order.length;
                while(j--){
                    k = order[j] * 3;
                    n = j*3 + softPoints;
                    p[k] = Sr[n];
                    p[k+1] = Sr[n+1];
                    p[k+2] = Sr[n+2];

                    cc = Math.abs(Sr[n+1]/10);
                    c[k] = cc;
                    c[k+1] = cc;
                    c[k+2] = cc;
                }

            } else {
                 while(j--){
                     
                    p[j] = Sr[j+softPoints];
                    if(n==1){ 
                        cc = Math.abs(p[j]/10);
                        c[j-1] = cc;
                        c[j] = cc;
                        c[j+1] = cc;
                    }
                    n--;
                    n = n<0 ? 2 : n;
                }

            }

        }

        if(t!==2) b.geometry.computeVertexNormals();

        b.geometry.attributes.position.needsUpdate = true;

        if(isWithNormal){

            var norm = b.geometry.attributes.normal.array;

            j = max;
            while(j--){
                if( j == max-1 ) k = maxi - pPoint[j];
                else k = pPoint[j+1] - pPoint[j];
                var d = pPoint[j];
                var ref = lPoint[d]*3;
                while(k--){
                    var id = lPoint[d+k]*3;
                    norm[id] = norm[ref];
                    norm[id+1] = norm[ref+1]; 
                    norm[id+2] = norm[ref+2];
                }
            }

            b.geometry.attributes.normal.needsUpdate = true;
        }

        if(isWithColor) b.geometry.attributes.color.needsUpdate = true;
        
        b.geometry.computeBoundingSphere();

        if( t == 5 ) softPoints += b.geometry.numVertices * 3;
        else softPoints += p.length;
    });

};


//--------------------------------------
//   SOFT TRI MESH
//--------------------------------------

view.softTriMesh = function ( o ) {

    //console.log(o.shape)

    //if(o.shape.bones) 

    var g = o.shape.clone();
    var pos = o.pos || [0,0,0];
    var size = o.size || [1,1,1];
    var rot = o.rot || [0,0,0];

    g.translate( pos[0], pos[1], pos[2] );
    g.scale( size[0], size[1], size[2] );

    //g.rotateX( rot[0] *= Math.degtorad );
    //g.rotateY( rot[1] *= Math.degtorad );
    //g.rotateZ( rot[2] *= Math.degtorad );
    g.applyMatrix( new THREE.Matrix4().makeRotationY(rot[1] *= Math.torad ));

    
    

    //console.log('start', g.getIndex().count);

    view.prepaGeometry( g );

    extraGeo.push( g );

    //console.log('mid', g.realIndices.length);

    // extra color
    /*var color = new Float32Array( g.maxi*3 );
    var i = g.maxi*3;
    while(i--){
        color[i] = 1;
    }
    g.addAttribute( 'color', new THREE.BufferAttribute( color, 3 ) );*/

    o.v = g.realVertices;
    o.i = g.realIndices;
    o.ntri = g.numFaces;

    var material = o.material === undefined ? mat.cloth : mat[o.material];
    var mesh = new THREE.Mesh( g, material );

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    mesh.softType = 5;

    scene.add( mesh );
    softs.push( mesh );

    if( o.shape ) delete(o.shape);
    if( o.material ) delete(o.material);

    // send to worker
    ammo.send( 'add', o );
    
}

//--------------------------------------
//   SOFT CONVEX
//--------------------------------------

view.softConvex = function ( o ) {

    var g = o.shape;
    var pos = o.pos || [0,0,0];

    g.translate( pos[0], pos[1], pos[2] );

    view.prepaGeometry(g);

    o.v = g.realVertices;

    var mesh = new THREE.Mesh( g, mat.cloth );
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    mesh.softType = 4;

    scene.add( mesh );
    softs.push( mesh );

    // send to worker
    ammo.send( 'add', o );

}

//--------------------------------------
//   CLOTH
//--------------------------------------

view.cloth = function ( o ) {

    var i, x, y, n;

    var div = o.div || [16,16];
    var size = o.size || [100,0,100];
    var pos = o.pos || [0,0,0];

    var max = div[0] * div[1];

    var g = new THREE.PlaneBufferGeometry( size[0], size[2], div[0] - 1, div[1] - 1 );
    g.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( max*3 ), 3 ) );
    g.rotateX( -Math.PI90 );
    //g.translate( -size[0]*0.5, 0, -size[2]*0.5 );

    var numVerts = g.attributes.position.array.length / 3;

    var mesh = new THREE.Mesh( g, mat.cloth );

    this.setName( o, mesh );

   // mesh.material.needsUpdate = true;
    mesh.position.set( pos[0], pos[1], pos[2] );

    mesh.castShadow = true;
    mesh.receiveShadow = true;//true;
    //mesh.frustumCulled = false;

    mesh.softType = 1;

    scene.add( mesh );
    softs.push( mesh );

    o.size = size;
    o.div = div;
    o.pos = pos;

    // send to worker
    ammo.send( 'add', o );

}

//--------------------------------------
//   ROPE
//--------------------------------------

view.rope = function ( o ) {

    var max = o.numSegment || 10;
    var start = o.start || [0,0,0];
    var end = o.end || [0,10,0];

    max += 2;
    var ropeIndices = [];

    //var n;
    //var pos = new Float32Array( max * 3 );
    for(var i=0; i<max-1; i++){

        ropeIndices.push( i, i + 1 );

    }

    var g = new THREE.BufferGeometry();
    g.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
    g.addAttribute('position', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
    g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));

    //var mesh = new THREE.LineSegments( g, new THREE.LineBasicMaterial({ vertexColors: true }));
    var mesh = new THREE.LineSegments( g, new THREE.LineBasicMaterial({ color: 0xFFFF00 }));

    this.setName( o, mesh );


    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.softType = 2;
    //mesh.frustumCulled = false;

    scene.add( mesh );
    softs.push( mesh );

    // send to worker
    ammo.send( 'add', o );

}

//--------------------------------------
//   ELLIPSOID 
//--------------------------------------

view.ellipsoid = function ( o ) {

    // send to worker
    ammo.send( 'add', o );

}

view.ellipsoidMesh = function ( o ) {

    var max = o.lng;
    var points = [];
    var ar = o.a;
    var i, j, k, v, n;
    
    // create temp convex geometry and convert to buffergeometry
    for( i = 0; i<max; i++ ){
        n = i*3;
        points.push(new THREE.Vector3(ar[n], ar[n+1], ar[n+2]));
    }
    var gt = new THREE.ConvexGeometry( points );

    
    var indices = new Uint32Array( gt.faces.length * 3 );
    var vertices = new Float32Array( max * 3 );
    var order = new Float32Array( max );
    //var normals = new Float32Array( max * 3 );
    //var uvs  = new Float32Array( max * 2 );

    

     // get new order of vertices
    var v = gt.vertices;
    var i = max, j, k;
    while(i--){
        j = max;
        while(j--){
            n = j*3;
            if(ar[n]==v[i].x && ar[n+1]==v[i].y && ar[n+2]==v[i].z) order[j] = i;
        }
    }

   
    i = max
    while(i--){
        n = i*3;
        k = order[i]*3;

        /*vertices[n] = v[i].x;
        vertices[n+1] = v[i].y;
        vertices[n+2] = v[i].z;*/

        vertices[k] = ar[n];
        vertices[k+1] = ar[n+1];
        vertices[k+2] = ar[n+2];

    }

    // get indices of faces
    var i = gt.faces.length;
    while(i--){
        n = i*3;
        var face = gt.faces[i];
        indices[n] = face.a;
        indices[n+1] = face.b;
        indices[n+2] = face.c;
    }

    //console.log(gtt.vertices.length)
    var g = new THREE.BufferGeometry();
    g.setIndex( new THREE.BufferAttribute( indices, 1 ) );
    g.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
    g.addAttribute('order', new THREE.BufferAttribute( order, 1 ));
    
    //g.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
    //g.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );

    g.computeVertexNormals();

    extraGeo.push( g );


    gt.dispose();


    //g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
    var mesh = new THREE.Mesh( g, mat.ball );

    this.setName( o, mesh );

    mesh.softType = 3;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add( mesh );
    softs.push( mesh );

}