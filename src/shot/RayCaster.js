/*global THREE*/
import { root, map } from './root.js';

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


export { RayCaster };

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
	this.point = new THREE.Vector3().fromArray( o.start || [0,10,0] );
	this.pointX = new THREE.Vector3().fromArray( o.start || [0,10,0] );
	this.normal = new THREE.Vector3().fromArray(  [0,0,0] );

	this.c1 = new THREE.Vector3(0.1,0.1,0.1)
	this.c2 = new THREE.Vector3(0,1.0,0)

	this.inv = new THREE.Matrix4();


	this.callback = o.callback || function (){};
	this.result = { name:'' };

	this.vertices = [ 0,0,0, 0,0,0, 0,0,0, 0,0,0 , 0,0,0, 0,0,0, 0,0,0 ];
	this.colors = [  0,0,0, 0,0,0, 0,0,0, 0,0,0 , 0,0,0, 0,0,0, 0,0,0 ];

	

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

	upGeo: function ( on ) {

		if( on ) {

			this.isBase = false;

			this.c2.toArray( this.colors, 0*3 );
			this.c2.toArray( this.colors, 1*3 );

			this.c2.toArray( this.colors, 5*3 );
			this.c2.toArray( this.colors, 6*3 );

			this.start.toArray( this.vertices, 0 );
			this.point.toArray( this.vertices, 1*3 );
			this.point.toArray( this.vertices, 2*3 );
			this.end.toArray( this.vertices, 3*3 );
			this.point.toArray( this.vertices, 4*3 );
			this.point.toArray( this.vertices, 5*3 );//normal point
			this.pointX.toArray( this.vertices, 6*3 );//normal point

			this.geometry.attributes.position.needsUpdate = true;
	    	this.geometry.attributes.color.needsUpdate = true;

		} else {

			if(this.isBase) return;

			var i = 7;
			while(i--) this.c1.toArray( this.colors, i*3 );

			this.start.toArray( this.vertices, 0 );
			this.start.toArray( this.vertices, 1*3 );
			this.start.toArray( this.vertices, 2*3 );
			this.end.toArray( this.vertices, 3*3 );
			this.end.toArray( this.vertices, 4*3 );
			this.end.toArray( this.vertices, 5*3 );
			this.end.toArray( this.vertices, 6*3 );

			this.geometry.attributes.position.needsUpdate = true;
	     	this.geometry.attributes.color.needsUpdate = true;

			this.isBase = true;

		}

		

	},

	update: function ( o ) {

		if( o.hit ){

			this.callback( o );
			//this.material.color.setHex( 0x00FF00 );
			this.point.fromArray( o.point ).applyMatrix4( this.inv );
			var d = this.point.distanceTo( this.end );
			//this.point = this.worldToLocal(this.point)
		    this.normal.fromArray( o.normal );

		    this.pointX.copy( this.point ).addScaledVector( this.normal, d );

		    this.upGeo(true)

		} else {

			//this.material.color.setHex( 0xFF0000 );

			this.upGeo()

		}



	}

});

export { Ray };