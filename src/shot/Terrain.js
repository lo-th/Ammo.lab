/*global THREE*/
import { root, map } from './root.js';


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


export { Terrain };
