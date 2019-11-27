/**
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Ported from: https://github.com/maurizzzio/quickhull3d/ by Mauricio Poppe (https://github.com/maurizzzio)
 *
 */

//THREE.ConvexHull = ( function () {

	var Visible = 0;
	var Deleted = 1;

	var v1 = new THREE.Vector3();

	function ConvexHull() {

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

	Object.assign( ConvexHull.prototype, {

		setFromPoints: function ( points ) {

			if ( Array.isArray( points ) !== true ) {

				console.error( 'THREE.ConvexHull: Points parameter is not an array.' );

			}

			if ( points.length < 4 ) {

				console.error( 'THREE.ConvexHull: The algorithm needs at least four points.' );

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

		containsPoint: function ( point ) {

			var faces = this.faces;

			for ( var i = 0, l = faces.length; i < l; i ++ ) {

				var face = faces[ i ];

				// compute signed distance and check on what half space the point lies

				if ( face.distanceToPoint( point ) > this.tolerance ) return false;

			}

			return true;

		},

		intersectRay: function ( ray, target ) {

			// based on "Fast Ray-Convex Polyhedron Intersection"  by Eric Haines, GRAPHICS GEMS II

			var faces = this.faces;

			var tNear = - Infinity;
			var tFar = Infinity;

			for ( var i = 0, l = faces.length; i < l; i ++ ) {

				var face = faces[ i ];

				// interpret faces as planes for the further computation

				var vN = face.distanceToPoint( ray.origin );
				var vD = face.normal.dot( ray.direction );

				// if the origin is on the positive side of a plane (so the plane can "see" the origin) and
				// the ray is turned away or parallel to the plane, there is no intersection

				if ( vN > 0 && vD >= 0 ) return null;

				// compute the distance from the ray’s origin to the intersection with the plane

				var t = ( vD !== 0 ) ? ( - vN / vD ) : 0;

				// only proceed if the distance is positive. a negative distance means the intersection point
				// lies "behind" the origin

				if ( t <= 0 ) continue;

				// now categorized plane as front-facing or back-facing

				if ( vD > 0 ) {

					//  plane faces away from the ray, so this plane is a back-face

					tFar = Math.min( t, tFar );

				} else {

					// front-face

					tNear = Math.max( t, tNear );

				}

				if ( tNear > tFar ) {

					// if tNear ever is greater than tFar, the ray must miss the convex hull

					return null;

				}

			}

			// evaluate intersection point

			// always try tNear first since its the closer intersection point

			if ( tNear !== - Infinity ) {

				ray.at( tNear, target );

			} else {

				ray.at( tFar, target );

			}

			return target;

		},

		intersectsRay: function ( ray ) {

			return this.intersectRay( ray, v1 ) !== null;

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

	} );

	//

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


function geometryInfo( g, type ) {
	var facesOnly = false;

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

	{

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

// ROOT reference of engine

var REVISION = '005';

var root = {

	Ar: null,
	ArLng: [],
	ArPos: [],
	ArMax: 0,
	key: [ 0, 0, 0, 0, 0, 0, 0, 0 ],

	constraintDebug: false,

	flow:{
		//matrix:{},
		//force:{},
		//option:{},
		ray:[],
		terrain:[],
		vehicle:[],
		key:[],
	},

	post: null, // send to worker
	extraGeo: [], // array of extra geometry to delete

	container: null, // THREE scene or group
	tmpMat: [], // tmp materials
	mat: {}, // materials object
	geo: {}, // geometrys object
	controler: null,

	torad: Math.PI / 180,

	isRefView: false,

	correctSize: function ( s ) {

		if ( s.length === 1 ) s[ 1 ] = s[ 0 ];
	    if ( s.length === 2 ) s[ 2 ] = s[ 0 ];
	    return s;

	},

	// rotation

	tmpQ: new THREE.Quaternion(),
	tmpE: new THREE.Euler(),
	tmpM: new THREE.Matrix4(),

	toQuatArray: function ( rotation ) { // rotation array in degree

		return root.tmpQ.setFromEuler( root.tmpE.fromArray( root.vectorad( rotation ) ) ).toArray();

	},

	vectorad: function ( r ) {

		var i = r.length;
	    while ( i -- ) r[ i ] *= root.torad;
	    return r;

	},


};

// ROW map

var map = new Map();

/*global THREE*/

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    SHOT - RIGIDBODY
*/

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

			var s = AR[ n ];// speed km/h
		        if ( s > 0 ) {

		            if ( b.material.name == 'sleep' ) b.material = root.mat.move;
		            if ( s > 50 && b.material.name == 'move' ) b.material = root.mat.speed;
		            else if ( s < 50 && b.material.name == 'speed' ) b.material = root.mat.move;

		        } else {

		            if ( b.material.name == 'move' || b.material.name == 'speed' ) b.material = root.mat.sleep;

			}

			if( b.enabled ){
				b.position.fromArray( AR, n + 1 );
	            b.quaternion.fromArray( AR, n + 4 );

	            //if( !b.matrixAutoUpdate ) b.updateMatrix();
	            //b.updateMatrixWorld( true );
	            //b.updateWorldMatrix( true,true)
			}

			
	        //}

		} );

	},

	clear: function () {

		while ( this.bodys.length > 0 ) this.destroy( this.bodys.pop() );
		while ( this.solids.length > 0 ) this.destroy( this.solids.pop() );
		this.ID = 0;

	},

	destroy: function ( b ) {

		map.delete( b.name );
		root.destroy( b );

	},

	remove: function ( name ) {

		if ( ! map.has( name ) ) return;
		var b = map.get( name );
		var solid = b.type === 'solid' ? true : false;
		var n = solid ? this.solids.indexOf( b ) : this.bodys.indexOf( b );



		//console.log('remove SHOT', name, n )

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

		if ( o.density !== undefined ) o.mass = o.density;
		if ( o.bounce !== undefined ) o.restitution = o.bounce;

		o.mass = o.mass === undefined ? 0 : o.mass;
		o.kinematic = o.kinematic || false;

		var autoName = 'body';
		if ( o.mass === 0 && ! o.kinematic ) autoName = 'static';

		o.name = o.name !== undefined ? o.name : autoName + this.ID ++;

		// delete old if same name
		this.remove( o.name );

		if ( o.breakable ) {

			if ( o.type === 'hardbox' || o.type === 'box' || o.type === 'sphere' || o.type === 'cylinder' || o.type === 'cone' ) o.type = 'real' + o.type;

		}

		var customGeo = false;

		o.type = o.type === undefined ? 'box' : o.type;

		// position
		o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
	    // size
	    o.size = o.size == undefined ? [ 1, 1, 1 ] : o.size;
	    o.size = root.correctSize( o.size );
	    if ( o.geoSize ) o.geoSize = root.correctSize( o.geoSize );
	    // rotation is in degree or Quaternion
	    o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;
	    if( o.rot !== undefined ){ o.quat = root.toQuatArray( o.rot ); delete ( o.rot ); }

	    
	    

	    var mesh = null;
	    var noMesh = o.noMesh !== undefined ? o.noMesh : false; 

	    if ( o.type === 'plane' ) {

	        //this.grid.position.set( o.pos[0], o.pos[1], o.pos[2] )
	        root.post( 'add', o );
	        return;

		}



	    // material

	    var material;
	    if ( o.material !== undefined ) {

	    	if ( o.material.constructor === String ) material = root.mat[ o.material ];
	    	else material = o.material;

	    } else {

	    	if ( o.mass === 0 && ! o.kinematic ) material = root.mat.static;
	    	else material = root.mat.move;
	    	if ( o.kinematic ) material = root.mat.kinematic;

	    }

	    // geometry

	    var m, g;

	    if ( o.type === 'compound' ) {

		    for ( var i = 0; i < o.shapes.length; i ++ ) {

	    		g = o.shapes[ i ];
	    		g.size = g.size === undefined ? [ 1, 1, 1 ] : g.size;
	    		if ( g.size.length === 1 ) {

					g.size[ 1 ] = g.size[ 0 ];

				}
	            if ( g.size.length === 2 ) {

					g.size[ 2 ] = g.size[ 0 ];

				}
	            g.pos = g.pos === undefined ? [ 0, 0, 0 ] : g.pos;
	    		g.rot = g.rot === undefined ? [ 0, 0, 0 ] : root.vectorad( g.rot );
				g.quat = g.quat === undefined ? new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( g.rot ) ).toArray() : g.quat;

	    	}

	    	mesh = o.geometry ? new THREE.Mesh( o.geometry, material ) : new THREE.Group();

	    	if ( o.geometry ) root.extraGeo.push( o.geometry );

	    	if ( ! o.geometry || o.debug ) {

	    		//mesh = new THREE.Group();
	    		mesh.material = material;// TODO fix
		    	
		    	for ( var i = 0; i < o.shapes.length; i ++ ) {

		    		g = o.shapes[ i ];

		    		var geom = null;

		    		if( g.type === 'capsule' ) geom = new Capsule( o.size[ 0 ], o.size[ 1 ] );
		    		else if( g.type === 'convex' ){ 
		    			geom = g.shape; 
		    			g.v = geometryInfo( g.shape, g.type );
		    			delete ( g.shape );
		    		}
		    		else geom = root.geo[ g.type ];

		    		if( g.type === 'capsule' || g.type === 'convex' ) root.extraGeo.push( geom );

		    		m = new THREE.Mesh( geom, o.debug ? root.mat.debug : material );
		    		m.scale.fromArray( g.size );
		    		m.position.fromArray( g.pos );
	                m.quaternion.fromArray( g.quat );

		    		mesh.add( m );

		    	}

			}

	    } else if ( o.type === 'mesh' || o.type === 'convex' ) {
	    	customGeo = true;

	        if ( o.shape ) {

	            o.v = geometryInfo( o.shape, o.type );
	            root.extraGeo.push( o.shape );

			}

	        if ( o.geometry ) {

	        	
	        	if ( o.geoScale ){ 
	        		o.geometry = o.geometry.clone();
	        		o.geometry.applyMatrix( new THREE.Matrix4().makeScale( o.geoScale[ 0 ], o.geoScale[ 0 ], o.geoScale[ 0 ] ) );
	        	}


	            mesh = new THREE.Mesh( o.geometry, material );
	            root.extraGeo.push( o.geometry );

	        } else {

	            if ( !noMesh ) mesh = new THREE.Mesh( o.shape, material );
	            //extraGeo.push(mesh.geometry);

			}

	    } else {

	    	//if ( o.type === 'box' && o.mass === 0 && ! o.kinematic ) o.type = 'hardbox';
	    	if ( o.type === 'capsule' ) o.geometry = new Capsule( o.size[ 0 ], o.size[ 1 ] );
	    	
	    	// breakable
	    	if ( o.type === 'realbox' || o.type === 'realhardbox' ) o.geometry = new THREE.BoxBufferGeometry( o.size[ 0 ], o.size[ 1 ], o.size[ 2 ] );
	    	if ( o.type === 'realsphere' ) o.geometry = new THREE.SphereBufferGeometry( o.size[ 0 ], 16, 12 );
	    	if ( o.type === 'realcylinder' ) o.geometry = new THREE.CylinderBufferGeometry( o.size[ 0 ], o.size[ 0 ], o.size[ 1 ] * 0.5, 12, 1 );
	    	if ( o.type === 'realcone' ) o.geometry = new THREE.CylinderBufferGeometry( 0, o.size[ 0 ] * 0.5, o.size[ 1 ] * 0.55, 12, 1 );
	    	

	    	// new Geometry
	    	if( o.radius !== undefined && root.isRefView ){

	    		if ( o.type === 'box' ) o.geometry = new THREE.ChamferBox( o.size[ 0 ], o.size[ 1 ], o.size[ 2 ], o.radius );
	    		if ( o.type === 'cylinder' ) o.geometry = new THREE.ChamferCyl( o.size[ 0 ], o.size[ 0 ], o.size[ 1 ] * 0.5, o.radius );
	    		if ( o.type === 'cone' ) o.geometry = new THREE.ChamferCyl( o.radius, o.size[ 0 ], o.size[ 1 ] * 0.5, o.radius );

	    	}


	        if ( o.geometry ) {

	            if ( o.geoRot || o.geoScale ) o.geometry = o.geometry.clone();
	            // rotation only geometry
	            if ( o.geoRot ) o.geometry.applyMatrix( new THREE.Matrix4().makeRotationFromEuler( new THREE.Euler().fromArray( root.vectorad( o.geoRot ) ) ) );
	            // scale only geometry
	            if ( o.geoScale ) o.geometry.applyMatrix( new THREE.Matrix4().makeScale( o.geoScale[ 0 ], o.geoScale[ 1 ], o.geoScale[ 2 ] ) );

	        }

	        mesh = new THREE.Mesh( o.geometry || root.geo[ o.type ], material );

	        if ( o.geometry ) {

	            root.extraGeo.push( o.geometry );
	            if ( o.geoSize ) mesh.scale.fromArray( o.geoSize );// ??
	            //if( !o.geoSize && o.size && o.type !== 'capsule' ) mesh.scale.fromArray( o.size );
	            customGeo = true;

			}

	    }

	    if ( o.type === 'highsphere' ) o.type = 'sphere';


	    if ( extra == 'isGeometry' ) return g;





	    if ( mesh ) {

	        if ( !customGeo && !mesh.isGroup ){ 

	        	mesh.scale.fromArray( o.size );
	        	// ! add to group to avoid matrix scale
	        	var tmp = mesh;
	        	mesh = new THREE.Group();
	        	mesh.add( tmp );
	        	
	        }

	        // mesh remplacement 
	        if( o.mesh ){

		    	mesh = new THREE.Group();
		        mesh.add( o.mesh );

		    }

	        // out of view on start
	        //mesh.position.set(0,-1000000,0);
	        mesh.position.fromArray( o.pos );
	        mesh.quaternion.fromArray( o.quat );

	        mesh.updateMatrix();

	        mesh.name = o.name;
	        mesh.enabled = true;
	        //mesh.type = 'rigidbody';

	        if ( o.parent !== undefined ){ 

	        	o.parent.add( mesh );
	        	o.parent = null;

	        } else { 

	        	root.container.add( mesh );
	        	
	        }

	        // shadow
	        if( o.noShadow === undefined ){

	        	if( mesh.isGroup ){

	        		/*Object.defineProperty( mesh, 'material', {
					    get: function() { return this.children[0].material; },
					    set: function( value ) { 
					    	var i = this.children.length;
					    	while(i--) this.children[i].material = value; 
					    }
					});*/

					Object.defineProperty( mesh, 'receiveShadow', {
					    get: function() { return this.children[0].receiveShadow; },
					    set: function( value ) { 
					    	var i = this.children.length;
					    	while(i--) this.children[i].receiveShadow = value; 
					    }
					});

					Object.defineProperty( mesh, 'castShadow', {
					    get: function() { return this.children[0].castShadow; },
					    set: function( value ) { 
					    	var i = this.children.length;
					    	while(i--) this.children[i].castShadow = value; 
					    }
					});

	        		/*var j = mesh.children.length;
	        		while(j--){
	        			mesh.children[j].receiveShadow = true;
	        			mesh.children[j].castShadow = o.mass === 0 && !o.kinematic ? false : true;
	        		}*/

	        	} 

	        	
	        	mesh.receiveShadow = true;
	        	mesh.castShadow = o.mass === 0 && !o.kinematic ? false : true;
	        	

	        	//console.log('??')

	        	
	        }

	    }

	    if ( o.shape ) delete ( o.shape );
	    if ( o.geometry ) delete ( o.geometry );
	    if ( o.material ) delete ( o.material );
	    if ( o.mesh ) { delete ( o.mesh ); }

	    if ( o.noPhy === undefined ) {

	        // push
	        if ( mesh ) {

	            if ( o.mass === 0 && ! o.kinematic ) this.solids.push( mesh );// static
	            else this.bodys.push( mesh );// dynamique

	        }

	        // send to worker
	        root.post( 'add', o );

	    }

	    if ( mesh ) {

	    	mesh.type = o.mass === 0 && !o.kinematic ? 'solid' : 'body';
	    	//if( o.kinematic ) mesh.type = 'kinematic';

	    	//if ( o.mass === 0 && ! o.kinematic ) mesh.isSolid = true;
	    	//if ( o.kinematic ) mesh.isKinemmatic = true;
	    	//else mesh.isBody = true;
	    	//mesh.userData.mass = o.mass;
	    	mesh.userData.mass = o.mass;
	        map.set( o.name, mesh );

	        if( o.autoMatrix !== undefined ) mesh.matrixAutoUpdate = o.autoMatrix; 



	        return mesh;

		}


	}

} );

/*global THREE*/

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    SHOT - CONSTRAINT JOINT
*/

function Constraint() {

	this.ID = 0;
	this.joints = [];

	/*this.mat0 =new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors, depthTest: false, depthWrite: false, transparent: true });
	this.mat1 = new THREE.MeshBasicMaterial({ wireframe:true, color:0x00ff00, depthTest:false, depthWrite:true }); 
	this.mat2 = new THREE.MeshBasicMaterial({ wireframe:true, color:0xffff00, depthTest:false, depthWrite:true }); 

	this.g = new THREE.ConeBufferGeometry(0.1,0.2,6);
	this.g.translate( 0, 0.1, 0 );
	this.g.rotateZ( -Math.PI*0.5 );*/

}

Object.assign( Constraint.prototype, {

	step: function ( AR, N ) {

		if( !root.constraintDebug ) return;

		var n;

		this.joints.forEach( function ( j, id ) {
			
			n = N + ( id * 14 );
			j.step( n, AR );

		});

	},

	clear: function () {

		while ( this.joints.length > 0 ) this.destroy( this.joints.pop() );
		this.ID = 0;

	},

	destroy: function ( j ) {

		map.delete( j.name );
		j.clear();
		//root.destroy( b );

	},

	remove: function ( name ) {

		if ( ! map.has( name ) ) return;
		var j = map.get( name );

		var n = this.joints.indexOf( j );
		this.joints.splice( n, 1 );
		this.destroy( j );

	},

	add: function ( o ) {

		o.name = o.name !== undefined ? o.name : 'joint' + this.ID ++;

		// delete old if same name
		this.remove( o.name );

		/*
	    if ( o.rotA ){ o.quatA = root.toQuatArray( o.rotA ); delete ( o.rotA ); }
	    if ( o.rotB ){ o.quatB = root.toQuatArray( o.rotB ); delete ( o.rotB ); }

	    if ( o.angUpper ) o.angUpper = root.vectorad( o.angUpper );
	    if ( o.angLower ) o.angLower = root.vectorad( o.angLower );
	    */

		var joint = new Joint( o );
		this.joints.push( joint );

		// add to map
		map.set( joint.name, joint );

		// send to worker
		if ( o.parent !== undefined ) o.parent = null;
	    root.post( 'add', o );

	    return joint;

	},

});


function Joint( o ) {

	this.type = 'constraint';
	this.name = o.name;

	this.isMesh = false;
	
	if( root.constraintDebug ) this.init( o );

}

Object.assign( Joint.prototype, {

	step: function ( n, AR ){

		if( !this.isMesh ) return;

		if(!this.mesh.visible) this.mesh.visible = true;

		var p = this.pos.array;

		p[0] = AR[n];
		p[1] = AR[n+1];
		p[2] = AR[n+2];

		p[3] = AR[n+7];
		p[4] = AR[n+8];
		p[5] = AR[n+9];

		this.pos.needsUpdate = true;

        this.p1.position.fromArray( AR, n );
        this.p1.quaternion.fromArray( AR, n + 3 );

        this.p2.position.fromArray( AR, n + 7 );
        this.p2.quaternion.fromArray( AR, n + 10 );

	},

	init: function ( o ){

		var vertices = new Float32Array([ 0, 0, 0,	0, 0, 0 ]);
		var colors = new Float32Array([ 0, 1, 0, 1, 1, 0 ]);

		var geometry = new THREE.BufferGeometry();
		geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
		geometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

		this.mesh = new THREE.Line( geometry, root.mat.jointLine );
		this.mesh.name = o.name;

		this.p1 = new THREE.Mesh( root.geo.joint, root.mat.jointP1 );
		this.p2 = new THREE.Mesh( root.geo.joint, root.mat.jointP2 );

		this.p1.receiveShadow = false;
	    this.p1.castShadow = false;
	    this.p2.receiveShadow = false;
	    this.p2.castShadow = false;
	    this.mesh.receiveShadow = false;
	    this.mesh.castShadow = false;

		this.mesh.add( this.p1 );
		this.mesh.add( this.p2 );
         
        this.mesh.frustumCulled = false;

		this.pos = this.mesh.geometry.attributes.position;

		this.mesh.visible = false;

		if ( o.parent !== undefined ){ 

			o.parent.add( this.mesh );
			o.parent = null;

		} else {

	    	root.container.add( this.mesh );

	    }

		this.isMesh = true;

	},

	clear: function (){

		if( !this.isMesh ) return;

		this.mesh.geometry.dispose();
		root.destroy( this.mesh );
		this.mesh = null;
		this.p1 = null;
		this.p2 = null;
		this.isMesh = false;

	},

});

/*global THREE*/

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    SHOT - SOFTBODY
*/

function SoftBody() {

	this.ID = 0;
	this.softs = [];

	this.tmpMat = null;

}

Object.assign( SoftBody.prototype, {

	step: function ( AR, N ) {

		var softPoints = N;

		this.softs.forEach( function ( b ) {

			var n, c, cc, p, j, k, u;
	        var g = b.geometry;
	        var t = b.softType; // type of softBody
	        var order = null;
	        var isWithColor = g.attributes.color ? true : false;
	        var isWithNormal = g.attributes.normal ? true : false;


	        if ( t === 2 ) { // rope

	            j = g.positions.length;
	            while ( j -- ) {

	                n = softPoints + ( j * 3 );
	                g.positions[ j ].set( AR[ n ], AR[ n + 1 ], AR[ n + 2 ] );

				}

	            g.updatePath();

	        } else {

	            if ( ! g.attributes.position ) return;

	            p = g.attributes.position.array;
	            if ( isWithColor ) c = g.attributes.color.array;

	            if ( t === 5 || t === 4 ) { // softTriMesh // softConvex

	                var max = g.numVertices;
	                var maxi = g.maxi;
	                var pPoint = g.pPoint;
	                var lPoint = g.lPoint;

	                j = max;
	                while ( j -- ) {

	                    n = ( j * 3 ) + softPoints;
	                    if ( j == max - 1 ) k = maxi - pPoint[ j ];
	                    else k = pPoint[ j + 1 ] - pPoint[ j ];
	                    var d = pPoint[ j ];
	                    while ( k -- ) {

	                        u = lPoint[ d + k ] * 3;
	                        p[ u ] = AR[ n ];
	                        p[ u + 1 ] = AR[ n + 1 ];
	                        p[ u + 2 ] = AR[ n + 2 ];

						}

					}

	            } else { // cloth // ellipsoid

	                if ( g.attributes.order ) order = g.attributes.order.array;
	                j = p.length;

	                n = 2;

	                if ( order !== null ) {

	                    j = order.length;
	                    while ( j -- ) {

	                        k = order[ j ] * 3;
	                        n = j * 3 + softPoints;
	                        p[ k ] = AR[ n ];
	                        p[ k + 1 ] = AR[ n + 1 ];
	                        p[ k + 2 ] = AR[ n + 2 ];

	                        cc = Math.abs( AR[ n + 1 ] / 10 );
	                        c[ k ] = cc;
	                        c[ k + 1 ] = cc;
	                        c[ k + 2 ] = cc;

						}

	                } else {

	                     while ( j -- ) {

	                        p[ j ] = AR[ j + softPoints ];
	                        if ( n == 1 ) {

	                            cc = Math.abs( p[ j ] / 10 );
	                            c[ j - 1 ] = cc;
	                            c[ j ] = cc;
	                            c[ j + 1 ] = cc;

							}
	                        n --;
	                        n = n < 0 ? 2 : n;

						}

	                }

	            }

	            if ( t !== 2 ) g.computeVertexNormals();

	            if ( isWithNormal ) {

	                var norm = g.attributes.normal.array;

	                j = max;
	                while ( j -- ) {

	                    if ( j == max - 1 ) k = maxi - pPoint[ j ];
	                    else k = pPoint[ j + 1 ] - pPoint[ j ];
	                    var d = pPoint[ j ];
	                    var ref = lPoint[ d ] * 3;
	                    while ( k -- ) {

	                        u = lPoint[ d + k ] * 3;
	                        norm[ u ] = norm[ ref ];
	                        norm[ u + 1 ] = norm[ ref + 1 ];
	                        norm[ u + 2 ] = norm[ ref + 2 ];

						}

					}

	                g.attributes.normal.needsUpdate = true;

	            }

	            if ( isWithColor ) g.attributes.color.needsUpdate = true;
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

	add: function ( o ) {


		var name = o.name !== undefined ? o.name : o.type + this.ID ++;

		// delete old if same name
		this.remove( name );

		// position
		o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
		// size
	    o.size = o.size == undefined ? [ 1, 1, 1 ] : o.size;
	    o.size = root.correctSize( o.size );
		// rotation is in degree or Quaternion
	    o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;
	    if( o.rot !== undefined ){ o.quat = root.toQuatArray( o.rot ); delete ( o.rot ); }

		// material

		var material;
		if ( o.material !== undefined ) {

			if ( o.material.constructor === String ) material = root.mat[ o.material ];
			else material = o.material;

		} else {

			material = root.mat.soft;

		}

		var tmp, mesh;

		switch ( o.type ) {

			case 'softMesh': case 'softTriMesh': tmp = softMesh( o, material ); break;
			case 'softConvex': tmp = softMesh( o, material ); break;
			case 'softCloth': tmp = softCloth( o, material ); break;
			case 'softRope': tmp = softRope( o, material ); break;

			case 'softEllips':// tmp = ellipsoid( o )
			    this.tmpMat = material;
				root.post( 'add', o );

				return;
				break;

		}

		mesh = tmp.mesh;
		o = tmp.o;

		mesh.name = name;
		//mesh.isSoft = true;
		mesh.type = 'soft';

		//mesh.position.fromArray( o.pos );
	    //mesh.quaternion.fromArray( o.quat );


	    root.container.add( mesh );
		this.softs.push( mesh );

		map.set( name, mesh );

		root.post( 'add', o );

	},

	createEllipsoid: function ( o ) {

		var mesh = ellipsoid( o );
		if(this.tmpMat) mesh.material = this.tmpMat;
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
	
	// apply scale before get geometry info
	g.scale( o.size[ 0 ], o.size[ 1 ], o.size[ 2 ] );

	geometryInfo( g );

	root.extraGeo.push( g );

	o.v = g.realVertices;
	o.i = g.realIndices;
	o.ntri = g.numFaces;

	// position and rotation after get geometry info
	g.translate( o.pos[ 0 ], o.pos[ 1 ], o.pos[ 2 ] );
	g.applyMatrix( root.tmpM.makeRotationFromQuaternion( root.tmpQ.fromArray( o.quat ) ) );


	var mesh = new THREE.Mesh( g, material );

	mesh.castShadow = true;
	mesh.receiveShadow = true;

	mesh.softType = 5;
	mesh.points = o.v.length / 3;

	if ( o.shape ) delete ( o.shape );
	if ( o.material ) delete ( o.material );

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


function softCloth( o, material ) {

	var div = o.div || [ 16, 16 ];
	var size = o.size || [ 100, 0, 100 ];
	var pos = o.pos || [ 0, 0, 0 ];

	var max = div[ 0 ] * div[ 1 ];

	var g = new THREE.PlaneBufferGeometry( size[ 0 ], size[ 2 ], div[ 0 ] - 1, div[ 1 ] - 1 );
	g.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ) );
	g.rotateX( - Math.PI90 );
	//g.translate( -size[0]*0.5, 0, -size[2]*0.5 );

	//var numVerts = g.attributes.position.array.length / 3;

	var mesh = new THREE.Mesh( g, material );

	//mesh.idx = view.setIdx( softs.length, 'softs' );

	//view.setName( o, mesh );
	//this.byName[ o.name ] = mesh;

	// mesh.material.needsUpdate = true;
	mesh.position.set( pos[ 0 ], pos[ 1 ], pos[ 2 ] );

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

function softRope( o, material ) {

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

	if ( o.numSeg === undefined ) o.numSeg = o.numSegment;

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
	for ( i = 0; i < max; i ++ ) {

		n = i * 3;
		points.push( new THREE.Vector3( ar[ n ], ar[ n + 1 ], ar[ n + 2 ] ) );

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
	while ( i -- ) {

		j = max;
		while ( j -- ) {

			n = j * 3;
			if ( ar[ n ] == v[ i ].x && ar[ n + 1 ] == v[ i ].y && ar[ n + 2 ] == v[ i ].z ) order[ j ] = i;

		}

	}


	i = max;
	while ( i -- ) {

		n = i * 3;
		k = order[ i ] * 3;

		vertices[ k ] = ar[ n ];
		vertices[ k + 1 ] = ar[ n + 1 ];
		vertices[ k + 2 ] = ar[ n + 2 ];

	}

	// get indices of faces
	i = gt.faces.length;
	while ( i -- ) {

		n = i * 3;
		var face = gt.faces[ i ];
		indices[ n ] = face.a;
		indices[ n + 1 ] = face.b;
		indices[ n + 2 ] = face.c;

	}


	//gt.computeVertexNormals();
	//gt.computeFaceNormals();


	//console.log(gtt.vertices.length)
	var g = new THREE.BufferGeometry();//.fromDirectGeometry( gt );

	g.setIndex( new THREE.BufferAttribute( indices, 1 ) );
	g.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
	g.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ) );
	g.setAttribute( 'order', new THREE.BufferAttribute( order, 1 ) );

	//g.setAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );

	if ( gt.uvs ) {

		var uvs = new Float32Array( gt.uvs.length * 2 );
		g.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ).copyVector2sArray( gt.uvs ), 2 );

	}


	g.computeVertexNormals();

	root.extraGeo.push( g );


	gt.dispose();


	//g.setAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
	var mesh = new THREE.Mesh( g, root.mat.soft );

	//mesh.idx = view.setIdx( softs.length, 'softs' );

	//this.byName[ o.name ] = mesh;

	//this.setName( o, mesh );

	mesh.softType = 3;
	//mesh.isSoft = true;
	mesh.type = 'soft';
	mesh.points = g.attributes.position.array.length / 3;

	//console.log( mesh.points )

	mesh.castShadow = true;
	mesh.receiveShadow = true;

	return mesh;

	//this.scene.add( mesh );
	//this.softs.push( mesh );

}

/*global THREE*/


/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    SHOT - TERRAIN
*/

function Terrain() {

	this.ID = 0;
	this.terrains = [];


}

Object.assign( Terrain.prototype, {

	step: function () {

		root.flow.terrain = [];

		this.terrains.forEach( function ( t ) {

			if ( t.needsUpdate ) {

			    t.updateGeometry();
				root.flow.terrain.push( { name: t.name, heightData: t.heightData } );
				t.needsUpdate = false;

			}

		} );

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

	add: function ( o ) {


		var name = o.name !== undefined ? o.name : o.type + this.ID ++;

		// delete old if same name
		this.remove( name );

		o.sample = o.sample === undefined ? [ 64, 64 ] : o.sample;
	    o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
	    o.complexity = o.complexity === undefined ? 30 : o.complexity;
	    o.name = name;


	    var terrain = new THREE.Terrain( o );

	    terrain.needsUpdate = false;
	    terrain.type = 'terrain';

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

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    SHOT - VEHICLE
*/

function Vehicle() {

	this.ID = 0;
	this.cars = [];

}

Object.assign( Vehicle.prototype, {

	step: function ( AR, N ) {

		var n;

		this.cars.forEach( function ( b, id ) {

			//num = b.userData.NumWheels;
			var j = b.userData.NumWheels, w = 56, k, v;

			n = N + ( id * 64 );//( id * ( num + 2 ) );//( id * 56 );
	        b.userData.speed = AR[ n ];

	        b.userData.wr = [ AR[ n + 62 ], AR[ n + 63 ] ];




	        b.position.fromArray( AR, n + 1 );
	        b.quaternion.fromArray( AR, n + 4 );


	        
	        
	        var decal = 0.2;
	        var ratio = 1 / decal;
	        var radius = b.userData.radius;
	        var steering = AR[ n + 8 ];

	        b.userData.steering = steering;
	        
	        if ( b.userData.steeringWheel ) {

	            b.userData.steeringWheel.rotation.y = - steering * 15;

			}

	        if ( b.userData.isWithBrake ) {

	        	var steeringR = AR[ n + 8 ];
	            var steeringL = AR[ n + 16 ];

	            k = j;

	            while ( k -- ) {

	                if ( k === 0 ) b.userData.b[ k ].rotation.y = steeringL;
	                if ( k === 1 ) b.userData.b[ k ].rotation.y = Math.Pi - steeringR;
	                b.userData.b[ k ].position.y = radius - AR[ n + w + k ];

	            }

	        }

	        if ( b.userData.isWithSusp ) {

	            k = j;

	            while ( k -- ) {

	                v = ( AR[ n + w + k ] ) * ratio;
	                v = v > 1 ? 1 : v;
	                v = v < - 1 ? - 1 : v;

	                if ( v > 0 ) {

	                    b.userData.s[ k ].setWeight( 'low', v );
	                    b.userData.s[ k ].setWeight( 'top', 0 );

	                } else {

	                    b.userData.s[ k ].setWeight( 'low', 0 );
	                    b.userData.s[ k ].setWeight( 'top', - v );

	                }

	            }

	        }


	        if ( b.userData.helper ) {

	        	if ( j === 2 ) {

	                b.userData.helper.updateSuspension( AR[ n + w + 0 ], AR[ n + w + 0 ], AR[ n + w + 1 ], AR[ n + w + 1 ] );

				}

	            if ( j === 4 ) {

	                b.userData.helper.updateSuspension( AR[ n + w + 0 ], AR[ n + w + 1 ], AR[ n + w + 2 ], AR[ n + w + 3 ] );

				}

			}

	        while ( j -- ) {

	        	// suspension info
	            b.userData.suspension[ j ] = AR[ n + 56 + j ];

	            w = 8 * ( j + 1 );
	            b.userData.w[ j ].position.fromArray( AR, n + w + 1 );
	            b.userData.w[ j ].quaternion.fromArray( AR, n + w + 4 );

	        }


		} );

	},

	clear: function () {

		while ( this.cars.length > 0 ) this.destroy( this.cars.pop() );
		this.ID = 0;

	},

	destroy: function ( b ) {

		var wheel;
		for ( var i = 0, lng = b.userData.w.length; i < lng; i ++ ) {

			wheel = b.userData.w[ i ];
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

	add: function ( o ) {


		var name = o.name !== undefined ? o.name : o.type + this.ID ++;

		// delete old if same name
		this.remove( name );




		var size = o.size || [ 2, 0.5, 4 ];
	    var pos = o.pos || [ 0, 0, 0 ];
	    var rot = o.rot || [ 0, 0, 0 ];

	    var wPos = o.wPos || [ 1, 0, 1.6 ];

	    o.masscenter = o.masscenter === undefined ? [ 0, 0, 0 ] : o.masscenter;

	    //var masscenter = o.masscenter || [0,0.25,0];

	    Math.vectorad( rot );

	    // chassis
	    var mesh;
	    if ( o.mesh ) {

	        mesh = new THREE.Group();//o.mesh;
	        mesh.add( o.mesh );
	        /*var k = mesh.children.length;
	            while(k--){
	                //mesh.children[k].position.fromArray( o.masscenter ).negate();//.set( -masscenter[0], -masscenter[1], -masscenter[2] );
	                //mesh.children[k].geometry.translate( masscenter[0], masscenter[1], masscenter[2] );
	                //mesh.children[k].castShadow = true;
	                //mesh.children[k].receiveShadow = true;
	            }*/

		} else if ( o.geometry ) {

	            mesh = new THREE.Mesh( o.geometry, o.material );
	            root.extraGeo.push( o.geometry );

	    } else {

	        var g = new THREE.BufferGeometry().fromGeometry( new THREE.BoxGeometry( size[ 0 ], size[ 1 ], size[ 2 ] ) );//geo.box;
	        g.translate( - o.masscenter[ 0 ], - o.masscenter[ 1 ], - o.masscenter[ 2 ] );
	        root.extraGeo.push( g );
	        mesh = new THREE.Mesh( g, root.mat.move );

	    }


	    if ( o.debug && o.shape ) {

	        mesh = new THREE.Mesh( o.shape, root.mat.debug );

		}

	    //mesh.scale.set( size[0], size[1], size[2] );
	    mesh.position.set( pos[ 0 ], pos[ 1 ], pos[ 2 ] );
	    mesh.rotation.set( rot[ 0 ], rot[ 1 ], rot[ 2 ] );

	    // copy rotation quaternion
	    o.quat = mesh.quaternion.toArray();

	    //mesh.castShadow = true;
	    //mesh.receiveShadow = true;

	    root.container.add( mesh );

	    //mesh.idx = view.setIdx( cars.length, 'cars' );
	    //view.setName( o, mesh );

	    //this.byName[ o.name ] = mesh;

	    mesh.userData.speed = 0;
	    //mesh.userData.steering = 0;
	    mesh.userData.NumWheels = o.nWheel || 4;
	    mesh.userData.suspension = [0,0,0,0,0,0];
	    mesh.userData.wr = [0,0];
	    mesh.userData.steering = 0;
	    mesh.userData.type = 'car';

	    mesh.userData.steeringWheel = o.meshSteeringWheel || null;



	    // wheels

	    var radius = o.radius || 0.4;
	    var radiusBack = o.radiusBack || radius;
	    var deep = o.deep || 0.3;
	    wPos = o.wPos || [ 1, - 0.25, 1.6 ];

	    var w = [];
	    var s = [];
	    var b = [];
	    var m;
	    var isWithSusp = o.meshSusp === undefined ? false : true;
	    var isWithBrake = o.meshBrake === undefined ? false : true;


	    var needScale = o.wheel == undefined ? true : false;

	    var gw = o.wheel || root.geo[ 'wheel' ];
	    var gwr = gw.clone();
	    gwr.rotateY( Math.Pi );
	    root.extraGeo.push( gwr );

	    var wheelmat = root.mat.move;
	    if ( o.wheelMaterial !== undefined ) {

        	if ( o.wheelMaterial.constructor === String ) wheelmat = root.mat[ o.wheelMaterial ];
        	else wheelmat = o.wheelMaterial;

		}

	    //var i = o.nWheel || 4;
	    var n = o.nWheel || 4, p, fw;
	    var by = o.decalYBack || 0;

		for ( var i = 0; i < n; i ++ ) {

			if ( i === 0 ) {

				p = [ wPos[ 0 ], wPos[ 1 ], wPos[ 2 ] ]; fw = true;

			}
			if ( i === 1 ) {

				p = [ - wPos[ 0 ], wPos[ 1 ], wPos[ 2 ] ]; fw = true;

			}
			if ( i === 2 ) {

				p = [ - wPos[ 0 ], wPos[ 1 ], - wPos[ 2 ] ]; fw = false;

			}
			if ( i === 3 ) {

				p = [ wPos[ 0 ], wPos[ 1 ], - wPos[ 2 ] ]; fw = false;

			}
			if ( i === 4 ) {

				p = [ - wPos[ 0 ], wPos[ 1 ], - wPos[ 3 ] ]; fw = false;

			}
			if ( i === 5 ) {

				p = [ wPos[ 0 ], wPos[ 1 ], - wPos[ 3 ] ]; fw = false;

			}

			if ( n === 2 ) { // moto

				if ( i === 0 ) {

					p = [ 0, wPos[ 1 ],  wPos[ 2 ] ]; fw = true;

				}

				if ( i === 1 ) {

					p = [ 0, wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

				}

			}

			if ( n === 3 ) { // moto

				if ( i === 0 ) {

					p = [ 0, wPos[ 1 ], wPos[ 2 ] ]; fw = true;

				}

				if ( i === 1 ) {

					p = [ wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

				}

				if ( i === 2 ) {

					p = [ -wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

				}

			}


	        if ( o.meshBrake ) {

	            m = o.meshBrake.clone();
	           // this.scene.add( m );
	            mesh.add( m );
	            m.position.y = radius;
	            if ( i == 1 || i == 2 ) {

					m.rotation.y = Math.Pi; m.position.x = wPos[ 0 ]; m.rotation.x = Math.Pi;

				} else {

					m.position.x = - wPos[ 0 ];

				}
	            if ( i == 0 || i == 1 ) m.position.z = wPos[ 2 ];
	            else m.position.z = - wPos[ 2 ];

	            b[ i ] = m;//.children[0];

	        }

	        if ( o.meshSusp ) {

	            m = o.meshSusp.clone();
	            mesh.add( m );
	            m.position.y = radius;
	            if ( i == 1 || i == 2 ) m.rotation.y = Math.Pi;
	            if ( i == 0 || i == 1 ) m.position.z = wPos[ 2 ];
	            else m.position.z = - wPos[ 2 ];

	            s[ i ] = m.children[ 0 ];

	        }

	        if ( o.meshWheel ) {

	            w[ i ] = o.meshWheel.clone();
	            needScale = false;
	            if ( i == 1 || i == 2 ) {

	                w[ i ] = new THREE.Group();
	                var ww = o.meshWheel.clone();
	                ww.rotation.y = Math.Pi;
	                w[ i ].add( ww );

				} else {

	                w[ i ] = o.meshWheel.clone();
	                var k = w[ i ].children.length;
	                while ( k -- ) {

	                    if ( w[ i ].children[ k ].name === 'h_pneu' ) w[ i ].children[ k ].rotation.y = Math.Pi;

					}

				}


	        } else {

	            if ( i == 1 || i == 2 ) w[ i ] = new THREE.Mesh( gw, root.mat.move );
	            else w[ i ] = new THREE.Mesh( gwr, root.mat.move );

			}



	        if ( needScale ){

	        	w[ i ].scale.set( deep, fw ? radius : radiusBack, fw ? radius : radiusBack );

	        }

	        //else w[i].material = this.mat.move;//mat.cars;

	        w[ i ].material = wheelmat;
	        w[ i ].castShadow = true;
	        w[ i ].receiveShadow = true;

	        root.container.add( w[ i ] );

	    }

	    if ( o.extraWeels ) {

	        var www = o.meshWheel.clone();
	        www.children[ 0 ].visible = false;
	        www.rotation.z = - Math.Pi * 0.5;
	        www.position.set( 0, 1.25, - 1.11 );
	        mesh.add( www );

		}

	    mesh.userData.radius = radius;
	    mesh.userData.w = w;
	    mesh.userData.s = s;
	    mesh.userData.b = b;
	    mesh.userData.isWithSusp = isWithSusp;
	    mesh.userData.isWithBrake = isWithBrake;

	    if( o.noShadow === undefined ){
	    	mesh.castShadow = true;
	        mesh.receiveShadow = true;
	    }
	    
	    mesh.name = name;

	    if ( o.helper ) {

	        mesh.userData.helper = new THREE.CarHelper( wPos, o.masscenter, deep );
	        mesh.add( mesh.userData.helper );

		}



	    if ( o.mesh ) o.mesh = null;
	    if ( o.wheel ) o.wheel = null;

	    if ( o.shapeType == 'mesh' || o.shapeType == 'convex' ) o.v = geometryInfo( o.shape, o.shapeType );

	    if ( o.shape ) delete ( o.shape );
	    if ( o.geometry ) delete ( o.geometry );
	    if ( o.material ) delete ( o.material );
	    if ( o.mesh ) delete ( o.mesh );
	    if ( o.meshWheel ) delete ( o.meshWheel );
	    if ( o.meshSusp ) delete ( o.meshSusp );
	    if ( o.meshBrake ) delete ( o.meshBrake );
	    if ( o.meshSteeringWheel ) delete ( o.meshSteeringWheel );
	    if ( o.wheelMaterial ) delete ( o.wheelMaterial );

		this.cars.push( mesh );

		//map.set( name + '_body', mesh );

		map.set( name , mesh );

		root.post( 'add', o );

	}

} );

/*global THREE*/
/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    SHOT - CHARACTER
*/

function Character() {

	this.ID = 0;
	this.heroes = [];

}

Object.assign( Character.prototype, {

	step: function ( AR, N ) {

		var n;

		this.heroes.forEach( function ( b, id ) {

			n = N + ( id * 8 );
	        var s = AR[ n ] * 3.33;
	        b.userData.speed = s * 100;
	        b.position.fromArray( AR, n + 1 );
	        b.quaternion.fromArray( AR, n + 4 );

	        if ( b.skin ) {

	            if ( s === 0 ) b.skin.play( 0, 0.3 );
	            else {

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

	add: function ( o ) {


		var name = o.name !== undefined ? o.name : o.type + this.ID ++;

		// delete old if same name
		this.remove( name );

		o.scale  = o.scale || 1;

		o.size = o.size !== undefined ? o.size : [ 0.25, 2 ];

		
	    /*if ( o.size.length == 1 ) {

			o.size[ 1 ] = o.size[ 0 ];

		}
	    if ( o.size.length == 2 ) {

			o.size[ 2 ] = o.size[ 0 ];

		}*/

		if ( o.mesh ) {

			var gm = o.mesh.geometry;
	    	var h = (Math.abs(gm.boundingBox.max.y)+Math.abs(gm.boundingBox.min.y))*o.scale;
	    	var py = -(Math.abs(gm.boundingBox.max.y)-Math.abs(gm.boundingBox.min.y))*o.scale*0.5; // ?
	        o.size[ 1 ] = h;

	    }

	    // The total height is height+2*radius, so the height is just the height between the center of each 'sphere' of the capsule caps
	    o.size[ 1 ] = o.size[ 1 ] - ( o.size[ 0 ]*2 );

	    o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
	    o.rot = o.rot == undefined ? [ 0, 0, 0 ] : Math.vectorad( o.rot );
	    o.quat = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( o.rot ) ).toArray();

	    var material;
	    if ( o.material !== undefined ) {

	    	if ( o.material.constructor === String ) material = root.mat[ o.material ];
	    	else material = o.material;

		} else {

	    	material = root.mat.hero;

		}

	    var g = new Capsule( o.size[ 0 ], o.size[ 1 ], 6 );

	    var mesh = new THREE.Group();//o.mesh || new THREE.Mesh( g );

	    if ( o.debug ) {

	        var mm = new THREE.Mesh( g, root.mat.debug );
	        root.extraGeo.push( g );
	        mesh.add( mm );

	    }


	    if ( o.mesh ) {

	        var model = o.mesh;
	        model.material = material;
	        model.scale.multiplyScalar( o.scale );
	        model.position.set( 0, py, 0 );

	        model.setTimeScale( 0.5 );
	        model.play( 0 );

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

	    if ( o.material ) delete ( o.material );
	    if ( o.mesh ) delete ( o.mesh );
	    if ( o.scale ) delete ( o.scale );
	    


	    root.container.add( mesh );
		this.heroes.push( mesh );

		map.set( name, mesh );

		root.post( 'add', o );

		return mesh;

	},

	/////



} );

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    SHOT - COLLISION
*/

function Collision() {

	this.ID = 0;
	this.pairs = [];

}

Object.assign( Collision.prototype, {

	step: function ( AR, N ) {

		this.pairs.forEach( function ( pair, id ) {

			pair.hit = AR[ N + id ] ? AR[ N + id ] : 0;
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

	add: function ( o ) {


		var name = o.name !== undefined ? o.name : 'pair' + this.ID ++;

		// delete old if same name
		this.remove( name );

	    var pair = new Pair( name, o.callback );

		this.pairs.push( pair );

		delete ( o.callback );

		map.set( name, pair );

		root.post( 'add', o );

		return pair;


	},

});


//-------------------------------------------
//
//  CONTACT CLASS
//
//-------------------------------------------

function Pair( name, callback ) {

	this.name = name;
	this.callback = callback || function(){};
	this.type = 'collision';
	this.hit = 0;

}

Object.assign( Pair.prototype, {

	clear: function () {

		this.name = null;
		this.hit = 0;
		this.callback = null;

	}

} );

/*global THREE*/

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    SHOT - RAY
*/

function RayCaster() {

	this.ID = 0;
	this.rays = [];

}

Object.assign( RayCaster.prototype, {

	step: function () {

		var i = this.rays.length;
		var j = root.flow.ray.length;

		if ( !i ) return;

		if( i===j ){
	        while( j-- ) this.rays[j].update( root.flow.ray[j] );
		}

		root.flow.ray = [];

		this.rays.forEach( function ( r, id ) {

			r.updateMatrixWorld();
			root.flow.ray.push( { origin: r.origin, dest: r.dest, group: r.group, mask: r.mask, precision:r.precision } );
		
		});


	},

	clear: function () {

		while ( this.rays.length > 0 ) this.destroy( this.rays.pop() );
		this.ID = 0;

	},

	destroy: function ( r ) {

		if ( r.parent ) r.parent.remove( r );
		map.delete( r.name );

	},

	remove: function ( name ) {

		if ( ! map.has( name ) ) return;
		var r = map.get( name );
		var n = this.rays.indexOf( r );

		if ( n !== - 1 ) {

			this.rays.splice( n, 1 );
			this.destroy( r );

		}

	},

	add: function ( o ) {

		o.name = o.name !== undefined ? o.name : 'ray' + this.ID ++;
		// delete old if same name
		this.remove( o.name );

		var ray = new Ray( o );
		if( o.visible !== undefined ) ray.visible = o.visible;

		if ( o.parent !== undefined ) o.parent.add( ray );
	    else root.container.add( ray );

		this.rays.push( ray );
		map.set( o.name, ray );

		// send to worker
		delete( o.callback );
		delete( o.parent );
	    root.post( 'add', o );

		return ray;

	},

} );

//--------------------------------------
//   RAY CLASS
//--------------------------------------

function Ray( o ) {

	THREE.Line.call( this );

	this.type = 'ray';

	this.name = o.name;
	this.enabled = o.enabled !== undefined ? o.enabled : true;

	this.precision =  o.precision !== undefined ? o.precision : 1;

	this.callback = o.callback || function () {};

	this.position.fromArray( o.pos || [ 0, 0, 0 ] );

	this.group = o.group !== undefined ? o.group : 1;
	this.mask = o.mask !== undefined ? o.mask : - 1;

	this.origin = [ 0, 0, 0 ];
	this.dest = [ 0, 0, 0 ];

	this.start = new THREE.Vector3().fromArray( o.start || [ 0, 0, 0 ] );
	this.end = new THREE.Vector3().fromArray( o.end || [ 0, 10, 0 ] );
	//this.direction = new THREE.Vector3();
	this.maxDistance = this.start.distanceTo( this.end );

	// tmp
	this.tmp = new THREE.Vector3();
	this.normal = new THREE.Vector3();
	this.inv = new THREE.Matrix4();

	// color
	this.c1 = [ 0.1, 0.1, 0.1 ];
	this.c2 = [ 1.0, 0.1, 0.1 ];

	// geometry

	this.vertices = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
	this.colors = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
	this.local = [ 0, 0, 0, 0, 0, 0 ];

	this.geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( this.vertices, 3 ) );
	this.geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( this.colors, 3 ) );
	this.vertices = this.geometry.attributes.position.array;
	this.colors = this.geometry.attributes.color.array;

	this.material.color.setHex( 0xFFFFFF );
	this.material.vertexColors = THREE.VertexColors;

	this.base = false;

	this.info = { hit:false, name:'', distance:0 };

	this.upGeo();

}

Ray.prototype = Object.assign( Object.create( THREE.Line.prototype ), {

	setFromCamera: function ( coords, camera ) {

		if ( ( camera && camera.isPerspectiveCamera ) ) {

			this.start.setFromMatrixPosition( camera.matrixWorld );
			this.tmp.set( coords.x, coords.y, 0.5 ).unproject( camera ).sub( this.start ).normalize();
			this.end.copy( this.tmp ).multiplyScalar( camera.far ).add( this.start );


		} else if ( ( camera && camera.isOrthographicCamera ) ) {

			this.start.set( coords.x, coords.y, ( camera.near + camera.far ) / ( camera.near - camera.far ) ).unproject( camera ); // set origin in plane of camera
			this.normal.set( 0, 0, - 1 ).transformDirection( camera.matrixWorld );
			this.end.addScaledVector( this.normal, camera.far );

		} else {

			console.error( 'THREE.Raycaster: Unsupported camera type.' );

		}

	},

	updateMatrixWorld: function ( force ) {

		THREE.Line.prototype.updateMatrixWorld.call( this, force );
		this.tmp.copy( this.start ).applyMatrix4( this.matrixWorld );
		this.tmp.toArray( this.origin, 0 );
		this.tmp.copy( this.end ).applyMatrix4( this.matrixWorld );
		this.tmp.toArray( this.dest, 0 );
		this.inv.getInverse( this.matrixWorld );

	},

	upGeo: function ( hit ) {

		if ( ! this.enabled ) return;

		var v = this.vertices;
		var c = this.colors;
		var l = this.local;
		var n, d;

		if ( hit ) {

			this.isBase = false;

			c[ 0 ] = c[ 3 ] = c[ 15 ] = c[ 18 ] = this.c2[ 0 ];
			c[ 1 ] = c[ 4 ] = c[ 16 ] = c[ 19 ] = this.c2[ 1 ];
			c[ 2 ] = c[ 5 ] = c[ 17 ] = c[ 20 ] = this.c2[ 2 ];

			v[ 3 ] = v[ 6 ] = v[ 12 ] = v[ 15 ] = l[ 0 ];
			v[ 4 ] = v[ 7 ] = v[ 13 ] = v[ 16 ] = l[ 1 ];
			v[ 5 ] = v[ 8 ] = v[ 14 ] = v[ 17 ] = l[ 2 ];

			v[ 18 ] = l[ 3 ];
			v[ 19 ] = l[ 4 ];
			v[ 20 ] = l[ 5 ];

			this.geometry.attributes.position.needsUpdate = true;
	    	this.geometry.attributes.color.needsUpdate = true;

		} else {

			if ( this.isBase ) return;

			var i = 7;
			while ( i -- ) {

				n = i * 3;
				d = i < 3 ? true : false;
				c[ n ] = this.c1[ 0 ];
				c[ n + 1 ] = this.c1[ 1 ];
				c[ n + 2 ] = this.c1[ 2 ];
				v[ n ] = d ? this.start.x : this.end.x;
				v[ n + 1 ] = d ? this.start.y : this.end.y;
				v[ n + 2 ] = d ? this.start.z : this.end.z;

			}

			this.geometry.attributes.position.needsUpdate = true;
	     	this.geometry.attributes.color.needsUpdate = true;
			this.isBase = true;

		}

	},

	update: function ( o ) {

		this.info.hit = o.hit;
		this.info.name = o.name || '';
		this.info.distance = 0;

		if ( o.hit ) {

			//this.callback( o );

			if ( this.enabled ) {

				this.tmp.fromArray( o.point ).applyMatrix4( this.inv );
				var d = this.tmp.distanceTo( this.end );
				o.distance = this.maxDistance - d;
				this.info.distance = o.distance;
				this.tmp.toArray( this.local, 0 );
			    this.normal.fromArray( o.normal );
			    this.tmp.addScaledVector( this.normal, d );
			    this.tmp.toArray( this.local, 3 );
			    this.upGeo( true );

			}

		} else {

			this.upGeo();

		}

		this.callback( o );

	}

} );

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
		if( !geometry ) { console.log(object, 'no geometry ?'); return 0;}
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

		} while ( symbol < 0x100 );

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

		} while ( symbol < 0x100 );

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
		value = ~ ~ ( value / 9 );
		lp = value % 5;
		pb = ~ ~ ( value / 5 );

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

} )();

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

var engine = ( function () {

	var type = 'LZMA'; // LZMA / WASM / ASM

	var worker, callback, blob = null;

	var URL = window.URL || window.webkitURL;
	var Time = typeof performance === 'undefined' ? Date : performance;
	var t = { now: 0, delta: 0, then: 0, deltaTime:0, inter: 0, tmp: 0, n: 0, timerate: 0, steptime: 0 };

	var timer = null;

	var refView = null;

	var isBuffer = false;
	var isPause = false;
	var stepNext = false;

	var currentMode = '';
	var oldMode = '';

	var PI90 = Math.PI * 0.5;
	var torad = Math.PI / 180;
	var todeg = 180 / Math.PI;

	var rigidBody, softBody, terrains, vehicles, character, collision, rayCaster, constraint;

	var convexBreaker = null;
	var ray = null;
	var mouseMode = 'free';

	var tmpRemove = [];
	var tmpAdd = [];

	var oldFollow = '';

	var isInternUpdate = false;
	//var isRequestAnimationFrame = false;

	var option = {

		worldscale: 1,
		gravity: [ 0, - 10, 0 ],
		fps: 60,

		substep: 2,
		broadphase: 2,
		soft: true,

		animFrame : true,
		fixed: true,
		jointDebug: false,

	};

	engine = {

		folder: './build/',

		message: function ( e ) {

			var data = e.data;
			if ( data.Ar ) root.Ar = data.Ar;
			if ( data.flow ) root.flow = data.flow;

			switch ( data.m ) {

				case 'initEngine': engine.initEngine(); break;
				case 'start': engine.start(); break;
				case 'step': engine.step(data.fps, data.delta); break;

				case 'moveSolid': engine.moveSolid( data.o ); break;
				case 'ellipsoid': engine.ellipsoidMesh( data.o ); break;

				case 'makeBreak': engine.makeBreak( data.o ); break;

			}

		},

		init: function ( Callback, Type, Option, Counts ) {

			this.initArray( Counts );
			this.defaultRoot();

			Option = Option || {};

			callback = Callback;

			isInternUpdate = Option.use_intern_update || false;

			option = {

				fps: Option.fps || 60,
				worldscale: Option.worldscale || 1,
				gravity: Option.gravity || [ 0, - 10, 0 ],
				substep: Option.substep || 2,
				broadphase: Option.broadphase || 2,
				soft: Option.soft !== undefined ? Option.soft : true,
				//penetration: Option.penetration || 0.0399,

				fixed: Option.fixed !== undefined ? Option.fixed : true,
				animFrame: Option.animFrame !== undefined ? Option.animFrame : true,

				jointDebug : Option.jointDebug !== undefined ? Option.jointDebug : false,

				isInternUpdate: isInternUpdate,

			};

			t.timerate = ( 1 / option.fps ) * 1000;
			//t.autoFps = option.autoFps;

			type = Type || 'LZMA';

			switch( type ) {

				case 'min' : 
				    engine.load( engine.folder + "ammo.hex", true );
				break;

				case 'LZMA' : case 'lzma' : case 'compact' :
				    engine.load( engine.folder + "ammo.hex" );
				break;

				case 'WASM': case 'wasm':
				    blob = document.location.href.replace( /\/[^/]*$/, "/" ) + engine.folder + "ammo.wasm.js";
				    engine.startWorker();
				break;

				case 'BASIC': case 'basic':
				    blob = document.location.href.replace( /\/[^/]*$/, "/" ) + engine.folder + "ammo.js";
				    engine.startWorker();
				break;

			}

		},

		set: function ( o ) {

			o = o || option;
			t.timerate = o.fps !== undefined ? ( 1 / o.fps ) * 1000 : t.timerate;
			//t.autoFps = o.autoFps !== undefined ? o.autoFps : false;

			option.fixed = o.fixed || false;
			option.animFrame = o.animFrame || false;
			option.jointDebug = o.jointDebug || false;

			o.isInternUpdate = isInternUpdate;

			root.constraintDebug = option.jointDebug;

			this.post( 'set', o );

		},

		load: function ( link, isMin ) {

			var xhr = new XMLHttpRequest();
			xhr.responseType = "arraybuffer";
			xhr.open( 'GET', link, true );

			xhr.onreadystatechange = function () {

				if ( xhr.readyState === 4 ) {

					if ( xhr.status === 200 || xhr.status === 0 ) {

						blob = URL.createObjectURL( new Blob( [ LZMAdecompact( xhr.response ) ], { type: 'application/javascript' } ) );
						engine.startWorker( isMin );

					} else {

						console.error( "Couldn't load [" + link + "] [" + xhr.status + "]" );

					}

				}

			};

			xhr.send( null );

		},

		startWorker: function ( isMin ) {

			isMin = isMin || false;

			//blob = document.location.href.replace(/\/[^/]*$/,"/") + "./build/ammo.js" ;

			worker = new Worker( engine.folder + (isMin ? 'gun.min.js' : 'gun.js') );
			worker.postMessage = worker.webkitPostMessage || worker.postMessage;
			worker.onmessage = engine.message;

			// test transferrables
			var ab = new ArrayBuffer( 1 );
			worker.postMessage( { m: 'test', ab: ab }, [ ab ] );
			isBuffer = ab.byteLength ? false : true;

			if( isInternUpdate ) isBuffer = false;

			// start engine worker
			engine.post( 'init', { blob: blob, ArPos: root.ArPos, ArMax: root.ArMax, isBuffer: isBuffer, option: option } );
			root.post = engine.post;

		},

		initArray: function ( Counts ) {

			Counts = Counts || {};

			var counts = {
				maxBody: Counts.maxBody || 1400,
				maxContact: Counts.maxContact || 200,
				maxCharacter: Counts.maxCharacter || 10,
				maxCar: Counts.maxCar || 14,
				maxSoftPoint: Counts.maxSoftPoint || 8192,
				maxJoint: Counts.maxJoint || 1000,
			};

			root.ArLng = [
				counts.maxBody * 8, // rigidbody
				counts.maxContact, // contact
				counts.maxCharacter * 8, // hero
				counts.maxCar * 64, // cars
				counts.maxSoftPoint * 3, // soft point
				counts.maxJoint * 14, // joint point
			];

			root.ArPos = [
				0,
				root.ArLng[ 0 ],
				root.ArLng[ 0 ] + root.ArLng[ 1 ],
				root.ArLng[ 0 ] + root.ArLng[ 1 ] + root.ArLng[ 2 ],
				root.ArLng[ 0 ] + root.ArLng[ 1 ] + root.ArLng[ 2 ] + root.ArLng[ 3 ],
				root.ArLng[ 0 ] + root.ArLng[ 1 ] + root.ArLng[ 2 ] + root.ArLng[ 3 ] + root.ArLng[ 4 ],
			];

			root.ArMax = root.ArLng[ 0 ] + root.ArLng[ 1 ] + root.ArLng[ 2 ] + root.ArLng[ 3 ] + root.ArLng[ 4 ] + root.ArLng[ 5 ];

		},

		initEngine: function () {

			URL.revokeObjectURL( blob );
			blob = null;

			this.initObject();

			console.log( 'SHOTGUN ' + REVISION + ' | '+ ( isBuffer ? 'buffer' : 'no buffer' ) + ' | ' + type );

			if ( callback ) callback();

		},

		start: function ( noAutoUpdate ) {

			if( isPause ) return;

			engine.stop();

			//console.log('start', t.timerate );

			stepNext = true;

			// create tranfere array if buffer
			if ( isBuffer ) root.Ar = new Float32Array( root.ArMax );

			//engine.sendData( 0 );

			t.then = Time.now();



			if( !noAutoUpdate && !isInternUpdate ){

				timer = option.animFrame ? requestAnimationFrame( engine.sendData ) : setInterval(  function(){ engine.sendData(); }, t.timerate );

				//console.log( option.animFrame )

			}

			if( !noAutoUpdate && isInternUpdate ){ //engine.sendStep();
				var key = engine.getKey();
				worker.postMessage( { m: 'internStep', o: {  steptime:t.steptime, key:key }, flow: root.flow, Ar: root.Ar } );
			}

			// test ray
			engine.setMode( oldMode );

		},

		prevUpdate: function () {},
		postUpdate: function () {},
		pastUpdate: function () {},

		update: function () {

			engine.postUpdate( t.delta );

			rigidBody.step( root.Ar, root.ArPos[ 0 ] );
			collision.step( root.Ar, root.ArPos[ 1 ] );
			character.step( root.Ar, root.ArPos[ 2 ] );
			vehicles.step( root.Ar, root.ArPos[ 3 ] );
			softBody.step( root.Ar, root.ArPos[ 4 ] );
			constraint.step( root.Ar, root.ArPos[ 5 ] );

			terrains.step();

			rayCaster.step();

			engine.pastUpdate( t.delta );

		},

		step: function ( fps, delta ) {


			//t.now = Time.now();

			//var start = Time.now();


			if( isInternUpdate ){
				t.fps = fps;
				t.delta = delta; 
			} else {
			    //t.now = Time.now();
				if ( t.now - 1000 > t.tmp ) { t.tmp = t.now; t.fps = t.n; t.n = 0; } t.n ++; // FPS
			}

			

			

			engine.tell();

			engine.update();
			

			if ( root.controler ) root.controler.follow();
			
			
			engine.stepRemove();
        	engine.stepAdd();



        	//t.steptime = (Time.now() - t.now) * 0.001; // millisecond

        	
            stepNext = true;


			if( isInternUpdate ){ engine.sendStep(); }

			

		},

		sendData: function ( stamp ) {

			if( isInternUpdate ) return;

			if ( refView ) if ( refView.pause ) { engine.stop(); return; }
        	
        	if( option.animFrame ){

        		timer = requestAnimationFrame( engine.sendData );
        		//if ( !stepNext ) return;
        		t.now = stamp === undefined ? Time.now() : stamp;
        		t.deltaTime = t.now - t.then;
        		t.delta = t.deltaTime * 0.001;

        		if ( t.deltaTime > t.timerate ){

        			t.then = t.now - ( t.deltaTime % t.timerate );
        				
        			engine.sendStep();
        			
        		}
        		

        	} else {

        		if ( !stepNext ){ return; }

        		//t.delta = ( t.now - Time.now() ) * 0.001;

        		t.delta = ( t.now - t.then ) * 0.001;
        		t.then = t.now;

        		//t.now = Time.now();
			    //t.delta = ( t.now - t.then ) * 0.001;

			    //t.delta -= t.steptime;

			    //console.log(t.delta)
        	    //t.then = t.now;
        	    //

        	    engine.sendStep();

        	}


		},

		sendStep: function () {

			if ( !stepNext ) return;

			t.now = Time.now();
			//t.delta = ( t.now - t.then ) * 0.001;
			//t.then = t.now;

			engine.prevUpdate( t.delta );

			var key = engine.getKey();

        	// timeStep < maxSubSteps * fixedTimeStep if you don't want to lose time.

        	if( isInternUpdate ) {

        		if ( isBuffer ) worker.postMessage( { m: 'internStep', o: { steptime:t.steptime,  key:key }, flow: root.flow, Ar: root.Ar }, [ root.Ar.buffer ] );
			    //else worker.postMessage( { m: 'internStep', o: {  steptime:t.steptime, key:key }, flow: root.flow, Ar: root.Ar } );

        	} else {

        		if ( isBuffer ) worker.postMessage( { m: 'step', o: { delta: t.delta, key:key }, flow: root.flow, Ar: root.Ar }, [ root.Ar.buffer ] );
			    else worker.postMessage( { m: 'step', o: { delta: t.delta, key:key }, flow: root.flow, Ar: root.Ar } );

        	}

        	

			stepNext = false;

		},

		simpleStep: function (delta) {

			var key = engine.getKey();
			worker.postMessage( { m: 'step', o: { delta: delta, key:key } } );

		},

		

		/////////

		stepRemove: function () {

			if( tmpRemove.length === 0 ) return;
			this.post( 'setRemove', tmpRemove );
			while ( tmpRemove.length > 0 ) this.remove( tmpRemove.pop(), true );

		},

		stepAdd: function () {

			if( tmpAdd.length === 0 ) return;
			//this.post( 'setAdd', tmpAdd );
			while ( tmpAdd.length > 0 ) this.add( tmpAdd.shift() );

		},

		setView: function ( v ) {

			refView = v;
			root.mat = Object.assign( {}, root.mat, v.getMat() );
			root.geo = Object.assign( {}, root.geo, v.getGeo() );//v.getGeo();
			root.container = v.getContent();
			root.controler = v.getControler();

			root.isRefView = true;

			//if( isInternUpdate ) refView.updateIntern = engine.update;

		},

		getFps: function () { return t.fps; },
		getDelta: function () { return t.delta; },
		getIsFixed: function () { return option.fixed; },
		getKey: function () { return [ 0, 0, 0, 0, 0, 0, 0, 0 ]; },

		tell: function () {},
		log: function () {},


		

		post: function ( m, o ) {

			worker.postMessage( { m:m, o:o } );

		},

		reset: function ( full ) {

			//console.log('reset', full);

			engine.postUpdate = function(){};
			engine.pastUpdate = function(){};
			engine.prevUpdate = function(){};

			isPause = false;

			oldMode = currentMode;
			engine.setMode( '' );

			engine.stop();

			// remove all mesh
			engine.clear();

			// remove tmp material
			while ( root.tmpMat.length > 0 ) root.tmpMat.pop().dispose();

			tmpRemove = [];
			tmpAdd = [];
			oldFollow = '';

			if ( refView ) refView.reset( full );

			// clear physic object;
			engine.post( 'reset', { full: full } );

		},

		pause: function () {

			isPause = true;

		},

		play: function () {

			if( !isPause ) return
			isPause = false;
			engine.start();
			
		}, 

		stop: function () {

			if ( timer === null ) return;

			if( option.animFrame ) window.cancelAnimationFrame( timer );
			else clearInterval( timer );
			
			timer = null;

		},

		destroy: function () {

			worker.terminate();
			worker = undefined;

		},



		////////////////////////////

		addMat: function ( m ) {

			root.tmpMat.push( m );

		},

		ellipsoidMesh: function ( o ) {

			softBody.createEllipsoid( o );

		},

		updateTmpMat: function ( envmap, hdr ) {

			var i = root.tmpMat.length, m;
			while ( i -- ) {

				m = root.tmpMat[ i ];
				if ( m.envMap !== undefined ) {

					if ( m.type === 'MeshStandardMaterial' ) m.envMap = envmap;
					else m.envMap = hdr ? null : envmap;
					m.needsUpdate = true;

				}

			}

		},

		setVehicle: function ( o ) {

			root.flow.vehicle.push( o );

		},

		drive: function ( name ) {

			this.post( 'setDrive', name );

		},

		move: function ( name ) {

			this.post( 'setMove', name );

		},

		//-----------------------------
		//
		//  DIRECT
		//
		//-----------------------------

		// if( o.constructor !== Array ) o = [ o ];

		forces: function ( o, direct ) {

			direct = direct || false;
			engine.post( direct ? 'directForces' : 'setForces', o );

		},

		options: function ( o, direct ) {

			direct = direct || false;
			engine.post( direct ? 'directOptions' : 'setOptions', o );

		},

		matrix: function ( o, direct ) {

			direct = direct || false;
			engine.post( direct ? 'directMatrix' : 'setMatrix', o );

		},

		//-----------------------------
		//
		//  FLOW
		//
		//-----------------------------

		clearFlow: function () {

			root.flow = { ray:[], terrain:[], vehicle:[] };
			//root.flow = { matrix:{}, force:{}, option:{}, ray:[], terrain:[], vehicle:[] };

		},

		anchor: function ( o ) {

			this.post( 'addAnchor', o );

		},

		break: function ( o ) {

			this.post( 'addBreakable', o );

		},

		moveSolid: function ( o ) {

			if ( ! map.has( o.name ) ) return;
			var b = map.get( o.name );
			if ( o.pos !== undefined ) b.position.fromArray( o.pos );
			if ( o.quat !== undefined ) b.quaternion.fromArray( o.quat );

		},

		getBodys: function () {

			return rigidBody.bodys;

		},

		initObject: function () {

			rigidBody = new RigidBody();
			softBody = new SoftBody();
			terrains = new Terrain();
			vehicles = new Vehicle();
			character = new Character();
			collision = new Collision();
			rayCaster = new RayCaster();
			constraint = new Constraint();

		},

		//-----------------------------
		//
		//  CLEAR
		//
		//-----------------------------

		clear: function () {

			engine.clearFlow();

			rigidBody.clear();
			collision.clear();
			terrains.clear();
			vehicles.clear();
			character.clear();
			softBody.clear();
			rayCaster.clear();
			constraint.clear();

			while ( root.extraGeo.length > 0 ) root.extraGeo.pop().dispose();

		},

		//-----------------------------
		//
		//  REMOVE
		//
		//-----------------------------

		remove: function ( name, phy ) {

		    // remove physics 
			if( !phy ) this.post( 'remove', name );

			//if ( ! map.has( name ) ) return;
			var b = engine.byName( name );
			if( b === null ) return;

			switch( b.type ){

				case 'solid': case 'body' :
				    rigidBody.remove( name );
				break;

				case 'soft' :
				    softBody.remove( name );
				break;

				case 'terrain' :
				    terrains.remove( name );
				break;

				case 'collision' :
				    collision.remove( name );
				break;

				case 'ray' :
				    rayCaster.remove( name );
				break;

				case 'constraint':
				    constraint.remove( name );
				break;

			}

		},

		removes: function ( o ) {

			tmpRemove = tmpRemove.concat( o );

		},

		removesDirect: function ( o ) {

			this.post( 'directRemoves', o );

		},

		//-----------------------------
		//
		//  FIND OBJECT
		//
		//-----------------------------

		byName: function ( name ) {

			if ( ! map.has( name ) ) { engine.tell('no find object !!' ); return null; }
			else return map.get( name );

		},

		//-----------------------------
		//
		//  ADD
		//
		//-----------------------------

		addGroup: function ( list ) {

			tmpAdd = tmpAdd.concat( list );

		},

		add: function ( o ) {

			o = o || {};
			var type = o.type === undefined ? 'box' : o.type;
			var prev = type.substring( 0, 4 );

			if ( prev === 'join' ) return constraint.add( o );
			else if ( prev === 'soft' ) softBody.add( o );
			else if ( type === 'terrain' ) terrains.add( o );
			else if ( type === 'character' ) return character.add( o );
			else if ( type === 'collision' ) return collision.add( o );
			else if ( type === 'car' ) vehicles.add( o );
			else if ( type === 'ray' ) return rayCaster.add( o );
			else return rigidBody.add( o );

		},

		defaultRoot: function () {

			// geometry

			var geo = {
				circle: new THREE.CircleBufferGeometry( 1, 6 ),
				plane: new THREE.PlaneBufferGeometry( 1, 1, 1, 1 ),
				box: new THREE.BoxBufferGeometry( 1, 1, 1 ),
				hardbox: new THREE.BoxBufferGeometry( 1, 1, 1 ),
				cone: new THREE.CylinderBufferGeometry( 0, 1, 0.5 ),
				wheel: new THREE.CylinderBufferGeometry( 1, 1, 1, 18 ),
				sphere: new THREE.SphereBufferGeometry( 1, 16, 12 ),
				highsphere: new THREE.SphereBufferGeometry( 1, 32, 24 ),
				cylinder: new THREE.CylinderBufferGeometry( 1, 1, 1, 12, 1 ),
				hardcylinder: new THREE.CylinderBufferGeometry( 1, 1, 1, 12, 1 ),
				joint: new THREE.ConeBufferGeometry( 0.1,0.2, 4 ),
			};

			geo.circle.rotateX( - PI90 );
			geo.plane.rotateX( - PI90 );
			geo.wheel.rotateZ( - PI90 );

			 geo.joint.translate( 0, 0.1, 0 );
			 geo.joint.rotateZ( -Math.PI*0.5 );

			root.geo = geo;

			// material

			var wire = false;
			var shadowSide = false;
			
			root.mat = {

				hide: new THREE.MeshBasicMaterial({ name: 'debug', color:0x000000, depthTest:false, depthWrite:false, visible:false }),

				move: new THREE.MeshLambertMaterial( { color: 0xCCCCCC, name: 'move', wireframe: wire, shadowSide:shadowSide } ),
				speed: new THREE.MeshLambertMaterial( { color: 0xFFCC33, name: 'speed', wireframe: wire, shadowSide:shadowSide } ),
				sleep: new THREE.MeshLambertMaterial( { color: 0x33CCFF, name: 'sleep', wireframe: wire, shadowSide:shadowSide } ),
				static: new THREE.MeshLambertMaterial( { color: 0x333333, name: 'static', wireframe: wire, shadowSide:shadowSide, transparent:true, opacity:0.3, depthTest:true, depthWrite:false } ),
				kinematic: new THREE.MeshLambertMaterial( { color: 0x88FF33, name: 'kinematic', wireframe: wire, shadowSide:shadowSide } ),
				soft: new THREE.MeshLambertMaterial({ name: 'soft', vertexColors:THREE.VertexColors, shadowSide:shadowSide }),

				debug: new THREE.MeshBasicMaterial({ name: 'debug', color:0x00FF00, depthTest:false, depthWrite:false, wireframe:true, shadowSide:shadowSide }),


				jointLine: new THREE.LineBasicMaterial( { name: 'jointLine', vertexColors: THREE.VertexColors, depthTest: false, depthWrite: false, transparent: true }),
				jointP1: new THREE.MeshBasicMaterial({ name: 'jointP1', color:0x00FF00, depthTest:false, depthWrite:true, wireframe:true }),
				jointP2: new THREE.MeshBasicMaterial({ name: 'jointP2', color:0xFFFF00, depthTest:false, depthWrite:true, wireframe:true }),

			};

			root.container = new THREE.Group();

			root.destroy = function ( b ) {

		        var m;
		        while( b.children.length > 0 ) {
		            m = b.children.pop();
		            while( m.children.length > 0 ) m.remove( m.children.pop() );
		            b.remove( m );
		        }

		        if ( b.parent ) b.parent.remove( b );

		    };

		},

		getContainer: function () {

			return root.container;

		},

		//-----------------------------
		//
		//  BREAKABLE
		//
		//-----------------------------

		makeBreak: function ( o ) {

			var name = o.name;
			if ( ! map.has( name ) ) return;

			if ( convexBreaker === null ) convexBreaker = new ConvexObjectBreaker();

			var mesh = map.get( name );

			
			// breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision ]
			var breakOption = o.breakOption;

			var debris = convexBreaker.subdivideByImpact( mesh, o.pos, o.normal, breakOption[ 1 ], breakOption[ 2 ] ); // , 1.5 ??
			// remove one level
			breakOption[ 3 ] -= 1;
			
			
			// remove original object
			tmpRemove.push( name );

			var i = debris.length;
			while ( i -- ) tmpAdd.push( this.addDebris( name, i, debris[ i ], breakOption ) );

			//while ( i -- ) this.addDebris( name, i, debris[ i ], breakOption );

		},

		addDebris: function ( name, id, mesh, breakOption ) {

			var o = {
				name: name + '_debris' + id,
				material: mesh.material,
				type: 'convex',
				shape: mesh.geometry,
				//size: mesh.scale.toArray(),
				pos: mesh.position.toArray(),
				quat: mesh.quaternion.toArray(),
				mass: mesh.userData.mass,
				linearVelocity: mesh.userData.velocity.toArray(),
				angularVelocity: mesh.userData.angularVelocity.toArray(),
				margin: 0.05,
			};

			// if levelOfSubdivision > 0 make debris breakable !!
			if ( breakOption[ 3 ] > 0 ) {

				o.breakable = true;
				o.breakOption = breakOption;

			}

			//this.add( o );

			return o;

		},

		//-----------------------------
		//
		// EXTRA MODE
		//
		//-----------------------------

		setMode: function ( mode ) {

			if ( mode !== currentMode ) {

				if ( currentMode === 'picker' ) engine.removeRayCamera();
				if ( currentMode === 'shoot' ) engine.removeShootCamera();
				if ( currentMode === 'lock' ) engine.removeLockCamera();

			}

			currentMode = mode;

			if ( currentMode === 'picker' ) engine.addRayCamera();
			if ( currentMode === 'shoot' ) engine.addShootCamera();
			if ( currentMode === 'lock' ) engine.addLockCamera();

		},

		// CAMERA LOCK

		addLockCamera: function () {

		},

		removeLockCamera: function () {

		},

		// CAMERA SHOOT

		addShootCamera: function () {

		},

		removeShootCamera: function () {

		},

		// CAMERA RAY

		addRayCamera: function () {

			if ( ! refView ) return;

			ray = engine.add( { name: 'cameraRay', type: 'ray', callback: engine.onRay, mask: 1, visible: false } );// only move body
			refView.activeRay( engine.updateRayCamera, false );

		},

		removeRayCamera: function () {

			if ( ! refView ) return;
			engine.remove( 'cameraRay' );
			refView.removeRay();
			engine.log();

		},

		updateRayCamera: function ( offset ) {

			//ray.setFromCamera( refView.getMouse(), refView.getCamera() );
			if ( mouseMode === 'drag' ) engine.matrix( [{ name:'dragger', pos: offset.toArray(), keepRot:true }] );

		},

		onRay: function ( o ) {

			var mouse = refView.getMouse();
			var control = refView.getControls();
			var name = o.name === undefined ? '' : o.name;

			ray.setFromCamera( mouse, control.object );

			if ( mouse.z === 0 ) {

				if ( mouseMode === 'drag' ){ 
					control.enableRotate = true;
					engine.removeConnector();
				}

				mouseMode = 'free';

			} else {

				if ( mouseMode === 'free' ) {

					if ( name ) {

						if( mouseMode !== 'drag' ){

							refView.setDragPlane( o.point );
						    control.enableRotate = false;
						    engine.addConnector( o );
						    mouseMode = 'drag';

						} 

					} else {

						mouseMode = 'rotate';

					}

				}

				/*if ( mouseMode === 'drag' ){

					physic.matrix( [{ name:'dragger', pos: refView.getOffset().toArray() }] );

				}*/

			}

			// debug
			engine.log( mouseMode + '   ' + name );

		},

		addConnector: function ( o ) {

			//if ( ! map.has( o.name ) ) { console.log('no find !!'); return;}
			//var mesh = map.get( o.name );

			var mesh = engine.byName( o.name );
			if( mesh === null ) return;

			// reste follow on drag
			engine.testCurrentFollow( o.name );  


			var p0 = new THREE.Vector3().fromArray( o.point );
			var qB = mesh.quaternion.toArray();
			var pos = engine.getLocalPoint( p0, mesh ).toArray();

			engine.add({ 
				name:'dragger', 
				type:'sphere', 
				size:[0.2], 
				pos:o.point,
				quat: qB, 
				mass:0, 
				kinematic: true,
				group:32,
				mask:32, 
			});

			engine.add({ 
				name:'connector', 
				type:'joint_fixe', 
				b1:'dragger', b2:o.name, 
				pos1:[0,0,0], pos2:pos,
				collision:false 
			});
		},

		removeConnector: function () {

			engine.remove( 'dragger' );
			engine.remove( 'connector' );

			if( oldFollow !== '' ) engine.setCurrentFollow( oldFollow );

		},

		getLocalPoint: function (vector, mesh) {
			
			mesh.updateMatrix();
			//mesh.updateMatrixWorld(true);
			var m1 = new THREE.Matrix4();
			var s = new THREE.Vector3(1,1,1);
			var m0 = new THREE.Matrix4().compose( mesh.position, mesh.quaternion, s );
			m1.getInverse( m0 );
			return vector.applyMatrix4( m1 );

		},

		setCurrentFollow: function ( name, o ) {

			if( !refView ) return;
			var target = engine.byName( name );
            if( target !== null ) refView.getControls().initFollow( target, o );
            else refView.getControls().resetFollow();
            oldFollow = '';

		},


		testCurrentFollow: function ( name ) {

			oldFollow = '';
			if( !refView ) return;
			if( !refView.getControls().followTarget ) return;
			if( refView.getControls().followTarget.name === name ){ 
				refView.getControls().resetFollow();
				oldFollow = name;
			}

		},



	};

	return engine;

} )();

export { engine };
