/*global Ammo*/
import { root, map } from './root.js';

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    GUN - COLLISION
*/

function Collision() {

	this.ID = 0;
	this.pairs = [];
	//this.contacts = [];

}

Object.assign( Collision.prototype, {

	step: function ( AR, N ) {

		var n;

		this.pairs.forEach( function ( pair, id ) {

			n = N + id;

			pair.result = 0;
			if ( pair.b !== undefined ) root.world.contactPairTest( pair.a, pair.b, pair.f );
			else root.world.contactTest( pair.a, pair.f );
			AR[ n ] = pair.result;

		});

	},

	clear: function () {

		while ( this.pairs.length > 0 ) this.destroy( this.pairs.pop() );
		//this.contacts = [];
		this.ID = 0;

	},

	destroy: function ( p ) {

		p.clear();
		map.delete( p.name );

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

		if ( ! map.has( o.b1 ) ) return;

		var a = map.get( o.b1 );
		var b = o.b2 !== undefined ? ( map.has( o.b2 ) ? map.get( o.b2 ) : undefined ) : undefined;

		var p = new Pair( a, b, name );
		this.pairs.push( p );
		//this.contacts.push( 0 );

		map.set( name, p );

	}

} );


export { Collision };


//--------------------------------------------------
//
//  CONTACT CLASS
//
//--------------------------------------------------

function Pair( a, b, name ) {

	this.name = name;

	this.result = 0;

	this.type = 'collision';

	this.pa = [ 0, 0, 0 ];
	this.pb = [ 0, 0, 0 ];
	this.nb = [ 0, 0, 0 ];
	this.distance = 0;
	this.impulse = 0;
	this.maxImpulse = 0;

	this.a = a;
	this.b = b;

	this.f = new Ammo.ConcreteContactResultCallback();
	///console.log(this.f)
	this.f.addSingleResult = function ( ) {

		//this.f.addSingleResult = function ( manifoldPoint, collisionObjectA, id0, index0, collisionObjectB, id1, index1 ) {
	    /*var manifold = Ammo.wrapPointer( manifoldPoint, Ammo.btManifoldPoint )

	    this.nb = manifold.m_normalWorldOnB.toArray();
	    this.pa = manifold.m_positionWorldOnA.toArray();
	    this.pb = manifold.m_positionWorldOnB.toArray();

	    this.distance = manifold.getDistance();
	    this.impulse = manifold.getAppliedImpulse();
	    if ( this.impulse > this.maxImpulse ) {
	    	this.maxImpulse = this.impulse;
	    }*/

	  //  console.log( this.pa, this.pb, this.nb );

	    //console.log( this.maxImpulse );



		this.result = 1;

	}.bind( this );


}

Object.assign( Pair.prototype, {

	clear: function () {

		this.a = null;
		this.b = null;
		Ammo.destroy( this.f );

	}

} );

export { Pair };
