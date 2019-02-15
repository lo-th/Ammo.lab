/*global Ammo*/
import { root, map } from './root.js';

/**
* @author lth / https://github.com/lo-th/
*/

//--------------------------------------------------
//  AMMO CHARACTER
//--------------------------------------------------

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

		} );

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
			//this.contacts.splice( n, 1 );
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
	this.a = a;
	this.b = b;

	this.f = new Ammo.ConcreteContactResultCallback();
	this.f.addSingleResult = function () {

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
