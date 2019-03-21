/*global THREE*/
import { root, map } from './root.js';

function RayCaster() {

	this.ID = 0;
	this.rays = [];

}

Object.assign( RayCaster.prototype, {

	step: function () {

		if ( ! this.rays.length ) return;

		var raytest = [];

		this.rays.forEach( function ( r ) {

			r.updateMatrixWorld();
			raytest.push( { origin: r.origin, dest: r.dest, group: r.group, mask: r.mask } );

		} );

		root.post( 'rayCast', raytest );

	},

	receive: function ( o ) {

		var i = this.rays.length;
		if ( ! i ) return;
		if ( i !== o.length ) return;

		while ( i -- ) this.rays[ i ].update( o[ i ] );

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

		if ( o.parent !== undefined ) o.parent.add( ray );
	    else root.container.add( ray );

		this.rays.push( ray );
		map.set( o.name, ray );
		return ray;

	},

} );


export { RayCaster };

//--------------------------------------
//   RAY CLASS
//--------------------------------------

function Ray( o ) {


	THREE.Line.call( this );

	this.name = o.name;
	this.visible = o.visible !== undefined ? o.visible : true;

	this.callback = o.callback || function () {};

	this.position.fromArray( o.pos || [ 0, 0, 0 ] );

	this.group = o.group !== undefined ? o.group : 1;
	this.mask = o.mask !== undefined ? o.mask : - 1;

	this.origin = [ 0, 0, 0 ];
	this.dest = [ 0, 0, 0 ];

	this.start = new THREE.Vector3().fromArray( o.start || [ 0, 0, 0 ] );
	this.end = new THREE.Vector3().fromArray( o.end || [ 0, 10, 0 ] );
	//this.direction = new THREE.Vector3();

	// tmp
	this.tmp = new THREE.Vector3();
	this.normal = new THREE.Vector3();
	this.inv = new THREE.Matrix4();

	// color
	this.c1 = [ 0.1, 0.1, 0.1 ];
	this.c2 = [ 0.1, 1.0, 0.1 ];

	// geometry

	this.vertices = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
	this.colors = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
	this.local = [ 0, 0, 0, 0, 0, 0 ];

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

		if ( ! this.visible ) return;

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

		if ( o.hit ) {

			//this.callback( o );

			if ( this.visible ) {

				this.tmp.fromArray( o.point ).applyMatrix4( this.inv );
				var d = this.tmp.distanceTo( this.end );
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

export { Ray };
