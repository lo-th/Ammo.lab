/*global Ammo*/
import { root, map } from './root.js';

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    GUN - RAY
*/

function RayCaster() {

	this.ID = 0;
	this.rays = [];
	this.ray = null;
	this.results = [];

}

Object.assign( RayCaster.prototype, {

	step: function () {

		if( this.ray === null ) return;

		var i = this.rays.length;
		var j = root.flow.ray.length;

		if ( !i ) return;

		//var updated = i === root.flow.ray.length;

		if(i===j){
			//var j = root.flow.ray.length;
	        while( j-- ) this.rays[j].update( root.flow.ray[j] );
	        //root.flow.ray = [];
		}

		

		//root.responce.ray = [];
		root.flow.ray = [];

		//console.log(updated)

		var ray = this.ray;

		this.rays.forEach( function ( r, id ) {

			//if( updated ) r.update( root.flow.ray[ id ] );

			ray.set_m_closestHitFraction( r.precision );
			ray.set_m_collisionObject( null );

			// Set ray option
			ray.get_m_rayFromWorld().fromArray( r.origin, 0, root.invScale );
			ray.get_m_rayToWorld().fromArray( r.dest, 0, root.invScale );
			ray.set_m_collisionFilterGroup( r.group );
			ray.set_m_collisionFilterMask( r.mask );

			// Perform ray test
			root.world.rayTest( ray.get_m_rayFromWorld(), ray.get_m_rayToWorld(), ray );

			if ( ray.hasHit() ) {

		    	var name = Ammo.castObject( ray.get_m_collisionObject(), Ammo.btRigidBody ).name;
		    	if ( name === undefined ) name = Ammo.castObject( ray.get_m_collisionObject(), Ammo.btSoftBody ).name;

		    	var normal = ray.get_m_hitNormalWorld();
		    	normal.normalize();
		    	
		    	r.result.hit = true;
		    	r.result.name = name;
		    	r.result.point = ray.get_m_hitPointWorld().toArray( undefined, 0, root.scale );
		    	r.result.normal = normal.toArray();


		    } else {

		    	r.result.hit = false;
		    	r.result.name = '';

			}

			//root.responce.ray[ id ] = r.result;
			//root.responce.ray.push( r.result );
			root.flow.ray.push( r.result );

		});

	},

	update: function ( o ){

		var i = this.rays.length;
		if ( !i || i !== o.length ) return;
		while ( i -- ) this.rays[ i ].update( o[ i ] );

	},

	clear: function () {

		while ( this.rays.length > 0 ) this.destroy( this.rays.pop() );
		this.ID = 0;

	},

	destroy: function ( p ) {

		p.clear();
		map.delete( p.name );

	},

	remove: function ( name ) {

		if ( ! map.has( name ) ) return;
		var p = map.get( name );
		var n = this.rays.indexOf( p );
		if ( n !== - 1 ) {

			this.rays.splice( n, 1 );
			this.destroy( p );

		}

	},

	add: function ( o ) {

		if( this.ray === null ) this.ray = new Ammo.ClosestRayResultCallback();

		var name = o.name !== undefined ? o.name : 'ray' + this.ID ++;

		// delete old if same name
		this.remove( o.name );


		var p = new Ray( name, o );
		this.rays.push( p );
		map.set( name, p );

	},



});


export { RayCaster };


//--------------------------------------------------
//
//  CONTACT CLASS
//
//--------------------------------------------------

function Ray( name, o ) {

	this.name = name;
	this.type = 'ray';

	this.precision = 1;

	this.update( o );

	this.result = {
		hit: false,
		name: '',
		point: [0,0,0],
		normal: [0,0,0],
	};

}

Object.assign( Ray.prototype, {

	update: function ( o ) {

		this.precision = o.precision || 1;
		this.origin = o.origin || [0,0,0];
		this.dest = o.dest || [0,1,0];
		this.group = o.group !== undefined ? o.group : 1;
		this.mask = o.mask !== undefined ? o.mask : -1;

	},

	clear: function () {

		/*this.a = null;
		this.b = null;
		Ammo.destroy( this.f );*/

	}

} );

export { Ray };
