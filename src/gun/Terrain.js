/*global Ammo*/
import { math } from './math.js';
import { root, map } from './root.js';

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    GUN - TERRAIN
*/

function Terrain() {

	this.ID = 0;
	this.terrains = [];

}

Object.assign( Terrain.prototype, {

	step: function () {

		var i = root.flow.terrain.length;
		while( i-- ) this.setData( root.flow.terrain[i] );
		root.flow.terrain = [];

		this.terrains.forEach( function ( b ) {

			b.update();

		} );

	},

	clear: function () {

		while ( this.terrains.length > 0 ) this.destroy( this.terrains.pop() );
		this.ID = 0;

	},

	destroy: function ( t ) {

		root.world.removeCollisionObject( t.body );
		t.clear();
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

	setData: function ( o ) {

		if ( ! map.has( o.name ) ) return;
		var t = map.get( o.name );
		t.setData( o.heightData );

	},

	add: function ( o ) {

		var name = o.name !== undefined ? o.name : 'terrain' + this.ID ++;

		// delete old if same name
		this.remove( name );

		var group = o.group === undefined ? 2 : o.group;
		var mask = o.mask === undefined ? - 1 : o.mask;

		var t = new LandScape( name, o );

		root.world.addCollisionObject( t.body, group, mask );

		this.terrains.push( t );

		map.set( name, t );

	}

} );


export { Terrain };


//--------------------------------------------------
//
//  LandScape CLASS
//
//--------------------------------------------------

function LandScape( name, o ) {

	var trans = math.transform();
	var p1 = math.vector3();

	this.needsUpdate = false;
	this.data = null;
	this.tmpData = null;
	this.dataHeap = null;
	this.type = 'terrain';

	if ( root.scale !== 1 ) {

		o.pos = math.vectomult( o.pos, root.invScale );
		o.size = math.vectomult( o.size, root.invScale );

	}

	var size = o.size === undefined ? [ 1, 1, 1 ] : o.size;
	var sample = o.sample === undefined ? [ 64, 64 ] : o.sample;
	var pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
	var quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;

	var mass = o.mass === undefined ? 0 : o.mass;
	var margin = o.margin === undefined ? 0.02 : o.margin;
	var friction = o.friction === undefined ? 0.5 : o.friction;
	var restitution = o.restitution === undefined ? 0 : o.restitution;

	var flag = o.flag === undefined ? 1 : o.flag;


	// This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
	var heightScale = o.heightScale === undefined ? 1 : o.heightScale;

	// Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
	var upAxis = o.upAxis === undefined ? 1 : o.upAxis;

	// hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
	var hdt = o.hdt || "PHY_FLOAT";

	// Set this to your needs (inverts the triangles)
	var flipEdge = o.flipEdge !== undefined ? o.flipEdge : false;

	// Creates height data buffer in Ammo heap
	this.setData( o.heightData );
	this.update();

	//var shape = new Ammo.btHeightfieldTerrainShape( sample[0], sample[1], terrainData[name], heightScale, -size[1], size[1], upAxis, hdt, flipEdge );
	var shape = new Ammo.btHeightfieldTerrainShape( sample[ 0 ], sample[ 1 ], this.data, heightScale, - size[ 1 ], size[ 1 ], upAxis, hdt, flipEdge );

	//console.log(shape.getMargin())

	p1.set( size[ 0 ] / sample[ 0 ], 1, size[ 2 ] / sample[ 1 ] );
	shape.setLocalScaling( p1 );

	shape.setMargin( margin );

	trans.identity().fromArray( pos.concat( quat ) );

	p1.set( 0, 0, 0 );
	//shape.calculateLocalInertia( mass, p1 );
	var motionState = new Ammo.btDefaultMotionState( trans );
	var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, p1 );

	rbInfo.set_m_friction( friction );
	rbInfo.set_m_restitution( restitution );

	var body = new Ammo.btRigidBody( rbInfo );
	body.setCollisionFlags( flag );

	body.name = name;

	this.name = name;
	this.body = body;

	Ammo.destroy( rbInfo );

	trans.free();
	p1.free();

	o = null;

}

Object.assign( LandScape.prototype, {

	setData: function ( data ) {

		this.tmpData = data;
		this.nDataBytes = this.tmpData.length * this.tmpData.BYTES_PER_ELEMENT;
		this.needsUpdate = true;

	},

	update: function () {

		if ( ! this.needsUpdate ) return;

		this.malloc();
		//self.postMessage( { m:'terrain', o: { name: this.name } } );
		this.needsUpdate = false;
		this.tmpData = null;

	},

	clear: function () {


		Ammo.destroy( this.body );
		Ammo._free( this.dataHeap.byteOffset );
		//Ammo.destroy( this.data );

		this.body = null;
		this.data = null;
		this.tmpData = null;
		this.dataHeap = null;

	},

	malloc: function () {

		//var nDataBytes = this.tmpData.length * this.tmpData.BYTES_PER_ELEMENT;
		if ( this.data === null ) this.data = Ammo._malloc( this.nDataBytes );
		this.dataHeap = new Uint8Array( Ammo.HEAPU8.buffer, this.data, this.nDataBytes );
		this.dataHeap.set( new Uint8Array( this.tmpData.buffer ) );

	},

} );

export { LandScape };
