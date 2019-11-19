/*global THREE*/
import { ConvexHull } from './ConvexHull.js';


export function geometryInfo( g, type ) {

	var verticesOnly = false;
	var facesOnly = false;
	var withColor = true;

	if ( type == 'mesh' || type == 'convex' ) facesOnly = true;
	//if(type == 'convex') verticesOnly = true;

	var i, j, n, p, n2;

	var tmpGeo = g.isBufferGeometry ? new THREE.Geometry().fromBufferGeometry( g ) : g;
	tmpGeo.mergeVertices();

	var totalVertices = g.attributes.position.array.length / 3;
	var numVertices = tmpGeo.vertices.length;
	var numFaces = tmpGeo.faces.length;

	g.realVertices = new Float32Array( numVertices * 3 );
	g.realIndices = new ( numFaces * 3 > 65535 ? Uint32Array : Uint16Array )( numFaces * 3 );

	if ( withColor ) {

		g.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( totalVertices * 3 ), 3 ) );
		var cc = g.attributes.color.array;

		i = totalVertices;
		while ( i -- ) {

			n = i * 3;
			cc[ n ] = 1;
			cc[ n + 1 ] = 1;
			cc[ n + 2 ] = 1;

		}

	}

	i = numVertices;
	while ( i -- ) {

		p = tmpGeo.vertices[ i ];
		n = i * 3;
		g.realVertices[ n ] = p.x;
		g.realVertices[ n + 1 ] = p.y;
		g.realVertices[ n + 2 ] = p.z;

	}

	if ( verticesOnly ) {

		tmpGeo.dispose();
		return g.realVertices;

	}

	i = numFaces;
	while ( i -- ) {

		p = tmpGeo.faces[ i ];
		n = i * 3;
		g.realIndices[ n ] = p.a;
		g.realIndices[ n + 1 ] = p.b;
		g.realIndices[ n + 2 ] = p.c;

	}

	tmpGeo.dispose();

	//g.realIndices = g.getIndex();
	//g.setIndex(g.realIndices);

	if ( facesOnly ) {

		var faces = [];
		i = g.realIndices.length;
		while ( i -- ) {

			n = i * 3;
			p = g.realIndices[ i ] * 3;
			faces[ n ] = g.realVertices[ p ];
			faces[ n + 1 ] = g.realVertices[ p + 1 ];
			faces[ n + 2 ] = g.realVertices[ p + 2 ];

		}
		return faces;

	}

	// find same point
	var ar = [];
	var pos = g.attributes.position.array;
	i = numVertices;
	while ( i -- ) {

		n = i * 3;
		ar[ i ] = [];
		j = totalVertices;
		while ( j -- ) {

			n2 = j * 3;
			if ( pos[ n2 ] == g.realVertices[ n ] && pos[ n2 + 1 ] == g.realVertices[ n + 1 ] && pos[ n2 + 2 ] == g.realVertices[ n + 2 ] ) ar[ i ].push( j );

		}

	}

	// generate same point index
	var pPoint = new ( numVertices > 65535 ? Uint32Array : Uint16Array )( numVertices );
	var lPoint = new ( totalVertices > 65535 ? Uint32Array : Uint16Array )( totalVertices );

	p = 0;
	for ( i = 0; i < numVertices; i ++ ) {

		n = ar[ i ].length;
		pPoint[ i ] = p;
		j = n;
		while ( j -- ) {

			lPoint[ p + j ] = ar[ i ][ j ];

		}
		p += n;

	}

	g.numFaces = numFaces;
	g.numVertices = numVertices;
	g.maxi = totalVertices;
	g.pPoint = pPoint;
	g.lPoint = lPoint;

}


/**
* CAPSULE GEOMETRY
*/

function Capsule( radius, height, radialSegs, heightSegs ) {

	THREE.BufferGeometry.call( this );

	this.type = 'Capsule';

    radius = radius || 1;
    height = height || 1;

    var pi = Math.PI;

    radialSegs = Math.floor( radialSegs ) || 12;
    var sHeight = Math.floor( radialSegs * 0.5 );

    heightSegs = Math.floor( heightSegs ) || 1;
    var o0 = Math.PI * 2;
    var o1 = Math.PI * 0.5;
    var g = new THREE.Geometry();
    var m0 = new THREE.CylinderGeometry( radius, radius, height, radialSegs, heightSegs, true );

    var mr = new THREE.Matrix4();
    var m1 = new THREE.SphereGeometry( radius, radialSegs, sHeight, 0, o0, 0, o1);
    var m2 = new THREE.SphereGeometry( radius, radialSegs, sHeight, 0, o0, o1, o1);
    var mtx0 = new THREE.Matrix4().makeTranslation( 0,0,0 );
   // if(radialSegs===6) mtx0.makeRotationY( 30 * THREE.Math.DEG2RAD );
    var mtx1 = new THREE.Matrix4().makeTranslation(0, height*0.5,0);
    var mtx2 = new THREE.Matrix4().makeTranslation(0, -height*0.5,0);
    mr.makeRotationZ( pi );
    g.merge( m0, mtx0.multiply(mr) );
    g.merge( m1, mtx1);
    g.merge( m2, mtx2);

    g.mergeVertices();
    g.computeVertexNormals();

    m0.dispose();
    m1.dispose();
    m2.dispose();

    this.fromGeometry( g );

    g.dispose();

}

Capsule.prototype = Object.create( THREE.BufferGeometry.prototype );

export { Capsule };

/**
* CONVEX GEOMETRY
*/

function ConvexGeometry( points ) {

	THREE.Geometry.call( this );

	this.fromBufferGeometry( new ConvexBufferGeometry( points ) );
	this.mergeVertices();

}

ConvexGeometry.prototype = Object.create( THREE.Geometry.prototype );
ConvexGeometry.prototype.constructor = ConvexGeometry;

export { ConvexGeometry };

/**
* CONVEXBUFFER GEOMETRY
*/

function ConvexBufferGeometry( points ) {

	THREE.BufferGeometry.call( this );

	// buffers

	var vertices = [];
	var normals = [];

	// execute QuickHull

	var quickHull = new ConvexHull().setFromPoints( points );


	// generate vertices and normals

	var faces = quickHull.faces;

	for ( var i = 0; i < faces.length; i ++ ) {

		var face = faces[ i ];
		var edge = face.edge;

		// we move along a doubly-connected edge list to access all face points (see HalfEdge docs)

		do {

			var point = edge.head().point;

			vertices.push( point.x, point.y, point.z );
			normals.push( face.normal.x, face.normal.y, face.normal.z );

			edge = edge.next;

		} while ( edge !== face.edge );

	}

	// build geometry

	this.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
	this.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );

}

ConvexBufferGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
ConvexBufferGeometry.prototype.constructor = ConvexBufferGeometry;

export { ConvexBufferGeometry };
