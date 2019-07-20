import { root, map } from './root.js';

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


export { Collision };


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

export { Pair };
