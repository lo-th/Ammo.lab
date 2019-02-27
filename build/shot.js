(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.SHOT = {}));
}(this, function (exports) { 'use strict';

	/**
	 * @author Mugen87 / https://github.com/Mugen87
	 *
	 * Ported from: https://github.com/maurizzzio/quickhull3d/ by Mauricio Poppe (https://github.com/maurizzzio)
	 *
	 */


	var Visible = 0;
	var Deleted = 1;

	function QuickHull() {

		this.tolerance = - 1;

		this.faces = []; // the generated faces of the convex hull
		this.newFaces = []; // this array holds the faces that are generated within a single iteration

		// the vertex lists work as follows:
		//
		// let 'a' and 'b' be 'Face' instances
		// let 'v' be points wrapped as instance of 'Vertex'
		//
		//     [v, v, ..., v, v, v, ...]
		//      ^             ^
		//      |             |
		//  a.outside     b.outside
		//
		this.assigned = new VertexList();
		this.unassigned = new VertexList();

		this.vertices = []; 	// vertices of the hull (internal representation of given geometry data)

	}

	Object.assign( QuickHull.prototype, {

		setFromPoints: function ( points ) {

			if ( Array.isArray( points ) !== true ) {

				console.error( 'THREE.QuickHull: Points parameter is not an array.' );

			}

			if ( points.length < 4 ) {

				console.error( 'THREE.QuickHull: The algorithm needs at least four points.' );

			}

			this.makeEmpty();

			for ( var i = 0, l = points.length; i < l; i ++ ) {

				this.vertices.push( new VertexNode( points[ i ] ) );

			}

			this.compute();

			return this;

		},

		setFromObject: function ( object ) {

			var points = [];

			object.updateMatrixWorld( true );

			object.traverse( function ( node ) {

				var i, l, point;

				var geometry = node.geometry;

				if ( geometry !== undefined ) {

					if ( geometry.isGeometry ) {

						var vertices = geometry.vertices;

						for ( i = 0, l = vertices.length; i < l; i ++ ) {

							point = vertices[ i ].clone();
							point.applyMatrix4( node.matrixWorld );

							points.push( point );

						}

					} else if ( geometry.isBufferGeometry ) {

						var attribute = geometry.attributes.position;

						if ( attribute !== undefined ) {

							for ( i = 0, l = attribute.count; i < l; i ++ ) {

								point = new THREE.Vector3();

								point.fromBufferAttribute( attribute, i ).applyMatrix4( node.matrixWorld );

								points.push( point );

							}

						}

					}

				}

			} );

			return this.setFromPoints( points );

		},

		makeEmpty: function () {

			this.faces = [];
			this.vertices = [];

			return this;

		},

		// Adds a vertex to the 'assigned' list of vertices and assigns it to the given face

		addVertexToFace: function ( vertex, face ) {

			vertex.face = face;

			if ( face.outside === null ) {

				this.assigned.append( vertex );

			} else {

				this.assigned.insertBefore( face.outside, vertex );

			}

			face.outside = vertex;

			return this;

		},

		// Removes a vertex from the 'assigned' list of vertices and from the given face

		removeVertexFromFace: function ( vertex, face ) {

			if ( vertex === face.outside ) {

				// fix face.outside link

				if ( vertex.next !== null && vertex.next.face === face ) {

					// face has at least 2 outside vertices, move the 'outside' reference

					face.outside = vertex.next;

				} else {

					// vertex was the only outside vertex that face had

					face.outside = null;

				}

			}

			this.assigned.remove( vertex );

			return this;

		},

		// Removes all the visible vertices that a given face is able to see which are stored in the 'assigned' vertext list

		removeAllVerticesFromFace: function ( face ) {

			if ( face.outside !== null ) {

				// reference to the first and last vertex of this face

				var start = face.outside;
				var end = face.outside;

				while ( end.next !== null && end.next.face === face ) {

					end = end.next;

				}

				this.assigned.removeSubList( start, end );

				// fix references

				start.prev = end.next = null;
				face.outside = null;

				return start;

			}

		},

		// Removes all the visible vertices that 'face' is able to see

		deleteFaceVertices: function ( face, absorbingFace ) {

			var faceVertices = this.removeAllVerticesFromFace( face );

			if ( faceVertices !== undefined ) {

				if ( absorbingFace === undefined ) {

					// mark the vertices to be reassigned to some other face

					this.unassigned.appendChain( faceVertices );


				} else {

					// if there's an absorbing face try to assign as many vertices as possible to it

					var vertex = faceVertices;

					do {

						// we need to buffer the subsequent vertex at this point because the 'vertex.next' reference
						// will be changed by upcoming method calls

						var nextVertex = vertex.next;

						var distance = absorbingFace.distanceToPoint( vertex.point );

						// check if 'vertex' is able to see 'absorbingFace'

						if ( distance > this.tolerance ) {

							this.addVertexToFace( vertex, absorbingFace );

						} else {

							this.unassigned.append( vertex );

						}

						// now assign next vertex

						vertex = nextVertex;

					} while ( vertex !== null );

				}

			}

			return this;

		},

		// Reassigns as many vertices as possible from the unassigned list to the new faces

		resolveUnassignedPoints: function ( newFaces ) {

			if ( this.unassigned.isEmpty() === false ) {

				var vertex = this.unassigned.first();

				do {

					// buffer 'next' reference, see .deleteFaceVertices()

					var nextVertex = vertex.next;

					var maxDistance = this.tolerance;

					var maxFace = null;

					for ( var i = 0; i < newFaces.length; i ++ ) {

						var face = newFaces[ i ];

						if ( face.mark === Visible ) {

							var distance = face.distanceToPoint( vertex.point );

							if ( distance > maxDistance ) {

								maxDistance = distance;
								maxFace = face;

							}

							if ( maxDistance > 1000 * this.tolerance ) break;

						}

					}

					// 'maxFace' can be null e.g. if there are identical vertices

					if ( maxFace !== null ) {

						this.addVertexToFace( vertex, maxFace );

					}

					vertex = nextVertex;

				} while ( vertex !== null );

			}

			return this;

		},

		// Computes the extremes of a simplex which will be the initial hull

		computeExtremes: function () {

			var min = new THREE.Vector3();
			var max = new THREE.Vector3();

			var minVertices = [];
			var maxVertices = [];

			var i, l, j;

			// initially assume that the first vertex is the min/max

			for ( i = 0; i < 3; i ++ ) {

				minVertices[ i ] = maxVertices[ i ] = this.vertices[ 0 ];

			}

			min.copy( this.vertices[ 0 ].point );
			max.copy( this.vertices[ 0 ].point );

			// compute the min/max vertex on all six directions

			for ( i = 0, l = this.vertices.length; i < l; i ++ ) {

				var vertex = this.vertices[ i ];
				var point = vertex.point;

				// update the min coordinates

				for ( j = 0; j < 3; j ++ ) {

					if ( point.getComponent( j ) < min.getComponent( j ) ) {

						min.setComponent( j, point.getComponent( j ) );
						minVertices[ j ] = vertex;

					}

				}

				// update the max coordinates

				for ( j = 0; j < 3; j ++ ) {

					if ( point.getComponent( j ) > max.getComponent( j ) ) {

						max.setComponent( j, point.getComponent( j ) );
						maxVertices[ j ] = vertex;

					}

				}

			}

			// use min/max vectors to compute an optimal epsilon

			this.tolerance = 3 * Number.EPSILON * (
				Math.max( Math.abs( min.x ), Math.abs( max.x ) ) +
				Math.max( Math.abs( min.y ), Math.abs( max.y ) ) +
				Math.max( Math.abs( min.z ), Math.abs( max.z ) )
			);

			return { min: minVertices, max: maxVertices };

		},

		// Computes the initial simplex assigning to its faces all the points
		// that are candidates to form part of the hull

		computeInitialHull: function () {

			var line3, plane, closestPoint;

			return function computeInitialHull() {

				if ( line3 === undefined ) {

					line3 = new THREE.Line3();
					plane = new THREE.Plane();
					closestPoint = new THREE.Vector3();

				}

				var vertex, vertices = this.vertices;
				var extremes = this.computeExtremes();
				var min = extremes.min;
				var max = extremes.max;

				var v0, v1, v2, v3;
				var i, l, j;

				// 1. Find the two vertices 'v0' and 'v1' with the greatest 1d separation
				// (max.x - min.x)
				// (max.y - min.y)
				// (max.z - min.z)

				var distance, maxDistance = 0;
				var index = 0;

				for ( i = 0; i < 3; i ++ ) {

					distance = max[ i ].point.getComponent( i ) - min[ i ].point.getComponent( i );

					if ( distance > maxDistance ) {

						maxDistance = distance;
						index = i;

					}

				}

				v0 = min[ index ];
				v1 = max[ index ];

				// 2. The next vertex 'v2' is the one farthest to the line formed by 'v0' and 'v1'

				maxDistance = 0;
				line3.set( v0.point, v1.point );

				for ( i = 0, l = this.vertices.length; i < l; i ++ ) {

					vertex = vertices[ i ];

					if ( vertex !== v0 && vertex !== v1 ) {

						line3.closestPointToPoint( vertex.point, true, closestPoint );

						distance = closestPoint.distanceToSquared( vertex.point );

						if ( distance > maxDistance ) {

							maxDistance = distance;
							v2 = vertex;

						}

					}

				}

				// TODO resolve bug
				if(!v2){ console.log('bug v2'); return;}

				// 3. The next vertex 'v3' is the one farthest to the plane 'v0', 'v1', 'v2'

				maxDistance = - 1;
				plane.setFromCoplanarPoints( v0.point, v1.point, v2.point );

				for ( i = 0, l = this.vertices.length; i < l; i ++ ) {

					vertex = vertices[ i ];

					if ( vertex !== v0 && vertex !== v1 && vertex !== v2 ) {

						distance = Math.abs( plane.distanceToPoint( vertex.point ) );

						if ( distance > maxDistance ) {

							maxDistance = distance;
							v3 = vertex;

						}

					}

				}

				var faces = [];

				if ( plane.distanceToPoint( v3.point ) < 0 ) {

					// the face is not able to see the point so 'plane.normal' is pointing outside the tetrahedron

					faces.push(
						Face.create( v0, v1, v2 ),
						Face.create( v3, v1, v0 ),
						Face.create( v3, v2, v1 ),
						Face.create( v3, v0, v2 )
					);

					// set the twin edge

					for ( i = 0; i < 3; i ++ ) {

						j = ( i + 1 ) % 3;

						// join face[ i ] i > 0, with the first face

						faces[ i + 1 ].getEdge( 2 ).setTwin( faces[ 0 ].getEdge( j ) );

						// join face[ i ] with face[ i + 1 ], 1 <= i <= 3

						faces[ i + 1 ].getEdge( 1 ).setTwin( faces[ j + 1 ].getEdge( 0 ) );

					}

				} else {

					// the face is able to see the point so 'plane.normal' is pointing inside the tetrahedron

					faces.push(
						Face.create( v0, v2, v1 ),
						Face.create( v3, v0, v1 ),
						Face.create( v3, v1, v2 ),
						Face.create( v3, v2, v0 )
					);

					// set the twin edge

					for ( i = 0; i < 3; i ++ ) {

						j = ( i + 1 ) % 3;

						// join face[ i ] i > 0, with the first face

						faces[ i + 1 ].getEdge( 2 ).setTwin( faces[ 0 ].getEdge( ( 3 - i ) % 3 ) );

						// join face[ i ] with face[ i + 1 ]

						faces[ i + 1 ].getEdge( 0 ).setTwin( faces[ j + 1 ].getEdge( 1 ) );

					}

				}

				// the initial hull is the tetrahedron

				for ( i = 0; i < 4; i ++ ) {

					this.faces.push( faces[ i ] );

				}

				// initial assignment of vertices to the faces of the tetrahedron

				for ( i = 0, l = vertices.length; i < l; i ++ ) {

					vertex = vertices[ i ];

					if ( vertex !== v0 && vertex !== v1 && vertex !== v2 && vertex !== v3 ) {

						maxDistance = this.tolerance;
						var maxFace = null;

						for ( j = 0; j < 4; j ++ ) {

							distance = this.faces[ j ].distanceToPoint( vertex.point );

							if ( distance > maxDistance ) {

								maxDistance = distance;
								maxFace = this.faces[ j ];

							}

						}

						if ( maxFace !== null ) {

							this.addVertexToFace( vertex, maxFace );

						}

					}

				}

				return this;

			};

		}(),

		// Removes inactive faces

		reindexFaces: function () {

			var activeFaces = [];

			for ( var i = 0; i < this.faces.length; i ++ ) {

				var face = this.faces[ i ];

				if ( face.mark === Visible ) {

					activeFaces.push( face );

				}

			}

			this.faces = activeFaces;

			return this;

		},

		// Finds the next vertex to create faces with the current hull

		nextVertexToAdd: function () {

			// if the 'assigned' list of vertices is empty, no vertices are left. return with 'undefined'

			if ( this.assigned.isEmpty() === false ) {

				var eyeVertex, maxDistance = 0;

				// grap the first available face and start with the first visible vertex of that face

				var eyeFace = this.assigned.first().face;
				var vertex = eyeFace.outside;

				// now calculate the farthest vertex that face can see

				do {

					var distance = eyeFace.distanceToPoint( vertex.point );

					if ( distance > maxDistance ) {

						maxDistance = distance;
						eyeVertex = vertex;

					}

					vertex = vertex.next;

				} while ( vertex !== null && vertex.face === eyeFace );

				return eyeVertex;

			}

		},

		// Computes a chain of half edges in CCW order called the 'horizon'.
		// For an edge to be part of the horizon it must join a face that can see
		// 'eyePoint' and a face that cannot see 'eyePoint'.

		computeHorizon: function ( eyePoint, crossEdge, face, horizon ) {

			// moves face's vertices to the 'unassigned' vertex list

			this.deleteFaceVertices( face );

			face.mark = Deleted;

			var edge;

			if ( crossEdge === null ) {

				edge = crossEdge = face.getEdge( 0 );

			} else {

				// start from the next edge since 'crossEdge' was already analyzed
				// (actually 'crossEdge.twin' was the edge who called this method recursively)

				edge = crossEdge.next;

			}

			do {

				var twinEdge = edge.twin;
				var oppositeFace = twinEdge.face;

				if ( oppositeFace.mark === Visible ) {

					if ( oppositeFace.distanceToPoint( eyePoint ) > this.tolerance ) {

						// the opposite face can see the vertex, so proceed with next edge

						this.computeHorizon( eyePoint, twinEdge, oppositeFace, horizon );

					} else {

						// the opposite face can't see the vertex, so this edge is part of the horizon

						horizon.push( edge );

					}

				}

				edge = edge.next;

			} while ( edge !== crossEdge );

			return this;

		},

		// Creates a face with the vertices 'eyeVertex.point', 'horizonEdge.tail' and 'horizonEdge.head' in CCW order

		addAdjoiningFace: function ( eyeVertex, horizonEdge ) {

			// all the half edges are created in ccw order thus the face is always pointing outside the hull

			var face = Face.create( eyeVertex, horizonEdge.tail(), horizonEdge.head() );

			this.faces.push( face );

			// join face.getEdge( - 1 ) with the horizon's opposite edge face.getEdge( - 1 ) = face.getEdge( 2 )

			face.getEdge( - 1 ).setTwin( horizonEdge.twin );

			return face.getEdge( 0 ); // the half edge whose vertex is the eyeVertex


		},

		//  Adds 'horizon.length' faces to the hull, each face will be linked with the
		//  horizon opposite face and the face on the left/right

		addNewFaces: function ( eyeVertex, horizon ) {

			this.newFaces = [];

			var firstSideEdge = null;
			var previousSideEdge = null;

			for ( var i = 0; i < horizon.length; i ++ ) {

				var horizonEdge = horizon[ i ];

				// returns the right side edge

				var sideEdge = this.addAdjoiningFace( eyeVertex, horizonEdge );

				if ( firstSideEdge === null ) {

					firstSideEdge = sideEdge;

				} else {

					// joins face.getEdge( 1 ) with previousFace.getEdge( 0 )

					sideEdge.next.setTwin( previousSideEdge );

				}

				this.newFaces.push( sideEdge.face );
				previousSideEdge = sideEdge;

			}

			// perform final join of new faces

			firstSideEdge.next.setTwin( previousSideEdge );

			return this;

		},

		// Adds a vertex to the hull

		addVertexToHull: function ( eyeVertex ) {

			var horizon = [];

			this.unassigned.clear();

			// remove 'eyeVertex' from 'eyeVertex.face' so that it can't be added to the 'unassigned' vertex list

			this.removeVertexFromFace( eyeVertex, eyeVertex.face );

			this.computeHorizon( eyeVertex.point, null, eyeVertex.face, horizon );

			this.addNewFaces( eyeVertex, horizon );

			// reassign 'unassigned' vertices to the new faces

			this.resolveUnassignedPoints( this.newFaces );

			return	this;

		},

		cleanup: function () {

			this.assigned.clear();
			this.unassigned.clear();
			this.newFaces = [];

			return this;

		},

		compute: function () {

			var vertex;

			this.computeInitialHull();

			// add all available vertices gradually to the hull

			while ( ( vertex = this.nextVertexToAdd() ) !== undefined ) {

				this.addVertexToHull( vertex );

			}

			this.reindexFaces();

			this.cleanup();

			return this;

		}

	});

	// FACE

	function Face() {

		this.normal = new THREE.Vector3();
		this.midpoint = new THREE.Vector3();
		this.area = 0;

		this.constant = 0; // signed distance from face to the origin
		this.outside = null; // reference to a vertex in a vertex list this face can see
		this.mark = Visible;
		this.edge = null;

	}

	Object.assign( Face, {

		create: function ( a, b, c ) {

			var face = new Face();

			var e0 = new HalfEdge( a, face );
			var e1 = new HalfEdge( b, face );
			var e2 = new HalfEdge( c, face );

			// join edges

			e0.next = e2.prev = e1;
			e1.next = e0.prev = e2;
			e2.next = e1.prev = e0;

			// main half edge reference

			face.edge = e0;

			return face.compute();

		}

	} );

	Object.assign( Face.prototype, {

		getEdge: function ( i ) {

			var edge = this.edge;

			while ( i > 0 ) {

				edge = edge.next;
				i --;

			}

			while ( i < 0 ) {

				edge = edge.prev;
				i ++;

			}

			return edge;

		},

		compute: function () {

			var triangle;

			return function compute() {

				if ( triangle === undefined ) triangle = new THREE.Triangle();

				var a = this.edge.tail();
				var b = this.edge.head();
				var c = this.edge.next.head();

				triangle.set( a.point, b.point, c.point );

				triangle.getNormal( this.normal );
				triangle.getMidpoint( this.midpoint );
				this.area = triangle.getArea();

				this.constant = this.normal.dot( this.midpoint );

				return this;

			};

		}(),

		distanceToPoint: function ( point ) {

			return this.normal.dot( point ) - this.constant;

		}

	} );

	// Entity for a Doubly-Connected Edge List (DCEL).

	function HalfEdge( vertex, face ) {

		this.vertex = vertex;
		this.prev = null;
		this.next = null;
		this.twin = null;
		this.face = face;

	}

	Object.assign( HalfEdge.prototype, {

		head: function () {

			return this.vertex;

		},

		tail: function () {

			return this.prev ? this.prev.vertex : null;

		},

		length: function () {

			var head = this.head();
			var tail = this.tail();

			if ( tail !== null ) {

				return tail.point.distanceTo( head.point );

			}

			return - 1;

		},

		lengthSquared: function () {

			var head = this.head();
			var tail = this.tail();

			if ( tail !== null ) {

				return tail.point.distanceToSquared( head.point );

			}

			return - 1;

		},

		setTwin: function ( edge ) {

			this.twin = edge;
			edge.twin = this;

			return this;

		}

	} );

	// A vertex as a double linked list node.

	function VertexNode( point ) {

		this.point = point;
		this.prev = null;
		this.next = null;
		this.face = null; // the face that is able to see this vertex

	}

	// A double linked list that contains vertex nodes.

	function VertexList() {

		this.head = null;
		this.tail = null;

	}

	Object.assign( VertexList.prototype, {

		first: function () {

			return this.head;

		},

		last: function () {

			return this.tail;

		},

		clear: function () {

			this.head = this.tail = null;

			return this;

		},

		// Inserts a vertex before the target vertex

		insertBefore: function ( target, vertex ) {

			vertex.prev = target.prev;
			vertex.next = target;

			if ( vertex.prev === null ) {

				this.head = vertex;

			} else {

				vertex.prev.next = vertex;

			}

			target.prev = vertex;

			return this;

		},

		// Inserts a vertex after the target vertex

		insertAfter: function ( target, vertex ) {

			vertex.prev = target;
			vertex.next = target.next;

			if ( vertex.next === null ) {

				this.tail = vertex;

			} else {

				vertex.next.prev = vertex;

			}

			target.next = vertex;

			return this;

		},

		// Appends a vertex to the end of the linked list

		append: function ( vertex ) {

			if ( this.head === null ) {

				this.head = vertex;

			} else {

				this.tail.next = vertex;

			}

			vertex.prev = this.tail;
			vertex.next = null; // the tail has no subsequent vertex

			this.tail = vertex;

			return this;

		},

		// Appends a chain of vertices where 'vertex' is the head.

		appendChain: function ( vertex ) {

			if ( this.head === null ) {

				this.head = vertex;

			} else {

				this.tail.next = vertex;

			}

			vertex.prev = this.tail;

			// ensure that the 'tail' reference points to the last vertex of the chain

			while ( vertex.next !== null ) {

				vertex = vertex.next;

			}

			this.tail = vertex;

			return this;

		},

		// Removes a vertex from the linked list

		remove: function ( vertex ) {

			if ( vertex.prev === null ) {

				this.head = vertex.next;

			} else {

				vertex.prev.next = vertex.next;

			}

			if ( vertex.next === null ) {

				this.tail = vertex.prev;

			} else {

				vertex.next.prev = vertex.prev;

			}

			return this;

		},

		// Removes a list of vertices whose 'head' is 'a' and whose 'tail' is b

		removeSubList: function ( a, b ) {

			if ( a.prev === null ) {

				this.head = b.next;

			} else {

				a.prev.next = b.next;

			}

			if ( b.next === null ) {

				this.tail = a.prev;

			} else {

				b.next.prev = a.prev;

			}

			return this;

		},

		isEmpty: function () {

			return this.head === null;

		}

	} );

	/*global THREE*/


	function geometryInfo ( g, type ) {
	    var facesOnly = false;

	    if(type == 'mesh' || type == 'convex') facesOnly = true;
	    //if(type == 'convex') verticesOnly = true;

	    var i, j, n, p, n2;

	    var tmpGeo = g.isBufferGeometry ? new THREE.Geometry().fromBufferGeometry( g ) : g;
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


	/**
	* CAPSULE GEOMETRY
	*/

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

	/**
	* CONVEXBUFFER GEOMETRY
	*/

	function ConvexBufferGeometry( points ) {

	    THREE.BufferGeometry.call( this );

	    // buffers

	    var vertices = [];
	    var normals = [];

	    // execute QuickHull

	    var quickHull = new QuickHull().setFromPoints( points );

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

	    this.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
	    this.addAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );

	}

	ConvexBufferGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
	ConvexBufferGeometry.prototype.constructor = ConvexBufferGeometry;

	// ROOT reference of engine

	var REVISION = '002';

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

		torad: 0.0174532925199432957,

	};

	// ROW map

	var map = new Map();


	function vectorad( r ) {

	    var i = r.length;
	    while(i--) r[i] *= root.torad;
	    return r;

	}

	/*global THREE*/

	function RigidBody() {

		this.ID = 0;
		this.solids = [];
		this.bodys = [];

	}

	Object.assign( RigidBody.prototype, {

		step: function ( AR, N ) {

			//var AR = root.Ar;
			//var N = root.ArPos[ 0 ];

			var n;

			this.bodys.forEach( function ( b, id ) {


				n = N + ( id * 8 );

				//if( AR[n] + AR[n+1] + AR[n+2] + AR[n+3] !== 0 || b.isKinemmatic ) {

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
		        //}

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

		add: function ( o, extra ) {

			o.name = o.name !== undefined ? o.name : 'body' + this.ID ++;
			// delete old if same name
			this.remove( o.name );

			if( o.breakable ){
	            if( o.type==='hardbox' || o.type==='box' || o.type==='sphere' || o.type==='cylinder' || o.type==='cone' ) o.type = 'real'+o.type;
	        }

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
		    o.rot = o.rot === undefined ? [0,0,0] : vectorad( o.rot );
		    o.quat = o.quat === undefined ? new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( o.rot ) ).toArray() : o.quat;

		    if( o.rotA ) o.quatA = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( vectorad( o.rotA ) ) ).toArray();
		    if( o.rotB ) o.quatB = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( vectorad( o.rotB ) ) ).toArray();

		    if( o.angUpper ) o.angUpper = vectorad( o.angUpper );
		    if( o.angLower ) o.angLower = vectorad( o.angLower );

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

		    if( o.type === 'compound') {

		    	var m, g;
			    for( var i = 0; i < o.shapes.length; i++ ){

		    		g = o.shapes[i];
		    		g.size = g.size === undefined ? [ 1, 1, 1 ] : g.size;
		    		if( g.size.length === 1 ){ g.size[1] = g.size[0]; }
		            if( g.size.length === 2 ){ g.size[2] = g.size[0]; }
		            g.pos = g.pos === undefined ? [ 0, 0, 0 ] : g.pos;
		    		g.rot = g.rot === undefined ? [0,0,0] : vectorad( g.rot );
	                g.quat = g.quat === undefined ? new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( g.rot ) ).toArray() : g.quat;

		    	}

		    	mesh = o.geometry ? new THREE.Mesh( o.geometry, material ) : new THREE.Group();

		    	if( o.geometry )  root.extraGeo.push( o.geometry );
		    	 
		    	if( !o.geometry || o.debug ){

		    		//mesh = new THREE.Group();
		    		mesh.material = material;// TODO fix
			    	var m, g;
			    	for( var i = 0; i < o.shapes.length; i++ ){

			    		g = o.shapes[i];
			    		if( g.type === 'box' ) g.type = 'hardbox';
			    		if( g.type === 'cylinder' ) g.type = 'hardcylinder';
			    		m = new THREE.Mesh( g.type === 'capsule' ? new Capsule( o.size[0] , o.size[1]*0.5 ) : root.geo[g.type], o.debug ? root.mat.debug : material );
			    		m.scale.fromArray( g.size );
			    		m.position.fromArray( g.pos );
		                m.quaternion.fromArray( g.quat );

			    		mesh.add( m );

			    	}
		    	}

		    } else if ( o.type === 'mesh' || o.type === 'convex' ){

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
		    	if( o.type === 'realbox' ||  o.type === 'realhardbox') o.geometry = new THREE.BoxBufferGeometry( o.size[0], o.size[1], o.size[2] );
		    	if( o.type === 'realsphere' ) o.geometry = new THREE.SphereBufferGeometry( o.size[0], 16, 12 );
		    	if( o.type === 'realcylinder' ) o.geometry = new THREE.CylinderBufferGeometry( o.size[0], o.size[0], o.size[1]*0.5,12,1 );
		    	if( o.type === 'realcone' ) o.geometry = new THREE.CylinderBufferGeometry( 0, o.size[0]*0.5, o.size[1]*0.55,12,1 );
		    	

		        if( o.geometry ){

		            if( o.geoRot || o.geoScale ) o.geometry = o.geometry.clone();
		            // rotation only geometry
		            if( o.geoRot ) o.geometry.applyMatrix(new THREE.Matrix4().makeRotationFromEuler( new THREE.Euler().fromArray( vectorad(o.geoRot))));
		            // scale only geometry
		            if( o.geoScale ) o.geometry.applyMatrix( new THREE.Matrix4().makeScale( o.geoScale[0], o.geoScale[1], o.geoScale[2] ) );
		            
		        }

		        mesh = new THREE.Mesh( o.geometry || root.geo[o.type], material );

		        if( o.geometry ){

		            root.extraGeo.push( o.geometry );
		            if( o.geoSize ) mesh.scale.fromArray( o.geoSize );// ??
		            //if( !o.geoSize && o.size && o.type !== 'capsule' ) mesh.scale.fromArray( o.size );
		            customGeo = true;
		        }

		    }

		    if(o.type ==='highsphere') o.type = 'sphere';


		    if( mesh ){

		        if( !customGeo ) mesh.scale.fromArray( o.size );

		        // out of view on start
		        //mesh.position.set(0,-1000000,0);
		        mesh.position.fromArray( o.pos );
		        mesh.quaternion.fromArray( o.quat );

		        mesh.receiveShadow = true;
		        mesh.castShadow = o.mass === 0 && ! o.kinematic ? false : true;

		        mesh.updateMatrix();

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
		    	//mesh.userData.mass = o.mass;
		    	mesh.userData.mass = o.mass;
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

	         // material

	        var material;
	        if( o.material !== undefined ){ 

	            if( o.material.constructor === String ) material = root.mat[o.material];
	            else material = o.material;
	        
	        } else { 

	            material = root.mat.soft;

	        }

			var tmp, mesh;

			switch( o.type ) {
				case 'softMesh': case 'softTriMesh': tmp = softMesh( o, material ); break;
				case 'softConvex': tmp = softMesh( o, material ); break;
				case 'softCloth': tmp = softCloth( o, material ); break;
				case 'softRope': tmp = softRope( o, material ); break;

				case 'softEllips':// tmp = ellipsoid( o ); 
	                root.post( 'add', o );
	                return;
	            break;
			}

			mesh = tmp.mesh;
			o = tmp.o;

			mesh.name = name;
	        mesh.isSoft = true;


		    root.container.add( mesh );
	        this.softs.push( mesh );
			map.set( name, mesh );

			root.post( 'add', o );

		},

	    createEllipsoid: function ( o ) {

	        var mesh = ellipsoid( o );
	        //o = tmp.o;

	        mesh.name = o.name;
	        root.container.add( mesh );
	        this.softs.push( mesh );
	        map.set( o.name, mesh );

	    },

		/////



	} );



	//--------------------------------------
	//   SOFT TRIMESH
	//--------------------------------------

	function softMesh( o, material ) {

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

	    

	    //var material = o.material === undefined ? root.mat.soft : root.mat[o.material];
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

	/*export function softConvex( o, material ) {

	    var g = o.shape.clone();
	    var pos = o.pos || [0,0,0];
	    var size = o.size || [1,1,1];
	    var rot = o.rot || [0,0,0];

	    g.translate( pos[0], pos[1], pos[2] );
	    g.scale( size[0], size[1], size[2] );
	    // g.applyMatrix( new THREE.Matrix4().makeRotationY(rot[1] *= Math.torad ));

	    geometryInfo( g );

	    root.extraGeo.push( g );

	    o.v = g.realVertices;

	    //var material = o.material === undefined ? root.mat.soft : root.mat[o.material];
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

	};*/


	function softCloth ( o, material ) {

	    var div = o.div || [16,16];
	    var size = o.size || [100,0,100];
	    var pos = o.pos || [0,0,0];

	    var max = div[0] * div[1];

	    var g = new THREE.PlaneBufferGeometry( size[0], size[2], div[0] - 1, div[1] - 1 );
	    g.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( max*3 ), 3 ) );
	    g.rotateX( -Math.PI90 );
	    //g.translate( -size[0]*0.5, 0, -size[2]*0.5 );

	    //var numVerts = g.attributes.position.array.length / 3;

	    var mesh = new THREE.Mesh( g, material );

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

	function softRope ( o, material ) {

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

	    var mesh = new THREE.Mesh( g, material );

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
	*/
	function ellipsoid( o ) {

	    var max = o.lng;
	    var points = [];
	    var ar = o.a;
	    var i, j, k, v, n;
	    
	    // create temp convex geometry and convert to buffergeometry
	    for( i = 0; i<max; i++ ){
	        n = i*3;
	        points.push( new THREE.Vector3(ar[n], ar[n+1], ar[n+2]));
	    }



	    var gt = new ConvexGeometry( points );

	    
	    var indices = new Uint32Array( gt.faces.length * 3 );
	    var vertices = new Float32Array( max * 3 );
	    var order = new Float32Array( max );
	    //var normals = new Float32Array( max * 3 );

	    

	    

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

	   
	    i = max;
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


	    //gt.computeVertexNormals();
	    //gt.computeFaceNormals();


	    //console.log(gtt.vertices.length)
	    var g = new THREE.BufferGeometry();//.fromDirectGeometry( gt );

	    g.setIndex( new THREE.BufferAttribute( indices, 1 ) );
	    g.addAttribute('position', new THREE.BufferAttribute( vertices, 3 ) );
	    g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
	    g.addAttribute('order', new THREE.BufferAttribute( order, 1 ));
	    
	    //g.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );

	    if(gt.uvs){
	        var uvs = new Float32Array( gt.uvs.length * 2 );
	        g.addAttribute( 'uv', new  THREE.BufferAttribute( uvs, 2 ).copyVector2sArray( gt.uvs ), 2 ) ;
	    }
	    

	    g.computeVertexNormals();

	    root.extraGeo.push( g );


	    gt.dispose();


	    //g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
	    var mesh = new THREE.Mesh( g, root.mat.soft );

	    //mesh.idx = view.setIdx( softs.length, 'softs' );

	    //this.byName[ o.name ] = mesh;

	    //this.setName( o, mesh );

	    mesh.softType = 3;
	    mesh.isSoft = true;
	    mesh.points = g.attributes.position.array.length / 3;

	    //console.log( mesh.points )

	    mesh.castShadow = true;
	    mesh.receiveShadow = true;

	    return mesh;

	    //this.scene.add( mesh );
	    //this.softs.push( mesh );

	}

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

		    var material;
		    if( o.material !== undefined ){ 
		    	if( o.material.constructor === String ) material = root.mat[o.material];
		    	else material = o.material;
		    } else {
		    	material = root.mat.hero;
		    }

		    var g = new THREE.CapsuleBufferGeometry( o.size[0], o.size[1]*0.5, 6 );

		    var mesh = new THREE.Group();//o.mesh || new THREE.Mesh( g );

		    if( o.debug ){

		        var mm = new THREE.Mesh( g, root.mat.debug );
		        root.extraGeo.push( g );
		        mesh.add( mm );

		    }
		    
		    if( o.mesh ){

		        var model = o.mesh;
		        model.material = material;
		        model.scale.multiplyScalar( o.scale || 1 );
		        model.position.set(0,0,0);
		        
		        model.setTimeScale( 0.5 );
		        model.play(0);

		        mesh.add( model );
		        mesh.skin = model;

		        //this.extraGeo.push( mesh.skin.geometry );
		        
		    } else {

		        var mx = new THREE.Mesh( g, material );
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

		    if( o.material ) delete( o.material );
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

	/*global THREE*/

	function RayCaster() {

		this.rays = [];

	}

	Object.assign( RayCaster.prototype, {

		step: function () {

			if( !this.rays.length ) return;

			var raytest = [];

			this.rays.forEach( function ( r, id ) {

				r.updateMatrixWorld();
				raytest.push( { origin:r.origin.toArray(), dest:r.dest.toArray() } );

			});

			root.post( 'rayCast', raytest );

		},

		receive: function ( o ) {

			var i = o.length;
			while(i--) this.rays[i].update( o[i] );

		},

		clear: function () {

			while ( this.rays.length > 0 ) this.destroy( this.rays.pop() );

		},

		destroy: function ( r ) {

			if ( r.parent ) r.parent.remove( r );

		},

		add: function ( o ) {

			var ray = new Ray(o);

			if( o.parent !== undefined ) o.parent.add( ray );
		    else root.container.add( ray );

			this.rays.push( ray );

			return ray;

		},

	} );

	//--------------------------------------
	//   RAY CLASS
	//--------------------------------------

	function Ray( o ) {


		THREE.Line.call( this );

		this.position.fromArray( o.pos || [0,0,0] );

		this.origin = new THREE.Vector3();
		this.dest = new THREE.Vector3();

		this.start = new THREE.Vector3().fromArray( o.start || [0,0,0] );
		this.end = new THREE.Vector3().fromArray( o.end || [0,10,0] );
		this.tmp = new THREE.Vector3();
		this.normal = new THREE.Vector3().fromArray(  [0,0,0] );

		this.c1 = new THREE.Vector3(0.1,0.1,0.1);
		this.c2 = new THREE.Vector3(0,1.0,0);

		this.inv = new THREE.Matrix4();


		this.callback = o.callback || function (){};
		this.result = { name:'' };

		this.vertices = [ 0,0,0, 0,0,0, 0,0,0, 0,0,0 , 0,0,0, 0,0,0, 0,0,0 ];
		this.colors = [  0,0,0, 0,0,0, 0,0,0, 0,0,0 , 0,0,0, 0,0,0, 0,0,0 ];
		this.local = [ 0,0,0, 0,0,0 ];

		this.geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( this.vertices, 3 ) );
		this.geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( this.colors, 3 ) );
		this.vertices = this.geometry.attributes.position.array;
		this.colors = this.geometry.attributes.color.array;

		this.material.color.setHex( 0xFFFFFF );
		this.material.vertexColors = THREE.VertexColors;

		this.base = false;

		this.upGeo();

	}

	Ray.prototype = Object.assign( Object.create( THREE.Line.prototype ), {

		updateMatrixWorld: function ( force ){

			THREE.Line.prototype.updateMatrixWorld.call( this, force );
			this.origin.copy( this.start ).applyMatrix4( this.matrixWorld );
			this.dest.copy( this.end ).applyMatrix4( this.matrixWorld );
			this.inv.getInverse( this.matrixWorld );

		},

		upGeo: function ( hit ) {

			var v = this.vertices;
			var c = this.colors;
			var l = this.local;
			var n, d;

			if( hit ) {

				this.isBase = false;

				c[0] = c[3] = c[15] = c[18] = this.c2.x;
				c[1] = c[4] = c[16] = c[19] = this.c2.y;
				c[2] = c[5] = c[17] = c[20] = this.c2.z;

				v[3] = v[6] = v[12] = v[15] = l[0];
				v[4] = v[7] = v[13] = v[16] = l[1];
				v[5] = v[8] = v[14] = v[17] = l[2];

				v[18] = l[3];
				v[19] = l[4];
				v[20] = l[5];

				this.geometry.attributes.position.needsUpdate = true;
		    	this.geometry.attributes.color.needsUpdate = true;

			} else {

				if( this.isBase ) return;

				var i = 7;
				while(i--){ 
					n = i*3;
					d = i<3 ? true : false;
					c[n] = this.c1.x;
					c[n+1] = this.c1.y;
					c[n+2] = this.c1.z;
					v[n] = d ? this.start.x : this.end.x;
					v[n+1] = d ? this.start.y : this.end.y;
					v[n+2] = d ? this.start.z : this.end.z;
				}

				this.geometry.attributes.position.needsUpdate = true;
		     	this.geometry.attributes.color.needsUpdate = true;

				this.isBase = true;

			}

		},

		update: function ( o ) {

			if( o.hit ){

				this.callback( o );

				this.tmp.fromArray( o.point ).applyMatrix4( this.inv );
				var d = this.tmp.distanceTo( this.end );
				this.tmp.toArray( this.local, 0 );
			    this.normal.fromArray( o.normal );
			    this.tmp.addScaledVector( this.normal, d );
			    this.tmp.toArray( this.local, 3 );

			    this.upGeo( true );

			} else {

				this.upGeo();

			}



		}

	});

	/*global THREE*/
	/**
	 * @author yomboprime https://github.com/yomboprime
	 *
	 * fileoverview This class can be used to subdivide a convex Geometry object into pieces.
	 *
	 * Usage:
	 *
	 * Use the function prepareBreakableObject to prepare a Mesh object to be broken.
	 *
	 * Then, call the various functions to subdivide the object (subdivideByImpact, cutByPlane)
	 *
	 * Sub-objects that are product of subdivision don't need prepareBreakableObject to be called on them.
	 *
	 * Requisites for the object:
	 *
	 *  - Mesh object must have a BufferGeometry (not Geometry) and a Material
	 *
	 *  - Vertex normals must be planar (not smoothed)
	 *
	 *  - The geometry must be convex (this is not checked in the library). You can create convex
	 *  geometries with THREE.ConvexBufferGeometry. The BoxBufferGeometry, SphereBufferGeometry and other convex primitives
	 *  can also be used.
	 *
	 * Note: This lib adds member variables to object's userData member (see prepareBreakableObject function)
	 * Use with caution and read the code when using with other libs.
	 *
	 * @param {double} minSizeForBreak Min size a debris can have to break.
	 * @param {double} smallDelta Max distance to consider that a point belongs to a plane.
	 *
	*/


	function ConvexObjectBreaker( minSizeForBreak, smallDelta ) {

		this.minSizeForBreak = minSizeForBreak || 1.4;
		this.smallDelta = smallDelta || 0.0001;

		this.tempLine1 = new THREE.Line3();
		this.tempPlane1 = new THREE.Plane();
		this.tempPlane2 = new THREE.Plane();
		this.tempPlane_Cut = new THREE.Plane();
		this.tempCM1 = new THREE.Vector3();
		this.tempCM2 = new THREE.Vector3();
		this.tempVector3 = new THREE.Vector3();
		this.tempVector3_2 = new THREE.Vector3();
		this.tempVector3_3 = new THREE.Vector3();
		this.tempVector3_P0 = new THREE.Vector3();
		this.tempVector3_P1 = new THREE.Vector3();
		this.tempVector3_P2 = new THREE.Vector3();
		this.tempVector3_N0 = new THREE.Vector3();
		this.tempVector3_N1 = new THREE.Vector3();
		this.tempVector3_AB = new THREE.Vector3();
		this.tempVector3_CB = new THREE.Vector3();
		this.tempResultObjects = { object1: null, object2: null };

		this.segments = [];
		var n = 30 * 30;
		for ( var i = 0; i < n; i ++ ) this.segments[ i ] = false;

	}
	ConvexObjectBreaker.prototype = {

		constructor: ConvexObjectBreaker,

		prepareBreakableObject: function ( object, mass, velocity, angularVelocity, breakable ) {

			// object is a THREE.Object3d (normally a Mesh), must have a BufferGeometry, and it must be convex.
			// Its material property is propagated to its children (sub-pieces)
			// mass must be > 0

			if ( ! object.geometry.isBufferGeometry ) {

				console.error( 'ConvexObjectBreaker.prepareBreakableObject(): Parameter object must have a BufferGeometry.' );

			}

			var userData = object.userData;
			userData.mass = mass;
			userData.velocity = velocity !== undefined ? velocity.clone() : new THREE.Vector3();
			userData.angularVelocity = angularVelocity !== undefined ? angularVelocity.clone() : new THREE.Vector3();
			userData.breakable = breakable;

		},

		/**
		 * @param {int} maxRadialIterations Iterations for radial cuts.
		 * @param {int} maxRandomIterations Max random iterations for not-radial cuts
		 *
		 * Returns the array of pieces
		 */
		subdivideByImpact: function ( object, PointOfImpact, Normal, maxRadialIterations, maxRandomIterations ) {

			var debris = [];

			var pointOfImpact = new THREE.Vector3().fromArray( PointOfImpact );
			var normal = new THREE.Vector3().fromArray( Normal );

			var tempPlane1 = this.tempPlane1;
			var tempPlane2 = this.tempPlane2;

			this.tempVector3.addVectors( pointOfImpact, normal );
			tempPlane1.setFromCoplanarPoints( pointOfImpact, object.position, this.tempVector3 );

			var maxTotalIterations = maxRandomIterations + maxRadialIterations;

			var scope = this;

			function subdivideRadial( subObject, startAngle, endAngle, numIterations ) {

				if ( Math.random() < numIterations * 0.05 || numIterations > maxTotalIterations ) {

					debris.push( subObject );

					return;

				}

				var angle = Math.PI;

				if ( numIterations === 0 ) {

					tempPlane2.normal.copy( tempPlane1.normal );
					tempPlane2.constant = tempPlane1.constant;

				} else {

					if ( numIterations <= maxRadialIterations ) {

						angle = ( endAngle - startAngle ) * ( 0.2 + 0.6 * Math.random() ) + startAngle;

						// Rotate tempPlane2 at impact point around normal axis and the angle
						scope.tempVector3_2.copy( object.position ).sub( pointOfImpact ).applyAxisAngle( normal, angle ).add( pointOfImpact );
						tempPlane2.setFromCoplanarPoints( pointOfImpact, scope.tempVector3, scope.tempVector3_2 );

					} else {

						angle = ( ( 0.5 * ( numIterations & 1 ) ) + 0.2 * ( 2 - Math.random() ) ) * Math.PI;

						// Rotate tempPlane2 at object position around normal axis and the angle
						scope.tempVector3_2.copy( pointOfImpact ).sub( subObject.position ).applyAxisAngle( normal, angle ).add( subObject.position );
						scope.tempVector3_3.copy( normal ).add( subObject.position );
						tempPlane2.setFromCoplanarPoints( subObject.position, scope.tempVector3_3, scope.tempVector3_2 );

					}

				}

				// Perform the cut
				scope.cutByPlane( subObject, tempPlane2, scope.tempResultObjects );

				var obj1 = scope.tempResultObjects.object1;
				var obj2 = scope.tempResultObjects.object2;

				if ( obj1 ) {

					subdivideRadial( obj1, startAngle, angle, numIterations + 1 );

				}

				if ( obj2 ) {

					subdivideRadial( obj2, angle, endAngle, numIterations + 1 );

				}

			}

			subdivideRadial( object, 0, 2 * Math.PI, 0 );

			return debris;

		},

		cutByPlane: function ( object, plane, output ) {

			// Returns breakable objects in output.object1 and output.object2 members, the resulting 2 pieces of the cut.
			// object2 can be null if the plane doesn't cut the object.
			// object1 can be null only in case of internal error
			// Returned value is number of pieces, 0 for error.

			var geometry = object.geometry;
			var coords = geometry.attributes.position.array;
			var normals = geometry.attributes.normal.array;

			var numPoints = coords.length / 3;
			var numFaces = numPoints / 3;

			var indices = geometry.getIndex();

			if ( indices ) {

				indices = indices.array;
				numFaces = indices.length / 3;

			}

			function getVertexIndex( faceIdx, vert ) {

				// vert = 0, 1 or 2.

				var idx = faceIdx * 3 + vert;

				return indices ? indices[ idx ] : idx;

			}

			var points1 = [];
			var points2 = [];

			var delta = this.smallDelta;

			// Reset segments mark
			var numPointPairs = numPoints * numPoints;
			for ( var i = 0; i < numPointPairs; i ++ ) this.segments[ i ] = false;

			var p0 = this.tempVector3_P0;
			var p1 = this.tempVector3_P1;
			var n0 = this.tempVector3_N0;
			var n1 = this.tempVector3_N1;

			// Iterate through the faces to mark edges shared by coplanar faces
			for ( var i = 0; i < numFaces - 1; i ++ ) {

				var a1 = getVertexIndex( i, 0 );
				var b1 = getVertexIndex( i, 1 );
				var c1 = getVertexIndex( i, 2 );

				// Assuming all 3 vertices have the same normal
				n0.set( normals[ a1 ], normals[ a1 ] + 1, normals[ a1 ] + 2 );

				for ( var j = i + 1; j < numFaces; j ++ ) {

					var a2 = getVertexIndex( j, 0 );
					var b2 = getVertexIndex( j, 1 );
					var c2 = getVertexIndex( j, 2 );

					// Assuming all 3 vertices have the same normal
					n1.set( normals[ a2 ], normals[ a2 ] + 1, normals[ a2 ] + 2 );

					var coplanar = 1 - n0.dot( n1 ) < delta;

					if ( coplanar ) {

						if ( a1 === a2 || a1 === b2 || a1 === c2 ) {

							if ( b1 === a2 || b1 === b2 || b1 === c2 ) {

								this.segments[ a1 * numPoints + b1 ] = true;
								this.segments[ b1 * numPoints + a1 ] = true;

							}	else {

								this.segments[ c1 * numPoints + a1 ] = true;
								this.segments[ a1 * numPoints + c1 ] = true;

							}

						}	else if ( b1 === a2 || b1 === b2 || b1 === c2 ) {

							this.segments[ c1 * numPoints + b1 ] = true;
							this.segments[ b1 * numPoints + c1 ] = true;

						}

					}

				}

			}

			// Transform the plane to object local space
			var localPlane = this.tempPlane_Cut;
			object.updateMatrix();
			ConvexObjectBreaker.transformPlaneToLocalSpace( plane, object.matrix, localPlane );

			// Iterate through the faces adding points to both pieces
			for ( var i = 0; i < numFaces; i ++ ) {

				var va = getVertexIndex( i, 0 );
				var vb = getVertexIndex( i, 1 );
				var vc = getVertexIndex( i, 2 );

				for ( var segment = 0; segment < 3; segment ++ ) {

					var i0 = segment === 0 ? va : ( segment === 1 ? vb : vc );
					var i1 = segment === 0 ? vb : ( segment === 1 ? vc : va );

					var segmentState = this.segments[ i0 * numPoints + i1 ];

					if ( segmentState ) continue; // The segment already has been processed in another face

					// Mark segment as processed (also inverted segment)
					this.segments[ i0 * numPoints + i1 ] = true;
					this.segments[ i1 * numPoints + i0 ] = true;

					p0.set( coords[ 3 * i0 ], coords[ 3 * i0 + 1 ], coords[ 3 * i0 + 2 ] );
					p1.set( coords[ 3 * i1 ], coords[ 3 * i1 + 1 ], coords[ 3 * i1 + 2 ] );

					// mark: 1 for negative side, 2 for positive side, 3 for coplanar point
					var mark0 = 0;

					var d = localPlane.distanceToPoint( p0 );

					if ( d > delta ) {

						mark0 = 2;
						points2.push( p0.clone() );

					} else if ( d < - delta ) {

						mark0 = 1;
						points1.push( p0.clone() );

					} else {

						mark0 = 3;
						points1.push( p0.clone() );
						points2.push( p0.clone() );

					}

					// mark: 1 for negative side, 2 for positive side, 3 for coplanar point
					var mark1 = 0;

					d = localPlane.distanceToPoint( p1 );

					if ( d > delta ) {

						mark1 = 2;
						points2.push( p1.clone() );

					} else if ( d < - delta ) {

						mark1 = 1;
						points1.push( p1.clone() );

					}	else {

						mark1 = 3;
						points1.push( p1.clone() );
						points2.push( p1.clone() );

					}

					if ( ( mark0 === 1 && mark1 === 2 ) || ( mark0 === 2 && mark1 === 1 ) ) {

						// Intersection of segment with the plane

						this.tempLine1.start.copy( p0 );
						this.tempLine1.end.copy( p1 );

						var intersection = new THREE.Vector3();
						intersection = localPlane.intersectLine( this.tempLine1, intersection );

						if ( intersection === undefined ) {

							// Shouldn't happen
							console.error( "Internal error: segment does not intersect plane." );
							output.segmentedObject1 = null;
							output.segmentedObject2 = null;
							return 0;

						}

						points1.push( intersection );
						points2.push( intersection.clone() );

					}

				}

			}

			// Calculate debris mass (very fast and imprecise):
			var newMass = object.userData.mass * 0.5;

			// Calculate debris Center of Mass (again fast and imprecise)
			this.tempCM1.set( 0, 0, 0 );
			var radius1 = 0;
			var numPoints1 = points1.length;

			if ( numPoints1 > 0 ) {

				for ( var i = 0; i < numPoints1; i ++ ) this.tempCM1.add( points1[ i ] );

				this.tempCM1.divideScalar( numPoints1 );
				for ( var i = 0; i < numPoints1; i ++ ) {

					var p = points1[ i ];
					p.sub( this.tempCM1 );
					radius1 = Math.max( radius1, p.x, p.y, p.z );

				}
				this.tempCM1.add( object.position );

			}

			this.tempCM2.set( 0, 0, 0 );
			var radius2 = 0;
			var numPoints2 = points2.length;
			if ( numPoints2 > 0 ) {

				for ( var i = 0; i < numPoints2; i ++ ) this.tempCM2.add( points2[ i ] );

				this.tempCM2.divideScalar( numPoints2 );
				for ( var i = 0; i < numPoints2; i ++ ) {

					var p = points2[ i ];
					p.sub( this.tempCM2 );
					radius2 = Math.max( radius2, p.x, p.y, p.z );

				}
				this.tempCM2.add( object.position );

			}

			var object1 = null;
			var object2 = null;

			var numObjects = 0;

			if ( numPoints1 > 4 ) {

				object1 = new THREE.Mesh( new ConvexBufferGeometry( points1 ), object.material );
				object1.position.copy( this.tempCM1 );
				object1.quaternion.copy( object.quaternion );

				this.prepareBreakableObject( object1, newMass, object.userData.velocity, object.userData.angularVelocity, 2 * radius1 > this.minSizeForBreak );

				numObjects ++;

			}

			if ( numPoints2 > 4 ) {

				object2 = new THREE.Mesh( new ConvexBufferGeometry( points2 ), object.material );
				object2.position.copy( this.tempCM2 );
				object2.quaternion.copy( object.quaternion );

				this.prepareBreakableObject( object2, newMass, object.userData.velocity, object.userData.angularVelocity, 2 * radius2 > this.minSizeForBreak );

				numObjects ++;

			}

			output.object1 = object1;
			output.object2 = object2;

			return numObjects;

		}

	};

	ConvexObjectBreaker.transformFreeVector = function ( v, m ) {

		// input:
		// vector interpreted as a free vector
		// THREE.Matrix4 orthogonal matrix (matrix without scale)

		var x = v.x, y = v.y, z = v.z;
		var e = m.elements;

		v.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z;
		v.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z;
		v.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z;

		return v;

	};

	ConvexObjectBreaker.transformFreeVectorInverse = function ( v, m ) {

		// input:
		// vector interpreted as a free vector
		// THREE.Matrix4 orthogonal matrix (matrix without scale)

		var x = v.x, y = v.y, z = v.z;
		var e = m.elements;

		v.x = e[ 0 ] * x + e[ 1 ] * y + e[ 2 ] * z;
		v.y = e[ 4 ] * x + e[ 5 ] * y + e[ 6 ] * z;
		v.z = e[ 8 ] * x + e[ 9 ] * y + e[ 10 ] * z;

		return v;

	};

	ConvexObjectBreaker.transformTiedVectorInverse = function ( v, m ) {

		// input:
		// vector interpreted as a tied (ordinary) vector
		// THREE.Matrix4 orthogonal matrix (matrix without scale)

		var x = v.x, y = v.y, z = v.z;
		var e = m.elements;

		v.x = e[ 0 ] * x + e[ 1 ] * y + e[ 2 ] * z - e[ 12 ];
		v.y = e[ 4 ] * x + e[ 5 ] * y + e[ 6 ] * z - e[ 13 ];
		v.z = e[ 8 ] * x + e[ 9 ] * y + e[ 10 ] * z - e[ 14 ];

		return v;

	};

	ConvexObjectBreaker.transformPlaneToLocalSpace = function () {

		var v1 = new THREE.Vector3();

		return function transformPlaneToLocalSpace( plane, m, resultPlane ) {

			resultPlane.normal.copy( plane.normal );
			resultPlane.constant = plane.constant;

			var referencePoint = ConvexObjectBreaker.transformTiedVectorInverse( plane.coplanarPoint( v1 ), m );

			ConvexObjectBreaker.transformFreeVectorInverse( resultPlane.normal, m );

			// recalculate constant (like in setFromNormalAndCoplanarPoint)
			resultPlane.constant = - referencePoint.dot( resultPlane.normal );


		};

	}();

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
	    var Time = typeof performance === 'undefined' ? Date : performance;
	    
	    var t = { now:0, delta:0, then:0, inter:0, tmp:0, n:0, timerate:0, autoFps:false };
	    var interval = null;
	    var refView = null;
	    var isBuffer = false;

	    var stepNext = false;

	    var PI90 = 1.570796326794896;

	    var rigidBody, softBody, terrains, vehicles, character, collision, rayCaster;

	    var convexBreaker = null;

	    //var needUpdate = false;

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
	                fixed: Option.fixed !== undefined ? Option.fixed : false,
	                //autoFps : Option.autoFps !== undefined ? Option.autoFps : false,

	                //penetration: Option.penetration || 0.0399,

	            };

	            t.timerate = ( 1 / option.fps ) * 1000;
	            t.autoFps = option.autoFps;

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
	                maxBody: Counts.maxBody || 1400,
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
	                case 'start': exports.engine.start(); break;
	                case 'step': exports.engine.step(); break;
	                //
	                //case 'terrain': terrains.upGeo( data.o.name ); break;

	                case 'moveSolid': exports.engine.moveSolid( data.o ); break;
	                case 'ellipsoid': exports.engine.ellipsoidMesh( data.o ); break;

	                case 'makeBreak': exports.engine.makeBreak( data.o ); break;

	                case 'rayCast': rayCaster.receive( data.o ); break;
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

	            //console.log('start', t.timerate );

	            stepNext = true;

	            // create tranfere array if buffer
	            if( isBuffer ) root.Ar = new Float32Array( root.ArMax );

	            //engine.sendData( 0 );

	            //if ( !timer ) timer = requestAnimationFrame( engine.sendData );
	            t.then = Time.now();
	            if ( interval ) clearInterval( interval );
	            interval = setInterval( exports.engine.sendData, t.timerate );
	           
	        },

	        postUpdate: function () {},

	        update: function () {

	            exports.engine.postUpdate();

	            terrains.step();
	            rayCaster.step();

	            rigidBody.step( root.Ar, root.ArPos[ 0 ] );
	            collision.step( root.Ar, root.ArPos[ 1 ] );
	            character.step( root.Ar, root.ArPos[ 2 ] );
	            vehicles.step( root.Ar, root.ArPos[ 3 ] );
	            softBody.step( root.Ar, root.ArPos[ 4 ] );

	        },

	        step: function () {

	            if ( t.now - 1000 > t.tmp ){ t.tmp = t.now; t.fps = t.n; t.n = 0; } t.n++; // FPS
	            exports.engine.tell();
	            
	            if( refView ) refView.needUpdate( true );
	            //else 
	            exports.engine.update();

	            stepNext = true;
	            
	        },

	        sendData: function ( time ){

	            if( refView ) if( refView.pause ) exports.engine.stop();
	            
	        	if( !stepNext ) return;

	            t.now = Time.now();
	            t.delta = ( t.now - t.then ) * 0.001;
	        	t.then = t.now;

	        	if( isBuffer ) worker.postMessage( { m:'step',  o:{ delta:t.delta, key: exports.engine.getKey() }, Ar:root.Ar }, [ root.Ar.buffer ] );
	            else worker.postMessage( { m:'step', o:{ delta:t.delta, key: exports.engine.getKey() } } );

	            stepNext = false;

	        },

	        setView: function ( v ) { 

	            refView = v;
	            root.mat = v.getMat();
	            root.geo = v.getGeo();
	            root.container = v.getScene();

	        },

	        getFps: function () { return t.fps; },
	        getDelta: function () { return t.delta; },

	        tell: function () {},
	        
	        getKey: function () { return [0,0,0,0,0,0,0,0]; },

	        set: function ( o ) {

	            o = o || option;
	            t.timerate = o.fps !== undefined ? (  1 / o.fps ) * 1000 : t.timerate;
	            t.autoFps = o.autoFps !== undefined ? o.autoFps : false;
	            this.post( 'set', o );

	        },

	        post: function ( m, o ) {

	            worker.postMessage( { m:m, o:o } );

	        },

	        reset: function( full ) {

	            //console.log('reset', full);

	            exports.engine.stop();

	            // remove all mesh
	            exports.engine.clear();

	            // remove tmp material
	            while ( root.tmpMat.length > 0 ) root.tmpMat.pop().dispose();

	            exports.engine.postUpdate = function (){};
	            
	            if( refView ) refView.reset( full );

	            // clear physic object;
	            exports.engine.post( 'reset', { full:full } );

	        },

	        stop: function () {

	            if ( interval ) {
	                clearInterval( interval );
	                interval = null;
	            }

	        },

	        destroy: function (){

	            worker.terminate();
	            worker = undefined;

	        },



	        ////////////////////////////

	        addMat : function ( m ) { root.tmpMat.push( m ); },

	        ellipsoidMesh: function ( o ) {

	            softBody.createEllipsoid( o );

	        },

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
	        option: function ( o ) { this.post('setOption', o ); },
	        remove: function ( o ) { this.post('setRemove', o ); },
	        matrix: function ( o ) { this.post('setMatrix', o ); },//if( o.constructor !== Array ) o = [ o ]; 

	        anchor: function ( o ) { this.post('addAnchor', o ); },

	        break: function ( o ) { this.post('addBreakable', o ); },

	        //rayCast: function ( o ) { this.post('rayCast', o ); },

	        moveSolid: function ( o ) {

	            if ( ! map.has( o.name ) ) return;
	            var b = map.get( o.name );
	            if( o.pos !== undefined ) b.position.fromArray( o.pos );
	            if( o.quat !== undefined ) b.quaternion.fromArray( o.quat );

	        },

	        getBodys: function () {

	            return rigidBody.bodys;

	        },

	        byName: function ( name ) {

	            return map.get( name );

	        },

	        removeRigidBody: function (name){

	            rigidBody.remove(name);

	        },

	        initObject: function () {

	            rigidBody = new RigidBody();
	            //constraint = new Constraint();
	            softBody = new SoftBody();
	            terrains = new Terrain();
	            vehicles = new Vehicle();
	            character = new Character();
	            collision = new Collision();
	            rayCaster = new RayCaster();

	            // auto define basic function
	            //if(!refView) this.defaultRoot();

	        },

	        

	        clear: function ( o ) {

	            rigidBody.clear();
	            collision.clear();
	            terrains.clear();
	            vehicles.clear();
	            character.clear();
	            softBody.clear();
	            rayCaster.clear();

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
	            else if( type === 'ray' ) return rayCaster.add( o );
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
	                hardcylinder: new THREE.CylinderBufferGeometry( 1,1,1,12,1 ),
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

	        // BREAKABLE

	        makeBreak: function ( o ) {

	            var name = o.name;
	            if ( ! map.has( name ) ) return;

	            if( convexBreaker === null ) convexBreaker = new ConvexObjectBreaker();

	            var mesh = map.get( name );
	            // breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision ]
	            var breakOption = o.breakOption;
	            
	            var debris = convexBreaker.subdivideByImpact( mesh, o.pos, o.normal , breakOption[1], breakOption[2] ); // , 1.5 ??
	            // remove one level
	            breakOption[3] -= 1;
	            // remove original object
	            this.removeRigidBody( name );

	            var i = debris.length;
	            while( i-- ) this.addDebris( name, i, debris[ i ], breakOption );

	        },

	        addDebris: function ( name, id, mesh, breakOption ) {

	            var o = {
	                name: name+'_debris'+ id,
	                material: mesh.material,
	                type:'convex',
	                shape: mesh.geometry,
	                //size: mesh.scale.toArray(),
	                pos: mesh.position.toArray(),
	                quat: mesh.quaternion.toArray(),
	                mass: mesh.userData.mass,
	                linearVelocity:mesh.userData.velocity.toArray(),
	                angularVelocity:mesh.userData.angularVelocity.toArray(),
	                margin:0.05, 
	            };

	            // if levelOfSubdivision > 0 make debris breakable !!
	            if( breakOption[3] > 0 ){

	                o.breakable = true;
	                o.breakOption = breakOption;

	            }

	            this.add( o );
	            
	        },
	        
	    };

	    return exports.engine;

	})();

	Object.defineProperty(exports, '__esModule', { value: true });

}));
