(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.SHOT = {}));
}(this, function (exports) { 'use strict';

	/*global THREE*/

	function geometryInfo ( g, type ) {

	    var verticesOnly = false;
	    var facesOnly = false;

	    if(type == 'mesh') facesOnly = true;
	    if(type == 'convex') verticesOnly = true;

	    var i, j, n, p, n2;

	    var tmpGeo = new THREE.Geometry().fromBufferGeometry( g );
	    tmpGeo.mergeVertices();

	    var totalVertices = g.attributes.position.array.length/3;
	    var numVertices = tmpGeo.vertices.length;
	    var numFaces = tmpGeo.faces.length;

	    g.realVertices = new Float32Array( numVertices * 3 );
	    g.realIndices = new ( numFaces * 3 > 65535 ? Uint32Array : Uint16Array )( numFaces * 3 );

	    {
	        g.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( totalVertices*3 ), 3 ) );
	        var cc = g.attributes.color.array;

	        i = totalVertices;
	        while(i--){
	            n = i * 3;
	            cc[ n ] = 1;
	            cc[ n + 1 ] = 1;
	            cc[ n + 2 ] = 1;
	        }
	    }

	    i = numVertices;
	    while(i--){
	        p = tmpGeo.vertices[ i ];
	        n = i * 3;
	        g.realVertices[ n ] = p.x;
	        g.realVertices[ n + 1 ] = p.y;
	        g.realVertices[ n + 2 ] = p.z;
	    }

	    if( verticesOnly ){ 
	        tmpGeo.dispose();
	        return g.realVertices;
	    }

	    i = numFaces;
	    while(i--){
	        p = tmpGeo.faces[ i ];
	        n = i * 3;
	        g.realIndices[ n ] = p.a;
	        g.realIndices[ n + 1 ] = p.b;
	        g.realIndices[ n + 2 ] = p.c;
	    }

	    tmpGeo.dispose();

	    //g.realIndices = g.getIndex();
	    //g.setIndex(g.realIndices);

	    if( facesOnly ){ 
	        var faces = [];
	        i = g.realIndices.length;
	        while(i--){
	            n = i * 3;
	            p = g.realIndices[i]*3;
	            faces[n] = g.realVertices[ p ];
	            faces[n+1] = g.realVertices[ p+1 ];
	            faces[n+2] = g.realVertices[ p+2 ];
	        }
	        return faces;
	    }

	    // find same point
	    var ar = [];
	    var pos = g.attributes.position.array;
	    i = numVertices;
	    while(i--){
	        n = i*3;
	        ar[i] = [];
	        j = totalVertices;
	        while(j--){
	            n2 = j*3;
	            if( pos[n2] == g.realVertices[n] && pos[n2+1] == g.realVertices[n+1] && pos[n2+2] == g.realVertices[n+2] ) ar[i].push(j);
	        }
	    }

	    // generate same point index
	    var pPoint = new ( numVertices > 65535 ? Uint32Array : Uint16Array )( numVertices );
	    var lPoint = new ( totalVertices > 65535 ? Uint32Array : Uint16Array )( totalVertices );

	    p = 0;
	    for(i=0; i<numVertices; i++){
	        n = ar[i].length;
	        pPoint[i] = p;
	        j = n;
	        while(j--){ lPoint[p+j] = ar[i][j]; }
	        p += n;
	    }

	    g.numFaces = numFaces;
	    g.numVertices = numVertices;
	    g.maxi = totalVertices;
	    g.pPoint = pPoint;
	    g.lPoint = lPoint;

	}


	function Capsule( Radius, Height, SRadius, H ) {

	    THREE.BufferGeometry.call( this );

	    this.type = 'CapsuleBufferGeometry';

	    var radius = Radius || 1;
	    var height = Height || 1;

	    var sRadius = SRadius || 12;
	    var sHeight = Math.floor(sRadius*0.5);// SHeight || 6;
	    var h = H || 1;
	    var o0 = Math.PI * 2;
	    var o1 = Math.PI * 0.5;
	    var g = new THREE.Geometry();
	    var m0 = new THREE.CylinderGeometry(radius, radius, height, sRadius, h, true);
	    var m1 = new THREE.SphereGeometry(radius, sRadius, sHeight, 0, o0, 0, o1);
	    var m2 = new THREE.SphereGeometry(radius, sRadius, sHeight, 0, o0, o1, o1);
	    var mtx0 = new THREE.Matrix4().makeTranslation(0,0,0);
	    if(SRadius===6) mtx0.makeRotationY(30*0.0174532925199432957);
	    var mtx1 = new THREE.Matrix4().makeTranslation(0, height*0.5,0);
	    var mtx2 = new THREE.Matrix4().makeTranslation(0, -height*0.5,0);
	    g.merge( m0, mtx0);
	    g.merge( m1, mtx1);
	    g.merge( m2, mtx2);
	    g.mergeVertices();

	    this.fromGeometry( g );

	}

	Capsule.prototype = Object.create( THREE.BufferGeometry.prototype );

	// ROOT reference of engine

	var REVISION = '001';

	var root = {

		Ar: null,
		ArLng: [],
		ArPos: [],
		ArMax: 0,
		key: [ 0, 0, 0, 0, 0, 0, 0, 0 ],

		post:null,// send to worker
		extraGeo: [], // array of extra geometry to delete

		container: null,// THREE scene or group
		tmpMat: [], // tmp materials
		mat: {}, // materials object
		geo: {}, // geometrys object

	};

	// ROW map

	var map = new Map();

	/*global THREE*/

	function RigidBody() {

		this.ID = 0;
		this.solids = [];
		this.bodys = [];
		this.torad = 0.0174532925199432957;

	}

	Object.assign( RigidBody.prototype, {

		step: function ( AR, N ) {

			//var AR = root.Ar;
			//var N = root.ArPos[ 0 ];

			var n;

			this.bodys.forEach( function ( b, id ) {

				n = N + ( id * 8 );
				var s = AR[n];// speed km/h
		        if ( s > 0 ) {

		            if ( b.material.name == 'sleep' ) b.material = root.mat.move;
		            if( s > 50 && b.material.name == 'move' ) b.material = root.mat.speed;
		            else if( s < 50 && b.material.name == 'speed') b.material = root.mat.move;
		      
		        } else {
		            if ( b.material.name == 'move' || b.material.name == 'speed' ) b.material = root.mat.sleep;
		        }
				b.position.fromArray( AR, n + 1 );
	            b.quaternion.fromArray( AR, n + 4 );

			} );

		},

		clear: function () {

			while ( this.bodys.length > 0 ) this.destroy( this.bodys.pop() );
			while ( this.solids.length > 0 ) this.destroy( this.solids.pop() );
			this.ID = 0;

		},

		destroy: function ( b ) {


			if ( b.parent ) b.parent.remove( b );
			map.delete( b.name );

		},

		remove: function ( name ) {



			if ( ! map.has( name ) ) return;
			var b = map.get( name );
			var solid = b.isSolid ? true : false;
			var n = solid ? this.solids.indexOf( b ) : this.bodys.indexOf( b );

			if ( n !== - 1 ) {

				if ( solid ) {

					this.solids.splice( n, 1 );
					this.destroy( b );

				} else {

					this.bodys.splice( n, 1 );
					this.destroy( b );

				}

			}

		},

		vectorad: function ( r ) {

		    var i = r.length;
		    while(i--) r[i] *= this.torad;
		    return r;

		},

		add: function ( o, extra ) {

			o.name = o.name !== undefined ? o.name : 'body' + this.ID ++;
			// delete old if same name
			this.remove( o.name );

			if ( o.density !== undefined ) o.mass = o.density;
			if ( o.bounce !== undefined ) o.restitution = o.bounce;

			o.mass = o.mass === undefined ? 0 : o.mass;
			o.kinematic = o.kinematic || false;

			o.type = o.type === undefined ? 'box' : o.type;
			o.size = o.size === undefined ? [ 1, 1, 1 ] : o.size;
			o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
			//o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;

		


		    var customGeo = false;
		   
		    // size
		    o.size = o.size == undefined ? [1,1,1] : o.size;
		    if( o.size.length === 1 ){ o.size[1] = o.size[0]; }
		    if( o.size.length === 2 ){ o.size[2] = o.size[0]; }

		    if( o.geoSize ){
		        if(o.geoSize.length === 1){ o.geoSize[1] = o.geoSize[0]; }
		        if(o.geoSize.length === 2){ o.geoSize[2] = o.geoSize[0]; }
		    }

		    // rotation is in degree
		    o.rot = o.rot === undefined ? [0,0,0] : this.vectorad(o.rot);
		    o.quat = o.quat === undefined ? new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( o.rot ) ).toArray() : o.quat;

		    if( o.rotA ) o.quatA = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( this.vectorad( o.rotA ) ) ).toArray();
		    if( o.rotB ) o.quatB = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( this.vectorad( o.rotB ) ) ).toArray();

		    if( o.angUpper ) o.angUpper = this.vectorad( o.angUpper );
		    if( o.angLower ) o.angLower = this.vectorad( o.angLower );

		    var mesh = null;


		    if(o.type === 'plane'){
		        //this.grid.position.set( o.pos[0], o.pos[1], o.pos[2] )
		        root.post( 'add', o ); 
		        return;
		    }
		    
		    // material

		    var material;
		    if( o.material !== undefined ){ 

		    	if( o.material.constructor === String ) material = root.mat[o.material];
		    	else material = o.material;
		    
		    } else { 

		    	if( o.mass === 0 && ! o.kinematic ) material = root.mat.static;
		    	else material = root.mat.move;
		    	if( o.kinematic ) material = root.mat.kinematic;

		    }

		    // geometry
		    
		    if ( o.type === 'mesh' || o.type === 'convex' ){

		        if( o.shape ) {
		            o.v = geometryInfo( o.shape, o.type );
		            root.extraGeo.push( o.shape );
		        }

		        if( o.geometry ){

		            mesh = new THREE.Mesh( o.geometry, material );
		            root.extraGeo.push( o.geometry );
		            
		        } else {
		            mesh = new THREE.Mesh( o.shape, material );
		            //extraGeo.push(mesh.geometry);
		        }

		    } else {

		    	if( o.type === 'box' && o.mass === 0 && ! o.kinematic ) o.type = 'hardbox';
		    	if( o.type === 'capsule' ) o.geometry = new Capsule( o.size[0] , o.size[1]*0.5 );

		        if( o.geometry ){

		            if( o.geoRot || o.geoScale ) o.geometry = o.geometry.clone();
		            // rotation only geometry
		            if( o.geoRot ) o.geometry.applyMatrix(new THREE.Matrix4().makeRotationFromEuler( new THREE.Euler().fromArray(this.vectorad(o.geoRot))));
		            // scale only geometry
		            if( o.geoScale ) o.geometry.applyMatrix( new THREE.Matrix4().makeScale( o.geoScale[0], o.geoScale[1], o.geoScale[2] ) );
		            
		        }

		        mesh = new THREE.Mesh( o.geometry || root.geo[o.type], material );

		        if( o.geometry ){
		            root.extraGeo.push( o.geometry );
		            if( o.geoSize ) mesh.scale.fromArray( o.geoSize );
		            if( !o.geoSize && o.size && o.type !== 'capsule' ) mesh.scale.fromArray( o.size );
		            customGeo = true;
		        }

		    }


		    if( mesh ){

		        if( !customGeo ) mesh.scale.fromArray( o.size );
		        mesh.position.fromArray( o.pos );
		        mesh.quaternion.fromArray( o.quat );

		        mesh.receiveShadow = true;
		        mesh.castShadow = o.mass === 0 && ! o.kinematic ? false : true;

		        mesh.name = o.name;

		        if( o.parent !== undefined ) o.parent.add( mesh );
		        else root.container.add( mesh );

		    }

		    if( o.shape ) delete( o.shape );
		    if( o.geometry ) delete( o.geometry );
		    if( o.material ) delete( o.material );
		    
		    if( o.noPhy === undefined ){

		        // push 
		        if( mesh ){

		            if( o.mass === 0 && ! o.kinematic ) this.solids.push( mesh );// static
		            else this.bodys.push( mesh );// dynamique

		        }

		        // send to worker
		        root.post( 'add', o );

		    }

		    if( mesh ){ 
		    	if( o.mass === 0 && ! o.kinematic ) mesh.isSolid = true;
		    	if( o.kinematic ) mesh.isKinemmatic = true;
		    	else mesh.isBody = true;
		        map.set( o.name, mesh );
		        return mesh;
		    }


		}

	} );

	/*global THREE*/

	function SoftBody() {

		this.ID = 0;
		this.softs = [];

	}

	Object.assign( SoftBody.prototype, {

		step: function ( AR, N ) {

			var softPoints = N;

			this.softs.forEach( function ( b, id ) {

				var n, c, cc, p, j, k, u;
		        var g = b.geometry;
		        var t = b.softType; // type of softBody
		        var order = null;
		        var isWithColor = g.attributes.color ? true : false;
		        var isWithNormal = g.attributes.normal ? true : false;


		        if( t === 2 ){ // rope

		            j = g.positions.length;
		            while( j-- ){
		                n = softPoints + ( j * 3 );
		                g.positions[j].set( AR[n], AR[n+1], AR[n+2] );
		            }

		            g.updatePath();

		        } else {

		            if( !g.attributes.position ) return;

		            p = g.attributes.position.array;
		            if( isWithColor ) c = g.attributes.color.array;

		            if( t === 5 || t === 4 ){ // softTriMesh // softConvex

		                var max = g.numVertices;
		                var maxi = g.maxi;
		                var pPoint = g.pPoint;
		                var lPoint = g.lPoint;

		                j = max;
		                while(j--){
		                    n = (j*3) + softPoints;
		                    if( j == max-1 ) k = maxi - pPoint[j];
		                    else k = pPoint[j+1] - pPoint[j];
		                    var d = pPoint[j];
		                    while(k--){
		                        u = lPoint[d+k]*3;
		                        p[u] = AR[n];
		                        p[u+1] = AR[n+1]; 
		                        p[u+2] = AR[n+2];
		                    }
		                }

		            } else { // cloth // ellipsoid

		                if( g.attributes.order ) order = g.attributes.order.array;
		                j = p.length;

		                n = 2;

		                if( order !== null ) {

		                    j = order.length;
		                    while(j--){
		                        k = order[j] * 3;
		                        n = j*3 + softPoints;
		                        p[k] = AR[n];
		                        p[k+1] = AR[n+1];
		                        p[k+2] = AR[n+2];

		                        cc = Math.abs(AR[n+1]/10);
		                        c[k] = cc;
		                        c[k+1] = cc;
		                        c[k+2] = cc;
		                    }

		                } else {
		                     while(j--){
		                         
		                        p[j] = AR[ j + softPoints ];
		                        if(n==1){ 
		                            cc = Math.abs(p[j]/10);
		                            c[j-1] = cc;
		                            c[j] = cc;
		                            c[j+1] = cc;
		                        }
		                        n--;
		                        n = n < 0 ? 2 : n;
		                    }

		                }

		            }

		            if( t !== 2 ) g.computeVertexNormals();

		            if( isWithNormal ){

		                var norm = g.attributes.normal.array;

		                j = max;
		                while(j--){
		                    if( j == max-1 ) k = maxi - pPoint[j];
		                    else k = pPoint[j+1] - pPoint[j];
		                    var d = pPoint[j];
		                    var ref = lPoint[d]*3;
		                    while(k--){
		                        u = lPoint[d+k]*3;
		                        norm[u] = norm[ref];
		                        norm[u+1] = norm[ref+1]; 
		                        norm[u+2] = norm[ref+2];
		                    }
		                }

		                g.attributes.normal.needsUpdate = true;

		            }

		            if( isWithColor ) g.attributes.color.needsUpdate = true;
		            g.attributes.position.needsUpdate = true;
		            
		            g.computeBoundingSphere();

		        }

		        softPoints += b.points * 3;

			} );

			

		},

		clear: function () {

			while ( this.softs.length > 0 ) this.destroy( this.softs.pop() );
			this.ID = 0;

		},

		destroy: function ( b ) {

			if ( b.parent ) b.parent.remove( b );
			map.delete( b.name );

		},

		remove: function ( name ) {

			if ( ! map.has( name ) ) return;
			var b = map.get( name );

			var n = this.softs.indexOf( b );
			if ( n !== - 1 ) {

				this.softs.splice( n, 1 );
				this.destroy( b );

			}

		},

		add: function ( o, extra ) {


			var name = o.name !== undefined ? o.name : o.type + this.ID ++;

			// delete old if same name
			this.remove( name );

			var tmp, mesh;

			switch( o.type ) {
				case 'softMesh': case 'softTriMesh': tmp = softMesh( o ); break;
				case 'softConvex': tmp = softConvex( o ); break;
				case 'softCloth': tmp = softCloth( o ); break;
				case 'softRope': tmp = softRope( o ); break;

				//case 'ellipsoid': tmp = ellipsoid( o ); break;
			}

			mesh = tmp.mesh;
			o = tmp.o;

			mesh.name = name;


		    root.container.add( mesh );
	        this.softs.push( mesh );
			map.set( name, mesh );
			root.post( 'add', o );

		},

		/////



	} );



	//--------------------------------------
	//   SOFT TRIMESH
	//--------------------------------------

	function softMesh( o ) {

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

	    geometryInfo( g );

	    root.extraGeo.push( g );

	    o.v = g.realVertices;
	    o.i = g.realIndices;
	    o.ntri = g.numFaces;

	    var material = o.material === undefined ? root.mat.soft : root.mat[o.material];
	    var mesh = new THREE.Mesh( g, material );

	    mesh.castShadow = true;
	    mesh.receiveShadow = true;
	    
	    mesh.softType = 5;
	    mesh.points = o.v.length / 3;

	    if( o.shape ) delete(o.shape);
	    if( o.material ) delete(o.material);

	    return { mesh: mesh, o: o };
	    
	}
	//--------------------------------------
	//   SOFT CONVEX
	//--------------------------------------

	function softConvex( o ) {

	    var g = o.shape.clone();
	    var pos = o.pos || [0,0,0];

	    g.translate( pos[0], pos[1], pos[2] );

	    geometryInfo( g );

	    root.extraGeo.push( g );

	    o.v = g.realVertices;

	    var material = o.material === undefined ? root.mat.soft : root.mat[o.material];
	    var mesh = new THREE.Mesh( g, material );
	    
	    mesh.castShadow = true;
	    mesh.receiveShadow = true;
	    
	    mesh.softType = 4;
	    mesh.points = o.v.length / 3;

	    //mesh.idx = view.setIdx( softs.length, 'softs' );
	    //view.setName( o, mesh );

	    //this.byName[ o.name ] = mesh;

	    //this.scene.add( mesh );
	    //this.softs.push( mesh );

	    if( o.shape ) delete(o.shape);
	    if( o.material ) delete(o.material);

	    return { mesh: mesh, o: o };

	}

	function softCloth ( o ) {

	    var div = o.div || [16,16];
	    var size = o.size || [100,0,100];
	    var pos = o.pos || [0,0,0];

	    var max = div[0] * div[1];

	    var g = new THREE.PlaneBufferGeometry( size[0], size[2], div[0] - 1, div[1] - 1 );
	    g.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( max*3 ), 3 ) );
	    g.rotateX( -Math.PI90 );
	    //g.translate( -size[0]*0.5, 0, -size[2]*0.5 );

	    //var numVerts = g.attributes.position.array.length / 3;

	    var mesh = new THREE.Mesh( g, root.mat.soft );

	    //mesh.idx = view.setIdx( softs.length, 'softs' );

	    //view.setName( o, mesh );
	    //this.byName[ o.name ] = mesh;

	   // mesh.material.needsUpdate = true;
	    mesh.position.set( pos[0], pos[1], pos[2] );

	    mesh.castShadow = true;
	    mesh.receiveShadow = true;//true;
	    //mesh.frustumCulled = false;

	    mesh.softType = 1;
	    mesh.points = g.attributes.position.array.length / 3;

	    o.size = size;
	    o.div = div;
	    o.pos = pos;


	    return { mesh: mesh, o: o };

	}
	//--------------------------------------
	//   ROPE
	//--------------------------------------

	function softRope ( o ) {

	    //var max = o.numSegment || 10;
	    //var start = o.start || [0,0,0];
	    //var end = o.end || [0,10,0];

	   // max += 2;
	    /*var ropeIndices = [];

	    //var n;
	    //var pos = new Float32Array( max * 3 );
	    for(var i=0; i<max-1; i++){

	        ropeIndices.push( i, i + 1 );

	    }*/

	    if( o.numSeg === undefined ) o.numSeg = o.numSegment;

	    var g = new THREE.Tubular( o, o.numSeg || 10, o.radius || 0.2, o.numRad || 6, false );

	    var mesh = new THREE.Mesh( g, root.mat.soft );

	    mesh.castShadow = true;
	    mesh.receiveShadow = true;

	    mesh.softType = 2;
	    mesh.points = g.positions.length;

	    return { mesh: mesh, o: o };

	}
	//--------------------------------------
	//   ELLIPSOID 
	//--------------------------------------
	/*
	function ellipsoid( o ) {

	    // send to worker
	    root.send( 'add', o );

	};

	function ellipsoidMesh( o ) {

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
	    v = gt.vertices;
	    i = max;
	    //var v = gt.vertices;
	    //var i = max, j, k;
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

	        vertices[k] = ar[n];
	        vertices[k+1] = ar[n+1];
	        vertices[k+2] = ar[n+2];

	    }

	    // get indices of faces
	    i = gt.faces.length;
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

	    this.extraGeo.push( g );


	    gt.dispose();


	    //g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
	    var mesh = new THREE.Mesh( g, this.mat.soft );

	    //mesh.idx = view.setIdx( softs.length, 'softs' );

	    this.byName[ o.name ] = mesh;

	    //this.setName( o, mesh );

	    mesh.softType = 3;
	    mesh.points = g.attributes.position.array.length / 3;

	    //console.log( mesh.points )

	    mesh.castShadow = true;
	    mesh.receiveShadow = true;

	    this.scene.add( mesh );
	    this.softs.push( mesh );

	};*/

	/*global THREE*/

	function Terrain() {

		this.ID = 0;
		this.terrains = [];


	}

	Object.assign( Terrain.prototype, {

		step: function ( AR, N ) {

			this.terrains.forEach( function ( t, id ) {

				if( t.needsUpdate ){

				    t.updateGeometry(); 
					root.post( 'setTerrain', { name:t.name, heightData:t.heightData });
					t.needsUpdate = false;

				}

			});

		},

		clear: function () {

			while ( this.terrains.length > 0 ) this.destroy( this.terrains.pop() );
			this.ID = 0;

		},

		destroy: function ( t ) {

			if ( t.parent ) t.parent.remove( t );
			map.delete( t.name );

		},

		remove: function ( name ) {

			if ( ! map.has( name ) ) return;
			var t = map.get( name );

			var n = this.terrains.indexOf( t );
			if ( n !== - 1 ) {

				this.terrains.splice( n, 1 );
				this.destroy( t );

			}

		},

		add: function ( o, extra ) {


			var name = o.name !== undefined ? o.name : o.type + this.ID ++;

			// delete old if same name
			this.remove( name );

			o.sample = o.sample === undefined ? [64,64] : o.sample;
		    o.pos = o.pos === undefined ? [0,0,0] : o.pos;
		    o.complexity = o.complexity === undefined ? 30 : o.complexity;
		    o.name = name;


		    var terrain = new THREE.Terrain( o );

		    terrain.needsUpdate = false; 

		    //terrain.physicsUpdate = function () { root.post( 'setTerrain', { name:this.name, heightData:this.heightData } ) }

		    o.heightData = terrain.heightData;

		    o.offset = 0;

		    root.container.add( terrain );

	        this.terrains.push( terrain );

			map.set( name, terrain );

			root.post( 'add', o );

		},

		/////

		/*upGeo: function ( name ) {

			if ( ! map.has( name ) ) return;
			var t = map.get( name );

			//if(!t.needsUpdate) return;

			t.updateGeometry(); 
	        //t.needsUpdate = false; 

		},

		update: function ( name ) {

			if ( ! map.has( name ) ) return;
			var t = map.get( name );

			if( t.isWater ){ t.local.y += 0.25; t.local.z += 0.25; t.update( true ); t.needsUpdate = true; }
	        else t.easing( true ); 

		},*/

		move: function ( name, x, z ) {

			if ( ! map.has( name ) ) return;
			var t = map.get( name );

			t.local.x += x || 0;
	        t.local.z += z || 0;
	        t.update( true );
	        t.needsUpdate = true;


		},



	} );

	/*global THREE*/

	function Vehicle() {

		this.ID = 0;
		this.cars = [];

	}

	Object.assign( Vehicle.prototype, {

		step: function ( AR, N ) {

			var n;

			this.cars.forEach( function ( b, id ) {

				n = N + (id * 56);
		        b.userData.speed = AR[n];

		        b.position.fromArray( AR, n + 1 );
		        b.quaternion.fromArray( AR, n + 4 );


		        var j = b.userData.NumWheels, w, k, v;
		        var w = 8 * ( 4 + 1 );
		        var decal = 0.2;
		        var ratio = 1/decal;
		        var radius = b.userData.radius;
		        var steering = AR[n+8];

		        if( b.userData.steeringWheel ) {
		            b.userData.steeringWheel.rotation.y = - steering * 6;
		        }


		        if( b.userData.isWithBrake ){

		            k = j;

		            while(k--){
		                if(k===0)  b.userData.b[k].rotation.y = steering;
		                if(k===1)  b.userData.b[k].rotation.y = Math.Pi - steering;
		                b.userData.b[k].position.y = radius - AR[n+w+k];

		            }
		            
		        }

		        if( b.userData.isWithSusp ){

		            k = j;

		            while(k--){

		                v = ( AR[n+w+k] )*ratio;

		                v = v > 1 ? 1 : v;
		                v = v < -1 ? -1 : v;

		                if(v>0){

		                    b.userData.s[k].setWeight( 'low', v );
		                    b.userData.s[k].setWeight( 'top', 0 );

		                } else {

		                    b.userData.s[k].setWeight( 'low', 0 );
		                    b.userData.s[k].setWeight( 'top', -v );

		                }

		            }
		            
		        }


		        if(b.userData.helper){
		            if( j == 4 ){
		                b.userData.helper.updateSuspension(AR[n+w+0], AR[n+w+1], AR[n+w+2], AR[n+w+3]);
		            }
		        }
		        
		        while(j--){

		            w = 8 * ( j + 1 );
		            b.userData.w[j].position.fromArray( AR, n + w + 1 );
		            b.userData.w[j].quaternion.fromArray( AR, n + w + 4 );

		        }
				

			} );

		},

		clear: function () {

			while ( this.cars.length > 0 ) this.destroy( this.cars.pop() );
			this.ID = 0;

		},

		destroy: function ( b ) {

			var wheel;
			for( var i = 0, lng = b.userData.w.length; i < lng; i++){

				wheel = b.userData.w[i];
				if ( wheel.parent ) wheel.parent.remove( wheel );

			}

			if ( b.parent ) b.parent.remove( b );
			map.delete( b.name );

		},

		remove: function ( name ) {

			if ( ! map.has( name ) ) return;
			var car = map.get( name );

			var n = this.cars.indexOf( car );
			if ( n !== - 1 ) {

				this.cars.splice( n, 1 );
				this.destroy( car );

			}

		},

		add: function ( o, extra ) {


			var name = o.name !== undefined ? o.name : o.type + this.ID ++;

			// delete old if same name
			this.remove( name );




			var size = o.size || [2,0.5,4];
		    var pos = o.pos || [0,0,0];
		    var rot = o.rot || [0,0,0];

		    var wPos = o.wPos || [1, 0, 1.6];

		    o.masscenter = o.masscenter == undefined ? [0,0,0] : o.masscenter;

		    //var masscenter = o.masscenter || [0,0.25,0];

		    Math.vectorad( rot );

		    // chassis
		    var mesh;
		    if( o.mesh ){

		        mesh = new THREE.Group();//o.mesh;
		        mesh.add( o.mesh );
		        /*var k = mesh.children.length;
		            while(k--){
		                //mesh.children[k].position.fromArray( o.masscenter ).negate();//.set( -masscenter[0], -masscenter[1], -masscenter[2] );
		                //mesh.children[k].geometry.translate( masscenter[0], masscenter[1], masscenter[2] );
		                //mesh.children[k].castShadow = true;
		                //mesh.children[k].receiveShadow = true;
		            }*/
		    } else if( o.geometry ){

		            mesh = new THREE.Mesh( o.geometry, o.material );
		            root.extraGeo.push( o.geometry );
		            
		    } else {

		        var g = new THREE.BufferGeometry().fromGeometry( new THREE.BoxGeometry(size[0], size[1], size[2]) );//geo.box;
		        g.translate( -o.masscenter[0], -o.masscenter[1], -o.masscenter[2] );
		        root.extraGeo.push( g );
		        mesh = new THREE.Mesh( g, root.mat.move );

		    } 
		    

		    if( o.debug && o.shape ){
		        mesh = new THREE.Mesh( o.shape, root.mat.debug );
		    }

		    //mesh.scale.set( size[0], size[1], size[2] );
		    mesh.position.set( pos[0], pos[1], pos[2] );
		    mesh.rotation.set( rot[0], rot[1], rot[2] );

		    // copy rotation quaternion
		    o.quat = mesh.quaternion.toArray();

		    //mesh.castShadow = true;
		    //mesh.receiveShadow = true;

		    root.container.add( mesh );

		    //mesh.idx = view.setIdx( cars.length, 'cars' );
		    //view.setName( o, mesh );

		    //this.byName[ o.name ] = mesh;

		    mesh.userData.speed = 0;
		    mesh.userData.steering = 0;
		    mesh.userData.NumWheels = o.nw || 4;
		    mesh.userData.type = 'car';

		    mesh.userData.steeringWheel = o.meshSteeringWheel || null;

		    

		    // wheels

		    var radius = o.radius || 0.4;
		    var deep = o.deep || 0.3;
		    wPos = o.wPos || [1, -0.25, 1.6];

		    var w = [];
		    var s = [];
		    var b = [];
		    var m;
		    var isWithSusp = o.meshSusp === undefined ? false : true;
		    var isWithBrake = o.meshBrake === undefined ? false : true;


		    var needScale = o.wheel == undefined ? true : false;

		    var gw = o.wheel || root.geo['wheel'];
		    var gwr = gw.clone();
		    gwr.rotateY( Math.Pi );
		    root.extraGeo.push( gwr );

		    var wheelmat = root.mat.move;
		    if( o.wheelMaterial !== undefined ){ 
	        	if( o.wheelMaterial.constructor === String ) wheelmat = root.mat[o.wheelMaterial];
	        	else wheelmat = o.wheelMaterial;
	        }

		    var i = o.nw || 4;

		    while(i--){

		        if(o.meshBrake){

		            m = o.meshBrake.clone(); 
		           // this.scene.add( m );
		            mesh.add( m );
		            m.position.y = radius;
		            if(i==1 || i==2){ m.rotation.y = Math.Pi; m.position.x = wPos[0]; m.rotation.x = Math.Pi;}
		            else { m.position.x = -wPos[0]; }
		            if(i==0 || i==1) m.position.z = wPos[2];
		            else m.position.z = -wPos[2];

		            b[i] = m;//.children[0];

		        }

		        if(o.meshSusp){

		            m = o.meshSusp.clone(); 
		            mesh.add( m );
		            m.position.y = radius;
		            if(i==1 || i==2) m.rotation.y = Math.Pi;
		            if(i==0 || i==1) m.position.z = wPos[2];
		            else m.position.z = -wPos[2];

		            s[i] = m.children[0];

		        }

		        if( o.meshWheel ){

		            w[i] = o.meshWheel.clone();
		            needScale = false;
		            if(i==1 || i==2){ 
		                w[i] = new THREE.Group();
		                var ww = o.meshWheel.clone();
		                ww.rotation.y = Math.Pi;
		                w[i].add(ww);
		            } else {
		                w[i] = o.meshWheel.clone();
		                var k = w[i].children.length; 
		                while( k-- ){
		                    if(w[i].children[k].name === 'h_pneu') w[i].children[k].rotation.y = Math.Pi;
		                }
		            }


		        } else {
		            if(i==1 || i==2) w[i] = new THREE.Mesh( gw, root.mat.move );
		            else w[i] = new THREE.Mesh( gwr, root.mat.move );
		        }

		        

		        if( needScale ) w[i].scale.set( deep, radius, radius );
		        //else w[i].material = this.mat.move;//mat.cars;

		        w[i].material = wheelmat;
		        w[i].castShadow = true;
		        w[i].receiveShadow = true;

		        root.container.add( w[i] );

		    }

		    if(o.extraWeels){
		        var www = o.meshWheel.clone();
		        www.children[0].visible = false;
		        www.rotation.z = -Math.Pi * 0.5;
		        www.position.set( 0,1.25, -1.11 );
		        mesh.add( www );
		    }

		    mesh.userData.radius = radius;
		    mesh.userData.w = w;
		    mesh.userData.s = s;
		    mesh.userData.b = b;
		    mesh.userData.isWithSusp = isWithSusp;
		    mesh.userData.isWithBrake = isWithBrake;

		    if(o.helper){
		        mesh.userData.helper = new THREE.CarHelper( wPos, o.masscenter, deep );
		        mesh.add( mesh.userData.helper );
		    }



		    if( o.mesh ) o.mesh = null;
		    if( o.wheel ) o.wheel = null;

		    if ( o.shapeType == 'mesh' || o.shapeType == 'convex' ) o.v = geometryInfo( o.shape, o.shapeType );

		    if( o.shape ) delete(o.shape);
		    if( o.geometry ) delete(o.geometry);
		    if( o.material ) delete(o.material);
		    if( o.mesh ) delete(o.mesh);
		    if( o.meshWheel ) delete(o.meshWheel);
		    if( o.meshSusp ) delete(o.meshSusp);
		    if( o.meshBrake ) delete(o.meshBrake);
		    if( o.meshSteeringWheel ) delete(o.meshSteeringWheel);
		    if( o.wheelMaterial ) delete( o.wheelMaterial );

	        this.cars.push( mesh );

			map.set( name, mesh );

			root.post( 'add', o );

		}

	} );

	/*global THREE*/

	function Character() {

		this.ID = 0;
		this.heroes = [];

	}

	Object.assign( Character.prototype, {

		step: function ( AR, N ) {

			var n;

			this.heroes.forEach( function ( b, id ) {

				n = N + (id * 8);
		        var s = AR[n] * 3.33;
		        b.userData.speed = s * 100;
		        b.position.fromArray( AR, n + 1 );
		        b.quaternion.fromArray( AR, n + 4 );

		        if(b.skin){

		            if( s === 0 ) b.skin.play( 0, 0.3 );
		            else{ 
		                b.skin.play( 1, 0.3 );
		                b.skin.setTimeScale( s );

		            }

		            //console.log(s)
		            
		        }

			} );

			

		},

		clear: function () {

			while ( this.heroes.length > 0 ) this.destroy( this.heroes.pop() );
			this.ID = 0;

		},

		destroy: function ( b ) {

			if ( b.parent ) b.parent.remove( b );
			map.delete( b.name );

		},

		remove: function ( name ) {

			if ( ! map.has( name ) ) return;
			var b = map.get( name );

			var n = this.heroes.indexOf( b );
			if ( n !== - 1 ) {

				this.heroes.splice( n, 1 );
				this.destroy( b );

			}

		},

		add: function ( o, extra ) {


			var name = o.name !== undefined ? o.name : o.type + this.ID ++;

			// delete old if same name
			this.remove( name );

			o.size = o.size == undefined ? [0.25,2,2] : o.size;
		    if(o.size.length == 1){ o.size[1] = o.size[0]; }
		    if(o.size.length == 2){ o.size[2] = o.size[0]; }

		    o.pos = o.pos === undefined ? [0,0,0] : o.pos;
		    o.rot = o.rot == undefined ? [0,0,0] : Math.vectorad( o.rot );
		    o.quat = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( o.rot ) ).toArray();

		    var g = new THREE.CapsuleBufferGeometry( o.size[0], o.size[1]*0.5, 6 );

		    var mesh = new THREE.Group();//o.mesh || new THREE.Mesh( g );

		    if( o.debug ){

		        var mm = new THREE.Mesh( g, root.mat.debug );
		        root.extraGeo.push( g );
		        mesh.add( mm );

		    }

		    //mesh.material = mat.hero;
		    if( o.mesh ){

		        //this.mat.hero.skinning = true;
		        //mesh.userData.skin = true;

		        var model = o.mesh;

		        

		        model.material = root.mat.hero;
		        model.scale.multiplyScalar( o.scale || 1 );
		        model.position.set(0,0,0);
		        
		        model.setTimeScale( 0.5 );
		        model.play(0);

		        mesh.add( model );
		        mesh.skin = model;

		        //this.extraGeo.push( mesh.skin.geometry );
		        
		    } else {

		        var mx = new THREE.Mesh( g, root.mat.hero );
		        root.extraGeo.push( g );
		        mesh.add( mx );

		    }
		    


		    

		    mesh.userData.speed = 0;
		    mesh.userData.type = 'hero';
		    //mesh.userData.id = this.heros.length;

		     // copy rotation quaternion
		    mesh.position.fromArray( o.pos );
		    mesh.quaternion.fromArray( o.quat );

		    

		    mesh.castShadow = true;
		    mesh.receiveShadow = true;
		    mesh.name = name;


		    if( o.mesh ) delete( o.mesh );

		    root.container.add( mesh );
	        this.heroes.push( mesh );

			map.set( name, mesh );

			root.post( 'add', o );

		},

		/////



	} );

	/*global THREE*/

	function Collision() {

		this.ID = 0;
		this.pairs = [];

	}

	Object.assign( Collision.prototype, {

		step: function ( AR, N ) {

			this.pairs.forEach( function ( pair, id ) {

	            pair.callback( AR[ N + id ] || 0 );

	        });

		},

		clear: function () {

			while ( this.pairs.length > 0 ) this.destroy( this.pairs.pop() );
			this.ID = 0;

		},

		destroy: function ( b ) {

			b.clear();
			map.delete( b.name );

		},

		remove: function ( name ) {

			if ( ! map.has( name ) ) return;
			var p = map.get( name );

			var n = this.pairs.indexOf( p );
			if ( n !== - 1 ) {

				this.pairs.splice( n, 1 );
				this.destroy( p );

			}

		},

		add: function ( o, extra ) {


			var name = o.name !== undefined ? o.name : 'pair' + this.ID ++;

			// delete old if same name
			this.remove( name );

		    var pair = new Pair( name, o.callback );

	        this.pairs.push( pair );

	        delete( o.callback );
	        //o.callback = null;

			map.set( name, pair );

			root.post( 'add', o );

		},




	} );


	//--------------------------------------------------
	//
	//  CONTACT CLASS
	//
	//--------------------------------------------------

	function Pair( name, callback ) {

		this.name = name;
		this.callback = callback;

	}

	Object.assign( Pair.prototype, {

		clear: function () {

			this.name = null;
			this.callback = null;

		}

	} );

	/*
	Copyright (c) 2011 Juan Mellado

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
	*/

	/*
	References:
	- "LZMA SDK" by Igor Pavlov
	  http://www.7-zip.org/sdk.html
	*/
	var LZMA = ( function () {

		var LZMA = LZMA || {};

		LZMA.OutWindow = function () {

			this._windowSize = 0;

		};

		LZMA.OutWindow.prototype.create = function ( windowSize ) {

			if ( ( ! this._buffer ) || ( this._windowSize !== windowSize ) ) {

				this._buffer = [];

			}
			this._windowSize = windowSize;
			this._pos = 0;
			this._streamPos = 0;

		};

		LZMA.OutWindow.prototype.flush = function () {

			var size = this._pos - this._streamPos;
			if ( size !== 0 ) {

				while ( size -- ) {

					this._stream.writeByte( this._buffer[ this._streamPos ++ ] );

				}
				if ( this._pos >= this._windowSize ) {

					this._pos = 0;

				}
				this._streamPos = this._pos;

			}

		};

		LZMA.OutWindow.prototype.releaseStream = function () {

			this.flush();
			this._stream = null;

		};

		LZMA.OutWindow.prototype.setStream = function ( stream ) {

			this.releaseStream();
			this._stream = stream;

		};

		LZMA.OutWindow.prototype.init = function ( solid ) {

			if ( ! solid ) {

				this._streamPos = 0;
				this._pos = 0;

			}

		};

		LZMA.OutWindow.prototype.copyBlock = function ( distance, len ) {

			var pos = this._pos - distance - 1;
			if ( pos < 0 ) {

				pos += this._windowSize;

			}
			while ( len -- ) {

				if ( pos >= this._windowSize ) {

					pos = 0;

				}
				this._buffer[ this._pos ++ ] = this._buffer[ pos ++ ];
				if ( this._pos >= this._windowSize ) {

					this.flush();

				}

			}

		};

		LZMA.OutWindow.prototype.putByte = function ( b ) {

			this._buffer[ this._pos ++ ] = b;
			if ( this._pos >= this._windowSize ) {

				this.flush();

			}

		};

		LZMA.OutWindow.prototype.getByte = function ( distance ) {

			var pos = this._pos - distance - 1;
			if ( pos < 0 ) {

				pos += this._windowSize;

			}
			return this._buffer[ pos ];

		};

		LZMA.RangeDecoder = function () {
		};

		LZMA.RangeDecoder.prototype.setStream = function ( stream ) {

			this._stream = stream;

		};

		LZMA.RangeDecoder.prototype.releaseStream = function () {

			this._stream = null;

		};

		LZMA.RangeDecoder.prototype.init = function () {

			var i = 5;

			this._code = 0;
			this._range = - 1;

			while ( i -- ) {

				this._code = ( this._code << 8 ) | this._stream.readByte();

			}

		};

		LZMA.RangeDecoder.prototype.decodeDirectBits = function ( numTotalBits ) {

			var result = 0, i = numTotalBits, t;

			while ( i -- ) {

				this._range >>>= 1;
				t = ( this._code - this._range ) >>> 31;
				this._code -= this._range & ( t - 1 );
				result = ( result << 1 ) | ( 1 - t );

				if ( ( this._range & 0xff000000 ) === 0 ) {

					this._code = ( this._code << 8 ) | this._stream.readByte();
					this._range <<= 8;

				}

			}

			return result;

		};

		LZMA.RangeDecoder.prototype.decodeBit = function ( probs, index ) {

			var prob = probs[ index ],
				newBound = ( this._range >>> 11 ) * prob;

			if ( ( this._code ^ 0x80000000 ) < ( newBound ^ 0x80000000 ) ) {

				this._range = newBound;
				probs[ index ] += ( 2048 - prob ) >>> 5;
				if ( ( this._range & 0xff000000 ) === 0 ) {

					this._code = ( this._code << 8 ) | this._stream.readByte();
					this._range <<= 8;

				}
				return 0;

			}

			this._range -= newBound;
			this._code -= newBound;
			probs[ index ] -= prob >>> 5;
			if ( ( this._range & 0xff000000 ) === 0 ) {

				this._code = ( this._code << 8 ) | this._stream.readByte();
				this._range <<= 8;

			}
			return 1;

		};

		LZMA.initBitModels = function ( probs, len ) {

			while ( len -- ) {

				probs[ len ] = 1024;

			}

		};

		LZMA.BitTreeDecoder = function ( numBitLevels ) {

			this._models = [];
			this._numBitLevels = numBitLevels;

		};

		LZMA.BitTreeDecoder.prototype.init = function () {

			LZMA.initBitModels( this._models, 1 << this._numBitLevels );

		};

		LZMA.BitTreeDecoder.prototype.decode = function ( rangeDecoder ) {

			var m = 1, i = this._numBitLevels;

			while ( i -- ) {

				m = ( m << 1 ) | rangeDecoder.decodeBit( this._models, m );

			}
			return m - ( 1 << this._numBitLevels );

		};

		LZMA.BitTreeDecoder.prototype.reverseDecode = function ( rangeDecoder ) {

			var m = 1, symbol = 0, i = 0, bit;

			for ( ; i < this._numBitLevels; ++ i ) {

				bit = rangeDecoder.decodeBit( this._models, m );
				m = ( m << 1 ) | bit;
				symbol |= bit << i;

			}
			return symbol;

		};

		LZMA.reverseDecode2 = function ( models, startIndex, rangeDecoder, numBitLevels ) {

			var m = 1, symbol = 0, i = 0, bit;

			for ( ; i < numBitLevels; ++ i ) {

				bit = rangeDecoder.decodeBit( models, startIndex + m );
				m = ( m << 1 ) | bit;
				symbol |= bit << i;

			}
			return symbol;

		};

		LZMA.LenDecoder = function () {

			this._choice = [];
			this._lowCoder = [];
			this._midCoder = [];
			this._highCoder = new LZMA.BitTreeDecoder( 8 );
			this._numPosStates = 0;

		};

		LZMA.LenDecoder.prototype.create = function ( numPosStates ) {

			for ( ; this._numPosStates < numPosStates; ++ this._numPosStates ) {

				this._lowCoder[ this._numPosStates ] = new LZMA.BitTreeDecoder( 3 );
				this._midCoder[ this._numPosStates ] = new LZMA.BitTreeDecoder( 3 );

			}

		};

		LZMA.LenDecoder.prototype.init = function () {

			var i = this._numPosStates;
			LZMA.initBitModels( this._choice, 2 );
			while ( i -- ) {

				this._lowCoder[ i ].init();
				this._midCoder[ i ].init();

			}
			this._highCoder.init();

		};

		LZMA.LenDecoder.prototype.decode = function ( rangeDecoder, posState ) {

			if ( rangeDecoder.decodeBit( this._choice, 0 ) === 0 ) {

				return this._lowCoder[ posState ].decode( rangeDecoder );

			}
			if ( rangeDecoder.decodeBit( this._choice, 1 ) === 0 ) {

				return 8 + this._midCoder[ posState ].decode( rangeDecoder );

			}
			return 16 + this._highCoder.decode( rangeDecoder );

		};

		LZMA.Decoder2 = function () {

			this._decoders = [];

		};

		LZMA.Decoder2.prototype.init = function () {

			LZMA.initBitModels( this._decoders, 0x300 );

		};

		LZMA.Decoder2.prototype.decodeNormal = function ( rangeDecoder ) {

			var symbol = 1;

			do {

				symbol = ( symbol << 1 ) | rangeDecoder.decodeBit( this._decoders, symbol );

			}while ( symbol < 0x100 );

			return symbol & 0xff;

		};

		LZMA.Decoder2.prototype.decodeWithMatchByte = function ( rangeDecoder, matchByte ) {

			var symbol = 1, matchBit, bit;

			do {

				matchBit = ( matchByte >> 7 ) & 1;
				matchByte <<= 1;
				bit = rangeDecoder.decodeBit( this._decoders, ( ( 1 + matchBit ) << 8 ) + symbol );
				symbol = ( symbol << 1 ) | bit;
				if ( matchBit !== bit ) {

					while ( symbol < 0x100 ) {

						symbol = ( symbol << 1 ) | rangeDecoder.decodeBit( this._decoders, symbol );

					}
					break;

				}

			}while ( symbol < 0x100 );

			return symbol & 0xff;

		};

		LZMA.LiteralDecoder = function () {
		};

		LZMA.LiteralDecoder.prototype.create = function ( numPosBits, numPrevBits ) {

			var i;

			if ( this._coders
				&& ( this._numPrevBits === numPrevBits )
				&& ( this._numPosBits === numPosBits ) ) {

				return;

			}
			this._numPosBits = numPosBits;
			this._posMask = ( 1 << numPosBits ) - 1;
			this._numPrevBits = numPrevBits;

			this._coders = [];

			i = 1 << ( this._numPrevBits + this._numPosBits );
			while ( i -- ) {

				this._coders[ i ] = new LZMA.Decoder2();

			}

		};

		LZMA.LiteralDecoder.prototype.init = function () {

			var i = 1 << ( this._numPrevBits + this._numPosBits );
			while ( i -- ) {

				this._coders[ i ].init();

			}

		};

		LZMA.LiteralDecoder.prototype.getDecoder = function ( pos, prevByte ) {

			return this._coders[ ( ( pos & this._posMask ) << this._numPrevBits )
				+ ( ( prevByte & 0xff ) >>> ( 8 - this._numPrevBits ) ) ];

		};

		LZMA.Decoder = function () {

			this._outWindow = new LZMA.OutWindow();
			this._rangeDecoder = new LZMA.RangeDecoder();
			this._isMatchDecoders = [];
			this._isRepDecoders = [];
			this._isRepG0Decoders = [];
			this._isRepG1Decoders = [];
			this._isRepG2Decoders = [];
			this._isRep0LongDecoders = [];
			this._posSlotDecoder = [];
			this._posDecoders = [];
			this._posAlignDecoder = new LZMA.BitTreeDecoder( 4 );
			this._lenDecoder = new LZMA.LenDecoder();
			this._repLenDecoder = new LZMA.LenDecoder();
			this._literalDecoder = new LZMA.LiteralDecoder();
			this._dictionarySize = - 1;
			this._dictionarySizeCheck = - 1;

			this._posSlotDecoder[ 0 ] = new LZMA.BitTreeDecoder( 6 );
			this._posSlotDecoder[ 1 ] = new LZMA.BitTreeDecoder( 6 );
			this._posSlotDecoder[ 2 ] = new LZMA.BitTreeDecoder( 6 );
			this._posSlotDecoder[ 3 ] = new LZMA.BitTreeDecoder( 6 );

		};

		LZMA.Decoder.prototype.setDictionarySize = function ( dictionarySize ) {

			if ( dictionarySize < 0 ) {

				return false;

			}
			if ( this._dictionarySize !== dictionarySize ) {

				this._dictionarySize = dictionarySize;
				this._dictionarySizeCheck = Math.max( this._dictionarySize, 1 );
				this._outWindow.create( Math.max( this._dictionarySizeCheck, 4096 ) );

			}
			return true;

		};

		LZMA.Decoder.prototype.setLcLpPb = function ( lc, lp, pb ) {

			var numPosStates = 1 << pb;

			if ( lc > 8 || lp > 4 || pb > 4 ) {

				return false;

			}

			this._literalDecoder.create( lp, lc );

			this._lenDecoder.create( numPosStates );
			this._repLenDecoder.create( numPosStates );
			this._posStateMask = numPosStates - 1;

			return true;

		};

		LZMA.Decoder.prototype.init = function () {

			var i = 4;

			this._outWindow.init( false );

			LZMA.initBitModels( this._isMatchDecoders, 192 );
			LZMA.initBitModels( this._isRep0LongDecoders, 192 );
			LZMA.initBitModels( this._isRepDecoders, 12 );
			LZMA.initBitModels( this._isRepG0Decoders, 12 );
			LZMA.initBitModels( this._isRepG1Decoders, 12 );
			LZMA.initBitModels( this._isRepG2Decoders, 12 );
			LZMA.initBitModels( this._posDecoders, 114 );

			this._literalDecoder.init();

			while ( i -- ) {

				this._posSlotDecoder[ i ].init();

			}

			this._lenDecoder.init();
			this._repLenDecoder.init();
			this._posAlignDecoder.init();
			this._rangeDecoder.init();

		};

		LZMA.Decoder.prototype.decode = function ( inStream, outStream, outSize ) {

			var state = 0, rep0 = 0, rep1 = 0, rep2 = 0, rep3 = 0, nowPos64 = 0, prevByte = 0,
				posState, decoder2, len, distance, posSlot, numDirectBits;

			this._rangeDecoder.setStream( inStream );
			this._outWindow.setStream( outStream );

			this.init();

			while ( outSize < 0 || nowPos64 < outSize ) {

				posState = nowPos64 & this._posStateMask;

				if ( this._rangeDecoder.decodeBit( this._isMatchDecoders, ( state << 4 ) + posState ) === 0 ) {

					decoder2 = this._literalDecoder.getDecoder( nowPos64 ++, prevByte );

					if ( state >= 7 ) {

						prevByte = decoder2.decodeWithMatchByte( this._rangeDecoder, this._outWindow.getByte( rep0 ) );

					} else {

						prevByte = decoder2.decodeNormal( this._rangeDecoder );

					}
					this._outWindow.putByte( prevByte );

					state = state < 4 ? 0 : state - ( state < 10 ? 3 : 6 );

				} else {

					if ( this._rangeDecoder.decodeBit( this._isRepDecoders, state ) === 1 ) {

						len = 0;
						if ( this._rangeDecoder.decodeBit( this._isRepG0Decoders, state ) === 0 ) {

							if ( this._rangeDecoder.decodeBit( this._isRep0LongDecoders, ( state << 4 ) + posState ) === 0 ) {

								state = state < 7 ? 9 : 11;
								len = 1;

							}

						} else {

							if ( this._rangeDecoder.decodeBit( this._isRepG1Decoders, state ) === 0 ) {

								distance = rep1;

							} else {

								if ( this._rangeDecoder.decodeBit( this._isRepG2Decoders, state ) === 0 ) {

									distance = rep2;

								} else {

									distance = rep3;
									rep3 = rep2;

								}
								rep2 = rep1;

							}
							rep1 = rep0;
							rep0 = distance;

						}
						if ( len === 0 ) {

							len = 2 + this._repLenDecoder.decode( this._rangeDecoder, posState );
							state = state < 7 ? 8 : 11;

						}

					} else {

						rep3 = rep2;
						rep2 = rep1;
						rep1 = rep0;

						len = 2 + this._lenDecoder.decode( this._rangeDecoder, posState );
						state = state < 7 ? 7 : 10;

						posSlot = this._posSlotDecoder[ len <= 5 ? len - 2 : 3 ].decode( this._rangeDecoder );
						if ( posSlot >= 4 ) {

							numDirectBits = ( posSlot >> 1 ) - 1;
							rep0 = ( 2 | ( posSlot & 1 ) ) << numDirectBits;

							if ( posSlot < 14 ) {

								rep0 += LZMA.reverseDecode2( this._posDecoders,
									rep0 - posSlot - 1, this._rangeDecoder, numDirectBits );

							} else {

								rep0 += this._rangeDecoder.decodeDirectBits( numDirectBits - 4 ) << 4;
								rep0 += this._posAlignDecoder.reverseDecode( this._rangeDecoder );
								if ( rep0 < 0 ) {

									if ( rep0 === - 1 ) {

										break;

									}
									return false;

								}

							}

						} else {

							rep0 = posSlot;

						}

					}

					if ( rep0 >= nowPos64 || rep0 >= this._dictionarySizeCheck ) {

						return false;

					}

					this._outWindow.copyBlock( rep0, len );
					nowPos64 += len;
					prevByte = this._outWindow.getByte( 0 );

				}

			}

			this._outWindow.flush();
			this._outWindow.releaseStream();
			this._rangeDecoder.releaseStream();

			return true;

		};

		LZMA.Decoder.prototype.setDecoderProperties = function ( properties ) {

			var value, lc, lp, pb, dictionarySize;

			if ( properties.size < 5 ) {

				return false;

			}

			value = properties.readByte();
			lc = value % 9;
			value = ~~ ( value / 9 );
			lp = value % 5;
			pb = ~~ ( value / 5 );

			if ( ! this.setLcLpPb( lc, lp, pb ) ) {

				return false;

			}

			dictionarySize = properties.readByte();
			dictionarySize |= properties.readByte() << 8;
			dictionarySize |= properties.readByte() << 16;
			dictionarySize += properties.readByte() * 16777216;

			return this.setDictionarySize( dictionarySize );

		};

		LZMA.decompress = function ( properties, inStream, outStream, outSize ) {

			var decoder = new LZMA.Decoder();

			if ( ! decoder.setDecoderProperties( properties ) ) {

				throw "Incorrect stream properties";

			}

			if ( ! decoder.decode( inStream, outStream, outSize ) ) {

				throw "Error in data stream";

			}

			return true;

		};

		LZMA.decompressFile = function ( inStream, outStream ) {

			var decoder = new LZMA.Decoder(), outSize;

			if ( ! decoder.setDecoderProperties( inStream ) ) {

				throw "Incorrect stream properties";

			}

			outSize = inStream.readByte();
			outSize |= inStream.readByte() << 8;
			outSize |= inStream.readByte() << 16;
			outSize += inStream.readByte() * 16777216;

			inStream.readByte();
			inStream.readByte();
			inStream.readByte();
			inStream.readByte();

			if ( ! decoder.decode( inStream, outStream, outSize ) ) {

				throw "Error in data stream";

			}

			return true;

		};

		return LZMA;

	})();

	/**
	 * 	SEA3D LZMA
	 * 	@author Sunag / http://www.sunag.com.br/
	 */

	function LZMAdecompact( data ) {

		data = new Uint8Array( data );

		var inStream = 
		{
			data: data,
			position: 0,
			readByte: function () {

				return this.data[ this.position ++ ];

			}
		};

		var outStream = {
			data: [],
			position: 0,
			writeByte: function ( value ) {

				this.data[ this.position ++ ] = value;

			}
		};

		LZMA.decompressFile( inStream, outStream );

		return new Uint8Array( outStream.data ).buffer;

	}

	/*global THREE*/

	/**   _  _____ _   _   
	*    | ||_   _| |_| |
	*    | |_ | | |  _  |
	*    |___||_| |_| |_|
	*    @author lth / https://github.com/lo-th/
	*    Shoutgun Ammo worker launcher
	*/

	exports.engine = ( function () {

	    var type = 'LZMA'; // LZMA / WASM / ASM

	    var worker, callback, blob = null;


	    var URL = window.URL || window.webkitURL;
	    
	    var t = { now:0, delta:0, then:0, inter:0, tmp:0, n:0, timerate:0 };
	    var timer = undefined;
	    var stepNext = false;
	    var refView = null;
	    var isBuffer = false;

	    var PI90 = 1.570796326794896;

	    var rigidBody, softBody, terrains, vehicles, character, collision;

	    var option = {

	        worldscale: 1,
	        gravity: [0,-10,0],
	        fps: 60,

	        substep: 2,
	        broadphase: 2,
	        soft: true,

	    };

	    exports.engine = {

	        init: function ( Callback, Type, Option, Counts ) {

	            this.initArray( Counts );
	            this.defaultRoot();

	            Option = Option || {};

	            callback = Callback;

	            option = {
	                fps: Option.fps || 60,
	                worldscale: Option.worldscale || 1,
	                gravity: Option.gravity || [0,-10,0],
	                substep: Option.substep || 2,
	                broadphase: Option.broadphase || 2,
	                soft: Option.soft !== undefined ? Option.soft : true,

	                //penetration: Option.penetration || 0.0399,

	            };

	            t.timerate = ( 1 / option.fps ) * 1000;

	            type = Type || 'LZMA';
	            if( type === 'LZMA' ){ 
	                exports.engine.load( option );
	            } else {
	                blob = document.location.href.replace(/\/[^/]*$/,"/") + ( type === 'WASM' ? "./build/ammo.wasm.js" : "./build/ammo.js" );
	                exports.engine.startWorker();
	            }

	        },

	        load: function () {

	            var xhr = new XMLHttpRequest(); 
	            xhr.responseType = "arraybuffer";
	            xhr.open( 'GET', "./build/ammo.hex", true );

	            xhr.onreadystatechange = function () {

	                if ( xhr.readyState === 4 ) {
	                    if ( xhr.status === 200 || xhr.status === 0 ){
	                        blob = URL.createObjectURL( new Blob([ LZMAdecompact( xhr.response ) ], { type: 'application/javascript' }));
	                        exports.engine.startWorker();
	                    }else{ 
	                        console.error( "Couldn't load ["+ "./build/ammo.hex" + "] [" + xhr.status + "]" );
	                    }
	                }
	            };

	            xhr.send( null );

	        },

	        startWorker: function () {

	           //blob = document.location.href.replace(/\/[^/]*$/,"/") + "./build/ammo.js" ;

	            worker = new Worker('./build/gun.js');
	            worker.postMessage = worker.webkitPostMessage || worker.postMessage;
	            worker.onmessage = exports.engine.message;

	            // test transferrables
	            var ab = new ArrayBuffer(1);
	            worker.postMessage( { m:'test', ab:ab }, [ab] );
	            isBuffer = ab.byteLength ? false : true;

	            // start engine worker
	            exports.engine.post( 'init', { blob:blob, ArPos:root.ArPos, ArMax:root.ArMax, isBuffer:isBuffer, option:option } );
	            root.post = exports.engine.post;

	        },

	        initArray : function ( Counts ) {

	            Counts = Counts || {};

	            var counts = {
	                maxBody: Counts.maxBody || 1000,
	                maxContact: Counts.maxContact || 200,
	                maxCharacter: Counts.maxCharacter || 10, 
	                maxCar: Counts.maxCar || 14,
	                maxSoftPoint: Counts.maxSoftPoint || 8192,
	            };

	            root.ArLng = [ 
	                counts.maxBody * 8, // rigidbody
	                counts.maxContact , // contact
	                counts.maxCharacter * 8, // hero
	                counts.maxCar * 56, // cars
	                counts.maxSoftPoint * 3,  // soft point
	            ];

	            root.ArPos = [ 
	                0, 
	                root.ArLng[0], 
	                root.ArLng[0] + root.ArLng[1],
	                root.ArLng[0] + root.ArLng[1] + root.ArLng[2],
	                root.ArLng[0] + root.ArLng[1] + root.ArLng[2] + root.ArLng[3],
	            ];

	            root.ArMax = root.ArLng[0] + root.ArLng[1] + root.ArLng[2] + root.ArLng[3] + root.ArLng[4];

	        },

	        message: function( e ) {

	            var data = e.data;
	            if( data.Ar ) root.Ar = data.Ar;
	            //if( data.contacts ) contacts = data.contacts;

	            switch( data.m ){
	                case 'initEngine': exports.engine.initEngine(); break;
	                case 'start': exports.engine.start( data ); break;
	                case 'step': exports.engine.step(); break;
	                //case 'ellipsoid': if( refView ) refView.ellipsoidMesh( data.o ); break;
	                //case 'terrain': terrains.upGeo( data.o.name ); break;
	            }

	        },


	        initEngine: function () {

	            URL.revokeObjectURL( blob );
	            blob = null;

	            this.initObject();

	            console.log( 'AMMO.Worker '+ REVISION + ( isBuffer ? ' with ':' without ' ) + 'Buffer #'+ type );

	            if( callback ) callback();

	        },

	        start: function ( o ) {

	            stepNext = true;

	            // create tranfere array if buffer
	            if( isBuffer ) root.Ar = new Float32Array( root.ArMax );

	            if ( !timer ) timer = requestAnimationFrame( exports.engine.sendData );
	           
	        },

	        postUpdate: function () {},

	        step: function () {

	            if ( t.now - 1000 > t.tmp ){ t.tmp = t.now; t.fps = t.n; t.n = 0; } t.n++; // FPS

	            // TODO
	            
	            exports.engine.postUpdate();
	            exports.engine.steps();
	            if( refView ) refView.needUpdate( true );
	            //engine.updateContact();

	            stepNext = true;
	            
	        },

	        sendData: function ( time ){

	            if( refView ){
	                if( refView.pause ){ timer = null; return; }
	            }

	            timer = requestAnimationFrame( exports.engine.sendData );
	            t.now = time;
	            t.delta = t.now - t.then;

	            if ( t.delta > t.timerate ) {

	                t.then = t.now - ( t.delta % t.timerate );

	                if( stepNext ){

	                    if( isBuffer ) worker.postMessage( { m:'step',  o:{ key: exports.engine.getKey() }, Ar:root.Ar }, [ root.Ar.buffer ] );
	                    else worker.postMessage( { m:'step', o:{ key: exports.engine.getKey() } } );
	                    
	                    stepNext = false;

	                }

	                exports.engine.tell();

	            }

	        },

	        setView: function ( v ) { 

	            refView = v; 

	            root.mat = v.getMat();
	            root.geo = v.getGeo();
	            root.container = v.getScene();

	        },

	        getFps: function () { return t.fps; },

	        tell: function () {},
	        
	        getKey: function () { return [0,0,0,0,0,0,0,0]; },

	        set: function ( o ) {

	            o = o || option;
	            t.timerate = o.fps !== undefined ? (  1 / o.fps ) * 1000 : t.timerate;
	            this.post( 'set', o );

	        },

	        post: function ( m, o ) {

	            worker.postMessage( { m:m, o:o } );

	        },

	        reset: function( full ) {

	            if ( timer ) {
	               window.cancelAnimationFrame( timer );
	               timer = undefined;
	            }

	            // remove all mesh
	            exports.engine.clear();

	            // remove tmp material
	            while ( root.tmpMat.length > 0 ) root.tmpMat.pop().dispose();

	            exports.engine.postUpdate = function (){};
	            
	            if( refView ) refView.reset();

	            // clear physic object;
	            exports.engine.post( 'reset', { full:full } );

	        },

	        stop: function () {

	            if ( timer ) {
	               window.cancelAnimationFrame( timer );
	               timer = undefined;
	            }

	        },

	        destroy: function (){

	            worker.terminate();
	            worker = undefined;

	        },



	        ////////////////////////////

	        addMat : function ( m ) { root.tmpMat.push( m ); },

	        updateTmpMat : function ( envmap, hdr ) {
	            var i = root.tmpMat.length, m;
	            while( i-- ){
	                m = root.tmpMat[i];
	                if( m.envMap !== undefined ){
	                    if( m.type === 'MeshStandardMaterial' ) m.envMap = envmap;
	                    else m.envMap =  hdr ? null : envmap;
	                    m.needsUpdate = true;
	                }
	            }
	        },


	        drive: function ( name ) { this.post('setDrive', { name:name } ); },
	        move: function ( name ) { this.post('setMove', { name:name } ); },


	        forces: function ( o ) { this.post('setForces', o ); },
	        matrix: function ( o ) { this.post('setMatrix', o ); },
	        option: function ( o ) { this.post('setOption', o ); },
	        remove: function ( o ) { this.post('setRemove', o ); },

	        getBodys: function () {

	            return rigidBody.bodys;

	        },

	        byName: function ( name ) {

	            return map.get( name );

	        },

	        initObject: function () {

	            rigidBody = new RigidBody();
	            //constraint = new Constraint();
	            softBody = new SoftBody();
	            terrains = new Terrain();
	            vehicles = new Vehicle();
	            character = new Character();
	            collision = new Collision();

	            // auto define basic function
	            //if(!refView) this.defaultRoot();

	        },

	        steps: function () {

	            terrains.step();
	            rigidBody.step( root.Ar, root.ArPos[ 0 ] );
	            collision.step( root.Ar, root.ArPos[ 1 ] );
	            character.step( root.Ar, root.ArPos[ 2 ] );
	            vehicles.step( root.Ar, root.ArPos[ 3 ] );
	            softBody.step( root.Ar, root.ArPos[ 4 ] );

	        },

	        clear: function ( o ) {

	            rigidBody.clear();
	            collision.clear();
	            terrains.clear();
	            vehicles.clear();
	            character.clear();
	            softBody.clear();

	            while( root.extraGeo.length > 0 ) root.extraGeo.pop().dispose();

	        },


	        addGroup: function ( list ) {

	            for( var i = 0, lng = list.length; i < lng; i++ ){
	                this.add( list[i] );
	            }

	        },

	        add: function ( o ) {

	            o = o || {};
	            var type = o.type === undefined ? 'box' : o.type;
	            var prev = type.substring( 0, 4 );

	            if( prev === 'join' ) root.post( 'add', o );
	            else if( prev === 'soft' ) softBody.add( o );
	            else if( type === 'terrain' ) terrains.add( o );
	            else if( type === 'character' ) character.add( o );
	            else if( type === 'collision' ) collision.add( o );
	            else if( type === 'car' ) vehicles.add( o );
	            else return rigidBody.add( o );

	        },

	        defaultRoot: function () {

	            // geometry

	            var geo = {
	                circle:     new THREE.CircleBufferGeometry( 1,6 ),
	                plane:      new THREE.PlaneBufferGeometry(1,1,1,1),
	                box:        new THREE.BoxBufferGeometry(1,1,1),
	                hardbox:    new THREE.BoxBufferGeometry(1,1,1),
	                cone:       new THREE.CylinderBufferGeometry( 0,1,0.5 ),
	                wheel:      new THREE.CylinderBufferGeometry( 1,1,1, 18 ),
	                sphere:     new THREE.SphereBufferGeometry( 1, 16, 12 ),
	                highsphere: new THREE.SphereBufferGeometry( 1, 32, 24 ),
	                cylinder:   new THREE.CylinderBufferGeometry( 1,1,1,12,1 ),
	            };

	            geo.circle.rotateX( -PI90 );
	            geo.plane.rotateX( -PI90 );
	            geo.wheel.rotateZ( -PI90 );

	            root.geo = geo;

	            // material

	            var wire = false;
	            root.mat = {

	                move: new THREE.MeshLambertMaterial({ color:0xFF8811, name:'move', wireframe:wire }),
	                speed: new THREE.MeshLambertMaterial({ color:0xFFFF11, name:'speed', wireframe:wire }),
	                sleep: new THREE.MeshLambertMaterial({ color:0x1188FF, name:'sleep', wireframe:wire }),
	                basic: new THREE.MeshLambertMaterial({ color:0x111111, name:'basic', wireframe:wire }),
	                static: new THREE.MeshLambertMaterial({ color:0x1111FF, name:'static', wireframe:wire }),
	                kinematic: new THREE.MeshLambertMaterial({ color:0x11FF11, name:'kinematic', wireframe:wire }),

	            };

	            root.container = new THREE.Group();

	        },

	        getContainer: function () {

	            return root.container;

	        },
	        
	    };

	    return exports.engine;

	})();

	Object.defineProperty(exports, '__esModule', { value: true });

}));
